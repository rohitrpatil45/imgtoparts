"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
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
  STL_VIEW_META,
  STILL_OUTPUT_SIZE,
  VIDEO_FRAME_COUNT
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
  value,
  tone = "default"
}: {
  label: string;
  value: string;
  tone?: "default" | "accent";
}) {
  return (
    <div
      className={`rounded-[1.25rem] border p-4 backdrop-blur-sm ${
        tone === "accent"
          ? "border-cyan-400/20 bg-cyan-400/10"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 font-[var(--font-heading)] text-xl text-white">
        {value}
      </div>
    </div>
  );
}

function formatTriplet(result: StlRenderResult) {
  const { x, y, z } = result.stats.dimensions;
  return `${x} x ${y} x ${z}`;
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs.toString().padStart(2, "0")}s`;
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
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!isRendering) {
      setElapsedSeconds(0);
      return;
    }

    const intervalId = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isRendering]);

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
      }
    };
  }, []);

  const statusLabel = isRendering ? "Processing" : result ? "Completed" : "Ready";
  const queueSeconds = selectedFile
    ? isRendering
      ? Math.max(2, Math.round((100 - progress) / 6))
      : result
        ? 0
        : 3
    : 0;

  const pipelineSteps = [
    "Upload",
    "Normalize",
    "Render",
    "Generate PNG",
    "Generate MP4",
    "Done"
  ];
  const activePipelineStep = result
    ? pipelineSteps.length - 1
    : isRendering
      ? Math.min(pipelineSteps.length - 1, Math.floor(progress / 18) + 1)
      : 0;

  const galleryCards = useMemo(() => {
    if (!result) {
      return [
        { label: "Front", description: "Waiting for render", accent: "from-cyan-400/20 to-indigo-500/10" },
        { label: "Left", description: "Waiting for render", accent: "from-violet-400/20 to-fuchsia-500/10" },
        { label: "Right", description: "Waiting for render", accent: "from-sky-400/20 to-cyan-500/10" },
        { label: "Perspective", description: "Waiting for render", accent: "from-amber-400/20 to-orange-500/10" }
      ];
    }

    return [
      {
        label: "Front",
        description: "Primary marketplace preview",
        image: result.images.bottom,
        view: STL_VIEW_META.bottom.label
      },
      {
        label: "Left",
        description: "Profile view",
        image: result.images.left,
        view: STL_VIEW_META.left.label
      },
      {
        label: "Right",
        description: "Profile view",
        image: result.images.right,
        view: STL_VIEW_META.right.label
      },
      {
        label: "Perspective",
        description: "Isometric rendering",
        image: result.images.top,
        view: STL_VIEW_META.top.label
      }
    ];
  }, [result]);

  function stopProgress() {
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }

  function startProgressSimulation() {
    stopProgress();

    const steps = [
      { value: 12, label: "Reviewing mesh integrity" },
      { value: 28, label: "Centering the model at world origin" },
      { value: 44, label: "Normalizing scale and applying smooth shading" },
      { value: 64, label: "Rendering the catalog views" },
      { value: 84, label: "Encoding the 360-degree MP4" },
      { value: 96, label: "Writing physical assets to disk" }
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
    setElapsedSeconds(0);
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
    setElapsedSeconds(0);
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
    <Container className="pb-16 pt-6 sm:pt-8 lg:pt-10">
      <div className="space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_24%),linear-gradient(135deg,#0f172a_0%,#111827_100%)] p-8 shadow-[0_40px_120px_rgba(2,8,23,0.45)] sm:p-10 lg:p-12"
        >
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.05),transparent_35%,rgba(255,255,255,0.03))]" />
          <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Premium 3D Render Studio
              </div>
              <h1 className="mt-5 font-[var(--font-heading)] text-4xl leading-tight text-white sm:text-5xl lg:text-[3.5rem]">
                Turn one STL upload into polished product visuals in minutes.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-8 text-slate-300 sm:text-base">
                Upload a model, tune the material and background, and ship a complete render pack with four PNG views, a square thumbnail, and a 360-degree MP4.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <motion.button
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleGenerate}
                disabled={!selectedFile || isRendering}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-violet-500 px-5 py-3 text-sm font-semibold text-slate-950 transition duration-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRendering ? "Rendering assets..." : "Generate Assets"}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={resetSession}
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition duration-300 hover:bg-white/10"
              >
                Reset
              </motion.button>
            </div>
          </div>

          <div className="relative mt-8 flex flex-wrap items-center gap-3 rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-4 backdrop-blur">
            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${statusLabel === "Processing" ? "bg-amber-400/10 text-amber-200" : statusLabel === "Completed" ? "bg-emerald-400/10 text-emerald-200" : "bg-cyan-400/10 text-cyan-200"}`}>
              <span className={`h-2.5 w-2.5 rounded-full ${statusLabel === "Processing" ? "bg-amber-400" : statusLabel === "Completed" ? "bg-emerald-400" : "bg-cyan-400"}`} />
              {statusLabel}
            </div>
            <div className="text-sm text-slate-400">
              {selectedFile ? `Loaded ${selectedFile.name}` : "Select a model to start the pipeline"}
            </div>
          </div>
        </motion.section>

        <div className="grid gap-6 lg:grid-cols-[400px_minmax(0,1fr)]">
          <div className="space-y-6 lg:order-2">
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
              className="rounded-[1.75rem] border border-white/10 bg-[#111827] p-6 shadow-[0_30px_90px_rgba(2,8,23,0.35)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">
                    Upload
                  </p>
                  <h2 className="mt-2 text-[1.35rem] font-semibold text-white">
                    Drop in your STL model
                  </h2>
                </div>
                <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
                  {selectedFile ? "Ready" : "Waiting"}
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <motion.button
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-violet-500 px-4 py-3 text-sm font-semibold text-slate-950"
                >
                  {selectedFile ? "Replace File" : "Select STL File"}
                </motion.button>
                <button
                  type="button"
                  onClick={resetSession}
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-300 transition duration-300 hover:bg-white/[0.08]"
                >
                  Reset Session
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
                className={`mt-6 rounded-[1.5rem] border border-dashed p-6 text-center transition duration-300 ${
                  isDragging
                    ? "border-cyan-300/70 bg-cyan-400/10"
                    : "border-white/10 bg-slate-950/50"
                }`}
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-cyan-200">
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
                <p className="mt-5 text-lg font-semibold text-white">
                  Drag and drop your STL here
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  STL only, up to {formatFileSize(MAX_STL_FILE_SIZE)}.
                </p>
              </div>

              {selectedFile ? (
                <div className="mt-6 rounded-[1.25rem] border border-emerald-400/20 bg-emerald-400/10 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-200">
                    Selected file
                  </div>
                  <div className="mt-2 font-semibold text-white">{selectedFile.name}</div>
                  <div className="mt-1 text-sm text-emerald-100/80">
                    {formatFileSize(selectedFile.size)}
                  </div>
                </div>
              ) : null}
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.08 }}
              className="rounded-[1.75rem] border border-white/10 bg-[#111827] p-6 shadow-[0_30px_90px_rgba(2,8,23,0.35)]"
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">
                Material presets
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {STL_MATERIAL_PRESET_KEYS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setMaterialPreset(preset)}
                    className={`rounded-full border px-3 py-2 text-sm font-semibold transition duration-300 ${
                      materialPreset === preset
                        ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
                        : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
                    }`}
                  >
                    {STL_MATERIAL_PRESET_META[preset].label}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                {STL_MATERIAL_PRESET_META[materialPreset].description}
              </p>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.11 }}
              className="rounded-[1.75rem] border border-white/10 bg-[#111827] p-6 shadow-[0_30px_90px_rgba(2,8,23,0.35)]"
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">
                Background settings
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(Object.keys(STL_BACKGROUND_META) as StlBackgroundPreset[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setBackground(key)}
                    className={`rounded-full border px-3 py-2 text-sm font-semibold transition duration-300 ${
                      background === key
                        ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
                        : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
                    }`}
                  >
                    {STL_BACKGROUND_META[key].label}
                  </button>
                ))}
              </div>

              <label className="mt-4 flex items-start gap-3 rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
                <input
                  type="checkbox"
                  checked={includeThumbnail}
                  onChange={(event) => setIncludeThumbnail(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent text-cyan-400"
                />
                <div>
                  <div className="font-semibold text-white">Generate square thumbnail</div>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    Adds a marketplace-friendly square thumbnail next to the core output pack.
                  </p>
                </div>
              </label>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.14 }}
              className="rounded-[1.75rem] border border-white/10 bg-[#111827] p-6 shadow-[0_30px_90px_rgba(2,8,23,0.35)]"
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">
                Export options
              </div>
              <div className="mt-4 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleZipDownload}
                  disabled={!result || isDownloadingZip}
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-100 transition duration-300 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isDownloadingZip ? "Building ZIP..." : "Download Full Pack"}
                </button>
                <button
                  type="button"
                  onClick={() => result && downloadAsset(result.video.filename, result.video.src)}
                  disabled={!result}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-violet-500 px-4 py-3 text-sm font-semibold text-slate-950 transition duration-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Download MP4
                </button>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.17 }}
              className="rounded-[1.75rem] border border-white/10 bg-[#111827] p-6 shadow-[0_30px_90px_rgba(2,8,23,0.35)]"
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">
                File information
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <StatCard label="Still outputs" value={`4 PNG · ${STILL_OUTPUT_SIZE}px`} />
                <StatCard label="Video output" value={`1 MP4 · ${VIDEO_FRAME_COUNT} frames`} />
                <StatCard label="Renderer" value={result?.stats.backend ?? "Awaiting render"} />
              </div>
            </motion.section>
          </div>

          <div className="min-w-0 space-y-6 lg:order-1">
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.06 }}
              className="rounded-[1.75rem] border border-white/10 bg-[#111827] p-6 shadow-[0_30px_90px_rgba(2,8,23,0.35)]"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-cyan-200">
                    Interactive preview
                  </p>
                  <h2 className="mt-2 text-[1.35rem] font-semibold text-white">
                    Inspect the model before export
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
                    The live viewer mirrors your chosen preset so the preview stays aligned with the generated assets.
                  </p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300">
                  {result ? "Render pack ready" : "Awaiting first render"}
                </div>
              </div>

              <div className="mt-6">
                <ThreeDViewer file={selectedFile} materialKey={materialPreset} />
              </div>
            </motion.section>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
                className="rounded-[1.75rem] border border-white/10 bg-[#111827] p-6 shadow-[0_30px_90px_rgba(2,8,23,0.35)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">
                      Render gallery
                    </p>
                    <h3 className="mt-2 text-[1.3rem] font-semibold text-white">
                      Generated image cards
                    </h3>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-slate-300">
                    {result ? "4 views" : "Pending"}
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {galleryCards.map((card) => (
                    <motion.article
                      key={card.label}
                      whileHover={{ y: -4, scale: 1.01 }}
                      className="group overflow-hidden rounded-[1.25rem] border border-white/10 bg-slate-950/60"
                    >
                      <div className={`relative aspect-square bg-gradient-to-br ${card.accent}`}>
                        {result && card.image ? (
                          <Image
                            src={card.image.src}
                            alt={`${card.label} rendering`}
                            width={card.image.width}
                            height={card.image.height}
                            unoptimized
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-400">
                            <div>
                              <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                                Preview pending
                              </div>
                              <div className="mt-2 text-base font-medium text-slate-300">
                                {card.label}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-semibold text-white">{card.label}</div>
                            <div className="text-sm text-slate-400">{card.description}</div>
                          </div>
                          {result && card.image ? (
                            <button
                              type="button"
                              onClick={() => downloadAsset(card.image!.filename, card.image!.src)}
                              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 transition duration-300 hover:bg-white/[0.08]"
                            >
                              PNG
                            </button>
                          ) : null}
                        </div>
                        {result && card.view ? (
                          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                            {card.view}
                          </div>
                        ) : null}
                      </div>
                    </motion.article>
                  ))}
                </div>
              </motion.section>

              <div className="space-y-6">
                <motion.section
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.13 }}
                  className="rounded-[1.75rem] border border-white/10 bg-[#111827] p-6 shadow-[0_30px_90px_rgba(2,8,23,0.35)]"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">
                    Statistics
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <StatCard label="PNG" value="4" tone="accent" />
                    <StatCard label="Frames" value={`${VIDEO_FRAME_COUNT}`} />
                    <StatCard label="MP4" value="1" />
                    <StatCard label="Resolution" value={`${STILL_OUTPUT_SIZE}×${STILL_OUTPUT_SIZE}`} />
                    <StatCard label="Elapsed time" value={result ? formatDuration(elapsedSeconds || 14) : "—"} />
                    <StatCard label="Queue time" value={selectedFile ? `${queueSeconds}s` : "—"} />
                  </div>
                </motion.section>

                <motion.section
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.16 }}
                  className="rounded-[1.75rem] border border-white/10 bg-[#111827] p-6 shadow-[0_30px_90px_rgba(2,8,23,0.35)]"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">
                    Pipeline
                  </div>
                  <div className="mt-5 space-y-4">
                    {pipelineSteps.map((step, index) => {
                      const isActive = index <= activePipelineStep;
                      const isCurrent = index === activePipelineStep;
                      return (
                        <div key={step} className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold ${isActive ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200" : "border-white/10 bg-white/[0.04] text-slate-500"}`}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className={`text-sm font-medium ${isCurrent ? "text-white" : "text-slate-400"}`}>
                              {step}
                            </div>
                            {index < pipelineSteps.length - 1 ? (
                              <div className={`mt-2 h-1 rounded-full ${isActive ? "bg-cyan-400/20" : "bg-white/[0.04]"}`}>
                                <div className={`h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all duration-500 ${isActive ? "w-full" : "w-0"}`} />
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-5 rounded-[1.25rem] border border-white/10 bg-slate-950/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                          Current step
                        </div>
                        <div className="mt-2 text-sm font-medium text-white">
                          {progressLabel}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-cyan-200">
                        {progress}%
                      </div>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-violet-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </motion.section>
              </div>
            </div>

            {result ? (
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.2 }}
                className="rounded-[1.75rem] border border-white/10 bg-[#111827] p-6 shadow-[0_30px_90px_rgba(2,8,23,0.35)]"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">
                      Video preview
                    </p>
                    <h3 className="mt-2 text-[1.3rem] font-semibold text-white">
                      360-degree MP4 export
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
                      The exported rotation loop uses your selected presets and includes {result.video.frameCount} frames at {result.video.width} × {result.video.height}.
                    </p>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300">
                    {result.video.codec.toUpperCase()}
                  </div>
                </div>

                <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-white/10 bg-black">
                  <video src={result.video.src} controls loop playsInline className="aspect-square w-full" />
                </div>
              </motion.section>
            ) : null}

            {error ? (
              <div className="rounded-[1.5rem] border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Container>
  );
}
