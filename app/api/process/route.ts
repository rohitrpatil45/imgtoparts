import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { sanitizeFileStem } from "@/lib/filenames";

export const runtime = "nodejs";

type CropDefinition = {
  key: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center-detail";
  label: string;
  left: number;
  top: number;
  width: number;
  height: number;
  outputWidth: number;
  outputHeight: number;
};

type BoundingBox = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

const WHITE_THRESHOLD = 240;
const DETAIL_PADDING_RATIO = 0.15;

function bufferToDataUrl(buffer: Buffer) {
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function buildQuadrantCropDefinitions(
  width: number,
  height: number
): CropDefinition[] {
  const quadrantWidth = Math.max(1, Math.floor(width / 2));
  const quadrantHeight = Math.max(1, Math.floor(height / 2));

  return [
    {
      key: "top-left",
      label: "Top Left",
      left: 0,
      top: 0,
      width: quadrantWidth,
      height: quadrantHeight,
      outputWidth: quadrantWidth,
      outputHeight: quadrantHeight
    },
    {
      key: "top-right",
      label: "Top Right",
      left: Math.max(0, width - quadrantWidth),
      top: 0,
      width: quadrantWidth,
      height: quadrantHeight,
      outputWidth: quadrantWidth,
      outputHeight: quadrantHeight
    },
    {
      key: "bottom-left",
      label: "Bottom Left",
      left: 0,
      top: Math.max(0, height - quadrantHeight),
      width: quadrantWidth,
      height: quadrantHeight,
      outputWidth: quadrantWidth,
      outputHeight: quadrantHeight
    },
    {
      key: "bottom-right",
      label: "Bottom Right",
      left: Math.max(0, width - quadrantWidth),
      top: Math.max(0, height - quadrantHeight),
      width: quadrantWidth,
      height: quadrantHeight,
      outputWidth: quadrantWidth,
      outputHeight: quadrantHeight
    }
  ];
}

async function detectObjectBounds(
  imageBuffer: Buffer
): Promise<BoundingBox | null> {
  const { data, info } = await sharp(imageBuffer)
    .flatten({ background: "#ffffff" })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const brightness = data[y * info.width + x];

      if (brightness <= WHITE_THRESHOLD) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX === -1 || maxY === -1) {
    return null;
  }

  return { minX, minY, maxX, maxY };
}

function buildCenterDetailCrop(
  width: number,
  height: number,
  bounds: BoundingBox | null
): CropDefinition {
  const outputWidth = Math.max(1, Math.floor(width / 2));
  const outputHeight = Math.max(1, Math.floor(height / 2));
  const targetAspectRatio = outputWidth / outputHeight;

  if (!bounds) {
    const fallbackWidth = Math.max(1, Math.floor(width * 0.45));
    const fallbackHeight = Math.max(1, Math.floor(height * 0.45));

    return {
      key: "center-detail",
      label: "Center Detail",
      left: Math.max(0, Math.floor((width - fallbackWidth) / 2)),
      top: Math.max(0, Math.floor((height - fallbackHeight) / 2)),
      width: fallbackWidth,
      height: fallbackHeight,
      outputWidth,
      outputHeight
    };
  }

  const objectWidth = bounds.maxX - bounds.minX + 1;
  const objectHeight = bounds.maxY - bounds.minY + 1;
  const centerX = bounds.minX + objectWidth / 2;
  const centerY = bounds.minY + objectHeight / 2;

  let cropWidth = Math.ceil(objectWidth * (1 + DETAIL_PADDING_RATIO * 2));
  let cropHeight = Math.ceil(objectHeight * (1 + DETAIL_PADDING_RATIO * 2));

  if (cropWidth / cropHeight > targetAspectRatio) {
    cropHeight = Math.ceil(cropWidth / targetAspectRatio);
  } else {
    cropWidth = Math.ceil(cropHeight * targetAspectRatio);
  }

  cropWidth = clamp(cropWidth, 1, width);
  cropHeight = clamp(cropHeight, 1, height);

  if (cropWidth / cropHeight > targetAspectRatio) {
    cropHeight = clamp(Math.ceil(cropWidth / targetAspectRatio), 1, height);
  } else {
    cropWidth = clamp(Math.ceil(cropHeight * targetAspectRatio), 1, width);
  }

  let left = Math.round(centerX - cropWidth / 2);
  let top = Math.round(centerY - cropHeight / 2);

  left = clamp(left, 0, Math.max(0, width - cropWidth));
  top = clamp(top, 0, Math.max(0, height - cropHeight));

  return {
    key: "center-detail",
    label: "Center Detail",
    left,
    top,
    width: cropWidth,
    height: cropHeight,
    outputWidth,
    outputHeight
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File);

    if (!files.length) {
      return NextResponse.json(
        { error: "Please upload at least one image file." },
        { status: 400 }
      );
    }

    const images = await Promise.all(
      files.map(async (file) => {
        if (!file.type.startsWith("image/")) {
          throw new Error(`Unsupported file type received: ${file.name}`);
        }

        const inputBuffer = Buffer.from(await file.arrayBuffer());
        const normalizedBuffer = await sharp(inputBuffer).rotate().png().toBuffer();
        const metadata = await sharp(normalizedBuffer).metadata();

        if (!metadata.width || !metadata.height) {
          throw new Error(`Unable to read image dimensions for ${file.name}.`);
        }

        const width = metadata.width;
        const height = metadata.height;
        const fileStem = sanitizeFileStem(file.name);
        const detectedObjectBounds = await detectObjectBounds(normalizedBuffer);
        const cropDefinitions = [
          ...buildQuadrantCropDefinitions(width, height),
          buildCenterDetailCrop(width, height, detectedObjectBounds)
        ];

        const crops = await Promise.all(
          cropDefinitions.map(async (definition) => {
            const cropBuffer = await sharp(normalizedBuffer)
              .extract({
                left: definition.left,
                top: definition.top,
                width: definition.width,
                height: definition.height
              })
              .resize({
                width: definition.outputWidth,
                height: definition.outputHeight,
                fit: "fill"
              })
              .png()
              .toBuffer();

            return {
              id: randomUUID(),
              kind: definition.key,
              label: definition.label,
              filename: `${fileStem}-${definition.key}.png`,
              dataUrl: bufferToDataUrl(cropBuffer),
              width: definition.outputWidth,
              height: definition.outputHeight
            };
          })
        );

        return {
          id: randomUUID(),
          sourceName: file.name,
          width,
          height,
          original: {
            id: randomUUID(),
            kind: "original" as const,
            label: "Original",
            filename: `${fileStem}-original.png`,
            dataUrl: bufferToDataUrl(normalizedBuffer),
            width,
            height
          },
          crops
        };
      })
    );

    return NextResponse.json({ images });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "We could not process the uploaded image set.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
