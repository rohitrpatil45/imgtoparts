export type ProcessedAsset = {
  id: string;
  kind: string;
  label: string;
  filename: string;
  dataUrl: string;
  width: number;
  height: number;
};

export type ProcessedImageResult = {
  id: string;
  sourceName: string;
  width: number;
  height: number;
  original: ProcessedAsset;
  crops: ProcessedAsset[];
};

export type ProcessResponse = {
  images: ProcessedImageResult[];
};

export type ModelFileExtension = "stl" | "obj";

export type RenderMaterialKey = "wood" | "metal" | "clay";

export type RenderAngleKey = "front" | "side" | "top" | "perspective";

export type Rendered3DImage = {
  id: string;
  material: RenderMaterialKey;
  angle: RenderAngleKey;
  label: string;
  filename: string;
  src: string;
  dataUrl?: string;
  width: number;
  height: number;
};

export type Rendered3DMaterialGroup = {
  key: RenderMaterialKey;
  label: string;
  description: string;
  images: Rendered3DImage[];
};

export type Rendered3DVideo = {
  filename: string;
  src: string;
  dataUrl?: string;
  mimeType: string;
  width: number;
  height: number;
  frameCount: number;
  material: RenderMaterialKey;
};

export type Rendered3DStats = {
  meshCount: number;
  vertexCount: number;
  triangleCount: number;
  dimensions: {
    x: number;
    y: number;
    z: number;
  };
};

export type Rendered3DImagePack = {
  id: string;
  renderId: string;
  sourceName: string;
  extension: ModelFileExtension;
  size: number;
  imageCount: number;
  images: Rendered3DImage[];
  materials: Rendered3DMaterialGroup[];
  stats: Rendered3DStats;
};

export type Rendered3DResult = Rendered3DImagePack & {
  video?: Rendered3DVideo | null;
};

export type Render3DImagesResponse = {
  result?: Rendered3DResult;
  renderId?: string;
  images?: string[];
  materials?: Rendered3DMaterialGroup[];
  stats?: Rendered3DStats;
  status?: "images_complete";
  error?: string;
};

export type RenderVideoResponse = {
  renderId?: string;
  video?: Rendered3DVideo;
  status?: "video_complete" | "video_pending" | "video_failed";
  error?: string;
};

export type StlMaterialPreset = "clay" | "metal" | "wood";

export type StlBackgroundPreset = "white" | "dark";

export type StlRenderViewKey = "left" | "right" | "top" | "bottom";

export type StlRenderImageKey = StlRenderViewKey | "thumbnail";

export type StlRenderImageAsset = {
  key: StlRenderImageKey;
  label: string;
  filename: string;
  src: string;
  outputPath: string;
  width: number;
  height: number;
  mimeType: "image/png";
};

export type StlRenderVideoAsset = {
  filename: string;
  src: string;
  outputPath: string;
  width: number;
  height: number;
  frameCount: number;
  frameRate: number;
  codec: "h264";
  mimeType: "video/mp4";
};

export type StlRenderStats = {
  meshCount: number;
  vertexCount: number;
  triangleCount: number;
  dimensions: {
    x: number;
    y: number;
    z: number;
  };
  normalizedScale: number;
  cameraDistance: number;
  backend: string;
  gpuEnabled: boolean;
  durationMs: number;
};

export type StlRenderResult = {
  renderId: string;
  sourceName: string;
  materialPreset: StlMaterialPreset;
  background: StlBackgroundPreset;
  outputDirectory: string;
  images: Record<StlRenderViewKey, StlRenderImageAsset>;
  video: StlRenderVideoAsset;
  thumbnail?: StlRenderImageAsset;
  stats: StlRenderStats;
};

export type StlRenderResponse = {
  result?: StlRenderResult;
  error?: string;
};
