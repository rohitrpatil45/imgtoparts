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
  Box3,
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
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { SVGRenderer } from "three/examples/jsm/renderers/SVGRenderer.js";
import { sanitizeFileStem } from "@/lib/filenames";
import {
  CAMERA_FOV,
  DEFAULT_BACKGROUND,
  DEFAULT_MATERIAL_PRESET,
  MAX_STL_FILE_SIZE,
  STL_BACKGROUND_META,
  STL_MATERIAL_PRESET_META,
  STL_RENDER_TIMEOUT_MS,
  STL_VIEW_KEYS,
  STL_VIEW_META,
  STILL_OUTPUT_SIZE,
  THUMBNAIL_FILENAME,
  VIDEO_FILENAME,
  VIDEO_FRAME_COUNT,
  VIDEO_FRAME_RATE,
  VIDEO_OUTPUT_SIZE
} from "@/lib/stl-render-config";
import type {
  StlBackgroundPreset,
  StlMaterialPreset,
  StlRenderImageAsset,
  StlRenderResult,
  StlRenderStats,
  StlRenderVideoAsset,
  StlRenderViewKey
} from "@/lib/types";

type RenderRequestOptions = {
  materialPreset?: StlMaterialPreset;
  background?: StlBackgroundPreset;
  includeThumbnail?: boolean;
  debug?: boolean;
};

type NormalizedModelSnapshot = {
  object: Object3D;
  radius: number;
  originalSize: Vector3;
  normalizedScale: number;
  meshCount: number;
  vertexCount: number;
  triangleCount: number;
};

type CameraPlacement = {
  position: Vector3;
  up?: Vector3;
};

type StillRenderFrame = {
  key: StlRenderViewKey;
  label: string;
  filename: string;
  cameraPosition: Vector3;
  cameraUp?: Vector3;
};

type SequenceFrame = {
  frameIndex: number;
  outputPath: string;
  rotationY: number;
  cameraPosition: Vector3;
  cameraUp?: Vector3;
};

type StoredRenderManifest = {
  renderId: string;
  sourceName: string;
  sourceFileName: string;
  fileStem: string;
  materialPreset: StlMaterialPreset;
  background: StlBackgroundPreset;
  includeThumbnail: boolean;
  size: number;
};

const PUBLIC_RENDER_ROOT = path.join(process.cwd(), "public", "renders", "stl");
const PRIVATE_RENDER_ROOT = path.join(process.cwd(), ".render-cache", "stl-renders");
const RENDER_MANIFEST_FILENAME = "manifest.json";
const DEFAULT_CAMERA_UP = new Vector3(0, 1, 0);
const FRAME_BATCH_SIZE = 12;

let svgDomQueue = Promise.resolve();
let resolvedFfmpegBinaryPromise: Promise<string> | null = null;
const materialCache = new Map<StlMaterialPreset, MeshPhongMaterial>();

type RenderLogger = {
  debugEnabled: boolean;
  log: (step: string, details?: Record<string, unknown>) => void;
  debug: (step: string, details?: Record<string, unknown>) => void;
  childOutput: (step: string, chunk: string) => void;
};

export class StlRenderPipelineError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "StlRenderPipelineError";
    this.status = status;
  }
}

function createRenderLogger(
  renderId: string,
  sourceName: string,
  debugEnabled: boolean
): RenderLogger {
  function print(
    level: "log" | "error",
    step: string,
    details: Record<string, unknown> = {}
  ) {
    const payload = {
      scope: "stl-render",
      renderId,
      sourceName,
      step,
      timestamp: new Date().toISOString(),
      ...details
    };

    if (level === "error") {
      console.error(payload);
      return;
    }

    console.log(payload);
  }

  return {
    debugEnabled,
    log(step, details = {}) {
      print("log", step, details);
    },
    debug(step, details = {}) {
      if (!debugEnabled) {
        return;
      }

      print("log", step, details);
    },
    childOutput(step, chunk) {
      if (!debugEnabled) {
        return;
      }

      const trimmed = chunk.trim();

      if (!trimmed) {
        return;
      }

      print("log", step, { output: trimmed });
    }
  };
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown render error.";
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new StlRenderPipelineError("The render was aborted.", 504);
  }
}

