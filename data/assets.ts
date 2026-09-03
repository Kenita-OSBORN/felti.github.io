import type { AssetCategory, DottiAsset } from '@/types/dotti';

const svg = (body: string, viewBox = '0 0 96 96') =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body}</svg>`,
  )}`;

export const assetCategories: AssetCategory[] = [
  'Flowers',
  'Hearts',
  'Stars',
  'Animals',
  'Letters',
  'Fruits',
  'Ribbons',
  'Leaves',
  'Shapes',
];

export const dottiAssets: DottiAsset[] = [
  {
    id: 'daisy-blush',
    name: 'Blush Daisy',
    category: 'Flowers',
    imageUrl: svg('<g fill="#ffd1dc"><circle cx="48" cy="24" r="16"/><circle cx="48" cy="72" r="16"/><circle cx="24" cy="48" r="16"/><circle cx="72" cy="48" r="16"/></g><circle cx="48" cy="48" r="15" fill="#f7c96d"/><circle cx="43" cy="43" r="3" fill="#5b4539"/><circle cx="53" cy="43" r="3" fill="#5b4539"/><path d="M39 53q9 10 18 0" fill="none" stroke="#5b4539" stroke-width="4" stroke-linecap="round"/>'),
  },
  {
    id: 'blue-bloom',
    name: 'Blue Bloom',
    category: 'Flowers',
    imageUrl: svg('<path d="M48 13c9 18 24 16 28 31-14 4-13 20-28 30-15-10-14-26-28-30 4-15 19-13 28-31Z" fill="#a8d8ea"/><circle cx="48" cy="47" r="14" fill="#fff0a9"/><path d="M38 51q10 7 20 0" stroke="#59483e" stroke-width="4" fill="none" stroke-linecap="round"/>'),
  },
  {
    id: 'tiny-rose',
    name: 'Tiny Rose',
    category: 'Flowers',
    imageUrl: svg('<path d="M49 17c20 7 27 28 13 45-11 14-33 13-44-2 16-4 13-24 31-43Z" fill="#f5a3af"/><path d="M42 33c18-7 29 13 12 23-12 7-27-8-12-23Z" fill="#ffcad4"/><path d="M64 67c12 2 19 8 20 17-12 0-21-4-27-13Z" fill="#9fca8b"/>'),
  },
  {
    id: 'felt-heart',
    name: 'Felt Heart',
    category: 'Hearts',
    imageUrl: svg('<path d="M48 80S15 60 15 34c0-13 9-22 21-22 7 0 11 3 12 8 2-5 7-8 14-8 12 0 20 9 20 22 0 26-34 46-34 46Z" fill="#ff8fab"/><path d="M30 31c4-8 12-9 18-2" stroke="#fff4f6" stroke-width="4" stroke-linecap="round" fill="none"/>'),
  },
  {
    id: 'cocoa-heart',
    name: 'Cocoa Heart',
    category: 'Hearts',
    imageUrl: svg('<path d="M48 82S16 61 16 36c0-13 9-22 21-22 6 0 10 3 11 7 2-4 6-7 12-7 12 0 20 9 20 22 0 25-32 46-32 46Z" fill="#8a6552"/><path d="M32 33c4-5 9-6 14-2" stroke="#f8e6dc" stroke-width="4" stroke-linecap="round" fill="none"/>'),
  },
  {
    id: 'spark-star',
    name: 'Spark Star',
    category: 'Stars',
    imageUrl: svg('<path d="m48 11 10 25 27 2-21 17 7 26-23-14-23 14 7-26L11 38l27-2Z" fill="#ffd166"/><path d="M35 43h26M48 30v26" stroke="#fff6cf" stroke-width="5" stroke-linecap="round"/>'),
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
    imageUrl: svg('<ellipse cx="35" cy="26" rx="9" ry="22" fill="#f6efe8"/><ellipse cx="61" cy="26" rx="9" ry="22" fill="#f6efe8"/><circle cx="48" cy="55" r="28" fill="#fff7f0"/><path d="M34 53q5 5 10 0M52 53q5 5 10 0" stroke="#6b5143" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M45 61h6l-3 4Z" fill="#ef9aa9"/>'),
  },
  {
    id: 'little-cat',
    name: 'Little Cat',
    category: 'Animals',
    imageUrl: svg('<path d="M24 42 20 18l22 14h12l22-14-4 24c6 8 7 23-4 32-12 10-38 10-50 0-11-9-10-24-4-32Z" fill="#f0d2b6"/><circle cx="38" cy="53" r="4" fill="#5b4539"/><circle cx="58" cy="53" r="4" fill="#5b4539"/><path d="M45 62h6l-3 4Z" fill="#d98b89"/>'),
  },
  {
    id: 'letter-d',
    name: 'Letter D',
    category: 'Letters',
    imageUrl: svg('<rect x="18" y="14" width="60" height="68" rx="18" fill="#fde2e4"/><text x="48" y="64" font-family="Arial, sans-serif" font-size="52" font-weight="700" text-anchor="middle" fill="#7d5a50">D</text>'),
  },
  {
    id: 'letter-love',
    name: 'Love',
    category: 'Letters',
    isVIP: true,
    imageUrl: svg('<rect x="9" y="24" width="78" height="48" rx="20" fill="#fff0a9"/><text x="48" y="56" font-family="Arial, sans-serif" font-size="22" font-weight="700" text-anchor="middle" fill="#7d5a50">LOVE</text>'),
  },
  {
    id: 'strawberry',
    name: 'Strawberry',
    category: 'Fruits',
    imageUrl: svg('<path d="M48 84C30 68 20 52 23 36c3-17 22-18 25-7 4-11 23-10 25 7 3 16-7 32-25 48Z" fill="#ef6f7f"/><path d="M35 22c8 0 10 6 13 11 3-5 5-11 13-11-2 10-7 15-13 16-6-1-11-6-13-16Z" fill="#8cc084"/><g fill="#ffe6a7"><circle cx="38" cy="44" r="2"/><circle cx="53" cy="48" r="2"/><circle cx="44" cy="62" r="2"/></g>'),
  },
  {
    id: 'peach',
    name: 'Peach',
    category: 'Fruits',
    imageUrl: svg('<path d="M49 84C19 66 23 27 47 28c4-13 28-10 31 9 4 25-11 42-29 47Z" fill="#ffb997"/><path d="M49 30c3 14 1 31-11 43" fill="none" stroke="#e88373" stroke-width="4" stroke-linecap="round"/><path d="M55 22c8-10 19-9 25-3-9 8-18 9-25 3Z" fill="#9fca8b"/>'),
  },
  {
    id: 'pink-ribbon',
    name: 'Pink Ribbon',
    category: 'Ribbons',
    imageUrl: svg('<path d="M45 47C32 31 15 31 10 47c5 16 22 16 35 0Z" fill="#f7a8b8"/><path d="M51 47c13-16 30-16 35 0-5 16-22 16-35 0Z" fill="#f7a8b8"/><circle cx="48" cy="47" r="10" fill="#e8899f"/><path d="M39 56 31 82l17-10 17 10-8-26Z" fill="#f39cae"/>'),
  },
  {
    id: 'gold-ribbon',
    name: 'Gold Ribbon',
    category: 'Ribbons',
    isVIP: true,
    imageUrl: svg('<path d="M45 45C31 28 15 31 9 47c6 15 22 17 36-2Z" fill="#f7c96d"/><path d="M51 45c14-17 30-14 36 2-6 15-22 17-36-2Z" fill="#f7c96d"/><circle cx="48" cy="47" r="10" fill="#dba64f"/><path d="M40 56 32 82l16-9 16 9-8-26Z" fill="#efba5f"/>'),
  },
  {
    id: 'soft-leaf',
    name: 'Soft Leaf',
    category: 'Leaves',
    imageUrl: svg('<path d="M20 75C24 36 50 15 80 19c-2 31-24 55-60 56Z" fill="#9fca8b"/><path d="M26 70c14-20 30-33 49-46" stroke="#f4fff1" stroke-width="5" fill="none" stroke-linecap="round"/>'),
  },
  {
    id: 'tiny-leaves',
    name: 'Tiny Leaves',
    category: 'Leaves',
    imageUrl: svg('<path d="M47 79C46 46 60 24 82 17c8 24-7 51-35 62Z" fill="#8fbf9f"/><path d="M45 78C32 52 17 40 10 38c0 23 14 37 35 40Z" fill="#b7d7a8"/><path d="M47 78c4-22 16-40 30-55" stroke="#f7fff1" stroke-width="4" fill="none" stroke-linecap="round"/>'),
  },
  {
    id: 'cream-dot',
    name: 'Cream Dot',
    category: 'Shapes',
    imageUrl: svg('<circle cx="48" cy="48" r="34" fill="#fff0d6"/><circle cx="48" cy="48" r="24" fill="none" stroke="#e8ccb0" stroke-width="5" stroke-dasharray="2 8" stroke-linecap="round"/>'),
  },
  {
    id: 'lavender-drop',
    name: 'Lavender Drop',
    category: 'Shapes',
    imageUrl: svg('<path d="M48 10c19 22 31 39 31 54 0 15-12 25-31 25S17 79 17 64c0-15 12-32 31-54Z" fill="#cdb4db"/><path d="M35 61q13 10 26 0" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>'),
  },
  {
    id: 'checker-patch',
    name: 'Checker Patch',
    category: 'Shapes',
    isVIP: true,
    imageUrl: svg('<rect x="17" y="17" width="62" height="62" rx="14" fill="#f7ede2"/><path d="M17 48h62M48 17v62" stroke="#d6a994" stroke-width="6"/><rect x="20" y="20" width="26" height="26" rx="8" fill="#f6bdc9"/><rect x="50" y="50" width="26" height="26" rx="8" fill="#f6bdc9"/>'),
  },
];

export const featuredDesigns = [
  { name: 'Garden Dot', creator: 'Mina', assetIds: ['daisy-blush', 'soft-leaf', 'felt-heart'] },
  { name: 'Sweet Picnic', creator: 'Lulu', assetIds: ['strawberry', 'pink-ribbon', 'cream-dot'] },
  { name: 'Cozy Star', creator: 'Aya', assetIds: ['mint-star', 'blue-bloom', 'cocoa-heart'] },
];

export const featuredProducts = [
  { name: 'Blush Daisy Brooch', price: '$18', assetIds: ['daisy-blush', 'soft-leaf'] },
  { name: 'Strawberry Felt Pin', price: '$16', assetIds: ['strawberry', 'pink-ribbon'] },
  { name: 'Mint Star Charm', price: '$14', assetIds: ['mint-star', 'cream-dot'] },
  { name: 'Little Cat Brooch', price: '$22', assetIds: ['little-cat', 'tiny-leaves'] },
];
