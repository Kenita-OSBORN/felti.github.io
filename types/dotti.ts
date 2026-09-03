export type BaseShape = 'circle' | 'oval' | 'heart';

export type AssetCategory =
  | 'Flowers'
  | 'Hearts'
  | 'Stars'
  | 'Animals'
  | 'Letters'
  | 'Fruits'
  | 'Ribbons'
  | 'Leaves'
  | 'Shapes';

export type DottiAsset = {
  id: string;
  name: string;
  category: AssetCategory;
  imageUrl: string;
  isVIP?: boolean;
};

export type DesignElement = {
  id: string;
  assetId: string;
  assetName: string;
  imageUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  flipX: boolean;
  flipY: boolean;
};

export type DesignState = {
  name: string;
  baseShape: BaseShape;
  canvasWidth: number;
  canvasHeight: number;
  elements: DesignElement[];
};