async function yieldToEventLoop() {
  await new Promise<void>((resolve) => {
    setImmediate(resolve);
  });
}

function toArrayBuffer(buffer: Buffer) {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer;
}

async function ensureDirectory(directoryPath: string) {
  await fs.mkdir(directoryPath, { recursive: true });
  return directoryPath;
}

async function writeBufferToFile(
  filePath: string,
  contents: Buffer,
  logger: RenderLogger,
  label: string,
  signal?: AbortSignal
) {
  throwIfAborted(signal);
  logger.debug("file-write:start", {
    label,
    filePath,
    bytes: contents.byteLength
  });

  try {
    await fs.writeFile(filePath, contents);
    logger.log("file-write:complete", {
      label,
      filePath,
      bytes: contents.byteLength
    });
  } catch (error) {
    logger.log("file-write:failed", {
      label,
      filePath,
      error: toErrorMessage(error)
    });
    throw error;
  }
}

async function writeJsonToFile(
  filePath: string,
  payload: unknown,
  logger: RenderLogger,
  label: string,
  signal?: AbortSignal
) {
  await writeBufferToFile(
    filePath,
    Buffer.from(JSON.stringify(payload, null, 2), "utf8"),
    logger,
    label,
    signal
  );
}

function toPublicAssetPath(renderId: string, filename: string) {
  return `/renders/stl/${renderId}/${filename}`;
}

function getPublicOutputDirectory(renderId: string) {
  return path.join(PUBLIC_RENDER_ROOT, renderId);
}

function getPrivateOutputDirectory(renderId: string) {
  return path.join(PRIVATE_RENDER_ROOT, renderId);
}

