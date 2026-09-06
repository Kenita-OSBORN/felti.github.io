import { NextResponse, type NextRequest } from 'next/server';

import { handleLocalDottiPost } from '@/lib/local-dotti-store';
import { calculateDesignPrice, defaultPricingConfig } from '@/lib/pricing';
import { applySupabaseCookies, createSupabaseAdminClient, createSupabaseRouteClient } from '@/lib/supabase/server';
import { hasSupabaseEnv } from '@/lib/supabase/env';
import { pricedDottiAssets } from '@/data/assets';
import { products as seedProducts } from '@/data/mock-commerce';
import type { AdminAssetRow, AdminDashboardData, CartItem, DottiUser, Order, PricingConfig, Product, ShippingAddress } from '@/types/commerce';
import type { DesignState, DottiAsset } from '@/types/dotti';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ActionRequest = { action: string; [key: string]: unknown };
type ProfileRow = {
  id: string;
  email: string;
  name: string;
  role: 'registered' | 'vip' | 'admin';
  membership_status: 'None' | 'Active' | 'Cancelled' | 'Expired';
  avatar_url: string | null;
  phone: string | null;
  birthday: string | null;
  bio: string | null;
  shipping_address: Partial<ShippingAddress> | null;
  subscription_start: string | null;
  subscription_end: string | null;
  created_at: string;
};
type DesignRow = { design_json: DesignState };
type UploadRow = {
  id: string;
  user_id: string;
  name: string;
  kind: 'base' | 'decoration' | 'avatar' | 'background';
  public_url: string | null;
  storage_path: string;
  content_type: string;
  size: number;
  created_at: string;
};
type OrderRow = {
  id: string;
  user_id: string;
  order_number: string;
  items_json: CartItem[];
  address_json: ShippingAddress;
  subtotal: number;
  shipping_fee: number;
  discount: number;
  vip_discount: number;
  total: number;
  payment_status: Order['paymentStatus'];
  order_status: Order['orderStatus'];
  tracking_company: string | null;
  tracking_number: string | null;
  created_at: string;
};
type ProductRow = {
  id: string;
  product_json: Product;
  active: boolean;
};
type AdminAssetDbRow = {
  id: string;
  asset_json: AdminAssetRow;
  active: boolean;
};

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function response(data: unknown, cookiesToSet: Parameters<typeof applySupabaseCookies>[1], init: ResponseInit = {}) {
  return applySupabaseCookies(NextResponse.json(data, init), cookiesToSet);
}

const UPLOAD_BUCKET = 'dotti-uploads';
const SIGNED_IMAGE_TTL_SECONDS = 60 * 60 * 24 * 365;

function userFromProfile(profile: ProfileRow): DottiUser {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    membershipStatus: profile.membership_status,
    avatarUrl: profile.avatar_url,
    phone: profile.phone ?? '',
    birthday: profile.birthday ?? '',
    bio: profile.bio ?? '',
    shippingAddress: profile.shipping_address ?? {},
    memberSince: profile.created_at.slice(0, 10),
    subscriptionStart: profile.subscription_start ?? undefined,
    subscriptionEnd: profile.subscription_end ?? undefined,
  };
}

function internalFileUrl(path: string) {
  return `/api/dotti/file?path=${encodeURIComponent(path)}`;
}

function storagePathFromInternalFileUrl(url: string | null | undefined) {
  if (!url?.startsWith('/api/dotti/file?')) return null;
  const params = new URLSearchParams(url.slice(url.indexOf('?') + 1));
  return params.get('path');
}

async function signedUploadUrl(admin: ReturnType<typeof createSupabaseAdminClient>, path: string) {
  const signed = await admin.storage.from(UPLOAD_BUCKET).createSignedUrl(path, SIGNED_IMAGE_TTL_SECONDS);
  return signed.data?.signedUrl ?? internalFileUrl(path);
}

async function signedDisplayUrl(admin: ReturnType<typeof createSupabaseAdminClient>, url: string | null | undefined) {
  const path = storagePathFromInternalFileUrl(url);
  return path ? signedUploadUrl(admin, path) : (url ?? null);
}

function canUseVipFeatures(user: DottiUser) {
  return user.membershipStatus === 'Active' && (user.role === 'vip' || user.role === 'admin');
}

function pricingFormInput(pricing: PricingConfig): PricingConfig {
  return {
    base: {
      S: Number(pricing?.base?.S ?? defaultPricingConfig.base.S),
      M: Number(pricing?.base?.M ?? defaultPricingConfig.base.M),
      L: Number(pricing?.base?.L ?? defaultPricingConfig.base.L),
    },
    standardDecoration: Number(pricing?.standardDecoration ?? defaultPricingConfig.standardDecoration),
    premiumDecoration: Number(pricing?.premiumDecoration ?? defaultPricingConfig.premiumDecoration),
    customDecoration: Number(pricing?.customDecoration ?? defaultPricingConfig.customDecoration),
    customBase: Number(pricing?.customBase ?? defaultPricingConfig.customBase),
    detachableDecoration: Number(pricing?.detachableDecoration ?? defaultPricingConfig.detachableDecoration),
    vipMonthly: Number(pricing?.vipMonthly ?? defaultPricingConfig.vipMonthly),
  };
}

