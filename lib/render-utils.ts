import "server-only";

import { randomUUID } from "crypto";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import ffmpegPath from "ffmpeg-static";
import { JSDOM } from "jsdom";
import sharp from "sharp";
import {
  AmbientLight,
  Box3,
  BufferGeometry,
  Color,
  DirectionalLight,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Scene,
  Sphere,
  Vector3
} from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { SVGRenderer } from "three/examples/jsm/renderers/SVGRenderer.js";
import {
  CAMERA_META,
  getModelExtension,
  MATERIAL_META,
  OUTPUT_IMAGE_SIZE,
  OUTPUT_VIDEO_SIZE,
  PREVIEW_VIDEO_MATERIAL,
  VIDEO_FRAME_COUNT
} from "@/lib/3d-config";
import { sanitizeFileStem } from "@/lib/filenames";
import type {
  ModelFileExtension,
  RenderAngleKey,
  RenderMaterialKey,
  Rendered3DImage,
  Rendered3DMaterialGroup,
  Rendered3DResult
} from "@/lib/types";

type NormalizedModelSnapshot = {
  object: Object3D;
  radius: number;
  originalSize: Vector3;
  meshCount: number;
  vertexCount: number;
  triangleCount: number;
};

type CameraPlacement = {
  position: Vector3;
  up?: Vector3;
};

const STUDIO_BACKGROUND = "#050816";
const CAMERA_FOV = 34;

let svgDomQueue = Promise.resolve();

function bufferToDataUrl(buffer: Buffer, mimeType: string) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

function toArrayBuffer(buffer: Buffer) {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer;
}

function runWithSvgDom<T>(task: () => Promise<T>) {
  const currentTask = svgDomQueue.then(async () => {
    const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
    const globals = globalThis as typeof globalThis & {
      document?: Document;
      self?: Window & typeof globalThis;
      window?: Window & typeof globalThis;
    };
    const previousDocument = globals.document;
    const previousWindow = globals.window;
    const previousSelf = globals.self;

    globals.document = dom.window.document as unknown as Document;
    globals.window = dom.window as unknown as Window & typeof globalThis;
    globals.self = dom.window as unknown as Window & typeof globalThis;

    try {
      return await task();
    } finally {
      if (previousDocument) {
        globals.document = previousDocument;
      } else {
        Reflect.deleteProperty(globals, "document");
      }

      if (previousWindow) {
        globals.window = previousWindow;
      } else {
        Reflect.deleteProperty(globals, "window");
      }

      if (previousSelf) {
        globals.self = previousSelf;
      } else {
        Reflect.deleteProperty(globals, "self");
      }

      dom.window.close();
    }
  });

  svgDomQueue = currentTask.then(
    () => undefined,
    () => undefined
  );

  return currentTask;
}

export async function loadModelFromBuffer(
  buffer: Buffer,
  extension: ModelFileExtension
) {
  if (extension === "stl") {
    const geometry = new STLLoader().parse(toArrayBuffer(buffer));
    geometry.computeVertexNormals();

    return new Mesh(geometry);
  }

  return new OBJLoader().parse(buffer.toString("utf8"));
}

function normalizeModelSnapshot(source: Object3D): NormalizedModelSnapshot {
  const clonedRoot = source.clone(true);
  let meshCount = 0;
  let vertexCount = 0;
  let triangleCount = 0;

  clonedRoot.traverse((node) => {
    if (!("isMesh" in node) || !node.isMesh) {
      return;
    }

    const mesh = node as Mesh;
    mesh.geometry = mesh.geometry.clone();

    if (!mesh.geometry.getAttribute("normal")) {
      mesh.geometry.computeVertexNormals();
    }

    mesh.geometry.computeBoundingBox();
    mesh.geometry.computeBoundingSphere();

    const position = mesh.geometry.getAttribute("position");
    meshCount += 1;
    vertexCount += position?.count ?? 0;
    triangleCount += mesh.geometry.index
      ? Math.floor(mesh.geometry.index.count / 3)
      : Math.floor((position?.count ?? 0) / 3);
  });

  const originalBox = new Box3().setFromObject(clonedRoot);

  if (originalBox.isEmpty()) {
    throw new Error("The uploaded 3D file does not contain any visible geometry.");
  }

  const originalSize = originalBox.getSize(new Vector3());
  const center = originalBox.getCenter(new Vector3());
  const maxAxis = Math.max(originalSize.x, originalSize.y, originalSize.z) || 1;

  // Rendering works by recentering the uploaded geometry at the origin and then
  // scaling the largest axis into a consistent two-unit box. That gives every file
  // the same predictable framing before we calculate angle-specific cameras.
  const wrapper = new Group();
  wrapper.add(clonedRoot);
  clonedRoot.position.copy(center.multiplyScalar(-1));
  wrapper.scale.setScalar(2 / maxAxis);
  wrapper.updateMatrixWorld(true);

  const normalizedSphere = new Box3()
    .setFromObject(wrapper)
    .getBoundingSphere(new Sphere());

  return {
    object: wrapper,
    radius: Math.max(normalizedSphere.radius, 1),
    originalSize,
    meshCount,
    vertexCount,
    triangleCount
  };
}

