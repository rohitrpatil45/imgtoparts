import JSZip from "jszip";
import { sanitizeFileStem } from "@/lib/filenames";
import type { ProcessedImageResult } from "@/lib/types";

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