function normalizeProduct(product: Product): Product {
  return {
    id: String(product.id || crypto.randomUUID()),
    name: String(product.name ?? '').trim() || 'Untitled Product',
    description: String(product.description ?? '').trim(),
    imageUrl: product.imageUrl ? String(product.imageUrl) : undefined,
    price: Number(product.price ?? 0),
    stock: Number(product.stock ?? 0),
    category: String(product.category ?? '').trim() || 'Brooches',
    material: String(product.material ?? '').trim() || 'Wool felt',
    active: product.active !== false,
    assetIds: Array.isArray(product.assetIds) ? product.assetIds.map(String) : [],
  };
}

function normalizeAdminAsset(asset: AdminAssetRow): AdminAssetRow {
  const isVIP = Boolean(asset.isVIP);
  return {
    id: String(asset.id || crypto.randomUUID()),
    name: String(asset.name ?? '').trim() || 'Untitled Asset',
    category: String(asset.category ?? '').trim() || 'Shapes',
    imageUrl: String(asset.imageUrl ?? '').trim(),
    source: isVIP ? 'premium' : (asset.source === 'upload' ? 'upload' : 'dotti'),
    isVIP,
    productionPrice: Number(asset.productionPrice ?? (isVIP ? 15 : 8)),
    colorEditable: Boolean(asset.colorEditable),
    active: asset.active !== false,
    ownerEmail: asset.ownerEmail,
  };
}

function orderFromRow(row: OrderRow): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    orderDate: row.created_at.slice(0, 10),
    items: row.items_json,
    shippingAddress: row.address_json,
    subtotal: Number(row.subtotal),
    shippingFee: Number(row.shipping_fee),
    discount: Number(row.discount),
    vipDiscount: Number(row.vip_discount),
    total: Number(row.total),
    paymentStatus: row.payment_status,
    orderStatus: row.order_status,
    trackingCompany: row.tracking_company ?? undefined,
    trackingNumber: row.tracking_number ?? undefined,
  };
}

async function uploadFromRow(admin: ReturnType<typeof createSupabaseAdminClient>, row: UploadRow): Promise<DottiAsset> {
  return {
    id: row.id,
    ownerId: row.user_id,
    name: row.name,
    category: 'Shapes',
    imageUrl: await signedUploadUrl(admin, row.storage_path),
    isVIP: true,
    productionPrice: row.kind === 'base' ? 30 : 30,
    source: 'upload',
  };
}

const emptyShippingAddress: ShippingAddress = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  district: '',
  province: '',
  postalCode: '',
  country: '',
};

async function ensureUploadBucket(admin: ReturnType<typeof createSupabaseAdminClient>) {
  const existing = await admin.storage.getBucket(UPLOAD_BUCKET);
  if (!existing.error) return;

  const created = await admin.storage.createBucket(UPLOAD_BUCKET, {
    public: false,
    fileSizeLimit: 2_000_000,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
  });
  if (created.error && !/already exists/i.test(created.error.message)) {
    throw new Error(created.error.message);
  }
}

function isVipMembershipOrder(order: OrderRow | Order) {
  return orderFromUnknownItems(order).some((item) => item.itemType === 'membership' || item.productId === 'felti-vip-monthly');
}

function orderFromUnknownItems(order: OrderRow | Order) {
  return 'items_json' in order ? order.items_json : order.items;
}

async function activateVipMembership(admin: ReturnType<typeof createSupabaseAdminClient>, userId: string) {
  const start = new Date();
  const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const { error } = await admin
    .from('profiles')
    .update({ role: 'vip', membership_status: 'Active', subscription_start: start.toISOString(), subscription_end: end.toISOString() })
    .eq('id', userId);
  if (error) throw new Error(error.message);
}

async function listProducts(admin: ReturnType<typeof createSupabaseAdminClient>, includeInactive = false) {
  let query = admin.from('products').select('id, product_json, active').order('updated_at', { ascending: false });
  if (!includeInactive) query = query.eq('active', true);
  const { data, error } = await query;
  if (error) return seedProducts;
  const products = ((data ?? []) as ProductRow[]).map((row) => ({ ...row.product_json, id: row.id, active: row.active }));
  return products;
}

async function listAdminAssets(admin: ReturnType<typeof createSupabaseAdminClient>, includeInactive = false) {
  let query = admin.from('admin_assets').select('id, asset_json, active').order('updated_at', { ascending: false });
  if (!includeInactive) query = query.eq('active', true);
  const { data, error } = await query;
  const savedAssets = error
    ? []
    : ((data ?? []) as AdminAssetDbRow[]).map((row) => ({ ...row.asset_json, id: row.id, active: row.active }));
  const savedIds = new Set(savedAssets.map((asset) => asset.id));
  const builtInAssets = pricedDottiAssets
    .filter((asset) => includeInactive || !savedIds.has(asset.id))
    .map((asset) => ({
      id: asset.id,
      name: asset.name,
      category: asset.category,
      imageUrl: asset.imageUrl,
      source: asset.source ?? (asset.isVIP ? 'premium' : 'dotti'),
      isVIP: Boolean(asset.isVIP),
      productionPrice: asset.productionPrice ?? (asset.isVIP ? 15 : 8),
      colorEditable: Boolean(asset.colorEditable),
      active: true,
    }));
  return [...savedAssets, ...builtInAssets];
}