async function persistRenderManifest(
  renderId: string,
  file: File,
  sourceBuffer: Buffer,
  materialPreset: StlMaterialPreset,
  background: StlBackgroundPreset,
  includeThumbnail: boolean,
  logger: RenderLogger,
  signal?: AbortSignal
) {
  const privateDirectory = await ensureDirectory(getPrivateOutputDirectory(renderId));
  const sourceFileName = "source.stl";
  const manifest: StoredRenderManifest = {
    renderId,
    sourceName: file.name,
    sourceFileName,
    fileStem: sanitizeFileStem(file.name),
    materialPreset,
    background,
    includeThumbnail,
    size: file.size
  };

  await Promise.all([
    writeBufferToFile(
      path.join(privateDirectory, sourceFileName),
      sourceBuffer,
      logger,
      "source-stl",
      signal
    ),
    writeJsonToFile(
      path.join(privateDirectory, RENDER_MANIFEST_FILENAME),
      manifest,
      logger,
      "render-manifest",
      signal
    )
  ]);

  return manifest;
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

function getCachedMaterial(materialPreset: StlMaterialPreset) {
  const cachedMaterial = materialCache.get(materialPreset);

  if (cachedMaterial) {
    return cachedMaterial;
  }

  const preset = STL_MATERIAL_PRESET_META[materialPreset];
  const material = new MeshPhongMaterial({
    color: new Color(preset.color),
    shininess: preset.shininess,
    specular: new Color(preset.specular),
    flatShading: false
  });

  materialCache.set(materialPreset, material);

  return material;
}

function applyMaterial(subject: Object3D, materialPreset: StlMaterialPreset) {
  const material = getCachedMaterial(materialPreset);

  subject.traverse((node) => {
    if (!("isMesh" in node) || !node.isMesh) {
      return;
    }

    const mesh = node as Mesh;
    mesh.material = material;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
  });

  return subject;
}

function loadStlMesh(buffer: Buffer) {
  const geometry = new STLLoader().parse(toArrayBuffer(buffer));
  const position = geometry.getAttribute("position");

  if (!position || position.count < 3) {
    throw new StlRenderPipelineError(
      "The uploaded STL does not contain a valid mesh.",
      422
    );
  }

  for (let index = 0; index < position.array.length; index += 1) {
    const value = position.array[index];

    if (!Number.isFinite(value)) {
      throw new StlRenderPipelineError(
        "The uploaded STL contains invalid vertex data.",
        422
      );
    }
  }

  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  return new Mesh(geometry);
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
    mesh.geometry.computeVertexNormals();
    mesh.geometry.computeBoundingBox();
    mesh.geometry.computeBoundingSphere();

    const position = mesh.geometry.getAttribute("position");

    meshCount += 1;
    vertexCount += position?.count ?? 0;
    triangleCount += mesh.geometry.index
      ? Math.floor(mesh.geometry.index.count / 3)
      : Math.floor((position?.count ?? 0) / 3);
  });

  if (!meshCount || !triangleCount) {
    throw new StlRenderPipelineError(
      "The uploaded STL does not contain any visible triangles.",
      422
    );
  }

  const originalBox = new Box3().setFromObject(clonedRoot);

  if (originalBox.isEmpty()) {
    throw new StlRenderPipelineError(
      "The uploaded STL does not contain any visible geometry.",
      422
    );
  }

  const originalSize = originalBox.getSize(new Vector3());
  const center = originalBox.getCenter(new Vector3());
  const maxAxis = Math.max(originalSize.x, originalSize.y, originalSize.z);

  if (!Number.isFinite(maxAxis) || maxAxis <= 0) {
    throw new StlRenderPipelineError(
      "The uploaded STL has invalid bounds and could not be normalized.",
      422
    );
  }

  const wrapper = new Group();
  const normalizedScale = 2 / maxAxis;

  wrapper.add(clonedRoot);
  clonedRoot.position.copy(center.multiplyScalar(-1));
  wrapper.scale.setScalar(normalizedScale);
  wrapper.updateMatrixWorld(true);

  const normalizedSphere = new Box3()
    .setFromObject(wrapper)
    .getBoundingSphere(new Sphere());

  return {
    object: wrapper,
    radius: Math.max(normalizedSphere.radius, 1),
    originalSize,
    normalizedScale,
    meshCount,
    vertexCount,
    triangleCount
  };
}

function createStudioScene(
  subject: Object3D,
  background: StlBackgroundPreset
) {
  const scene = new Scene();
  scene.background = new Color(STL_BACKGROUND_META[background].color);

  const keyLight = new DirectionalLight("#ffffff", 2.35);
  const fillLight = new DirectionalLight("#cfd6df", 1.05);
  const rimLight = new DirectionalLight("#f3f4f6", 1.4);

  keyLight.position.set(5.8, 5.2, 6.4);
  fillLight.position.set(-6.2, 1.8, 4.1);
  rimLight.position.set(-4.8, 4.8, -6.6);

  scene.add(keyLight, fillLight, rimLight, subject);

  return scene;
}

function calculateCameraDistance(radius: number) {
  const halfFov = MathUtils.degToRad(CAMERA_FOV / 2);
  return (radius / Math.sin(halfFov)) * 1.15;
}

function getStillCameraPlacement(
  view: StlRenderViewKey,
  distance: number
): CameraPlacement {
  switch (view) {
    case "left":
      return {
        position: new Vector3(-distance, 0, 0)
      };
    case "right":
      return {
        position: new Vector3(distance, 0, 0)
      };
    case "top":
      return {
        position: new Vector3(0, distance, 0.001),
        up: new Vector3(0, 0, -1)
      };
    case "bottom":
      return {
        position: new Vector3(0, -distance, 0.001),
        up: new Vector3(0, 0, 1)
      };
  }
}

function getVideoCameraPlacement(distance: number): CameraPlacement {
  return {
    position: new Vector3(0, distance * 0.28, distance * 1.12)
  };
}

