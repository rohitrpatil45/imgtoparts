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
  dataUrl: string;
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
  dataUrl: string;
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

export type Rendered3DResult = {
  id: string;
  sourceName: string;
  extension: ModelFileExtension;
  size: number;
  imageCount: number;
  materials: Rendered3DMaterialGroup[];
  video: Rendered3DVideo;
  stats: Rendered3DStats;
};

export type Render3DResponse = {
  result: Rendered3DResult;
};
