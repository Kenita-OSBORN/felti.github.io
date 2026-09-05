import type { AdminAssetRow, AdminDashboardData, CartItem, DottiUser, Order, PricingConfig, Product, ShippingAddress } from '@/types/commerce';
import type { DesignState, DottiAsset } from '@/types/dotti';

type ApiResult<T> = T & { error?: string };

async function call<T>(action: string, payload: Record<string, unknown> = {}) {
  const response = await fetch('/api/dotti', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = (await response.json()) as ApiResult<T>;
  if (!response.ok) throw new Error(data.error ?? 'Felti request failed.');
  if (!['me', 'getPricing', 'listOfficialAssets', 'adminDashboard', 'getCart', 'listDesigns', 'getDesign', 'listUploads', 'listOrders', 'getOrder'].includes(action)) {
    window.dispatchEvent(new Event('dotti-storage'));
  }
  return data;
}

export const dottiApi = {
  register: (input: { name: string; email: string; password: string; confirmPassword: string }) =>
    call<{ user: DottiUser }>('register', input),
  login: (input: { email: string; password: string }) => call<{ user: DottiUser }>('login', input),
  logout: () => call<{ ok: true }>('logout'),
  me: () => call<{ user: DottiUser | null }>('me'),
  getPricing: () => call<{ pricing: PricingConfig }>('getPricing'),
  listOfficialAssets: () => call<{ assets: AdminAssetRow[] }>('listOfficialAssets'),
  updateProfile: (profile: Partial<DottiUser>) => call<{ user: DottiUser }>('updateProfile', { profile }),
  upgradeVip: () => call<{ user: DottiUser }>('upgradeVip'),
  listDesigns: () => call<{ designs: DesignState[] }>('listDesigns'),
  saveDesign: (design: DesignState) => call<{ design: DesignState }>('saveDesign', { design }),
  getDesign: (id: string) => call<{ design: DesignState }>('getDesign', { id }),
  deleteDesign: (id: string) => call<{ ok: true }>('deleteDesign', { id }),
  duplicateDesign: (id: string) => call<{ design: DesignState }>('duplicateDesign', { id }),
  listUploads: () => call<{ uploads: DottiAsset[] }>('listUploads'),
  uploadAsset: (input: { name: string; imageUrl: string }) => call<{ upload: DottiAsset }>('uploadAsset', input),
  uploadBase: (input: { name: string; imageUrl: string }) => call<{ upload: DottiAsset }>('uploadBase', input),
  uploadBackground: (input: { name: string; imageUrl: string }) => call<{ upload: DottiAsset }>('uploadBackground', input),
  deleteUpload: (id: string) => call<{ ok: true }>('deleteUpload', { id }),
  getCart: () => call<{ items: CartItem[] }>('getCart'),
  addCart: (item: Omit<CartItem, 'id'> & { id?: string }) => call<{ item: CartItem }>('addCart', { item }),
  updateCart: (items: CartItem[]) => call<{ items: CartItem[] }>('updateCart', { items }),
  checkout: (address: ShippingAddress) => call<{ order: Order }>('checkout', { address }),
  pay: (orderId: string) => call<{ order: Order }>('pay', { orderId }),
  listOrders: () => call<{ orders: Order[] }>('listOrders'),
  getOrder: (id: string) => call<{ order: Order }>('getOrder', { id }),
  adminDashboard: () => call<{ admin: AdminDashboardData }>('adminDashboard'),
  adminUpdateOrder: (input: { orderId: string; paymentStatus?: Order['paymentStatus']; orderStatus?: Order['orderStatus']; trackingCompany?: string; trackingNumber?: string }) =>
    call<{ order: AdminDashboardData['orders'][number] }>('adminUpdateOrder', input),
  adminUpdateUser: (input: { userId: string; role?: DottiUser['role']; membershipStatus?: DottiUser['membershipStatus']; subscriptionStart?: string; subscriptionEnd?: string }) =>
    call<{ admin: AdminDashboardData }>('adminUpdateUser', input),
  adminUpdatePricing: (pricing: PricingConfig) => call<{ pricing: PricingConfig }>('adminUpdatePricing', { pricing }),
  adminSaveProduct: (product: Product) => call<{ products: Product[] }>('adminSaveProduct', { product }),
  adminSaveAsset: (asset: AdminAssetRow) => call<{ assets: AdminAssetRow[] }>('adminSaveAsset', { asset }),
};

export async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('The image could not be read.'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}
