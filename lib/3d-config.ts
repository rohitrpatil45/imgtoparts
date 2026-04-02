import type {
  ModelFileExtension,
  RenderAngleKey,
  RenderMaterialKey
} from "@/lib/types";

export const MAX_3D_FILE_SIZE = 20 * 1024 * 1024;
export const OUTPUT_IMAGE_SIZE = 1024;
export const OUTPUT_VIDEO_SIZE = 1024;
export const VIDEO_FRAME_COUNT = 24;
export const PREVIEW_VIDEO_MATERIAL: RenderMaterialKey = "clay";
export const RENDER_MATERIAL_KEYS = ["clay", "metal"] as const satisfies readonly RenderMaterialKey[];
export const RENDER_ANGLE_KEYS = ["front", "side", "perspective"] as const satisfies readonly RenderAngleKey[];

export const SUPPORTED_3D_EXTENSIONS: ModelFileExtension[] = ["stl", "obj"];

export const MATERIAL_META: Record<
  RenderMaterialKey,
  {
    label: string;
    description: string;
    color: string;
    roughness: number;
    metalness: number;
  }
> = {
  wood: {
    label: "Wood",
    description: "Warm brown studio finish with a soft satin sheen.",
    color: "#8a5a3c",
    roughness: 0.72,
    metalness: 0.08
  },
  metal: {
    label: "Metal",
    description: "Reflective machined-metal look for premium product previews.",
    color: "#b7c4d2",
    roughness: 0.3,
    metalness: 1
  },
  clay: {
    label: "Clay",
    description: "Neutral matte clay material for clean shape evaluation.",
    color: "#d8dce4",
    roughness: 0.96,
    metalness: 0
  }
};

export const CAMERA_META: Record<
  RenderAngleKey,
  {
    label: string;
    description: string;
  }
> = {
  front: {
    label: "Front",
    description: "Straight-on hero angle for the primary product view."
  },
  side: {
    label: "Side",
    description: "Orthogonal side profile for proportions and depth."
  },
  top: {
    label: "Top",
    description: "Top-down layout view with a locked roll axis."
  },
  perspective: {
    label: "Perspective",
    description: "Elevated isometric-style angle for a premium showcase shot."
  }
};

export function getModelExtension(
  fileName: string
): ModelFileExtension | null {
  const normalizedName = fileName.toLowerCase();

  if (normalizedName.endsWith(".stl")) {
    return "stl";
  }

  if (normalizedName.endsWith(".obj")) {
    return "obj";
  }

  return null;
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
