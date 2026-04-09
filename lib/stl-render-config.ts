import type {
  StlBackgroundPreset,
  StlMaterialPreset,
  StlRenderViewKey
} from "@/lib/types";

export const MAX_STL_FILE_SIZE = 50 * 1024 * 1024;
export const STL_RENDER_TIMEOUT_MS = 120_000;
export const STILL_OUTPUT_SIZE = 720;
export const VIDEO_OUTPUT_SIZE = 720;
export const VIDEO_FRAME_COUNT = 60;
export const VIDEO_FRAME_RATE = 30;
export const CAMERA_FOV = 34;
export const DEFAULT_BACKGROUND: StlBackgroundPreset = "dark";
export const DEFAULT_MATERIAL_PRESET: StlMaterialPreset = "clay";
export const DEFAULT_DEBUG_MODE = false;

export const STL_VIEW_KEYS = [
  "left",
  "right",
  "top",
  "bottom"
] as const satisfies readonly StlRenderViewKey[];

export const STL_MATERIAL_PRESET_KEYS = [
  "clay",
  "metal",
  "wood"
] as const satisfies readonly StlMaterialPreset[];

export const STL_BACKGROUND_META: Record<
  StlBackgroundPreset,
  {
    label: string;
    color: string;
  }
> = {
  white: {
    label: "White",
    color: "#ffffff"
  },
  dark: {
    label: "Dark Gray",
    color: "#1a1a1a"
  }
};

export const STL_MATERIAL_PRESET_META: Record<
  StlMaterialPreset,
  {
    label: string;
    description: string;
    color: string;
    shininess: number;
    specular: string;
  }
> = {
  clay: {
    label: "Clay",
    description: "Neutral matte studio clay for clean marketplace previews.",
    color: "#d9d4ca",
    shininess: 10,
    specular: "#4a4a4a"
  },
  metal: {
    label: "Metal",
    description: "Bright machined metal with a stronger highlight roll-off.",
    color: "#b8c1cb",
    shininess: 95,
    specular: "#f4f7ff"
  },
  wood: {
    label: "Wood",
    description: "Warm satin wood finish for a softer catalog presentation.",
    color: "#8d6545",
    shininess: 28,
    specular: "#76553c"
  }
};

export const STL_VIEW_META: Record<
  StlRenderViewKey,
  {
    label: string;
    filename: string;
    description: string;
  }
> = {
  left: {
    label: "Left",
    filename: "model_left.png",
    description: "Orthographic-style left profile."
  },
  right: {
    label: "Right",
    filename: "model_right.png",
    description: "Orthographic-style right profile."
  },
  top: {
    label: "Top",
    filename: "model_top.png",
    description: "Top-down catalog view."
  },
  bottom: {
    label: "Bottom",
    filename: "model_bottom.png",
    description: "Underside inspection view."
  }
};

export const THUMBNAIL_FILENAME = "model_thumbnail.png";
export const VIDEO_FILENAME = "model_360.mp4";