async function designWithDisplayImageUrls(admin: ReturnType<typeof createSupabaseAdminClient>, design: DesignState) {
  const customBaseUrl = await signedDisplayUrl(admin, design.customBaseUrl);
  const backgroundImageUrl = await signedDisplayUrl(admin, design.background?.imageUrl);
  const elements = await Promise.all(
    (design.elements ?? []).map(async (element) => ({
      ...element,
      imageUrl: (await signedDisplayUrl(admin, element.imageUrl)) ?? element.imageUrl,
    })),
  );

  return {
    ...design,
    customBaseUrl,
    background: design.background
      ? {
          ...design.background,
          imageUrl: backgroundImageUrl,
        }
      : design.background,
    elements,
  };
}

export async function GET(request: NextRequest) {
  const cookiesToSet: Parameters<typeof applySupabaseCookies>[1] = [];
  try {
    const user = await requireUser(request, cookiesToSet);
    const path = new URL(request.url).searchParams.get('path');
    if (!path) return response({ error: 'Missing file path.' }, cookiesToSet, { status: 400 });

    const admin = createSupabaseAdminClient();
    const { data: upload, error: uploadError } = await admin
      .from('uploads')
      .select('storage_path, content_type')
      .eq('storage_path', path)
      .eq('user_id', user.id)
      .maybeSingle<{ storage_path: string; content_type: string }>();
    if (uploadError) return response({ error: uploadError.message }, cookiesToSet, { status: 400 });
    if (!upload) return response({ error: 'File not found.' }, cookiesToSet, { status: 404 });

    await ensureUploadBucket(admin);
    const { data, error } = await admin.storage.from(UPLOAD_BUCKET).download(path);
    if (error || !data) return response({ error: error?.message ?? 'File not found.' }, cookiesToSet, { status: 404 });
    return applySupabaseCookies(new NextResponse(data, { headers: { 'content-type': upload.content_type, 'cache-control': 'private, max-age=3600' } }), cookiesToSet);
  } catch (error) {
    if (error instanceof Response) return response(await error.json(), cookiesToSet, { status: error.status });
    return response({ error: error instanceof Error ? error.message : 'Something went wrong.' }, cookiesToSet, { status: 500 });
  }
}

function parseDataImage(imageUrl: string) {
  const match = imageUrl.match(/^data:(image\/(?:png|jpe?g|webp));base64,(.+)$/i);
  if (!match) return { error: 'Please upload a PNG, JPG, JPEG, or WebP image.' } as const;
  const contentType = match[1].toLowerCase();
  const bytes = Buffer.from(match[2], 'base64');
  if (!bytes.length) return { error: 'The image file is empty.' } as const;
  if (bytes.byteLength > 2_000_000) return { error: 'Please choose an image under 2 MB.' } as const;
  const extension = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
  return { contentType, bytes, extension } as const;
}

async function profileForUser(admin: ReturnType<typeof createSupabaseAdminClient>, userId: string) {
  const { data, error } = await admin.from('profiles').select('*').eq('id', userId).single<ProfileRow>();
  if (error || !data) throw new Error('User profile could not be loaded.');
  const user = userFromProfile(data);
  user.avatarUrl = await signedDisplayUrl(admin, user.avatarUrl);
  return user;
}

async function ensureProfileForAuthUser(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  input: { userId: string; email: string; name: string; role?: DottiUser['role']; membershipStatus?: DottiUser['membershipStatus'] },
) {
  const { data: authData, error: authError } = await admin.auth.admin.getUserById(input.userId);
  if (authError || !authData.user) {
    throw new Error('Registration could not be completed. Please try again with a new email or delete the pending Auth user in Supabase.');
  }
  const authEmail = String(authData.user.email ?? '').trim().toLowerCase();
  if (authEmail && authEmail !== input.email) {
    throw new Error('This email is already registered or pending verification. Please log in, reset the password, or delete the old Auth user in Supabase.');
  }
  const { error } = await admin.from('profiles').upsert({
    id: input.userId,
    email: input.email,
    name: input.name,
    role: input.role ?? 'registered',
    membership_status: input.membershipStatus ?? 'None',
  });
  if (error) throw new Error(error.message);
  return profileForUser(admin, input.userId);
}

async function currentUser(request: NextRequest, cookiesToSet: Parameters<typeof applySupabaseCookies>[1]) {
  const supabase = createSupabaseRouteClient(request, cookiesToSet);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return profileForUser(createSupabaseAdminClient(), data.user.id);
}

async function requireUser(request: NextRequest, cookiesToSet: Parameters<typeof applySupabaseCookies>[1]) {
  const user = await currentUser(request, cookiesToSet);
  if (!user) throw new Response(JSON.stringify({ error: 'Please log in or sign up to continue.' }), { status: 401 });
  return user;
}

async function validateDesignPermission(admin: ReturnType<typeof createSupabaseAdminClient>, user: DottiUser, design: DesignState) {
  const usesVipFeature =
    !!design.customBaseUrl ||
    design.background?.type === 'upload' ||
    design.elements.some((element) => element.source === 'premium' || element.source === 'upload' || element.productionPrice > 8);
  if (usesVipFeature && !canUseVipFeatures(user)) return 'VIP membership is required for premium assets and personal uploads.';

  const uploadedAssetIds = design.elements.filter((element) => element.source === 'upload').map((element) => element.assetId);
  for (const assetId of uploadedAssetIds) {
    const { data } = await admin.from('uploads').select('id').eq('id', assetId).eq('user_id', user.id).maybeSingle();
    if (!data) return 'This uploaded asset does not belong to the current user.';
  }
  return null;
}