function createMaterialVariant(key: RenderMaterialKey) {
  const spec = MATERIAL_META[key];

  return new MeshStandardMaterial({
    color: new Color(spec.color),
    roughness: spec.roughness,
    metalness: spec.metalness,
    envMapIntensity: key === "metal" ? 1.6 : 0.7
  });
}

function cloneRenderableModel(
  snapshot: NormalizedModelSnapshot,
  materialKey: RenderMaterialKey
) {
  const model = snapshot.object.clone(true);

  model.traverse((node) => {
    if (!("isMesh" in node) || !node.isMesh) {
      return;
    }

    const mesh = node as Mesh<BufferGeometry>;
    mesh.material = createMaterialVariant(materialKey);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
  });

  return model;
}

function createStudioScene(subject: Object3D) {
  const scene = new Scene();
  scene.background = new Color(STUDIO_BACKGROUND);

  const ambientLight = new AmbientLight("#d9ecff", 1.7);
  const keyLight = new DirectionalLight("#7fd1ff", 2.8);
  const fillLight = new DirectionalLight("#8fb6ff", 1.4);
  const rimLight = new DirectionalLight("#f2fbff", 1.1);

  keyLight.position.set(5, 6, 6);
  fillLight.position.set(-5, 2.5, 4);
  rimLight.position.set(-4, 5, -6);

  scene.add(ambientLight, keyLight, fillLight, rimLight, subject);

  return scene;
}

function calculateCameraDistance(radius: number) {
  const halfFov = MathUtils.degToRad(CAMERA_FOV / 2);

  return (radius / Math.sin(halfFov)) * 1.24;
}

function getCameraPlacement(
  angle: RenderAngleKey,
  distance: number
): CameraPlacement {
  // Camera angles are derived from the normalized model radius. That means the
  // same front / side / top / perspective presets work for small and large uploads
  // without hand-tuned per-model camera positions.
  switch (angle) {
    case "front":
      return {
        position: new Vector3(0, 0, distance)
      };
    case "side":
      return {
        position: new Vector3(distance, 0, 0)
      };
    case "top":
      return {
        position: new Vector3(0, distance, 0.001),
        up: new Vector3(0, 0, -1)
      };
    case "perspective":
    default:
      return {
        position: new Vector3(distance * 0.9, distance * 0.68, distance * 0.9)
      };
  }
}

