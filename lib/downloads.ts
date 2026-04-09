import JSZip from "jszip";
import { sanitizeFileStem } from "@/lib/filenames";
import { CAMERA_META, MATERIAL_META } from "@/lib/3d-config";
import { STL_VIEW_KEYS } from "@/lib/stl-render-config";
import type {
  ProcessedImageResult,
  Rendered3DImage,
  Rendered3DResult,
  StlRenderResult
} from "@/lib/types";

function triggerBrowserDownload(filename: string, href: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function dataUrlToBase64(dataUrl: string) {
  const parts = dataUrl.split(",");

  if (parts.length !== 2) {
    throw new Error("Received an invalid data URL.");
  }

  return parts[1];
}

export function downloadAsset(filename: string, dataUrl: string) {
  triggerBrowserDownload(filename, dataUrl);
}

export async function downloadZipBundle(images: ProcessedImageResult[]) {
  if (!images.length) {
    throw new Error("No processed images are available for ZIP download.");
  }

  const zip = new JSZip();

  images.forEach((image) => {
    const folder = zip.folder(sanitizeFileStem(image.sourceName));

    if (!folder) {
      return;
    }

    folder.file(image.original.filename, dataUrlToBase64(image.original.dataUrl), {
      base64: true
    });

    image.crops.forEach((crop) => {
      folder.file(crop.filename, dataUrlToBase64(crop.dataUrl), {
        base64: true
      });
    });
  });

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const objectUrl = URL.createObjectURL(zipBlob);
  triggerBrowserDownload("cnc-image-auto-crop-tool-export.zip", objectUrl);
  URL.revokeObjectURL(objectUrl);
}

export async function download3DRenderZipBundle(result: Rendered3DResult) {
  const zip = new JSZip();
  const rootFolder = zip.folder(`${sanitizeFileStem(result.sourceName)}-renders`);

  if (!rootFolder) {
    throw new Error("Could not prepare the 3D render ZIP bundle.");
  }

  await Promise.all(result.materials.map(async (materialGroup) => {
    const materialFolder = rootFolder.folder(MATERIAL_META[materialGroup.key].label);

    if (!materialFolder) {
      return;
    }

    const manifest = materialGroup.images
      .map((image) => `${CAMERA_META[image.angle].label}: ${image.filename}`)
      .join("\n");

    await Promise.all(materialGroup.images.map(async (image) => {
      const fileContent = await resolve3DAssetContent(image);
      materialFolder.file(image.filename, fileContent);
    }));

    materialFolder.file("README.txt", `${manifest}\n`);
  }));

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const objectUrl = URL.createObjectURL(zipBlob);
  triggerBrowserDownload(
    `${sanitizeFileStem(result.sourceName)}-render-pack.zip`,
    objectUrl
  );
  URL.revokeObjectURL(objectUrl);
}

async function resolve3DAssetContent(image: Rendered3DImage) {
  if (image.dataUrl) {
    return dataUrlToBase64(image.dataUrl);
  }

  const response = await fetch(image.src);

  if (!response.ok) {
    throw new Error(`Unable to download render asset: ${image.src}`);
  }

  return response.arrayBuffer();
}

export async function downloadStlRenderZipBundle(result: StlRenderResult) {
  const zip = new JSZip();
  const rootFolder = zip.folder(`${sanitizeFileStem(result.sourceName)}-preview-assets`);

  if (!rootFolder) {
    throw new Error("Could not prepare the STL render ZIP bundle.");
  }

  await Promise.all(
    STL_VIEW_KEYS.map(async (view) => {
      const image = result.images[view];
      const response = await fetch(image.src);

      if (!response.ok) {
        throw new Error(`Unable to download ${image.filename}.`);
      }

      rootFolder.file(image.filename, await response.arrayBuffer());
    })
  );

  const videoResponse = await fetch(result.video.src);

  if (!videoResponse.ok) {
    throw new Error(`Unable to download ${result.video.filename}.`);
  }

  rootFolder.file(result.video.filename, await videoResponse.arrayBuffer());

  if (result.thumbnail) {
    const thumbnailResponse = await fetch(result.thumbnail.src);

    if (!thumbnailResponse.ok) {
      throw new Error(`Unable to download ${result.thumbnail.filename}.`);
    }

    rootFolder.file(
      result.thumbnail.filename,
      await thumbnailResponse.arrayBuffer()
    );
  }

  rootFolder.file(
    "README.txt",
    [
      `Source: ${result.sourceName}`,
      `Material preset: ${result.materialPreset}`,
      `Background: ${result.background}`,
      "",
      ...STL_VIEW_KEYS.map((view) => `${view}: ${result.images[view].filename}`),
      `video: ${result.video.filename}`,
      result.thumbnail ? `thumbnail: ${result.thumbnail.filename}` : ""
    ]
      .filter(Boolean)
      .join("\n")
  );

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const objectUrl = URL.createObjectURL(zipBlob);
  triggerBrowserDownload(
    `${sanitizeFileStem(result.sourceName)}-preview-assets.zip`,
    objectUrl
  );
  URL.revokeObjectURL(objectUrl);
}
