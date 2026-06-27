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
  MeshPhongMaterial,
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
  RENDER_ANGLE_KEYS,
  RENDER_MATERIAL_KEYS,
  VIDEO_FRAME_COUNT
} from "@/lib/3d-config";
import { sanitizeFileStem } from "@/lib/filenames";
import type {
  ModelFileExtension,
  RenderAngleKey,
  RenderMaterialKey,
  Rendered3DImage,
  Rendered3DImagePack,
  Rendered3DMaterialGroup,
  Rendered3DResult,
  Rendered3DStats,
  Rendered3DVideo
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

type SvgFrameRequest = {
  cameraPosition: Vector3;
  cameraUp?: Vector3;
  outputPath?: string;
  frameIndex?: number;
};

type StillFrameRequest = {
  angle: RenderAngleKey;
  cameraPosition: Vector3;
  cameraUp?: Vector3;
};

type StoredRenderManifest = {
  renderId: string;
  sourceName: string;
  extension: ModelFileExtension;
  size: number;
  fileStem: string;
  sourceFileName: string;
};

type PreviewVideoJobState =
  | {
      status: "pending";
      updatedAt: string;
    }
  | {
      status: "complete";
      updatedAt: string;
      video: Rendered3DVideo;
    }
  | {
      status: "error";
      updatedAt: string;
      error: string;
    };

type PipelineLogger = {
  log: (step: string, details?: Record<string, unknown>) => void;
  measure: <T>(
    step: string,
    task: () => Promise<T>,
    details?: Record<string, unknown>
  ) => Promise<T>;
};

const STUDIO_BACKGROUND = "#050816";
const CAMERA_FOV = 34;
const VIDEO_FRAME_RATE = 30;
const FFMPEG_TIMEOUT_MS = 120000;
const VIDEO_FRAME_BATCH_SIZE = 8;
const PUBLIC_RENDER_ROOT = path.join(process.cwd(), "public", "renders");
const PRIVATE_RENDER_ROOT = path.join(process.cwd(), ".render-cache", "3d-renders");
const RENDER_SOURCE_MANIFEST = "source.json";
const DEFAULT_CAMERA_UP = new Vector3(0, 1, 0);

let svgDomQueue = Promise.resolve();
let resolvedFfmpegBinaryPromise: Promise<string> | null = null;
const previewVideoJobs = new Map<string, Promise<void>>();
const previewVideoStates = new Map<string, PreviewVideoJobState>();

function createPipelineLogger(
  scope: string,
  context: Record<string, unknown> = {}
): PipelineLogger {
  const pipelineStartedAt = Date.now();

  return {
    log(step, details = {}) {
      console.log(`[perf] ${scope}`, {
        ...context,
        ...details,
        step,
        elapsedMs: Date.now() - pipelineStartedAt
      });
    },
    async measure(step, task, details = {}) {
      const startedAt = Date.now();

      console.log(`[perf] ${scope}:start`, {
        ...context,
        ...details,
        step,
        elapsedMs: startedAt - pipelineStartedAt
      });

      try {
        const result = await task();

        console.log(`[perf] ${scope}:done`, {
          ...context,
          ...details,
          step,
          durationMs: Date.now() - startedAt,
          elapsedMs: Date.now() - pipelineStartedAt
        });

        return result;
      } catch (error) {
        console.error(`[perf] ${scope}:failed`, {
          ...context,
          ...details,
          step,
          durationMs: Date.now() - startedAt,
          elapsedMs: Date.now() - pipelineStartedAt,
          error
        });
        throw error;
      }
    }
  };
}

function getTimestamp() {
  return new Date().toISOString();
}

async function ensureRenderOutputDirectory(renderId: string) {
  const outputDirectory = path.join(PUBLIC_RENDER_ROOT, renderId);

  await fs.mkdir(outputDirectory, { recursive: true });

  return outputDirectory;
}

async function ensurePrivateRenderDirectory(renderId: string) {
  const outputDirectory = path.join(PRIVATE_RENDER_ROOT, renderId);

  await fs.mkdir(outputDirectory, { recursive: true });

  return outputDirectory;
}

function toPublicRenderPath(renderId: string, filename: string) {
  return `/renders/${renderId}/${filename}`;
}

function getRenderSourceManifestPath(renderId: string) {
  return path.join(PRIVATE_RENDER_ROOT, renderId, RENDER_SOURCE_MANIFEST);
}

function getRenderSourceFilePath(renderId: string, sourceFileName: string) {
  return path.join(PRIVATE_RENDER_ROOT, renderId, sourceFileName);
}

function buildPreviewVideoFilename(fileStem: string) {
  return `${fileStem}-360-preview.mp4`;
}

async function persistRenderSource(
  renderId: string,
  file: File,
  extension: ModelFileExtension,
  buffer: Buffer
) {
  const fileStem = sanitizeFileStem(file.name);
  const privateOutputDirectory = await ensurePrivateRenderDirectory(renderId);
  const sourceFileName = `source.${extension}`;
  const manifest: StoredRenderManifest = {
    renderId,
    sourceName: file.name,
    extension,
    size: file.size,
    fileStem,
    sourceFileName
  };

  await Promise.all([
    fs.writeFile(path.join(privateOutputDirectory, sourceFileName), buffer),
    fs.writeFile(
      path.join(privateOutputDirectory, RENDER_SOURCE_MANIFEST),
      JSON.stringify(manifest, null, 2),
      "utf8"
    )
  ]);

  return manifest;
}

async function loadStoredRenderManifest(renderId: string) {
  try {
    const manifestContent = await fs.readFile(
      getRenderSourceManifestPath(renderId),
      "utf8"
    );
    const manifest = JSON.parse(manifestContent) as StoredRenderManifest;

    if (!manifest.sourceFileName || !manifest.extension || !manifest.sourceName) {
      throw new Error("The saved render source metadata is incomplete.");
    }

    return manifest;
  } catch (error) {
    if (error instanceof Error && error.message === "The saved render source metadata is incomplete.") {
      throw error;
    }

    throw new Error(
      "The source file for this render could not be found. Please re-render the model images first."
    );
  }
}

async function loadStoredRenderSource(renderId: string) {
  const manifest = await loadStoredRenderManifest(renderId);
  const sourcePath = getRenderSourceFilePath(renderId, manifest.sourceFileName);
  const buffer = await fs.readFile(sourcePath);

  return {
    manifest,
    buffer
  };
}

async function getExistingPreviewVideo(
  renderId: string
): Promise<Rendered3DVideo | null> {
  try {
    const manifest = await loadStoredRenderManifest(renderId);
    const publicVideoPath = path.join(
      PUBLIC_RENDER_ROOT,
      renderId,
      buildPreviewVideoFilename(manifest.fileStem)
    );

    await fs.access(publicVideoPath);

    return {
      filename: path.basename(publicVideoPath),
      src: toPublicRenderPath(renderId, path.basename(publicVideoPath)),
      mimeType: "video/mp4",
      width: OUTPUT_VIDEO_SIZE,
      height: OUTPUT_VIDEO_SIZE,
      frameCount: VIDEO_FRAME_COUNT,
      material: PREVIEW_VIDEO_MATERIAL
    };
  } catch {
    return null;
  }
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

async function yieldToEventLoop() {
  await new Promise<void>((resolve) => {
    setImmediate(resolve);
  });
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

  return new MeshPhongMaterial({
    color: new Color(spec.color),
    shininess: key === "metal" ? 90 : 22,
    specular: new Color(key === "metal" ? "#f4f8ff" : "#4f5a66")
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

async function renderSvgFramesBatch(
  snapshot: NormalizedModelSnapshot,
  materialKey: RenderMaterialKey,
  size: number,
  frames: SvgFrameRequest[]
) {
  return runWithSvgDom(async () => {
    const renderer = new SVGRenderer();
    const scene = createStudioScene(cloneRenderableModel(snapshot, materialKey));
    const camera = new PerspectiveCamera(CAMERA_FOV, 1, 0.1, 100);

    renderer.setQuality("high");
    renderer.setSize(size, size);
    renderer.setClearColor(new Color(STUDIO_BACKGROUND), 1);

    return Promise.all(
      frames.map(async ({ cameraPosition, cameraUp, outputPath }) => {
        camera.position.copy(cameraPosition);
        camera.up.copy(cameraUp ?? DEFAULT_CAMERA_UP);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
        camera.updateMatrixWorld(true);

        renderer.render(scene, camera);

        const studioSvg = buildStudioSvg(renderer.domElement.innerHTML, size);
        const pngBuffer = await sharp(Buffer.from(studioSvg)).png().toBuffer();

        if (outputPath) {
          await fs.writeFile(outputPath, pngBuffer);
        }

        return pngBuffer;
      })
    );
  });
}

function buildStillFrameRequests(
  snapshot: NormalizedModelSnapshot,
  angles: readonly RenderAngleKey[]
): StillFrameRequest[] {
  const distance = calculateCameraDistance(snapshot.radius);

  return angles.map((angle) => {
    const placement = getCameraPlacement(angle, distance);

    return {
      angle,
      cameraPosition: placement.position,
      cameraUp: placement.up
    };
  });
}

async function renderStillImagesBatch(
  snapshot: NormalizedModelSnapshot,
  materialKey: RenderMaterialKey,
  angles: readonly RenderAngleKey[],
  logger: PipelineLogger
) {
  const frameRequests = buildStillFrameRequests(snapshot, angles);

  logger.log("camera-setup", {
    material: materialKey,
    angleCount: frameRequests.length,
    angles: frameRequests.map((frame) => frame.angle)
  });

  const pngBuffers = await logger.measure(
    `render-svg-batch:${materialKey}`,
    async () =>
      renderSvgFramesBatch(
        snapshot,
        materialKey,
        OUTPUT_IMAGE_SIZE,
        frameRequests.map(({ cameraPosition, cameraUp }) => ({
          cameraPosition,
          cameraUp
        }))
      ),
    {
      material: materialKey,
      outputSize: OUTPUT_IMAGE_SIZE,
      angleCount: frameRequests.length
    }
  );

  return frameRequests.map((frameRequest, index) => ({
    angle: frameRequest.angle,
    pngBuffer: pngBuffers[index]
  }));
}

async function isExecutableReachable(command: string) {
  return new Promise<boolean>((resolve) => {
    const child = spawn(command, ["-version"], {
      stdio: ["ignore", "ignore", "ignore"],
      windowsHide: true
    });

    child.on("error", () => {
      resolve(false);
    });

    child.on("close", (code) => {
      resolve(code === 0);
    });
  });
}

async function resolveReadablePath(candidates: string[]) {
  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      continue;
    }
  }

  return null;
}

async function assertPathExists(filePath: string, label: string) {
  try {
    await fs.access(filePath);
  } catch {
    throw new Error(`${label} was not found at ${filePath}.`);
  }
}

async function assertFrameSequence(frameDirectory: string) {
  const files = await fs.readdir(frameDirectory);
  const frameFiles = files.filter(
    (fileName) => fileName.startsWith("frame-") && fileName.endsWith(".png")
  );

  if (frameFiles.length !== VIDEO_FRAME_COUNT) {
    throw new Error(
      `Expected ${VIDEO_FRAME_COUNT} frames for MP4 generation, but found ${frameFiles.length}.`
    );
  }

  return frameFiles.length;
}

async function resolveFfmpegBinary() {
  if (resolvedFfmpegBinaryPromise) {
    return resolvedFfmpegBinaryPromise;
  }

  resolvedFfmpegBinaryPromise = (async () => {
    if (process.env.FFMPEG_PATH) {
      try {
        await fs.access(process.env.FFMPEG_PATH);
        console.log("Using ffmpeg from FFMPEG_PATH:", process.env.FFMPEG_PATH);
        return process.env.FFMPEG_PATH;
      } catch {
        throw new Error(
          `FFMPEG_PATH is set but not readable: ${process.env.FFMPEG_PATH}`
        );
      }
    }

    if (await isExecutableReachable("ffmpeg")) {
      console.log("Using ffmpeg from PATH");
      return "ffmpeg";
    }

    const binaryName =
      (ffmpegPath && path.basename(ffmpegPath)) ||
      (process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg");
    const binaryPath = await resolveReadablePath(
      [ffmpegPath, path.join(process.cwd(), "node_modules", "ffmpeg-static", binaryName)].filter(
        (candidate): candidate is string => Boolean(candidate)
      )
    );

    if (!binaryPath) {
      throw new Error(
        "ffmpeg could not be found on PATH and no readable bundled binary was available. Install ffmpeg or provide FFMPEG_PATH."
      );
    }

    console.log("ffmpeg not found on PATH. Using bundled binary:", binaryPath);
    return binaryPath;
  })();

  try {
    return await resolvedFfmpegBinaryPromise;
  } catch (error) {
    resolvedFfmpegBinaryPromise = null;
    throw error;
  }
}

async function runFfmpeg(args: string[], logger: PipelineLogger) {
  const binaryPath = await resolveFfmpegBinary();

  await logger.measure(
    "ffmpeg-encode",
    async () =>
      new Promise<void>((resolve, reject) => {
        let isSettled = false;
        const child = spawn(binaryPath, args, {
          stdio: ["ignore", "ignore", "pipe"],
          windowsHide: true
        });
        const timeout = setTimeout(() => {
          if (isSettled) {
            return;
          }

          isSettled = true;
          child.kill("SIGKILL");
          reject(
            new Error(
              `ffmpeg timed out after ${FFMPEG_TIMEOUT_MS}ms while encoding the 360-degree preview.`
            )
          );
        }, FFMPEG_TIMEOUT_MS);

        let stderr = "";

        child.stderr.on("data", (chunk) => {
          stderr += chunk.toString();
        });

        child.on("error", (error) => {
          if (isSettled) {
            return;
          }

          isSettled = true;
          clearTimeout(timeout);
          reject(error);
        });

        child.on("close", (code) => {
          if (isSettled) {
            return;
          }

          isSettled = true;
          clearTimeout(timeout);

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
      }),
    {
      binaryPath,
      args
    }
  );
}

async function generatePreviewVideo(
  snapshot: NormalizedModelSnapshot,
  fileStem: string,
  renderId: string,
  publicOutputDirectory: string
): Promise<Rendered3DVideo> {
  const logger = createPipelineLogger("preview-video", {
    renderId,
    fileStem
  });
  const workingDirectory = await logger.measure("create-temp-directory", async () =>
    fs.mkdtemp(path.join(os.tmpdir(), "three-render-"))
  );
  const frameDirectory = path.join(workingDirectory, "frames");
  const outputDirectory = path.join(workingDirectory, "output");
  const outputPath = path.join(outputDirectory, buildPreviewVideoFilename(fileStem));
  const publicVideoPath = path.join(publicOutputDirectory, path.basename(outputPath));
  const distance = calculateCameraDistance(snapshot.radius) * 1.08;

  try {
    try {
      await fs.access(publicVideoPath);

      logger.log("reuse-existing-video", {
        publicVideoPath
      });

      return {
        filename: path.basename(outputPath),
        src: toPublicRenderPath(renderId, path.basename(outputPath)),
        mimeType: "video/mp4",
        width: OUTPUT_VIDEO_SIZE,
        height: OUTPUT_VIDEO_SIZE,
        frameCount: VIDEO_FRAME_COUNT,
        material: PREVIEW_VIDEO_MATERIAL
      };
    } catch {
      logger.log("no-existing-video");
    }

    await logger.measure("prepare-video-directories", async () =>
      Promise.all([
        fs.mkdir(frameDirectory, { recursive: true }),
        fs.mkdir(outputDirectory, { recursive: true })
      ])
    );

    const frameRequests = Array.from({ length: VIDEO_FRAME_COUNT }, (_value, frame) => {
      const rotation = (frame / VIDEO_FRAME_COUNT) * Math.PI * 2;

      return {
        frameIndex: frame,
        cameraPosition: new Vector3(
          Math.cos(rotation) * distance,
          distance * 0.42,
          Math.sin(rotation) * distance
        ),
        outputPath: path.join(
          frameDirectory,
          `frame-${String(frame).padStart(4, "0")}.png`
        )
      } satisfies SvgFrameRequest;
    });

    logger.log("video-camera-setup", {
      material: PREVIEW_VIDEO_MATERIAL,
      frameCount: VIDEO_FRAME_COUNT,
      outputSize: OUTPUT_VIDEO_SIZE
    });

    for (
      let batchStart = 0;
      batchStart < frameRequests.length;
      batchStart += VIDEO_FRAME_BATCH_SIZE
    ) {
      const batch = frameRequests.slice(batchStart, batchStart + VIDEO_FRAME_BATCH_SIZE);

      await logger.measure(
        `render-video-frame-batch:${batchStart}-${batchStart + batch.length - 1}`,
        async () =>
          renderSvgFramesBatch(
            snapshot,
            PREVIEW_VIDEO_MATERIAL,
            OUTPUT_VIDEO_SIZE,
            batch
          ),
        {
          batchSize: batch.length
        }
      );

      await yieldToEventLoop();
    }

    const frameCount = await logger.measure("verify-video-frames", async () =>
      assertFrameSequence(frameDirectory)
    );

    await runFfmpeg(
      [
        "-y",
        "-framerate",
        String(VIDEO_FRAME_RATE),
        "-i",
        path.join(frameDirectory, "frame-%04d.png"),
        "-c:v",
        "libx264",
        "-crf",
        "22",
        "-preset",
        "ultrafast",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        outputPath
      ],
      logger
    );

    await logger.measure("publish-video", async () => {
      await assertPathExists(outputPath, "Generated MP4");
      await fs.copyFile(outputPath, publicVideoPath);
      await assertPathExists(publicVideoPath, "Public MP4");
    });

    logger.log("video-complete", {
      frameCount
    });

    return {
      filename: path.basename(outputPath),
      src: toPublicRenderPath(renderId, path.basename(outputPath)),
      mimeType: "video/mp4",
      width: OUTPUT_VIDEO_SIZE,
      height: OUTPUT_VIDEO_SIZE,
      frameCount: VIDEO_FRAME_COUNT,
      material: PREVIEW_VIDEO_MATERIAL
    };
  } finally {
    await logger.measure("cleanup-temp-directory", async () =>
      fs.rm(workingDirectory, { recursive: true, force: true })
    );
  }
}

function buildRenderStats(snapshot: NormalizedModelSnapshot): Rendered3DStats {
  return {
    meshCount: snapshot.meshCount,
    vertexCount: snapshot.vertexCount,
    triangleCount: snapshot.triangleCount,
    dimensions: {
      x: Number(snapshot.originalSize.x.toFixed(2)),
      y: Number(snapshot.originalSize.y.toFixed(2)),
      z: Number(snapshot.originalSize.z.toFixed(2))
    }
  };
}

export async function generate3DImagePack(file: File): Promise<Rendered3DResult> {
  const extension = getModelExtension(file.name);

  if (!extension) {
    throw new Error("Unsupported file type. Upload an STL or OBJ model.");
  }

  const fileStem = sanitizeFileStem(file.name);
  const renderId = randomUUID();
  const logger = createPipelineLogger("image-pack", {
    renderId,
    sourceName: file.name,
    extension,
    size: file.size
  });

  const buffer = await logger.measure("read-upload-buffer", async () =>
    Buffer.from(await file.arrayBuffer())
  );

  await logger.measure("persist-render-source", async () =>
    persistRenderSource(renderId, file, extension, buffer)
  );

  const loadedModel = await logger.measure("parse-model", async () =>
    loadModelFromBuffer(buffer, extension)
  );
  const snapshot = await logger.measure("normalize-model", async () =>
    Promise.resolve(normalizeModelSnapshot(loadedModel))
  );
  const publicOutputDirectory = await logger.measure("prepare-public-output", async () =>
    ensureRenderOutputDirectory(renderId)
  );

  const materialEntries = await logger.measure(
    "render-material-groups",
    async () =>
      Promise.all(
        RENDER_MATERIAL_KEYS.map(async (materialKey) =>
          logger.measure(
            `material-group:${materialKey}`,
            async () => {
              const renderedFrames = await renderStillImagesBatch(
                snapshot,
                materialKey,
                RENDER_ANGLE_KEYS,
                logger
              );

              const images = await logger.measure(
                `write-images:${materialKey}`,
                async () =>
                  Promise.all(
                    renderedFrames.map(async ({ angle, pngBuffer }) => {
                      const filename = `${fileStem}-${materialKey}-${angle}.png`;
                      const outputPath = path.join(publicOutputDirectory, filename);

                      await fs.writeFile(outputPath, pngBuffer);

                      return {
                        id: randomUUID(),
                        material: materialKey,
                        angle,
                        label: `${MATERIAL_META[materialKey].label} ${CAMERA_META[angle].label}`,
                        filename,
                        src: toPublicRenderPath(renderId, filename),
                        width: OUTPUT_IMAGE_SIZE,
                        height: OUTPUT_IMAGE_SIZE
                      } satisfies Rendered3DImage;
                    })
                  ),
                {
                  material: materialKey,
                  imageCount: renderedFrames.length
                }
              );

              return {
                key: materialKey,
                label: MATERIAL_META[materialKey].label,
                description: MATERIAL_META[materialKey].description,
                images
              } satisfies Rendered3DMaterialGroup;
            },
            {
              material: materialKey,
              angleCount: RENDER_ANGLE_KEYS.length
            }
          )
        )
      ),
    {
      materialCount: RENDER_MATERIAL_KEYS.length,
      angleCount: RENDER_ANGLE_KEYS.length
    }
  );

  const images = materialEntries.flatMap((materialGroup) => materialGroup.images);

  logger.log("image-pack-complete", {
    imageCount: images.length,
    materialCount: materialEntries.length
  });

  return {
    id: renderId,
    renderId,
    sourceName: file.name,
    extension,
    size: file.size,
    imageCount: images.length,
    images,
    materials: materialEntries,
    stats: buildRenderStats(snapshot)
  };
}

export async function generate3DPreviewVideo(
  renderId: string
): Promise<Rendered3DVideo> {
  const logger = createPipelineLogger("video-source-load", {
    renderId
  });
  const { manifest, buffer } = await logger.measure("load-stored-source", async () =>
    loadStoredRenderSource(renderId)
  );
  const loadedModel = await logger.measure("parse-model", async () =>
    loadModelFromBuffer(buffer, manifest.extension)
  );
  const snapshot = await logger.measure("normalize-model", async () =>
    Promise.resolve(normalizeModelSnapshot(loadedModel))
  );
  const publicOutputDirectory = await logger.measure("prepare-public-output", async () =>
    ensureRenderOutputDirectory(renderId)
  );

  return generatePreviewVideo(
    snapshot,
    manifest.fileStem,
    renderId,
    publicOutputDirectory
  );
}

export async function queue3DPreviewVideo(renderId: string) {
  const existingVideo = await getExistingPreviewVideo(renderId);

  if (existingVideo) {
    const completedState: PreviewVideoJobState = {
      status: "complete",
      updatedAt: getTimestamp(),
      video: existingVideo
    };

    previewVideoStates.set(renderId, completedState);

    return completedState;
  }

  const existingState = previewVideoStates.get(renderId);

  if (existingState?.status === "pending" && previewVideoJobs.has(renderId)) {
    return existingState;
  }

  const pendingState: PreviewVideoJobState = {
    status: "pending",
    updatedAt: getTimestamp()
  };

  previewVideoStates.set(renderId, pendingState);

  const job = (async () => {
    try {
      const video = await generate3DPreviewVideo(renderId);

      previewVideoStates.set(renderId, {
        status: "complete",
        updatedAt: getTimestamp(),
        video
      });
    } catch (error) {
      previewVideoStates.set(renderId, {
        status: "error",
        updatedAt: getTimestamp(),
        error:
          error instanceof Error
            ? error.message
            : "We could not generate the preview video."
      });
    } finally {
      previewVideoJobs.delete(renderId);
    }
  })();

  previewVideoJobs.set(renderId, job);

  return pendingState;
}

export async function get3DPreviewVideoStatus(
  renderId: string
): Promise<PreviewVideoJobState | null> {
  const existingState = previewVideoStates.get(renderId);

  if (existingState) {
    return existingState;
  }

  const existingVideo = await getExistingPreviewVideo(renderId);

  if (!existingVideo) {
    return null;
  }

  const completedState: PreviewVideoJobState = {
    status: "complete",
    updatedAt: getTimestamp(),
    video: existingVideo
  };

  previewVideoStates.set(renderId, completedState);

  return completedState;
}

export async function generate3DRenderPack(file: File): Promise<Rendered3DImagePack> {
  return generate3DImagePack(file);
}
