"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ThreeDViewer } from "@/components/3d-viewer";
import { Container } from "@/components/ui/container";
import {
  CAMERA_META,
  formatFileSize,
  getModelExtension,
  MATERIAL_META,
  MAX_3D_FILE_SIZE
} from "@/lib/3d-config";
import { download3DRenderZipBundle, downloadAsset } from "@/lib/downloads";
import type {
  Render3DResponse,
  RenderMaterialKey,
  Rendered3DResult
} from "@/lib/types";

function StatCard({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/45 p-4">
      <div className="text-[11px] uppercase tracking-[0.26em] text-slate-400">
        {label}
      </div>
      <div className="mt-3 font-[var(--font-heading)] text-2xl font-semibold text-white">
        {value}
      </div>
    </div>
  );
}

function formatDimensionTriplet(result: Rendered3DResult) {
  const { x, y, z } = result.stats.dimensions;

  return `${x} x ${y} x ${z}`;
}

export default function ThreeDRenderToolPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<Rendered3DResult | null>(null);
  const [activeMaterial, setActiveMaterial] = useState<RenderMaterialKey>("wood");
  const [isDragging, setIsDragging] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("Ready to render");
  const [error, setError] = useState<string | null>(null);

  const activeMaterialGroup =
    result?.materials.find((material) => material.key === activeMaterial) ?? null;

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
      }
    };
  }, []);

  function stopProgress() {
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }

  function startProgressSimulation() {
    stopProgress();

    const steps = [
      { value: 12, label: "Validating STL/OBJ payload" },
      { value: 24, label: "Uploading source geometry to the render API" },
      { value: 42, label: "Centering the model and normalizing scale" },
      { value: 61, label: "Rendering material variations and camera angles" },
      { value: 81, label: "Encoding the 360-degree MP4 preview" },
      { value: 92, label: "Preparing the download-ready render pack" }
    ];
    let stepIndex = 0;

    setProgress(steps[0].value);
    setProgressLabel(steps[0].label);

    progressTimerRef.current = window.setInterval(() => {
      stepIndex = Math.min(stepIndex + 1, steps.length - 1);
      setProgress(steps[stepIndex].value);
      setProgressLabel(steps[stepIndex].label);
    }, 1200);
  }

  function validateAndSelectFile(file: File) {
    const extension = getModelExtension(file.name);

    if (!extension) {
      setError("Unsupported file type. Upload an STL or OBJ model.");
      return;
    }

    if (file.size > MAX_3D_FILE_SIZE) {
      setError("File is too large. Please keep uploads at or below 20 MB.");
      return;
    }

    setSelectedFile(file);
    setResult(null);
    setError(null);
    setProgress(0);
    setProgressLabel("Ready to render");
  }

  async function handleGenerate() {
    if (!selectedFile) {
      setError("Select an STL or OBJ file before rendering.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setIsRendering(true);
    setError(null);
    startProgressSimulation();

    try {
      const response = await fetch("/api/render-3d", {
        method: "POST",
        body: formData
      });
      const payload = (await response.json()) as Render3DResponse & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "We could not render this 3D file.");
      }

      stopProgress();
      setProgress(100);
      setProgressLabel("Render pack complete");
      setResult(payload.result);
    } catch (renderError) {
      stopProgress();
      setProgress(0);
      setProgressLabel("Ready to render");
      setError(
        renderError instanceof Error
          ? renderError.message
          : "Unexpected rendering error."
      );
    } finally {
      setIsRendering(false);
    }
  }

  async function handleZipDownload() {
    if (!result) {
      return;
    }

    try {
      setIsDownloadingZip(true);
      await download3DRenderZipBundle(result);
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Unable to build the ZIP bundle."
      );
    } finally {
      setIsDownloadingZip(false);
    }
  }

  return (
    <Container className="pb-16 pt-10 sm:pt-14">
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-white/5 p-7 shadow-premium backdrop-blur-xl sm:p-9">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 82% 18%, rgba(56,189,248,0.18), transparent 18%), radial-gradient(circle at 18% 24%, rgba(37,99,235,0.18), transparent 24%), linear-gradient(135deg, rgba(10,18,36,0.5), rgba(4,10,20,0.92))"
            }}
          />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.34em] text-cyan-100">
                3D STL/OBJ Auto Renderer
              </p>
              <h1 className="mt-5 font-[var(--font-heading)] text-4xl font-semibold text-white sm:text-5xl">
                Turn one CAD upload into a polished multi-angle render pack.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-8 text-slate-300 sm:text-base">
                Upload an STL or OBJ model to generate 12 production PNG renders
                across front, side, top, and perspective views, then finish with
                a rotating MP4 preview for approvals, listings, and client decks.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/tool"
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition duration-300 hover:bg-white/15"
              >
                Open Crop Tool
              </Link>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!selectedFile || isRendering}
                className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition duration-300 hover:-translate-y-0.5 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRendering ? "Rendering..." : "Generate 12 Renders + MP4"}
              </button>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
          <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-premium backdrop-blur-xl">
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200">
                  Upload Console
                </p>
                <h2 className="mt-3 font-[var(--font-heading)] text-3xl font-semibold text-white">
                  Drop a single STL or OBJ and render it server-side.
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  The pipeline validates the model, normalizes scale, renders
                  every material and camera preset, then assembles a rotating MP4
                  preview using ffmpeg.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition duration-300 hover:-translate-y-0.5 hover:bg-cyan-300"
                >
                  Select 3D File
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setResult(null);
                    setError(null);
                    setProgress(0);
                    setProgressLabel("Ready to render");
                  }}
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-slate-950/45 px-5 py-3 text-sm font-semibold text-slate-200 transition duration-300 hover:border-rose-300/30 hover:bg-rose-400/10"
                >
                  Clear
                </button>
              </div>

              <input
                ref={inputRef}
                type="file"
                accept=".stl,.obj"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (file) {
                    validateAndSelectFile(file);
                  }

                  event.target.value = "";
                }}
              />

              <div
                onDragEnter={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                  const file = event.dataTransfer.files?.[0];

                  if (file) {
                    validateAndSelectFile(file);
                  }
                }}
                className={`rounded-[1.75rem] border border-dashed px-6 py-10 text-center transition duration-300 ${
                  isDragging
                    ? "border-cyan-300/70 bg-cyan-400/10"
                    : "border-white/15 bg-slate-950/40"
                }`}
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-cyan-100">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-8 w-8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  >
                    <path
                      d="M7 16V8.75A2.75 2.75 0 019.75 6h4.5A2.75 2.75 0 0117 8.75V16M4 16h16M8 12l4-4 4 4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="mt-5 font-[var(--font-heading)] text-xl font-semibold text-white">
                  Drag and drop your 3D file here
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  STL or OBJ only, up to 20 MB per upload
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                  label="Accepted Formats"
                  value="STL / OBJ"
                />
                <StatCard
                  label="Still Outputs"
                  value="12 PNGs"
                />
                <StatCard
                  label="Video Output"
                  value="1 MP4"
                />
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/45 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.28em] text-slate-400">
                      Selected File
                    </div>
                    <div className="mt-3 font-[var(--font-heading)] text-xl font-semibold text-white">
                      {selectedFile ? selectedFile.name : "No file selected"}
                    </div>
                    <div className="mt-2 text-sm text-slate-400">
                      {selectedFile
                        ? `${formatFileSize(selectedFile.size)} - ${selectedFile.name
                            .split(".")
                            .pop()
                            ?.toUpperCase()}`
                        : "Choose a model to unlock the live 3D preview and render pipeline."}
                    </div>
                  </div>

                  {selectedFile ? (
                    <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.26em] text-cyan-100">
                      Ready
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/45 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.28em] text-slate-400">
                      Render Progress
                    </div>
                    <div className="mt-3 font-medium text-white">{progressLabel}</div>
                  </div>
                  <div className="text-sm font-semibold text-cyan-100">
                    {progress}%
                  </div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-sky-300 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {error ? (
                <div className="rounded-[1.5rem] border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                  {error}
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-premium backdrop-blur-xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-blue-200">
                  Preview Studio
                </p>
                <h2 className="mt-3 font-[var(--font-heading)] text-3xl font-semibold text-white">
                  Inspect the model, then review the finished render pack.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                  Material tabs sync the live viewer with the generated stills,
                  so the preview area feels like a real production console instead
                  of a placeholder gallery.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {result ? (
                  <>
                    <button
                      type="button"
                      onClick={handleZipDownload}
                      disabled={isDownloadingZip}
                      className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition duration-300 hover:border-cyan-300/30 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isDownloadingZip ? "Building ZIP..." : "Download All Images"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        downloadAsset(result.video.filename, result.video.dataUrl)
                      }
                      className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition duration-300 hover:-translate-y-0.5"
                    >
                      Download MP4
                    </button>
                  </>
                ) : (
                  <div className="rounded-full border border-white/10 bg-slate-950/45 px-4 py-2 text-sm text-slate-300">
                    Awaiting first render
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 space-y-6">
              <ThreeDViewer file={selectedFile} materialKey={activeMaterial} />

              <div className="flex flex-wrap gap-3">
                {(Object.keys(MATERIAL_META) as RenderMaterialKey[]).map((materialKey) => (
                  <button
                    key={materialKey}
                    type="button"
                    onClick={() => setActiveMaterial(materialKey)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition duration-300 ${
                      activeMaterial === materialKey
                        ? "border-cyan-300/40 bg-cyan-400/15 text-cyan-50"
                        : "border-white/10 bg-slate-950/45 text-slate-300 hover:border-white/20 hover:bg-white/10"
                    }`}
                  >
                    {MATERIAL_META[materialKey].label}
                  </button>
                ))}
              </div>

              {!result || !activeMaterialGroup ? (
                <div className="rounded-[1.75rem] border border-dashed border-white/15 bg-slate-950/40 px-6 py-16 text-center">
                  <h3 className="font-[var(--font-heading)] text-2xl font-semibold text-white">
                    Generated renders will land here.
                  </h3>
                  <p className="mt-3 mx-auto max-w-xl text-sm leading-7 text-slate-400">
                    Once the API finishes, you will see the four camera angles
                    for the active material tab plus a browser-ready 360-degree
                    MP4 preview.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-4 xl:grid-cols-[0.76fr_1.24fr]">
                    <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-5">
                      <div className="text-[11px] uppercase tracking-[0.28em] text-slate-400">
                        Model Stats
                      </div>
                      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                        <StatCard label="Meshes" value={`${result.stats.meshCount}`} />
                        <StatCard
                          label="Triangles"
                          value={result.stats.triangleCount.toLocaleString()}
                        />
                        <StatCard
                          label="Vertices"
                          value={result.stats.vertexCount.toLocaleString()}
                        />
                        <StatCard
                          label="Bounds"
                          value={formatDimensionTriplet(result)}
                        />
                      </div>
                    </div>

                    <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-[11px] uppercase tracking-[0.28em] text-slate-400">
                            {activeMaterialGroup.label} Render Set
                          </div>
                          <div className="mt-2 text-sm text-slate-300">
                            {activeMaterialGroup.description}
                          </div>
                        </div>
                        <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.26em] text-cyan-100">
                          {activeMaterialGroup.images.length} views
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        {activeMaterialGroup.images.map((image) => (
                          <article
                            key={image.id}
                            className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#060d19] transition duration-300 hover:-translate-y-1 hover:border-cyan-300/30"
                          >
                            <div className="aspect-square overflow-hidden border-b border-white/10">
                              <Image
                                src={image.dataUrl}
                                alt={`${activeMaterialGroup.label} ${CAMERA_META[image.angle].label}`}
                                width={image.width}
                                height={image.height}
                                unoptimized
                                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                              />
                            </div>
                            <div className="space-y-3 p-4">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <div className="font-semibold text-white">
                                    {CAMERA_META[image.angle].label}
                                  </div>
                                  <div className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-400">
                                    {image.width} x {image.height}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    downloadAsset(image.filename, image.dataUrl)
                                  }
                                  className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition duration-300 hover:border-cyan-300/30 hover:bg-cyan-400/10"
                                >
                                  PNG
                                </button>
                              </div>
                              <p className="text-sm leading-6 text-slate-400">
                                {CAMERA_META[image.angle].description}
                              </p>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.28em] text-slate-400">
                          360-Degree Video Preview
                        </div>
                        <h3 className="mt-2 font-[var(--font-heading)] text-2xl font-semibold text-white">
                          Rotating MP4 encoded from {result.video.frameCount} frames
                        </h3>
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
                          The preview video uses the neutral{" "}
                          {MATERIAL_META[result.video.material].label.toLowerCase()}
                          {" "}material so shape and silhouette stay readable across the
                          full orbit.
                        </p>
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-slate-200">
                        {result.video.width} x {result.video.height}
                      </div>
                    </div>

                    <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-white/10 bg-black">
                      <video
                        src={result.video.dataUrl}
                        controls
                        loop
                        playsInline
                        className="aspect-square w-full"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </Container>
  );
}
