import type { GalleryDesign, MembershipPlan, Order, Product } from '@/types/commerce';

export const products: Product[] = [
  {
    id: 'prod-blush-daisy',
    name: 'Blush Daisy Brooch',
    description: 'A soft handmade felt brooch with layered petals and a warm stitched center.',
    price: 180,
    stock: 12,
    category: 'Brooches',
    material: 'Wool felt, cotton thread, stainless pin',
    active: true,
    assetIds: ['daisy-blush', 'soft-leaf'],
  },
  {
    id: 'prod-strawberry',
    name: 'Strawberry Felt Pin',
    description: 'A sweet fruit pin for tote bags, cardigans, and little everyday outfits.',
    price: 160,
    stock: 8,
    category: 'Fruit Pins',
    material: 'Wool felt, seed stitching, stainless pin',
    active: true,
    assetIds: ['strawberry', 'tiny-leaves'],
  },
  {
    id: 'prod-cat',
    name: 'Little Cat Brooch',
    description: 'A cozy cat face brooch with soft neutral felt and hand-finished details.',
    price: 220,
    stock: 5,
    category: 'Animals',
    material: 'Wool felt, embroidery thread, stainless pin',
    active: true,
    assetIds: ['little-cat', 'cream-dot'],
  },
  {
    id: 'prod-mint-star',
    name: 'Mint Star Charm',
    description: 'A calm mint star charm that works as a bag charm or tiny pin accent.',
    price: 140,
    stock: 17,
    category: 'Charms',
    material: 'Wool felt, cotton thread, charm loop',
    active: true,
    assetIds: ['mint-star', 'pink-ribbon'],
  },
];

export const galleryDesigns: GalleryDesign[] = [
  { id: 'design-garden-dot', title: 'Garden Dot', creator: 'Mina', category: 'Floral', likes: 248, assetIds: ['daisy-blush', 'soft-leaf', 'felt-heart'] },
  { id: 'design-sweet-picnic', title: 'Sweet Picnic', creator: 'Lulu', category: 'Food', likes: 191, assetIds: ['strawberry', 'peach', 'pink-ribbon'] },
  { id: 'design-cozy-star', title: 'Cozy Star', creator: 'Aya', category: 'Cute', likes: 173, assetIds: ['mint-star', 'blue-bloom', 'cream-dot'] },
  { id: 'design-cat-note', title: 'Cat Note', creator: 'Nori', category: 'Animal', likes: 156, assetIds: ['little-cat', 'letter-d', 'tiny-leaves'] },
  { id: 'design-gold-bow', title: 'Gold Bow', creator: 'Vivi', category: 'VIP designs', likes: 132, isVIP: true, assetIds: ['gold-ribbon', 'checker-patch', 'spark-star'] },
  { id: 'design-rose-letter', title: 'Rose Letter', creator: 'June', category: 'Floral', likes: 121, assetIds: ['tiny-rose', 'letter-l', 'letter-o'] },
];

export const membershipPlan: MembershipPlan = {
  id: 'vip-monthly',
  name: 'Felti VIP',
  priceLabel: '฿79 / month',
  duration: 'Monthly',
  active: true,
  benefits: [
    'Premium decorations',
    'Exclusive templates',
    'More downloadable DIY works',
    'VIP profile badge',
    'Member-only promotions',
  ],
};

export const sampleOrders: Order[] = [
  {
    id: 'order-1',
    orderNumber: 'FELTI-260903-001',
    orderDate: '2026-09-03',
    items: [
      { id: 'item-1', productId: 'prod-blush-daisy', productName: 'Blush Daisy Brooch', price: 180, quantity: 1 },
    ],
    shippingAddress: {
      fullName: 'Mina Chen',
      phone: '+1 555 0100',
      email: 'mina@example.com',
      address: '18 Felt Lane',
      district: 'Central',
      province: 'CA',
      postalCode: '90001',
      country: 'United States',
    },
    subtotal: 180,
    shippingFee: 60,
    discount: 0,
    vipDiscount: 0,
    total: 240,
    paymentStatus: 'Paid',
    orderStatus: 'Making',
    trackingNumber: 'Pending',
  },
];