function buildNeutralSvg(markup: string, size: number, background: string) {
  const half = size / 2;
  const shadowY = Math.round(size * 0.72);
  const shadowRx = Math.round(size * 0.16);
  const shadowRy = Math.round(size * 0.038);

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" fill="${background}" />
      <ellipse cx="${half}" cy="${shadowY}" rx="${shadowRx}" ry="${shadowRy}" fill="#000000" fill-opacity="0.08" />
      <g transform="translate(${half} ${half})">
        ${markup}
      </g>
    </svg>
  `;
}

async function renderFrames(
  snapshot: NormalizedModelSnapshot,
  materialPreset: StlMaterialPreset,
  background: StlBackgroundPreset,
  size: number,
  logger: RenderLogger,
  signal: AbortSignal | undefined,
  frames: Array<{
    cameraPosition: Vector3;
    cameraUp?: Vector3;
    rotationY?: number;
  }>
) {
  return runWithSvgDom(async () => {
    logger.debug("render-frames:start", {
      frameCount: frames.length,
      size,
      materialPreset,
      background
    });
    const subject = applyMaterial(snapshot.object.clone(true), materialPreset);
    const scene = createStudioScene(subject, background);
    const camera = new PerspectiveCamera(CAMERA_FOV, 1, 0.1, 100);
    const renderer = new SVGRenderer();

    renderer.setQuality("high");
    renderer.setSize(size, size);
    renderer.setClearColor(new Color(STL_BACKGROUND_META[background].color), 1);

    const buffers: Buffer[] = [];

    for (const [index, frame] of frames.entries()) {
      throwIfAborted(signal);
      subject.rotation.set(0, frame.rotationY ?? 0, 0);
      subject.updateMatrixWorld(true);

      camera.position.copy(frame.cameraPosition);
      camera.up.copy(frame.cameraUp ?? DEFAULT_CAMERA_UP);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld(true);

      renderer.render(scene, camera);

      const svg = buildNeutralSvg(
        renderer.domElement.innerHTML,
        size,
        STL_BACKGROUND_META[background].color
      );
      const pngBuffer = await sharp(Buffer.from(svg))
        .png({ compressionLevel: 9 })
        .toBuffer();

      buffers.push(pngBuffer);

      logger.debug("render-frames:frame-complete", {
        frameIndex: index,
        bytes: pngBuffer.byteLength
      });
    }

    logger.log("render-frames:complete", {
      frameCount: buffers.length,
      size
    });

    return buffers;
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

async function isExecutableReachable(command: string) {
  return new Promise<boolean>((resolve) => {
    const child = spawn(command, ["-version"], {
      stdio: ["ignore", "ignore", "ignore"],
      windowsHide: true
    });

    child.on("error", () => resolve(false));
    child.on("close", (code) => resolve(code === 0));
  });
}

async function resolveFfmpegBinary() {
  if (resolvedFfmpegBinaryPromise) {
    return resolvedFfmpegBinaryPromise;
  }

  resolvedFfmpegBinaryPromise = (async () => {
    if (process.env.FFMPEG_PATH) {
      try {
        await fs.access(process.env.FFMPEG_PATH);
        return process.env.FFMPEG_PATH;
      } catch {
        throw new StlRenderPipelineError(
          `FFMPEG_PATH is set but not readable: ${process.env.FFMPEG_PATH}`
        );
      }
    }

    if (await isExecutableReachable("ffmpeg")) {
      return "ffmpeg";
    }

    const binaryName =
      (ffmpegPath && path.basename(ffmpegPath)) ||
      (process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg");

    const bundledBinary = await resolveReadablePath(
      [ffmpegPath, path.join(process.cwd(), "node_modules", "ffmpeg-static", binaryName)].filter(
        (candidate): candidate is string => Boolean(candidate)
      )
    );

    if (!bundledBinary) {
      throw new StlRenderPipelineError(
        "ffmpeg is not available. Install ffmpeg or provide FFMPEG_PATH."
      );
    }

    return bundledBinary;
  })();

  try {
    return await resolvedFfmpegBinaryPromise;
  } catch (error) {
    resolvedFfmpegBinaryPromise = null;
    throw error;
  }
}

async function runFfmpeg(
  args: string[],
  logger: RenderLogger,
  signal?: AbortSignal
) {
  const binaryPath = await resolveFfmpegBinary();

  await new Promise<void>((resolve, reject) => {
    const child = spawn(binaryPath, args, {
      stdio: ["ignore", "ignore", "pipe"],
      windowsHide: true
    });
    let settled = false;
    let stderr = "";

    const settleResolve = () => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      resolve();
    };

    const settleReject = (error: unknown) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      reject(error);
    };

    const timeout = setTimeout(() => {
      logger.log("video-generation:timeout", {
        binaryPath,
        timeoutMs: STL_RENDER_TIMEOUT_MS
      });
      child.kill("SIGKILL");
      settleReject(
        new StlRenderPipelineError(
          `ffmpeg timed out after ${Math.round(STL_RENDER_TIMEOUT_MS / 1000)} seconds.`,
          504
        )
      );
    }, STL_RENDER_TIMEOUT_MS);

    const abortHandler = () => {
      logger.log("video-generation:aborted", {
        binaryPath
      });
      child.kill("SIGKILL");
      settleReject(new StlRenderPipelineError("The render was aborted.", 504));
    };

    const cleanup = () => {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abortHandler);
    };

    logger.log("video-generation:started", {
      binaryPath,
      args
    });

    signal?.addEventListener("abort", abortHandler, { once: true });

    child.on("spawn", () => {
      logger.debug("video-generation:spawned", {
        pid: child.pid
      });
    });

    child.stderr.on("data", (chunk) => {
      const output = chunk.toString();
      stderr += output;
      logger.childOutput("video-generation:stderr", output);
    });

    child.on("error", (error) => {
      logger.log("video-generation:error", {
        error: toErrorMessage(error)
      });
      settleReject(error);
    });

    child.on("exit", (code, exitSignal) => {
      logger.debug("video-generation:exit", {
        code,
        signal: exitSignal
      });
    });

    child.on("close", (code) => {
      if (code === 0) {
        logger.log("video-generation:completed", {
          binaryPath
        });
        settleResolve();
        return;
      }

      logger.log("video-generation:failed", {
        code,
        error: stderr.trim() || "ffmpeg failed to encode the MP4 preview."
      });
      settleReject(
        new StlRenderPipelineError(
          stderr.trim() || "ffmpeg failed to encode the MP4 preview."
        )
      );
    });
  });
}

async function buildStillAssets(
  snapshot: NormalizedModelSnapshot,
  renderId: string,
  publicDirectory: string,
  materialPreset: StlMaterialPreset,
  background: StlBackgroundPreset,
  cameraDistance: number,
  logger: RenderLogger,
  signal?: AbortSignal
) {
  logger.log("images-render:start", {
    viewCount: STL_VIEW_KEYS.length,
    outputSize: STILL_OUTPUT_SIZE
  });

  const frames: StillRenderFrame[] = STL_VIEW_KEYS.map((view) => {
    const placement = getStillCameraPlacement(view, cameraDistance);
    const meta = STL_VIEW_META[view];

    return {
      key: view,
      label: meta.label,
      filename: meta.filename,
      cameraPosition: placement.position,
      cameraUp: placement.up
    };
  });

  const buffers = await renderFrames(
    snapshot,
    materialPreset,
    background,
    STILL_OUTPUT_SIZE,
    logger,
    signal,
    frames.map((frame) => ({
      cameraPosition: frame.cameraPosition,
      cameraUp: frame.cameraUp
    }))
  );

  const imageEntries = await Promise.all(
    frames.map(async (frame, index) => {
      const outputPath = path.join(publicDirectory, frame.filename);
      const buffer = buffers[index];

      await writeBufferToFile(
        outputPath,
        buffer,
        logger,
        `image-${frame.key}`,
        signal
      );

      const asset: StlRenderImageAsset = {
        key: frame.key,
        label: frame.label,
        filename: frame.filename,
        src: toPublicAssetPath(renderId, frame.filename),
        outputPath,
        width: STILL_OUTPUT_SIZE,
        height: STILL_OUTPUT_SIZE,
        mimeType: "image/png"
      };

      return [frame.key, asset] as const;
    })
  );

  logger.log("images-render:complete", {
    imageCount: imageEntries.length
  });

  return Object.fromEntries(imageEntries) as Record<
    StlRenderViewKey,
    StlRenderImageAsset
  >;
}

async function buildThumbnailAsset(
  renderId: string,
  publicDirectory: string,
  sourceImagePath: string,
  logger: RenderLogger,
  signal?: AbortSignal
) {
  throwIfAborted(signal);
  const outputPath = path.join(publicDirectory, THUMBNAIL_FILENAME);
  logger.log("thumbnail-generation:start", {
    sourceImagePath,
    outputPath
  });

  await sharp(sourceImagePath)
    .resize(512, 512, {
      fit: "cover",
      position: "centre"
    })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);

  logger.log("thumbnail-generation:complete", {
    outputPath
  });

  return {
    key: "thumbnail",
    label: "Thumbnail",
    filename: THUMBNAIL_FILENAME,
    src: toPublicAssetPath(renderId, THUMBNAIL_FILENAME),
    outputPath,
    width: 512,
    height: 512,
    mimeType: "image/png"
  } satisfies StlRenderImageAsset;
}

async function assertFrameSequence(frameDirectory: string) {
  const files = await fs.readdir(frameDirectory);
  const frameFiles = files.filter(
    (fileName) => fileName.startsWith("frame-") && fileName.endsWith(".png")
  );

  if (frameFiles.length !== VIDEO_FRAME_COUNT) {
    throw new StlRenderPipelineError(
      `Expected ${VIDEO_FRAME_COUNT} frames but found ${frameFiles.length}.`
    );
  }
}

async function buildVideoAsset(
  snapshot: NormalizedModelSnapshot,
  renderId: string,
  publicDirectory: string,
  materialPreset: StlMaterialPreset,
  background: StlBackgroundPreset,
  cameraDistance: number,
  logger: RenderLogger,
  signal?: AbortSignal
) {
  const workingDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "stl-render-"));
  const framesDirectory = path.join(workingDirectory, "frames");
  const outputPath = path.join(publicDirectory, VIDEO_FILENAME);
  const videoCamera = getVideoCameraPlacement(cameraDistance);

  try {
    logger.log("video-frames:start", {
      frameCount: VIDEO_FRAME_COUNT,
      outputSize: VIDEO_OUTPUT_SIZE,
      workingDirectory
    });
    await ensureDirectory(framesDirectory);

    const frameRequests: SequenceFrame[] = Array.from(
      { length: VIDEO_FRAME_COUNT },
      (_value, index) => ({
        frameIndex: index,
        outputPath: path.join(
          framesDirectory,
          `frame-${String(index).padStart(4, "0")}.png`
        ),
        rotationY: (index / VIDEO_FRAME_COUNT) * Math.PI * 2,
        cameraPosition: videoCamera.position.clone(),
        cameraUp: videoCamera.up
      })
    );

    for (
      let batchStart = 0;
      batchStart < frameRequests.length;
      batchStart += FRAME_BATCH_SIZE
    ) {
      throwIfAborted(signal);
      const batch = frameRequests.slice(batchStart, batchStart + FRAME_BATCH_SIZE);
      const batchBuffers = await renderFrames(
        snapshot,
        materialPreset,
        background,
        VIDEO_OUTPUT_SIZE,
        logger,
        signal,
        batch.map((frame) => ({
          cameraPosition: frame.cameraPosition,
          cameraUp: frame.cameraUp,
          rotationY: frame.rotationY
        }))
      );

      await Promise.all(
        batch.map((frame, index) =>
          writeBufferToFile(
            frame.outputPath,
            batchBuffers[index],
            logger,
            `video-frame-${frame.frameIndex}`,
            signal
          )
        )
      );

      logger.log("video-frames:batch-complete", {
        batchStart,
        batchEnd: batchStart + batch.length - 1
      });
      await yieldToEventLoop();
    }

    await assertFrameSequence(framesDirectory);

    logger.log("video-encoding:start", {
      outputPath
    });

    await runFfmpeg(
      [
        "-y",
        "-framerate",
        String(VIDEO_FRAME_RATE),
        "-i",
        path.join(framesDirectory, "frame-%04d.png"),
        "-vf",
        `scale=${VIDEO_OUTPUT_SIZE}:${VIDEO_OUTPUT_SIZE}`,
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        outputPath
      ],
      logger,
      signal
    );

    logger.log("video-encoding:complete", {
      outputPath
    });

    return {
      filename: VIDEO_FILENAME,
      src: toPublicAssetPath(renderId, VIDEO_FILENAME),
      outputPath,
      width: VIDEO_OUTPUT_SIZE,
      height: VIDEO_OUTPUT_SIZE,
      frameCount: VIDEO_FRAME_COUNT,
      frameRate: VIDEO_FRAME_RATE,
      codec: "h264",
      mimeType: "video/mp4"
    } satisfies StlRenderVideoAsset;
  } finally {
    logger.debug("video-cleanup:start", {
      workingDirectory
    });
    await fs.rm(workingDirectory, { recursive: true, force: true });
    logger.debug("video-cleanup:complete", {
      workingDirectory
    });
  }
}

function buildStats(
  snapshot: NormalizedModelSnapshot,
  cameraDistance: number,
  durationMs: number
): StlRenderStats {
  return {
    meshCount: snapshot.meshCount,
    vertexCount: snapshot.vertexCount,
    triangleCount: snapshot.triangleCount,
    dimensions: {
      x: Number(snapshot.originalSize.x.toFixed(3)),
      y: Number(snapshot.originalSize.y.toFixed(3)),
      z: Number(snapshot.originalSize.z.toFixed(3))
    },
    normalizedScale: Number(snapshot.normalizedScale.toFixed(6)),
    cameraDistance: Number(cameraDistance.toFixed(6)),
    backend: "three.js-headless-svg",
    gpuEnabled: false,
    durationMs
  };
}

async function withTimeout<T>(
  task: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
  logger: RenderLogger
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    logger.log("render-timeout:triggered", {
      timeoutMs
    });
    controller.abort();
  }, timeoutMs);

  try {
    return await task(controller.signal);
  } finally {
    clearTimeout(timeout);
  }
}

export function isStlFileName(fileName: string) {
  return fileName.toLowerCase().endsWith(".stl");
}

export function parseMaterialPreset(
  value: FormDataEntryValue | null | undefined
): StlMaterialPreset {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";

  if (!normalized) {
    return DEFAULT_MATERIAL_PRESET;
  }

  if (
    normalized === "clay" ||
    normalized === "metal" ||
    normalized === "wood"
  ) {
    return normalized;
  }

  throw new StlRenderPipelineError(
    "Invalid material preset. Use clay, metal, or wood.",
    400
  );
}

export function parseBackgroundPreset(
  value: FormDataEntryValue | null | undefined
): StlBackgroundPreset {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";

  if (!normalized) {
    return DEFAULT_BACKGROUND;
  }

  if (normalized === "white" || normalized === "dark") {
    return normalized;
  }

  throw new StlRenderPipelineError(
    "Invalid background preset. Use white or dark.",
    400
  );
}

export function parseBooleanFormValue(
  value: FormDataEntryValue | null | undefined,
  defaultValue: boolean
) {
  if (typeof value !== "string") {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "true" || normalized === "1" || normalized === "yes") {
    return true;
  }

  if (normalized === "false" || normalized === "0" || normalized === "no") {
    return false;
  }

  return defaultValue;
}

async function executeRender(
  renderId: string,
  file: File,
  options: RenderRequestOptions,
  signal: AbortSignal,
  logger: RenderLogger
): Promise<StlRenderResult> {
  const renderStartedAt = Date.now();

  logger.log("render:start", {
    size: file.size,
    debug: options.debug ?? false
  });

  if (!isStlFileName(file.name)) {
    throw new StlRenderPipelineError("Only STL uploads are supported.", 400);
  }

  if (!file.size) {
    throw new StlRenderPipelineError("The uploaded STL is empty.", 400);
  }

  if (file.size > MAX_STL_FILE_SIZE) {
    throw new StlRenderPipelineError(
      `The uploaded STL exceeds the ${Math.round(
        MAX_STL_FILE_SIZE / (1024 * 1024)
      )} MB limit.`,
      413
    );
  }

  const materialPreset = options.materialPreset ?? DEFAULT_MATERIAL_PRESET;
  const background = options.background ?? DEFAULT_BACKGROUND;
  const includeThumbnail = options.includeThumbnail ?? true;
  const sourceBuffer = Buffer.from(await file.arrayBuffer());
  logger.log("stl-loaded", {
    bytes: sourceBuffer.byteLength
  });

  if (!sourceBuffer.byteLength) {
    throw new StlRenderPipelineError("The uploaded STL is empty.", 400);
  }

  throwIfAborted(signal);

  let snapshot: NormalizedModelSnapshot;

  try {
    const loadedMesh = loadStlMesh(sourceBuffer);
    logger.log("mesh-loaded", {
      geometryType: loadedMesh.geometry.type
    });
    snapshot = normalizeModelSnapshot(loadedMesh);
    logger.log("mesh-processed", {
      meshCount: snapshot.meshCount,
      vertexCount: snapshot.vertexCount,
      triangleCount: snapshot.triangleCount
    });
  } catch (error) {
    logger.log("mesh-processing:failed", {
      error: toErrorMessage(error)
    });
    throw error;
  }

  throwIfAborted(signal);
  const publicDirectory = await ensureDirectory(getPublicOutputDirectory(renderId));
  logger.log("output-directory:ready", {
    publicDirectory
  });

  await persistRenderManifest(
    renderId,
    file,
    sourceBuffer,
    materialPreset,
    background,
    includeThumbnail,
    logger,
    signal
  );

  const cameraDistance = calculateCameraDistance(snapshot.radius);
  logger.debug("camera-setup", {
    cameraDistance
  });

  let images: Record<StlRenderViewKey, StlRenderImageAsset>;

  try {
    images = await buildStillAssets(
      snapshot,
      renderId,
      publicDirectory,
      materialPreset,
      background,
      cameraDistance,
      logger,
      signal
    );
  } catch (error) {
    logger.log("images-render:failed", {
      error: toErrorMessage(error)
    });
    throw error;
  }

  let video: StlRenderVideoAsset;

  try {
    video = await buildVideoAsset(
      snapshot,
      renderId,
      publicDirectory,
      materialPreset,
      background,
      cameraDistance,
      logger,
      signal
    );
  } catch (error) {
    logger.log("video-generation:failed", {
      error: toErrorMessage(error)
    });
    throw error;
  }

  let thumbnail: StlRenderImageAsset | undefined;

  if (includeThumbnail) {
    try {
      thumbnail = await buildThumbnailAsset(
        renderId,
        publicDirectory,
        images.left.outputPath,
        logger,
        signal
      );
    } catch (error) {
      logger.log("thumbnail-generation:failed", {
        error: toErrorMessage(error)
      });
      throw error;
    }
  }

  const durationMs = Date.now() - renderStartedAt;
  logger.log("render:complete", {
    durationMs
  });

  return {
    renderId,
    sourceName: file.name,
    materialPreset,
    background,
    outputDirectory: publicDirectory,
    images,
    video,
    thumbnail,
    stats: buildStats(snapshot, cameraDistance, durationMs)
  };
}

export async function renderUploadedStl(
  file: File,
  options: RenderRequestOptions = {}
) {
  const renderId = randomUUID();
  const logger = createRenderLogger(renderId, file.name, options.debug ?? false);

  return withTimeout(
    async (signal) => executeRender(renderId, file, options, signal, logger),
    STL_RENDER_TIMEOUT_MS,
    logger
  );
}
