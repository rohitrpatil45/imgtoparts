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

