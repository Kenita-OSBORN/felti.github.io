import type { CartItem, DottiUser, Order, ShippingAddress } from '@/types/commerce';
import type { DesignState } from '@/types/dotti';

export const keys = {
  cart: 'dotti-cart-v1',
  user: 'dotti-user-v1',
  orders: 'dotti-orders-v1',
  draft: 'dotti-design-draft-v1',
  favorites: 'dotti-favorites-v1',
};

const read = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};

const write = <T,>(key: string, value: T) => {
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event('dotti-storage'));
};

export const getCart = () => read<CartItem[]>(keys.cart, []);
export const saveCart = (items: CartItem[]) => write(keys.cart, items);

export const addCartItem = (item: Omit<CartItem, 'id'>) => {
  const items = getCart();
  const existing = items.find(
    (current) =>
      current.productId === item.productId &&
      current.designId === item.designId &&
      !item.designSnapshot,
  );
  if (existing) {
    existing.quantity += item.quantity;
    saveCart([...items]);
    return existing;
  }
  const next = { ...item, id: crypto.randomUUID() };
  saveCart([...items, next]);
  return next;
};

export const getCurrentUser = () =>
  read<DottiUser | null>(keys.user, null);

export const saveCurrentUser = (user: DottiUser | null) => {
  if (!user) {
    window.localStorage.removeItem(keys.user);
    window.dispatchEvent(new Event('dotti-storage'));
    return;
  }
  write(keys.user, user);
};

export const getOrders = () => read<Order[]>(keys.orders, []);
export const saveOrders = (orders: Order[]) => write(keys.orders, orders);

export const createOrder = (address: ShippingAddress) => {
  const cart = getCart();
  const user = getCurrentUser();
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = subtotal > 40 ? 0 : 5;
  const vipDiscount = user?.role === 'vip' ? Math.round(subtotal * 0.1 * 100) / 100 : 0;
  const discount = 0;
  const total = Math.max(0, subtotal + shippingFee - vipDiscount - discount);
  const order: Order = {
    id: crypto.randomUUID(),
    orderNumber: `FELTI-${Date.now().toString().slice(-8)}`,
    orderDate: new Date().toISOString().slice(0, 10),
    items: cart,
    shippingAddress: address,
    subtotal,
    shippingFee,
    discount,
    vipDiscount,
    total,
    paymentStatus: 'Pending',
    orderStatus: 'Pending',
  };
  saveOrders([order, ...getOrders()]);
  saveCart([]);
  return order;
};

export const payOrder = (orderId: string) => {
  const orders = getOrders();
  const updated = orders.map((order) =>
    order.id === orderId
      ? { ...order, paymentStatus: 'Paid' as const, orderStatus: 'Confirmed' as const }
      : order,
  );
  saveOrders(updated);
  return updated.find((order) => order.id === orderId);
};

export const saveDesignDraft = (design: DesignState) => {
  const now = new Date().toISOString();
  write(keys.draft, {
    id: 'local-draft',
    userId: getCurrentUser()?.id ?? 'guest',
    previewImage: null,
    createdDate: now,
    updatedDate: now,
    ...design,
  });
};

export const getDesignDraft = () => read<(DesignState & { id?: string }) | null>(keys.draft, null);
