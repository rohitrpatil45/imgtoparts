"use client";

import Image from "next/image";
import type { ChangeEvent } from "react";
import { useMemo, useRef, useState } from "react";
import { downloadAsset, downloadZipBundle } from "@/lib/downloads";
import type { ProcessResponse, ProcessedImageResult } from "@/lib/types";

function formatFileCount(count: number) {
  return `${count} ${count === 1 ? "image" : "images"}`;
}

export function ToolWorkspace() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [results, setResults] = useState<ProcessedImageResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assetCount = useMemo(

    () =>
      results.reduce((count, image) => count + image.crops.length + 1, 0),
    [results]
  );

  async function sendFiles(files: File[]) {
    const validFiles = files.filter((file) => file.type.startsWith("image/"));

    if (!validFiles.length) {
      setError("Please upload valid image files only.");
      return;
    }

    const formData = new FormData();
    validFiles.forEach((file) => {
      formData.append("files", file);
    });

    setError(null);
    setIsProcessing(true);

    try {
      const response = await fetch("/api/process", {
        method: "POST",
        body: formData
      });

      const payload = (await response.json()) as ProcessResponse & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          payload.error ?? "We could not process the uploaded images."
        );
      }

      setResults((current) => [...payload.images, ...current]);
    } catch (processingError) {
      setError(
        processingError instanceof Error
          ? processingError.message
          : "Unexpected processing error."
      );
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length) {
      await sendFiles(files);
    }

    event.target.value = "";
  }

  async function handleZipDownload() {
    try {
      setIsDownloadingZip(true);
      await downloadZipBundle(results);
    } catch (zipError) {
      setError(
        zipError instanceof Error
          ? zipError.message
          : "ZIP export failed."
      );
    } finally {
      setIsDownloadingZip(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-premium backdrop-blur-xl">
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200">
                Upload Console
              </p>
              <h2 className="mt-3 font-[var(--font-heading)] text-3xl font-semibold text-white">
                Drop image batches and process them on the server.
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Each upload returns the original image plus five generated
                assets. Repeated uploads stack into the same export session.
              </p>
            </div>

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex w-full items-center justify-center rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition duration-300 hover:-translate-y-0.5 hover:bg-cyan-300"
            >
              Select Images
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileInput}
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
              onDrop={async (event) => {
                event.preventDefault();
                setIsDragging(false);
                const files = Array.from(event.dataTransfer.files ?? []);
                if (files.length) {
                  await sendFiles(files);
                }
              }}
              className={`rounded-[1.75rem] border border-dashed px-6 py-10 text-center transition duration-300 ${isDragging
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
                    d="M12 16V4m0 0l-4 4m4-4l4 4M5 16v2a2 2 0 002 2h10a2 2 0 002-2v-2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="mt-5 font-[var(--font-heading)] text-xl font-semibold text-white">
                Drag and drop images here
              </p>
              <p className="mt-2 text-sm text-slate-400">
                PNG, JPG, WebP, and other Sharp-supported image formats
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  label: "Session images",
                  value: formatFileCount(results.length)
                },
                {
                  label: "Generated assets",
                  value: `${assetCount}`
                },
                {
                  label: "Processing mode",
                  value: "Sharp API"
                }
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-3xl border border-white/10 bg-slate-950/40 p-4"
                >
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                    {item.label}
                  </div>
                  <div className="mt-3 font-[var(--font-heading)] text-2xl font-semibold text-white">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={!results.length || isDownloadingZip}
                onClick={handleZipDownload}
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition duration-300 hover:border-cyan-300/30 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDownloadingZip ? "Building ZIP..." : "Download All as ZIP"}
              </button>
              <button
                type="button"
                disabled={!results.length || isProcessing}
                onClick={() => {
                  setResults([]);
                  setError(null);
                }}
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-slate-950/50 px-5 py-3 text-sm font-semibold text-slate-200 transition duration-300 hover:border-rose-300/30 hover:bg-rose-400/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear Session
              </button>
            </div>

            {isProcessing ? (
              <div className="rounded-3xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
                Processing images on the server. Large files can take a moment.
              </div>
            ) : null}

            {error ? (
              <div className="rounded-3xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-premium backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-200">
                Output Preview
              </p>
              <h2 className="mt-3 font-[var(--font-heading)] text-3xl font-semibold text-white">
                Review originals and generated crops before export.
              </h2>
            </div>
            <div className="hidden rounded-full border border-white/10 bg-slate-950/50 px-4 py-2 text-sm text-slate-300 sm:block">
              {results.length ? `${assetCount} assets ready` : "Awaiting upload"}
            </div>
          </div>

          {!results.length ? (
            <div className="mt-8 flex min-h-[22rem] items-center justify-center rounded-[1.75rem] border border-dashed border-white/15 bg-slate-950/40 px-6 text-center">
              <div className="max-w-md">
                <h3 className="font-[var(--font-heading)] text-2xl font-semibold text-white">
                  Your crop session will appear here.
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  Upload one or many images to render the original plus top-left,
                  top-right, bottom-left, bottom-right, and center-detail
                  previews.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-8 space-y-8">
              {results.map((image) => (
                <article
                  key={image.id}
                  className="rounded-[1.75rem] border border-white/10 bg-slate-950/40 p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="font-[var(--font-heading)] text-2xl font-semibold text-white">
                        {image.sourceName}
                      </h3>
                      <p className="text-sm text-slate-400">
                        Original dimensions: {image.width} x {image.height}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        downloadAsset(
                          image.original.filename,
                          image.original.dataUrl
                        )
                      }
                      className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition duration-300 hover:border-cyan-300/30 hover:bg-cyan-400/10"
                    >
                      Download Original
                    </button>
                  </div>

                  <div className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                    <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-900/70">
                      <Image
                        src={image.original.dataUrl}
                        alt={`${image.sourceName} original preview`}
                        width={image.original.width}
                        height={image.original.height}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2  xl:grid-cols-2">
                      {image.crops.map((crop) => (
                        <div
                          key={crop.id}
                          className="group rounded-[1.5rem] border border-white/10 bg-white/5 p-3 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-white/10"
                        >
                          <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70">
                            <Image
                              src={crop.dataUrl}
                              alt={`${image.sourceName} ${crop.label}`}
                              width={crop.width}
                              height={crop.height}
                              unoptimized
                              className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                            />
                          </div>
                          <div className="mt-3">
                            <div className="font-semibold text-white">
                              {crop.label}
                            </div>
                            <div className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">
                              {crop.width} x {crop.height}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              downloadAsset(crop.filename, crop.dataUrl)
                            }
                            className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-slate-950/60 px-4 py-2 text-sm font-semibold text-slate-100 transition duration-300 hover:border-cyan-300/30 hover:bg-cyan-400/10"
                          >
                            Download Image
                          </button>
                        </div>
                      ))}
                    </div>
                    
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
