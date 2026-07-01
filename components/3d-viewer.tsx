"use client";

import { motion } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, Stage } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import {
  Box3,
  BufferGeometry,
  Color,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Vector3
} from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { MATERIAL_META, getModelExtension } from "@/lib/3d-config";
import type { RenderMaterialKey } from "@/lib/types";

type ThreeDViewerProps = {
  file: File | null;
  materialKey: RenderMaterialKey;
};

type ViewMode = "rotate" | "pan" | "zoom";

function createPreviewMaterial(materialKey: RenderMaterialKey) {
  const spec = MATERIAL_META[materialKey];

  return new MeshStandardMaterial({
    color: new Color(spec.color),
    roughness: spec.roughness,
    metalness: spec.metalness,
    envMapIntensity: materialKey === "metal" ? 1.5 : 0.7
  });
}

function normalizePreviewObject(source: Object3D, materialKey: RenderMaterialKey) {
  const cloned = source.clone(true);
  const box = new Box3().setFromObject(cloned);

  if (box.isEmpty()) {
    throw new Error("The uploaded model does not contain renderable geometry.");
  }

  const size = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());
  const maxAxis = Math.max(size.x, size.y, size.z) || 1;
  const wrapper = new Group();

  cloned.position.copy(center.multiplyScalar(-1));

  cloned.traverse((node) => {
    if (!("isMesh" in node) || !node.isMesh) {
      return;
    }

    const mesh = node as Mesh<BufferGeometry>;

    mesh.geometry = mesh.geometry.clone();

    if (!mesh.geometry.getAttribute("normal")) {
      mesh.geometry.computeVertexNormals();
    }

    mesh.material = createPreviewMaterial(materialKey);
  });

  wrapper.add(cloned);
  wrapper.scale.setScalar(2 / maxAxis);
  wrapper.updateMatrixWorld(true);

  return wrapper;
}

async function parseUploadedModel(file: File) {
  const extension = getModelExtension(file.name);

  if (!extension) {
    throw new Error("Unsupported file type. Upload an STL or OBJ file.");
  }

  const arrayBuffer = await file.arrayBuffer();

  if (extension === "stl") {
    const geometry = new STLLoader().parse(arrayBuffer);
    geometry.computeVertexNormals();

    return new Mesh(geometry);
  }

  return new OBJLoader().parse(await file.text());
}

export function ThreeDViewer({ file, materialKey }: ThreeDViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef<any>(null);
  const [sourceModel, setSourceModel] = useState<Object3D | null>(null);
  const [displayModel, setDisplayModel] = useState<Object3D | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("rotate");

  useEffect(() => {
    let isCancelled = false;

    async function loadModel() {
      if (!file) {
        setSourceModel(null);
        setDisplayModel(null);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const model = await parseUploadedModel(file);

        if (isCancelled) {
          return;
        }

        setSourceModel(model);
      } catch (viewerError) {
        if (isCancelled) {
          return;
        }

        setError(
          viewerError instanceof Error
            ? viewerError.message
            : "Unable to preview this model."
        );
        setSourceModel(null);
        setDisplayModel(null);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadModel();

    return () => {
      isCancelled = true;
    };
  }, [file]);

  useEffect(() => {
    if (!sourceModel) {
      setDisplayModel(null);
      return;
    }

    try {
      setDisplayModel(normalizePreviewObject(sourceModel, materialKey));
    } catch (viewerError) {
      setError(
        viewerError instanceof Error
          ? viewerError.message
          : "Unable to style this preview."
      );
      setDisplayModel(null);
    }
  }, [materialKey, sourceModel]);

  function resetCamera() {
    controlsRef.current?.reset?.();
  }

  function toggleFullscreen() {
    if (!containerRef.current) {
      return;
    }

    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }

    void containerRef.current.requestFullscreen();
  }

  return (
    <div ref={containerRef} className="relative h-[32rem] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#020617] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at top right, rgba(34,211,238,0.16), transparent 28%), radial-gradient(circle at 16% 20%, rgba(59,130,246,0.14), transparent 22%), linear-gradient(180deg, rgba(2,6,23,0.8) 0%, rgba(2,8,23,0.95) 100%)"
        }}
      />

      <div className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/70 p-1.5 backdrop-blur">
        {[
          { key: "rotate", label: "Rotate", icon: "↺" },
          { key: "pan", label: "Pan", icon: "✥" },
          { key: "zoom", label: "Zoom", icon: "+" }
        ].map((tool) => (
          <button
            key={tool.key}
            type="button"
            onClick={() => setViewMode(tool.key as ViewMode)}
            className={`rounded-full px-3 py-2 text-sm font-medium transition ${
              viewMode === tool.key
                ? "bg-cyan-400/15 text-cyan-200"
                : "text-slate-300 hover:bg-white/10"
            }`}
          >
            {tool.icon}
          </button>
        ))}
        <button
          type="button"
          onClick={resetCamera}
          className="rounded-full px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={toggleFullscreen}
          className="rounded-full px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10"
        >
          Fullscreen
        </button>
      </div>

      {displayModel ? (
        <Canvas camera={{ position: [3.2, 2.6, 3.2], fov: 34 }}>
          <color attach="background" args={["#020617"]} />
          <fog attach="fog" args={["#020617", 7, 13]} />
          <Stage adjustCamera={1.45} intensity={0.72} environment={null} shadows={false}>
            <primitive object={displayModel} />
          </Stage>
          <Environment preset="city" />
          <OrbitControls
            ref={controlsRef}
            enableRotate={viewMode === "rotate"}
            enablePan={viewMode === "pan"}
            enableZoom={viewMode === "zoom"}
            maxDistance={7}
            minDistance={2.2}
            autoRotate={false}
          />
        </Canvas>
      ) : (
        <div className="relative flex h-full items-center justify-center px-6 text-center">
          <div className="max-w-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-8 w-8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path
                  d="M12 2l8 4.5v11L12 22 4 17.5v-11L12 2zm0 0v20m8-15.5-8 4.5-8-4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="mt-5 text-2xl font-medium text-white">
              Live 3D preview
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              Upload an STL or OBJ file to inspect it before generating the export pack.
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-x-5 top-5 rounded-[1rem] border border-cyan-400/20 bg-slate-950/70 p-4 backdrop-blur"
        >
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-400" />
            <div className="h-2 w-24 animate-pulse rounded-full bg-cyan-400/20" />
          </div>
          <div className="mt-3 grid gap-2">
            <div className="h-2 w-full animate-pulse rounded-full bg-white/10" />
            <div className="h-2 w-4/5 animate-pulse rounded-full bg-white/10" />
          </div>
        </motion.div>
      ) : null}

      {error ? (
        <div className="absolute inset-x-5 bottom-5 rounded-[1rem] border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {file ? (
        <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-slate-950/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-200">
          {file.name.split(".").pop()?.toUpperCase() ?? "3D"}
        </div>
      ) : null}
    </div>
  );
}
