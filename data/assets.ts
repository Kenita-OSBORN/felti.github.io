import type { AssetCategory, DottiAsset } from '@/types/dotti';

const svg = (body: string, viewBox = '0 0 96 96') =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">
      <defs>
        <filter id="felt" x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="7" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.15" xChannelSelector="R" yChannelSelector="G"/>
          <feDropShadow dx="0" dy="1.8" stdDeviation="1.8" flood-color="#7d5a50" flood-opacity="0.18"/>
        </filter>
        <filter id="feltTexture" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="12"/>
          <feColorMatrix type="saturate" values="0"/>
          <feComponentTransfer><feFuncA type="table" tableValues="0 0.18"/></feComponentTransfer>
        </filter>
      </defs>
      <g filter="url(#felt)">${body}</g>
      <rect width="100%" height="100%" opacity="0.16" filter="url(#feltTexture)" style="mix-blend-mode:multiply"/>
    </svg>`,
  )}`;

const letterAsset = (letter: string): DottiAsset => ({
  id: `letter-${letter.toLowerCase()}`,
  name: `Letter ${letter}`,
  category: 'Letters',
  colorEditable: true,
  defaultColor: '#d85d7d',
  imageUrl: svg(
    `<text x="48" y="72" font-family="'Arial Rounded MT Bold', 'Nunito Sans', Arial, sans-serif" font-size="70" font-weight="900" text-anchor="middle" fill="#d85d7d" stroke="#7d5a50" stroke-width="1.2" paint-order="stroke">${letter}</text>`,
  ),
});

const alphabetAssets = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letterAsset);

export const assetCategories: AssetCategory[] = [
  'Flowers',
  'Hearts',
  'Stars',
  'Animals',
  'Letters',
  'Fruits',
  'Food',
  'Ribbons',
  'Leaves',
  'Faces',
  'Seasonal',
  'Shapes',
];

export const dottiAssets: DottiAsset[] = [
  {
    id: 'daisy-blush',
    name: 'Blush Daisy',
    category: 'Flowers',
    imageUrl: '/felti-blush-daisy.png',
  },
  {
    id: 'daisy',
    name: 'Daisy',
    category: 'Flowers',
    imageUrl: '/felti-daisy.png',
  },
  {
    id: 'blue-bloom',
    name: 'Blue Bloom',
    category: 'Flowers',
    imageUrl: '/felti-blue-bloom.png',
  },
  {
    id: 'tiny-rose',
    name: 'Tiny Rose',
    category: 'Flowers',
    imageUrl: '/felti-tiny-rose.png',
  },
  {
    id: 'felt-heart',
    name: 'Felt Heart',
    category: 'Hearts',
    imageUrl: '/felti-heart.png',
  },
  {
    id: 'cocoa-heart',
    name: 'Cocoa Heart',
    category: 'Hearts',
    imageUrl: '/felti-cocoa-heart.png',
  },
  {
    id: 'spark-star',
    name: 'Spark Star',
    category: 'Stars',
    imageUrl: '/felti-spark-star.png',
  },
  {
    id: 'mint-star',
    name: 'Mint Star',
    category: 'Stars',
    imageUrl: svg('<path d="m48 9 9 27 28 1-22 17 8 27-23-16-23 16 8-27-22-17 28-1Z" fill="#a8e6cf"/><circle cx="39" cy="44" r="3" fill="#5b4539"/><circle cx="57" cy="44" r="3" fill="#5b4539"/>'),
  },
  {
    id: 'sleepy-bunny',
    name: 'Sleepy Bunny',
    category: 'Animals',
    isVIP: true,
    imageUrl: '/felti-sleepy-bunny.png',
  },
  {
    id: 'little-cat',
    name: 'Little Cat',
    category: 'Animals',
    imageUrl: '/felti-little-cat.png',
  },
  ...alphabetAssets,
  {
    id: 'strawberry',
    name: 'Strawberry',
    category: 'Fruits',
    imageUrl: '/felti-strawberry.png',
  },
  {
    id: 'peach',
    name: 'Peach',
    category: 'Fruits',
    imageUrl: '/felti-peach.png',
  },
  {
    id: 'pink-ribbon',
    name: 'Pink Ribbon',
    category: 'Ribbons',
    imageUrl: '/felti-pink-ribbon.png',
  },
  {
    id: 'cupcake',
    name: 'Cupcake',
    category: 'Food',
    imageUrl: '/felti-cupcake.png',
  },
  {
    id: 'smile-face',
    name: 'Smile Face',
    category: 'Faces',
    imageUrl: '/felti-smile-face.png',
  },
  {
    id: 'snow-flower',
    name: 'Snow Flower',
    category: 'Seasonal',
    isVIP: true,
    imageUrl: '/felti-snow-flower.png',
  },
  {
    id: 'gold-ribbon',
    name: 'Gold Ribbon',
    category: 'Ribbons',
    isVIP: true,
    imageUrl: '/felti-gold-ribbon.png',
  },
  {
    id: 'soft-leaf',
    name: 'Soft Leaf',
    category: 'Leaves',
    imageUrl: '/felti-soft-leaf.png',
  },
  {
    id: 'tiny-leaves',
    name: 'Tiny Leaves',
    category: 'Leaves',
    imageUrl: '/felti-tiny-leaves.png',
  },
  {
    id: 'cream-dot',
    name: 'Cream Dot',
    category: 'Shapes',
    imageUrl: '/felti-cream-dot.png',
  },
  {
    id: 'lavender-drop',
    name: 'Lavender Drop',
    category: 'Shapes',
    imageUrl: '/felti-lavender-drop.png',
  },
  {
    id: 'checker-patch',
    name: 'Checker Patch',
    category: 'Shapes',
    isVIP: true,
    imageUrl: '/felti-checker-patch.png',
  },
];

export const pricedDottiAssets: DottiAsset[] = dottiAssets.map((asset) => ({
  ...asset,
  productionPrice: asset.productionPrice ?? (asset.isVIP ? 15 : 8),
  source: asset.source ?? (asset.isVIP ? 'premium' : 'dotti'),
  colorEditable: asset.category === 'Letters',
  defaultColor:
    asset.defaultColor ??
    ({
      Letters: '#d85d7d',
    } as Partial<Record<AssetCategory, string>>)[asset.category] ??
    '#d85d7d',
}));

export const featuredDesigns = [
  { name: 'Garden Dot', creator: 'Mina', assetIds: ['daisy-blush', 'soft-leaf', 'felt-heart'] },
  { name: 'Sweet Picnic', creator: 'Lulu', assetIds: ['strawberry', 'pink-ribbon', 'cream-dot'] },
  { name: 'Cozy Star', creator: 'Aya', assetIds: ['mint-star', 'blue-bloom', 'cocoa-heart'] },
];

export const featuredProducts = [
  { name: 'Blush Daisy Brooch', price: '฿180', assetIds: ['daisy-blush', 'soft-leaf'] },
  { name: 'Strawberry Felt Pin', price: '฿160', assetIds: ['strawberry', 'pink-ribbon'] },
  { name: 'Mint Star Charm', price: '฿140', assetIds: ['mint-star', 'cream-dot'] },
  { name: 'Little Cat Brooch', price: '฿220', assetIds: ['little-cat', 'tiny-leaves'] },
];