function buildStudioSvg(innerMarkup: string, size: number) {
  const half = size / 2;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs>
        <radialGradient id="heroGlow" cx="50%" cy="42%" r="68%">
          <stop offset="0%" stop-color="#15375e" />
          <stop offset="55%" stop-color="#0a1324" />
          <stop offset="100%" stop-color="#050816" />
        </radialGradient>
        <radialGradient id="accentGlow" cx="82%" cy="18%" r="34%">
          <stop offset="0%" stop-color="#3cb4ff" stop-opacity="0.32" />
          <stop offset="100%" stop-color="#3cb4ff" stop-opacity="0" />
        </radialGradient>
        <filter id="blur-xl">
          <feGaussianBlur stdDeviation="42" />
        </filter>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#heroGlow)" />
      <circle cx="${size * 0.82}" cy="${size * 0.16}" r="${size * 0.16}" fill="url(#accentGlow)" />
      <ellipse cx="${half}" cy="${size * 0.78}" rx="${size * 0.25}" ry="${size * 0.055}" fill="#5fa8ff" fill-opacity="0.12" filter="url(#blur-xl)" />
      <g transform="translate(${half} ${half})">
        ${innerMarkup}
      </g>
    </svg>
  `;
}

async function renderSvgFrame(
  snapshot: NormalizedModelSnapshot,
  materialKey: RenderMaterialKey,
  size: number,
  cameraPosition: Vector3,
  cameraUp?: Vector3
) {
  return runWithSvgDom(async () => {
    const renderer = new SVGRenderer();
    const scene = createStudioScene(cloneRenderableModel(snapshot, materialKey));
    const camera = new PerspectiveCamera(CAMERA_FOV, 1, 0.1, 100);

    renderer.setQuality("high");
    renderer.setSize(size, size);
    renderer.setClearColor(new Color(STUDIO_BACKGROUND), 1);

    camera.position.copy(cameraPosition);

    if (cameraUp) {
      camera.up.copy(cameraUp);
    }

    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);

    renderer.render(scene, camera);

    const studioSvg = buildStudioSvg(renderer.domElement.innerHTML, size);

    return sharp(Buffer.from(studioSvg)).png().toBuffer();
  });
}

async function renderStillImage(
  snapshot: NormalizedModelSnapshot,
  materialKey: RenderMaterialKey,
  angle: RenderAngleKey
) {
  const distance = calculateCameraDistance(snapshot.radius);
  const placement = getCameraPlacement(angle, distance);

  return renderSvgFrame(
    snapshot,
    materialKey,
    OUTPUT_IMAGE_SIZE,
    placement.position,
    placement.up
  );
}

function resolveFfmpegBinary() {
  const binaryPath = process.env.FFMPEG_PATH || ffmpegPath;

  if (!binaryPath) {
    throw new Error(
      "ffmpeg could not be found. Install ffmpeg or provide FFMPEG_PATH."
    );
  }

  return binaryPath;
}

async function runFfmpeg(args: string[]) {
  const binaryPath = resolveFfmpegBinary();

  await new Promise<void>((resolve, reject) => {
    const child = spawn(binaryPath, args, {
      stdio: ["ignore", "ignore", "pipe"]
    });

    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          stderr.trim() || "ffmpeg failed while encoding the 360-degree preview."
        )
      );
    });
  });
}

async function generatePreviewVideo(
  snapshot: NormalizedModelSnapshot,
  fileStem: string
) {
  // Video generation reuses the same renderer as the stills, orbiting the camera
  // around the normalized model for 60 frames and then handing that frame sequence
  // to ffmpeg to encode a square MP4 preview that browsers can stream directly.
  const workingDirectory = await fs.mkdtemp(
    path.join(os.tmpdir(), "three-render-")
  );
  const outputPath = path.join(workingDirectory, `${fileStem}-360-preview.mp4`);
  const distance = calculateCameraDistance(snapshot.radius) * 1.08;

  try {
    for (let frame = 0; frame < VIDEO_FRAME_COUNT; frame += 1) {
      const rotation = (frame / VIDEO_FRAME_COUNT) * Math.PI * 2;
      const frameBuffer = await renderSvgFrame(
        snapshot,
        PREVIEW_VIDEO_MATERIAL,
        OUTPUT_VIDEO_SIZE,
        new Vector3(
          Math.cos(rotation) * distance,
          distance * 0.42,
          Math.sin(rotation) * distance
        )
      );

      await fs.writeFile(
        path.join(workingDirectory, `frame-${String(frame).padStart(4, "0")}.png`),
        frameBuffer
      );
    }

    await runFfmpeg([
      "-y",
      "-framerate",
      "30",
      "-i",
      path.join(workingDirectory, "frame-%04d.png"),
      "-c:v",
      "libx264",
      "-crf",
      "22",
      "-preset",
      "medium",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      outputPath
    ]);

    const videoBuffer = await fs.readFile(outputPath);

    return {
      filename: path.basename(outputPath),
      dataUrl: bufferToDataUrl(videoBuffer, "video/mp4"),
      mimeType: "video/mp4",
      width: OUTPUT_VIDEO_SIZE,
      height: OUTPUT_VIDEO_SIZE,
      frameCount: VIDEO_FRAME_COUNT,
      material: PREVIEW_VIDEO_MATERIAL
    };
  } finally {
    await fs.rm(workingDirectory, { recursive: true, force: true });
  }
}

export async function generate3DRenderPack(file: File): Promise<Rendered3DResult> {
  const extension = getModelExtension(file.name);

  if (!extension) {
    throw new Error("Unsupported file type. Upload an STL or OBJ model.");
  }

  const fileStem = sanitizeFileStem(file.name);
  const buffer = Buffer.from(await file.arrayBuffer());
  const loadedModel = await loadModelFromBuffer(buffer, extension);
  const snapshot = normalizeModelSnapshot(loadedModel);

  const materials = await Promise.all(
    (Object.keys(MATERIAL_META) as RenderMaterialKey[]).map(
      async (materialKey): Promise<Rendered3DMaterialGroup> => {
        const images = await Promise.all(
          (Object.keys(CAMERA_META) as RenderAngleKey[]).map(
            async (angle): Promise<Rendered3DImage> => {
              const pngBuffer = await renderStillImage(snapshot, materialKey, angle);

              return {
                id: randomUUID(),
                material: materialKey,
                angle,
                label: `${MATERIAL_META[materialKey].label} ${CAMERA_META[angle].label}`,
                filename: `${fileStem}-${materialKey}-${angle}.png`,
                dataUrl: bufferToDataUrl(pngBuffer, "image/png"),
                width: OUTPUT_IMAGE_SIZE,
                height: OUTPUT_IMAGE_SIZE
              };
            }
          )
        );

        return {
          key: materialKey,
          label: MATERIAL_META[materialKey].label,
          description: MATERIAL_META[materialKey].description,
          images
        };
      }
    )
  );

  const video = await generatePreviewVideo(snapshot, fileStem);

  return {
    id: randomUUID(),
    sourceName: file.name,
    extension,
    size: file.size,
    imageCount: materials.reduce(
      (count, materialGroup) => count + materialGroup.images.length,
      0
    ),
    materials,
    video,
    stats: {
      meshCount: snapshot.meshCount,
      vertexCount: snapshot.vertexCount,
      triangleCount: snapshot.triangleCount,
      dimensions: {
        x: Number(snapshot.originalSize.x.toFixed(2)),
        y: Number(snapshot.originalSize.y.toFixed(2)),
        z: Number(snapshot.originalSize.z.toFixed(2))
      }
    }
  };
}
