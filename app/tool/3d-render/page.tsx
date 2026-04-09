"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ThreeDViewer } from "@/components/3d-viewer";
import { Container } from "@/components/ui/container";
import { formatFileSize } from "@/lib/3d-config";
import {
  DEFAULT_BACKGROUND,
  MAX_STL_FILE_SIZE,
  STL_BACKGROUND_META,
  STL_MATERIAL_PRESET_KEYS,
  STL_MATERIAL_PRESET_META,
  STL_VIEW_KEYS,
  STL_VIEW_META
} from "@/lib/stl-render-config";
import {
  downloadAsset,
  downloadStlRenderZipBundle
} from "@/lib/downloads";
import type {
  RenderMaterialKey,
  StlBackgroundPreset,
  StlRenderResponse,
  StlRenderResult
} from "@/lib/types";

function StatCard({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-stone-200 bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
      <div className="text-[11px] uppercase tracking-[0.26em] text-stone-500">
        {label}
      </div>
      <div className="mt-3 font-[var(--font-heading)] text-2xl font-semibold text-stone-900">
        {value}
      </div>
    </div>
  );
}

function formatTriplet(result: StlRenderResult) {
  const { x, y, z } = result.stats.dimensions;
  return `${x} x ${y} x ${z}`;
}

export default function ThreeDRenderToolPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<StlRenderResult | null>(null);
  const [materialPreset, setMaterialPreset] =
    useState<RenderMaterialKey>("clay");
  const [background, setBackground] =
    useState<StlBackgroundPreset>(DEFAULT_BACKGROUND);
  const [includeThumbnail, setIncludeThumbnail] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("Ready to render");
  const [error, setError] = useState<string | null>(null);

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
      { value: 10, label: "Validating STL mesh integrity" },
      { value: 24, label: "Centering the model at world origin" },
      { value: 42, label: "Normalizing scale and applying smooth shading" },
      { value: 61, label: "Rendering left, right, top, and bottom previews" },
      { value: 82, label: "Encoding the 360 degree MP4" },
      { value: 94, label: "Writing preview assets to disk" }
    ];
    let index = 0;

    setProgress(steps[0].value);
    setProgressLabel(steps[0].label);

    progressTimerRef.current = window.setInterval(() => {
      index = Math.min(index + 1, steps.length - 1);
      setProgress(steps[index].value);
      setProgressLabel(steps[index].label);
    }, 1400);
  }

  function resetSession() {
    stopProgress();
    setSelectedFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setProgressLabel("Ready to render");
  }

  function validateAndSelectFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".stl")) {
      setError("Only STL uploads are supported in this render pipeline.");
      return;
    }

    if (!file.size) {
      setError("The selected STL file is empty.");
      return;
    }

    if (file.size > MAX_STL_FILE_SIZE) {
      setError(
        `The file is too large. Keep STL uploads at or below ${formatFileSize(MAX_STL_FILE_SIZE)}.`
      );
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
      setError("Select an STL file before rendering.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("materialPreset", materialPreset);
    formData.append("background", background);
    formData.append("includeThumbnail", String(includeThumbnail));

    setIsRendering(true);
    setError(null);
    startProgressSimulation();

    try {
      const response = await fetch("/render", {
        method: "POST",
        body: formData
      });
      const payload = (await response.json()) as StlRenderResponse;

      if (!response.ok || !payload.result) {
        throw new Error(payload.error ?? "The STL render failed.");
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
      await downloadStlRenderZipBundle(result);
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
        <section className="relative overflow-hidden rounded-[2.25rem] border border-stone-200 bg-[#f6f1e8] p-7 shadow-[0_35px_90px_rgba(28,25,23,0.09)] sm:p-9">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 12% 18%, rgba(202,138,4,0.16), transparent 28%), radial-gradient(circle at 86% 16%, rgba(59,130,246,0.12), transparent 24%), linear-gradient(135deg, rgba(255,255,255,0.76), rgba(245,236,224,0.96))"
            }}
          />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex rounded-full border border-amber-300 bg-amber-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.34em] text-amber-900">
                STL Preview Pipeline
              </p>
              <h1 className="mt-5 font-[var(--font-heading)] text-4xl font-semibold text-stone-950 sm:text-5xl">
                Turn one STL upload into a clean four-view image set and a 360 MP4.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-8 text-stone-700 sm:text-base">
                This server-side pipeline validates the mesh, centers it at the
                origin, normalizes scale, applies smooth shading, renders the
                required catalog views, and exports a rotating marketplace preview.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!selectedFile || isRendering}
                className="inline-flex items-center justify-center rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-stone-50 transition duration-300 hover:-translate-y-0.5 hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRendering ? "Rendering assets..." : "Generate Assets"}
              </button>
              <button
                type="button"
                onClick={resetSession}
                className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition duration-300 hover:border-stone-400 hover:bg-stone-50"
              >
                Reset
              </button>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
          <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_28px_80px_rgba(28,25,23,0.08)]">
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-700">
                  Upload Console
                </p>
                <h2 className="mt-3 font-[var(--font-heading)] text-3xl font-semibold text-stone-950">
                  Feed the renderer one STL and get production-ready previews back.
                </h2>
                <p className="mt-3 text-sm leading-7 text-stone-600">
                  The API endpoint is `POST /render` and returns the PNG URLs,
                  MP4 URL, output paths, and render statistics in a single response.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-stone-950 transition duration-300 hover:-translate-y-0.5 hover:bg-amber-400"
                >
                  Select STL File
                </button>
                <button
                  type="button"
                  onClick={resetSession}
                  className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-stone-50 px-5 py-3 text-sm font-semibold text-stone-700 transition duration-300 hover:border-rose-300 hover:bg-rose-50"
                >
                  Clear
                </button>
              </div>

              <input
                ref={inputRef}
                type="file"
                accept=".stl"
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
                    ? "border-amber-400 bg-amber-50"
                    : "border-stone-300 bg-stone-50"
                }`}
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-stone-200 bg-white text-amber-700">
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
                <p className="mt-5 font-[var(--font-heading)] text-xl font-semibold text-stone-900">
                  Drag and drop your STL file here
                </p>
                <p className="mt-2 text-sm text-stone-500">
                  STL only, up to {formatFileSize(MAX_STL_FILE_SIZE)}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="Still Outputs" value="4 PNGs" />
                <StatCard label="Video Output" value="1 MP4" />
                <StatCard label="Frames" value="120" />
              </div>

              <div className="grid gap-4">
                <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
                  <div className="text-[11px] uppercase tracking-[0.28em] text-stone-500">
                    Material Preset
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {STL_MATERIAL_PRESET_KEYS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setMaterialPreset(preset)}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition duration-300 ${
                          materialPreset === preset
                            ? "border-stone-900 bg-stone-900 text-white"
                            : "border-stone-300 bg-white text-stone-700 hover:border-stone-500"
                        }`}
                      >
                        {STL_MATERIAL_PRESET_META[preset].label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-stone-600">
                    {STL_MATERIAL_PRESET_META[materialPreset].description}
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
                  <div className="text-[11px] uppercase tracking-[0.28em] text-stone-500">
                    Background
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {(Object.keys(STL_BACKGROUND_META) as StlBackgroundPreset[]).map(
                      (key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setBackground(key)}
                          className={`rounded-full border px-4 py-2 text-sm font-semibold transition duration-300 ${
                            background === key
                              ? "border-stone-900 bg-stone-900 text-white"
                              : "border-stone-300 bg-white text-stone-700 hover:border-stone-500"
                          }`}
                        >
                          {STL_BACKGROUND_META[key].label}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <label className="flex items-start gap-3 rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
                  <input
                    type="checkbox"
                    checked={includeThumbnail}
                    onChange={(event) =>
                      setIncludeThumbnail(event.target.checked)
                    }
                    className="mt-1 h-4 w-4 rounded border-stone-300 text-amber-500 focus:ring-amber-500"
                  />
                  <div>
                    <div className="font-semibold text-stone-900">
                      Generate square thumbnail
                    </div>
                    <p className="mt-1 text-sm leading-6 text-stone-600">
                      Adds a marketplace-friendly square thumbnail alongside the
                      core PNG views and MP4.
                    </p>
                  </div>
                </label>
              </div>

              <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.28em] text-stone-500">
                      Selected File
                    </div>
                    <div className="mt-3 font-[var(--font-heading)] text-xl font-semibold text-stone-950">
                      {selectedFile ? selectedFile.name : "No STL selected"}
                    </div>
                    <div className="mt-2 text-sm text-stone-600">
                      {selectedFile
                        ? `${formatFileSize(selectedFile.size)}`
                        : "Choose a model to preview it and run the render pipeline."}
                    </div>
                  </div>

                  {selectedFile ? (
                    <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.26em] text-emerald-700">
                      Ready
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.28em] text-stone-500">
                      Render Progress
                    </div>
                    <div className="mt-3 font-medium text-stone-900">
                      {progressLabel}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-stone-700">
                    {progress}%
                  </div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-stone-900 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {error ? (
                <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_28px_80px_rgba(28,25,23,0.08)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-700">
                  Preview Studio
                </p>
                <h2 className="mt-3 font-[var(--font-heading)] text-3xl font-semibold text-stone-950">
                  Review the STL live, then inspect the exported assets.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
                  The live viewer uses the same preset selection as the render
                  job, so what you inspect before upload closely matches the
                  generated catalog output.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {result ? (
                  <>
                    <button
                      type="button"
                      onClick={handleZipDownload}
                      disabled={isDownloadingZip}
                      className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-stone-50 px-5 py-3 text-sm font-semibold text-stone-800 transition duration-300 hover:border-stone-500 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isDownloadingZip ? "Building ZIP..." : "Download Full Pack"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        downloadAsset(result.video.filename, result.video.src)
                      }
                      className="inline-flex items-center justify-center rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-stone-800"
                    >
                      Download MP4
                    </button>
                  </>
                ) : (
                  <div className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-600">
                    Awaiting first render
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 space-y-6">
              <ThreeDViewer file={selectedFile} materialKey={materialPreset} />

              {!result ? (
                <div className="rounded-[1.75rem] border border-dashed border-stone-300 bg-stone-50 px-6 py-16 text-center">
                  <h3 className="font-[var(--font-heading)] text-2xl font-semibold text-stone-950">
                    Rendered previews will appear here.
                  </h3>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-stone-600">
                    Once the render finishes you will see the four required PNG
                    views, the optional thumbnail, and the encoded 360-degree MP4.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-4 xl:grid-cols-[0.74fr_1.26fr]">
                    <div className="rounded-[1.75rem] border border-stone-200 bg-stone-50 p-5">
                      <div className="text-[11px] uppercase tracking-[0.28em] text-stone-500">
                        Render Stats
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
                        <StatCard label="Bounds" value={formatTriplet(result)} />
                        <StatCard
                          label="Renderer"
                          value={result.stats.backend}
                        />
                        <StatCard
                          label="GPU"
                          value={result.stats.gpuEnabled ? "Enabled" : "CPU"}
                        />
                      </div>
                    </div>

                    <div className="rounded-[1.75rem] border border-stone-200 bg-stone-50 p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-[11px] uppercase tracking-[0.28em] text-stone-500">
                            Static Render Set
                          </div>
                          <div className="mt-2 text-sm text-stone-600">
                            Output folder: {result.outputDirectory}
                          </div>
                        </div>
                        <div className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.26em] text-stone-700">
                          4 views
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        {STL_VIEW_KEYS.map((view) => {
                          const image = result.images[view];

                          return (
                            <article
                              key={view}
                              className="group overflow-hidden rounded-[1.5rem] border border-stone-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-stone-400"
                            >
                              <div className="aspect-square overflow-hidden border-b border-stone-200">
                                <Image
                                  src={image.src}
                                  alt={STL_VIEW_META[view].label}
                                  width={image.width}
                                  height={image.height}
                                  unoptimized
                                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                                />
                              </div>
                              <div className="space-y-3 p-4">
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <div className="font-semibold text-stone-950">
                                      {STL_VIEW_META[view].label}
                                    </div>
                                    <div className="mt-1 text-xs uppercase tracking-[0.24em] text-stone-500">
                                      {image.width} x {image.height}
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      downloadAsset(image.filename, image.src)
                                    }
                                    className="rounded-full border border-stone-300 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-800 transition duration-300 hover:border-stone-500 hover:bg-stone-100"
                                  >
                                    PNG
                                  </button>
                                </div>
                                <p className="text-sm leading-6 text-stone-600">
                                  {STL_VIEW_META[view].description}
                                </p>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {result.thumbnail ? (
                    <div className="rounded-[1.75rem] border border-stone-200 bg-stone-50 p-5">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                          <div className="text-[11px] uppercase tracking-[0.28em] text-stone-500">
                            Thumbnail
                          </div>
                          <h3 className="mt-2 font-[var(--font-heading)] text-2xl font-semibold text-stone-950">
                            Square marketplace thumbnail
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            downloadAsset(
                              result.thumbnail!.filename,
                              result.thumbnail!.src
                            )
                          }
                          className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 transition duration-300 hover:border-stone-500"
                        >
                          Download Thumbnail
                        </button>
                      </div>

                      <div className="mt-5 max-w-[18rem] overflow-hidden rounded-[1.5rem] border border-stone-200 bg-white">
                        <Image
                          src={result.thumbnail.src}
                          alt="Marketplace thumbnail"
                          width={result.thumbnail.width}
                          height={result.thumbnail.height}
                          unoptimized
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-[1.75rem] border border-stone-200 bg-stone-50 p-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.28em] text-stone-500">
                          360 Degree Video Preview
                        </div>
                        <h3 className="mt-2 font-[var(--font-heading)] text-2xl font-semibold text-stone-950">
                          MP4 encoded from {result.video.frameCount} frames
                        </h3>
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-stone-600">
                          The model spins through a full Y-axis rotation and is
                          exported as H.264 at {result.video.width} x {result.video.height}.
                        </p>
                      </div>
                      <div className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm text-stone-700">
                        {result.video.codec.toUpperCase()}
                      </div>
                    </div>

                    <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-stone-200 bg-black">
                      <video
                        src={result.video.src}
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
