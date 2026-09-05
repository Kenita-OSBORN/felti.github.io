export type UserRole = 'guest' | 'registered' | 'vip' | 'admin';
export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Making'
  | 'Ready'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';

export type Product = {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  price: number;
  stock: number;
  category: string;
  material: string;
  active: boolean;
  assetIds: string[];
};

export type GalleryDesign = {
  id: string;
  title: string;
  creator: string;
  category: string;
  likes: number;
  isVIP?: boolean;
  assetIds: string[];
};

export type CartItem = {
  id: string;
  itemType?: 'product' | 'design' | 'membership';
  productId?: string;
  designId?: string;
  productName: string;
  price: number;
  quantity: number;
  designSnapshot?: unknown;
  previewImage?: string | null;
  baseSize?: string;
  baseShape?: string;
  baseColor?: string;
  decorationCount?: number;
  decorationsDetachable?: boolean;
  decorationConnectionMethod?: 'Velcro' | null;
  detachableFee?: number;
  productConnectionMethod?: string;
};

export type ShippingAddress = {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  district: string;
  province: string;
  postalCode: string;
  country: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  orderDate: string;
  items: CartItem[];
  shippingAddress: ShippingAddress;
  subtotal: number;
  shippingFee: number;
  discount: number;
  vipDiscount: number;
  total: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  trackingCompany?: string;
  trackingNumber?: string;
};

export type DottiUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  membershipStatus: 'None' | 'Active' | 'Cancelled' | 'Expired';
  avatarUrl?: string | null;
  phone?: string;
  birthday?: string;
  bio?: string;
  shippingAddress?: Partial<ShippingAddress>;
  memberSince?: string;
  subscriptionStart?: string;
  subscriptionEnd?: string;
};

export type MembershipPlan = {
  id: string;
  name: string;
  priceLabel: string;
  duration: string;
  active: boolean;
  benefits: string[];
};

export type PricingConfig = {
  base: {
    S: number;
    M: number;
    L: number;
  };
  standardDecoration: number;
  premiumDecoration: number;
  customDecoration: number;
  customBase: number;
  detachableDecoration: number;
  vipMonthly: number;
};

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  membershipStatus: DottiUser['membershipStatus'];
  avatarUrl?: string | null;
  phone?: string;
  memberSince?: string;
  subscriptionStart?: string;
  subscriptionEnd?: string;
  designCount: number;
  uploadCount: number;
  orderCount: number;
  totalSpending: number;
};

export type AdminDesignRow = {
  id: string;
  name: string;
  userId: string;
  creatorName: string;
  creatorEmail: string;
  design: unknown;
  previewImage?: string | null;
  createdAt: string;
  updatedAt: string;
  ordered: boolean;
};

export type AdminAssetRow = {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  source: 'dotti' | 'premium' | 'upload';
  isVIP: boolean;
  productionPrice: number;
  colorEditable: boolean;
  active: boolean;
  ownerEmail?: string;
};

export type AdminDashboardData = {
  stats: {
    totalUsers: number;
    activeVipMembers: number;
    totalOrders: number;
    paidOrders: number;
    pendingOrders: number;
    makingOrders: number;
    totalSales: number;
    totalSavedDesigns: number;
  };
  users: AdminUserRow[];
  orders: Array<Order & { customerName: string; customerEmail: string; customerPhone?: string }>;
  designs: AdminDesignRow[];
  assets: AdminAssetRow[];
  pricing: PricingConfig;
  products: Product[];
  memberships: AdminUserRow[];
};
