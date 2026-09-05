export type BaseShape = 'circle' | 'oval' | 'heart' | 'square' | 'flower' | 'free' | 'custom';
export type BaseSize = 'S' | 'M' | 'L';
export type BackgroundPattern = 'plain' | 'soft-grid' | 'small-dots' | 'subtle-paper' | 'soft-fabric';
export type ProductConnectionMethod = 'pin' | 'velcro' | 'pendant' | 'strap';

export type BaseCustomShape = {
  width: number;
  height: number;
  radius: number;
  rotation: number;
};

export type DesignBackground = {
  type: 'solid' | 'pattern' | 'upload';
  color: string;
  pattern?: BackgroundPattern;
  imageUrl?: string | null;
};

export type AssetCategory =
  | 'Flowers'
  | 'Hearts'
  | 'Stars'
  | 'Animals'
  | 'Letters'
  | 'Fruits'
  | 'Food'
  | 'Ribbons'
  | 'Leaves'
  | 'Faces'
  | 'Seasonal'
  | 'Shapes';

export type DottiAsset = {
  id: string;
  name: string;
  category: AssetCategory;
  imageUrl: string;
  isVIP?: boolean;
  productionPrice?: number;
  source?: 'dotti' | 'premium' | 'upload';
  ownerId?: string;
  colorEditable?: boolean;
  defaultColor?: string;
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
  productionPrice: number;
  source: 'dotti' | 'premium' | 'upload';
  colorEditable?: boolean;
  color?: string;
};

export type DesignState = {
  id?: string;
  userId?: string;
  name: string;
  baseShape: BaseShape;
  baseSize: BaseSize;
  baseColor: string;
  baseCustomShape?: BaseCustomShape;
  customBaseUrl?: string | null;
  customBaseAspectRatio?: number | null;
  decorationsDetachable?: boolean;
  decorationConnectionMethod?: 'velcro' | null;
  detachableFee?: number;
  productConnectionMethod?: ProductConnectionMethod | null;
  finalPrice?: number;
  background: DesignBackground;
  canvasWidth: number;
  canvasHeight: number;
  elements: DesignElement[];
  previewImage?: string | null;
  createdDate?: string;
  updatedDate?: string;
};