export async function POST(request: NextRequest) {
  const cookiesToSet: Parameters<typeof applySupabaseCookies>[1] = [];

  try {
    const body = (await request.json()) as ActionRequest;
    if (!hasSupabaseEnv()) {
      if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
        return NextResponse.json(
          { error: 'Supabase environment variables are required in production.' },
          { status: 503 },
        );
      }
      return handleLocalDottiPost(request, body);
    }

    const supabase = createSupabaseRouteClient(request, cookiesToSet);
    const admin = createSupabaseAdminClient();

    if (body.action === 'register') {
      const name = String(body.name ?? '').trim();
      const email = String(body.email ?? '').trim().toLowerCase();
      const password = String(body.password ?? '');
      const confirmPassword = String(body.confirmPassword ?? '');
      if (!name) return response({ error: 'Please enter a display name.' }, cookiesToSet, { status: 400 });
      if (!validateEmail(email)) return response({ error: 'Please enter a valid email address.' }, cookiesToSet, { status: 400 });
      if (password.length < 8) return response({ error: 'Password must be at least 8 characters.' }, cookiesToSet, { status: 400 });
      if (password !== confirmPassword) return response({ error: 'Passwords do not match.' }, cookiesToSet, { status: 400 });

      const existing = await admin.from('profiles').select('id').eq('email', email).maybeSingle();
      if (existing.data) return response({ error: 'This email is already registered.' }, cookiesToSet, { status: 409 });

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name }, emailRedirectTo: `${siteUrl}/account` },
      });
      if (error || !data.user) return response({ error: error?.message ?? 'Registration failed.' }, cookiesToSet, { status: 400 });

      if (!data.session) {
        await supabase.auth.signInWithPassword({ email, password });
      }

      const allowLocalTestRoles = process.env.NODE_ENV !== 'production' && !process.env.VERCEL;
      const isAdminTest = allowLocalTestRoles && (email === 'admin@felti.test' || email === 'admin@dotti.test');
      const isVipTest = allowLocalTestRoles && (email === 'vip@felti.test' || email === 'vip@dotti.test');
      const profile = await ensureProfileForAuthUser(admin, {
        userId: data.user.id,
        email,
        name,
        role: isAdminTest ? 'admin' : isVipTest ? 'vip' : 'registered',
        membershipStatus: isAdminTest || isVipTest ? 'Active' : 'None',
      });

      return response({ user: profile }, cookiesToSet);
    }

    if (body.action === 'login') {
      const email = String(body.email ?? '').trim().toLowerCase();
      const password = String(body.password ?? '');
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) return response({ error: 'Incorrect email or password.' }, cookiesToSet, { status: 401 });
      try {
        return response({ user: await profileForUser(admin, data.user.id) }, cookiesToSet);
      } catch {
        const name = String(data.user.user_metadata?.display_name ?? data.user.email?.split('@')[0] ?? 'Felti friend');
        return response({ user: await ensureProfileForAuthUser(admin, { userId: data.user.id, email, name }) }, cookiesToSet);
      }
    }

    if (body.action === 'resetPassword') {
      const email = String(body.email ?? '').trim().toLowerCase();
      if (!validateEmail(email)) return response({ error: 'Please enter a valid email address.' }, cookiesToSet, { status: 400 });
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/login`,
      });
      if (error) return response({ error: error.message }, cookiesToSet, { status: 400 });
      return response({ ok: true }, cookiesToSet);
    }

    if (body.action === 'logout') {
      await supabase.auth.signOut();
      return response({ ok: true }, cookiesToSet);
    }

    if (body.action === 'me') return response({ user: await currentUser(request, cookiesToSet) }, cookiesToSet);

    if (body.action === 'getPricing') {
      const { data } = await admin.from('pricing').select('config_json').eq('id', 'current').maybeSingle<{ config_json: PricingConfig }>();
      return response({ pricing: { ...defaultPricingConfig, ...(data?.config_json ?? {}) } }, cookiesToSet);
    }

    if (body.action === 'listProducts') {
      return response({ products: await listProducts(admin) }, cookiesToSet);
    }

    if (body.action === 'listOfficialAssets') {
      return response({ assets: await listAdminAssets(admin) }, cookiesToSet);
    }

    const user = await requireUser(request, cookiesToSet);

    if (String(body.action).startsWith('admin')) {
      if (user.role !== 'admin') return response({ error: 'Admin access required.' }, cookiesToSet, { status: 403 });

      const [{ data: profileRows, error: profilesError }, { data: orderRows, error: ordersError }, { data: designRows, error: designsError }, { data: uploadRows }, productRowsResult, assetRowsResult, pricingResult] = await Promise.all([
        admin.from('profiles').select('*').order('created_at', { ascending: false }),
        admin.from('orders').select('*').order('created_at', { ascending: false }),
        admin.from('designs').select('id,user_id,name,design_json,preview_image,created_at,updated_at').order('updated_at', { ascending: false }),
        admin.from('uploads').select('*').order('created_at', { ascending: false }),
        admin.from('products').select('id, product_json, active').order('updated_at', { ascending: false }),
        admin.from('admin_assets').select('id, asset_json, active').order('updated_at', { ascending: false }),
        admin.from('pricing').select('config_json').eq('id', 'current').maybeSingle<{ config_json: PricingConfig }>(),
      ]);
      if (profilesError) return response({ error: profilesError.message }, cookiesToSet, { status: 400 });
      if (ordersError) return response({ error: ordersError.message }, cookiesToSet, { status: 400 });
      if (designsError) return response({ error: designsError.message }, cookiesToSet, { status: 400 });

      if (body.action === 'adminUpdateOrder') {
        const update = {
          payment_status: body.paymentStatus as Order['paymentStatus'] | undefined,
          order_status: body.orderStatus as Order['orderStatus'] | undefined,
          tracking_company: body.trackingCompany ? String(body.trackingCompany) : null,
          tracking_number: body.trackingNumber ? String(body.trackingNumber) : null,
        };
        const { error } = await admin.from('orders').update(update).eq('id', String(body.orderId));
        if (error) return response({ error: error.message }, cookiesToSet, { status: 400 });
      }

      if (body.action === 'adminUpdateUser') {
        const { error } = await admin
          .from('profiles')
          .update({
            role: body.role as DottiUser['role'],
            membership_status: body.membershipStatus as DottiUser['membershipStatus'],
            subscription_start: body.subscriptionStart ? String(body.subscriptionStart) : null,
            subscription_end: body.subscriptionEnd ? String(body.subscriptionEnd) : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', String(body.userId));
        if (error) return response({ error: error.message }, cookiesToSet, { status: 400 });
      }

      if (body.action === 'adminUpdatePricing') {
        const pricing = pricingFormInput(body.pricing as PricingConfig);
        const { error } = await admin.from('pricing').upsert({ id: 'current', config_json: pricing, updated_at: new Date().toISOString() });
        if (error) return response({ error: error.message }, cookiesToSet, { status: 400 });
        return response({ pricing }, cookiesToSet);
      }

      if (body.action === 'adminSaveProduct') {
        const product = normalizeProduct(body.product as Product);
        const { error } = await admin.from('products').upsert({
          id: product.id,
          product_json: product,
          active: product.active,
          updated_at: new Date().toISOString(),
        });
        if (error) return response({ error: error.message }, cookiesToSet, { status: 400 });
        return response({ products: await listProducts(admin, true) }, cookiesToSet);
      }

      if (body.action === 'adminDeleteProduct') {
        const productId = String(body.productId ?? '').trim();
        if (!productId) return response({ error: 'Missing product ID.' }, cookiesToSet, { status: 400 });
        const { error } = await admin.from('products').delete().eq('id', productId);
        if (error) return response({ error: error.message }, cookiesToSet, { status: 400 });
        return response({ products: await listProducts(admin, true) }, cookiesToSet);
      }

      if (body.action === 'adminSaveAsset') {
        const asset = normalizeAdminAsset(body.asset as AdminAssetRow);
        if (!asset.imageUrl) return response({ error: 'Please upload or enter an asset image before saving.' }, cookiesToSet, { status: 400 });
        const { error } = await admin.from('admin_assets').upsert({
          id: asset.id,
          asset_json: asset,
          active: asset.active,
          updated_at: new Date().toISOString(),
        });
        if (error) return response({ error: error.message }, cookiesToSet, { status: 400 });
        return response({ assets: await listAdminAssets(admin, true) }, cookiesToSet);
      }

      const profiles = ((profileRows ?? []) as ProfileRow[]).map(userFromProfile);
      const orders = ((orderRows ?? []) as OrderRow[]).map((row) => {
        const customer = profiles.find((profile) => profile.id === row.user_id);
        return { ...orderFromRow(row), customerName: customer?.name ?? 'Unknown customer', customerEmail: customer?.email ?? '', customerPhone: customer?.phone ?? '' };
      });
      const designs = ((designRows ?? []) as Array<{ id: string; user_id: string; name: string; design_json: DesignState; preview_image: string | null; created_at: string; updated_at: string }>).map((row) => {
        const creator = profiles.find((profile) => profile.id === row.user_id);
        return {
          id: row.id,
          name: row.name,
          userId: row.user_id,
          creatorName: creator?.name ?? 'Unknown creator',
          creatorEmail: creator?.email ?? '',
          design: row.design_json,
          previewImage: row.preview_image,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          ordered: orders.some((order) => order.items.some((item) => item.designId === row.id)),
        };
      });
      const users = profiles.map((profile) => {
        const userOrders = orders.filter((order) => order.customerEmail === profile.email);
        return {
          ...profile,
          designCount: designs.filter((design) => design.userId === profile.id).length,
          uploadCount: ((uploadRows ?? []) as UploadRow[]).filter((upload) => upload.user_id === profile.id).length,
          orderCount: userOrders.length,
          totalSpending: userOrders.filter((order) => order.paymentStatus === 'Paid').reduce((sum, order) => sum + order.total, 0),
        };
      });
      const paidOrders = orders.filter((order) => order.paymentStatus === 'Paid');
      const productRows = productRowsResult.error ? [] : ((productRowsResult.data ?? []) as ProductRow[]);
      const products = productRows.length
        ? productRows.map((row) => ({ ...row.product_json, id: row.id, active: row.active }))
        : seedProducts;
      const pricing = { ...defaultPricingConfig, ...(pricingResult.data?.config_json ?? {}) };
      const savedAssetRows = assetRowsResult.error ? [] : ((assetRowsResult.data ?? []) as AdminAssetDbRow[]);
      const savedAssets = savedAssetRows.map((row) => ({ ...row.asset_json, id: row.id, active: row.active }));
      const savedAssetIds = new Set(savedAssets.map((asset) => asset.id));
      const assets = [
        ...savedAssets,
        ...pricedDottiAssets
          .filter((asset) => !savedAssetIds.has(asset.id))
          .map((asset) => ({
            id: asset.id,
            name: asset.name,
            category: asset.category,
            imageUrl: asset.imageUrl,
            source: asset.source ?? (asset.isVIP ? 'premium' : 'dotti'),
            isVIP: Boolean(asset.isVIP),
            productionPrice: asset.productionPrice ?? (asset.isVIP ? 15 : 8),
            colorEditable: Boolean(asset.colorEditable),
            active: true,
          })),
      ];
      const adminData: AdminDashboardData = {
        stats: {
          totalUsers: users.length,
          activeVipMembers: users.filter((item) => item.role === 'vip' && item.membershipStatus === 'Active').length,
          totalOrders: orders.length,
          paidOrders: paidOrders.length,
          pendingOrders: orders.filter((order) => order.paymentStatus === 'Pending').length,
          makingOrders: orders.filter((order) => order.orderStatus === 'Making').length,
          totalSales: paidOrders.reduce((sum, order) => sum + order.total, 0),
          totalSavedDesigns: designs.length,
        },
        users,
        orders,
        designs,
        assets,
        pricing,
        products,
        memberships: users.filter((item) => item.role === 'vip' || item.role === 'admin' || item.membershipStatus !== 'None'),
      };
      return response({ admin: adminData }, cookiesToSet);
    }

    if (body.action === 'updateProfile') {
      const profile = body.profile as Partial<DottiUser> | undefined;
      let avatarUrl = profile?.avatarUrl ? String(profile.avatarUrl) : user.avatarUrl ?? null;
      if (avatarUrl?.startsWith('data:')) {
        const image = parseDataImage(avatarUrl);
        if ('error' in image) return response({ error: image.error }, cookiesToSet, { status: 400 });
        const uploadId = crypto.randomUUID();
        const path = `${user.id}/avatars/${uploadId}.${image.extension}`;
        await ensureUploadBucket(admin);
        const { error } = await admin.storage.from(UPLOAD_BUCKET).upload(path, image.bytes, { contentType: image.contentType, upsert: false });
        if (error) return response({ error: error.message }, cookiesToSet, { status: 400 });
        avatarUrl = internalFileUrl(path);
        await admin
          .from('uploads')
          .insert({
            id: uploadId,
            user_id: user.id,
            name: 'Avatar',
            kind: 'avatar',
            storage_path: path,
            public_url: avatarUrl,
            content_type: image.contentType,
            size: image.bytes.byteLength,
          });
      }
      const { error } = await admin
        .from('profiles')
        .update({
          name: String(profile?.name ?? user.name).trim(),
          phone: String(profile?.phone ?? ''),
          birthday: profile?.birthday || null,
          bio: String(profile?.bio ?? ''),
          avatar_url: avatarUrl,
          shipping_address: profile?.shippingAddress ?? {},
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      if (error) return response({ error: error.message }, cookiesToSet, { status: 400 });
      return response({ user: await profileForUser(admin, user.id) }, cookiesToSet);
    }

    if (body.action === 'upgradeVip') {
      return response({ error: 'VIP membership is activated after payment.' }, cookiesToSet, { status: 400 });
    }

    if (body.action === 'createVipOrder') {
      if (user.role === 'vip' && user.membershipStatus === 'Active') {
        return response({ error: 'Your Felti VIP membership is already active.' }, cookiesToSet, { status: 400 });
      }
      const { data: pricingRow } = await admin.from('pricing').select('config_json').eq('id', 'current').maybeSingle<{ config_json: PricingConfig }>();
      const pricing = { ...defaultPricingConfig, ...(pricingRow?.config_json ?? {}) };
      const total = pricing.vipMonthly;
      const orderNumber = `FELTI-VIP-${Date.now().toString().slice(-8)}`;
      const item: CartItem = {
        id: crypto.randomUUID(),
        itemType: 'membership',
        productId: 'felti-vip-monthly',
        productName: 'Felti VIP Monthly',
        price: total,
        quantity: 1,
      };
      const insert = await admin
        .from('orders')
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          items_json: [item],
          address_json: { ...emptyShippingAddress, fullName: user.name, email: user.email, phone: user.phone ?? '' },
          subtotal: total,
          shipping_fee: 0,
          discount: 0,
          vip_discount: 0,
          total,
          payment_status: 'Pending',
          order_status: 'Pending',
        })
        .select('*')
        .single<OrderRow>();
      if (insert.error || !insert.data) return response({ error: insert.error?.message ?? 'VIP checkout failed.' }, cookiesToSet, { status: 400 });
      return response({ order: orderFromRow(insert.data) }, cookiesToSet);
    }

    if (body.action === 'listDesigns') {
      const { data, error } = await admin.from('designs').select('design_json').eq('user_id', user.id).order('updated_at', { ascending: false });
      if (error) return response({ error: error.message }, cookiesToSet, { status: 400 });
      const designs = await Promise.all(((data ?? []) as DesignRow[]).map((row) => designWithDisplayImageUrls(admin, row.design_json)));
      return response({ designs }, cookiesToSet);
    }

    if (body.action === 'saveDesign') {
      const input = body.design as DesignState;
      const permissionError = await validateDesignPermission(admin, user, input);
      if (permissionError) return response({ error: permissionError }, cookiesToSet, { status: 403 });
      const stamp = new Date().toISOString();
      const design: DesignState = {
        ...input,
        id: input.id || crypto.randomUUID(),
        userId: user.id,
        baseSize: input.baseSize ?? 'M',
        previewImage: input.previewImage ?? null,
        createdDate: input.createdDate ?? stamp,
        updatedDate: stamp,
      };
      const { error } = await admin.from('designs').upsert({
        id: design.id,
        user_id: user.id,
        name: design.name,
        design_json: design,
        preview_image: design.previewImage,
        created_at: design.createdDate,
        updated_at: stamp,
      });
      if (error) return response({ error: error.message }, cookiesToSet, { status: 400 });
      return response({ design }, cookiesToSet);
    }

    if (body.action === 'getDesign') {
      const { data, error } = await admin.from('designs').select('design_json').eq('id', String(body.id)).eq('user_id', user.id).maybeSingle<DesignRow>();
      if (error) return response({ error: error.message }, cookiesToSet, { status: 400 });
      return data ? response({ design: await designWithDisplayImageUrls(admin, data.design_json) }, cookiesToSet) : response({ error: 'Design not found.' }, cookiesToSet, { status: 404 });
    }

    if (body.action === 'deleteDesign') {
      const { error } = await admin.from('designs').delete().eq('id', String(body.id)).eq('user_id', user.id);
      if (error) return response({ error: error.message }, cookiesToSet, { status: 400 });
      return response({ ok: true }, cookiesToSet);
    }

    if (body.action === 'duplicateDesign') {
      const { data, error } = await admin.from('designs').select('design_json').eq('id', String(body.id)).eq('user_id', user.id).maybeSingle<DesignRow>();
      if (error) return response({ error: error.message }, cookiesToSet, { status: 400 });
      if (!data) return response({ error: 'Design not found.' }, cookiesToSet, { status: 404 });
      const stamp = new Date().toISOString();
      const copy: DesignState = { ...data.design_json, id: crypto.randomUUID(), name: `${data.design_json.name} Copy`, createdDate: stamp, updatedDate: stamp };
      const insert = await admin.from('designs').insert({ id: copy.id, user_id: user.id, name: copy.name, design_json: copy, preview_image: copy.previewImage, created_at: stamp, updated_at: stamp });
      if (insert.error) return response({ error: insert.error.message }, cookiesToSet, { status: 400 });
      return response({ design: copy }, cookiesToSet);
    }

    if (body.action === 'listUploads') {
      if (!canUseVipFeatures(user)) return response({ error: 'VIP membership is required.' }, cookiesToSet, { status: 403 });
      const { data, error } = await admin.from('uploads').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) return response({ error: error.message }, cookiesToSet, { status: 400 });
      const uploads = await Promise.all(((data ?? []) as UploadRow[]).filter((row) => row.kind === 'decoration').map((row) => uploadFromRow(admin, row)));
      return response({ uploads }, cookiesToSet);
    }

    if (body.action === 'deleteUpload') {
      if (!canUseVipFeatures(user)) return response({ error: 'VIP membership is required.' }, cookiesToSet, { status: 403 });
      const uploadId = String(body.id ?? '');
      const { data: upload, error } = await admin
        .from('uploads')
        .select('id, storage_path')
        .eq('id', uploadId)
        .eq('user_id', user.id)
        .eq('kind', 'decoration')
        .maybeSingle<{ id: string; storage_path: string }>();
      if (error) return response({ error: error.message }, cookiesToSet, { status: 400 });
      if (!upload) return response({ error: 'Upload not found.' }, cookiesToSet, { status: 404 });

      const deleted = await admin.from('uploads').delete().eq('id', upload.id).eq('user_id', user.id).eq('kind', 'decoration');
      if (deleted.error) return response({ error: deleted.error.message }, cookiesToSet, { status: 400 });
      await admin.storage.from(UPLOAD_BUCKET).remove([upload.storage_path]);
      return response({ ok: true }, cookiesToSet);
    }

    if (body.action === 'uploadAsset' || body.action === 'uploadBase' || body.action === 'uploadBackground') {
      if (!canUseVipFeatures(user)) return response({ error: 'VIP membership is required.' }, cookiesToSet, { status: 403 });
      const image = parseDataImage(String(body.imageUrl ?? ''));
      if ('error' in image) return response({ error: image.error }, cookiesToSet, { status: 400 });
      const kind = body.action === 'uploadBase' ? 'base' : body.action === 'uploadBackground' ? 'background' : 'decoration';
      const uploadId = crypto.randomUUID();
      const path = `${user.id}/${kind}/${uploadId}.${image.extension}`;
      await ensureUploadBucket(admin);
      const uploaded = await admin.storage.from(UPLOAD_BUCKET).upload(path, image.bytes, { contentType: image.contentType, upsert: false });
      if (uploaded.error) return response({ error: uploaded.error.message }, cookiesToSet, { status: 400 });
      const publicUrl = internalFileUrl(path);
      const insert = await admin
        .from('uploads')
        .insert({
          id: uploadId,
          user_id: user.id,
          name: String(body.name ?? 'My Upload').trim() || 'My Upload',
          kind,
          storage_path: path,
          public_url: publicUrl,
          content_type: image.contentType,
          size: image.bytes.byteLength,
        })
        .select('*')
        .single<UploadRow>();
      if (insert.error || !insert.data) return response({ error: insert.error?.message ?? 'Upload failed.' }, cookiesToSet, { status: 400 });
      return response({ upload: await uploadFromRow(admin, insert.data) }, cookiesToSet);
    }

    if (body.action === 'getCart') {
      const { data, error } = await admin.from('cart_items').select('item_json').eq('user_id', user.id).order('created_at', { ascending: true });
      if (error) return response({ error: error.message }, cookiesToSet, { status: 400 });
      return response({ items: (data ?? []).map((row) => row.item_json as CartItem) }, cookiesToSet);
    }

    if (body.action === 'addCart') {
      const item = body.item as CartItem;
      if (item.designSnapshot) {
        const permissionError = await validateDesignPermission(admin, user, item.designSnapshot as DesignState);
        if (permissionError) return response({ error: permissionError }, cookiesToSet, { status: 403 });
      }
      const itemWithId = { ...item, id: item.id || crypto.randomUUID() };
      const { error } = await admin.from('cart_items').insert({ id: itemWithId.id, user_id: user.id, item_json: itemWithId });
      if (error) return response({ error: error.message }, cookiesToSet, { status: 400 });
      return response({ item: itemWithId }, cookiesToSet);
    }

    if (body.action === 'updateCart') {
      const items = ((body.items as CartItem[]) ?? []).map((item) => ({ ...item, id: item.id || crypto.randomUUID() }));
      const deleted = await admin.from('cart_items').delete().eq('user_id', user.id);
      if (deleted.error) return response({ error: deleted.error.message }, cookiesToSet, { status: 400 });
      if (items.length) {
        const inserted = await admin.from('cart_items').insert(items.map((item) => ({ id: item.id, user_id: user.id, item_json: item })));
        if (inserted.error) return response({ error: inserted.error.message }, cookiesToSet, { status: 400 });
      }
      return response({ items }, cookiesToSet);
    }

    if (body.action === 'checkout') {
      const { data, error } = await admin.from('cart_items').select('item_json').eq('user_id', user.id).order('created_at', { ascending: true });
      if (error) return response({ error: error.message }, cookiesToSet, { status: 400 });
      const items = (data ?? []).map((row) => row.item_json as CartItem);
      if (!items.length) return response({ error: 'Your cart is empty.' }, cookiesToSet, { status: 400 });
      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const shippingFee = subtotal > 1000 ? 0 : 60;
      const total = subtotal + shippingFee;
      const orderNumber = `FELTI-${Date.now().toString().slice(-8)}`;
      const insert = await admin
        .from('orders')
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          items_json: items,
          address_json: body.address as ShippingAddress,
          subtotal,
          shipping_fee: shippingFee,
          discount: 0,
          vip_discount: 0,
          total,
          payment_status: 'Pending',
          order_status: 'Pending',
        })
        .select('*')
        .single<OrderRow>();
      if (insert.error || !insert.data) return response({ error: insert.error?.message ?? 'Checkout failed.' }, cookiesToSet, { status: 400 });
      return response({ order: orderFromRow(insert.data) }, cookiesToSet);
    }

    if (body.action === 'pay') {
      const orderId = String(body.orderId ?? '');
      const existing = await admin.from('orders').select('*').eq('id', orderId).eq('user_id', user.id).maybeSingle<OrderRow>();
      if (existing.error) return response({ error: existing.error.message }, cookiesToSet, { status: 400 });
      if (!existing.data) return response({ error: 'Order not found.' }, cookiesToSet, { status: 404 });
      if (existing.data.payment_status !== 'Paid') {
        const paid = await admin.from('orders').update({ payment_status: 'Paid', order_status: 'Confirmed' }).eq('id', orderId).eq('user_id', user.id);
        if (paid.error) return response({ error: paid.error.message }, cookiesToSet, { status: 400 });
        if (isVipMembershipOrder(existing.data)) {
          await activateVipMembership(admin, user.id);
        }
        await admin.from('cart_items').delete().eq('user_id', user.id);
      }
      const { data } = await admin.from('orders').select('*').eq('id', orderId).eq('user_id', user.id).single<OrderRow>();
      return response({ order: orderFromRow(data!) }, cookiesToSet);
    }

    if (body.action === 'listOrders') {
      const { data, error } = await admin.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) return response({ error: error.message }, cookiesToSet, { status: 400 });
      return response({ orders: ((data ?? []) as OrderRow[]).map(orderFromRow) }, cookiesToSet);
    }

    if (body.action === 'getOrder') {
      const { data, error } = await admin.from('orders').select('*').eq('id', String(body.id)).eq('user_id', user.id).maybeSingle<OrderRow>();
      if (error) return response({ error: error.message }, cookiesToSet, { status: 400 });
      return data ? response({ order: orderFromRow(data) }, cookiesToSet) : response({ error: 'Order not found.' }, cookiesToSet, { status: 404 });
    }

    if (body.action === 'priceDesign') return response({ price: calculateDesignPrice(body.design as DesignState) }, cookiesToSet);

    return response({ error: 'Unknown Felti action.' }, cookiesToSet, { status: 400 });
  } catch (error) {
    if (error instanceof Response) return response(await error.json(), cookiesToSet, { status: error.status });
    return response({ error: error instanceof Error ? error.message : 'Something went wrong.' }, cookiesToSet, { status: 500 });
  }
}
