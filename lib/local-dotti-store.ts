import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';

import { NextResponse, type NextRequest } from 'next/server';

import { calculateDesignPrice, defaultPricingConfig } from '@/lib/pricing';
import { pricedDottiAssets } from '@/data/assets';
import { products as seedProducts } from '@/data/mock-commerce';
import type { AdminAssetRow, AdminDashboardData, CartItem, DottiUser, Order, PaymentStatus, PricingConfig, Product, ShippingAddress } from '@/types/commerce';
import type { DesignState, DottiAsset } from '@/types/dotti';

type LocalUser = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  passwordSalt: string;
  role: 'registered' | 'vip' | 'admin';
  membershipStatus: DottiUser['membershipStatus'];
  avatarUrl: string | null;
  phone: string;
  birthday: string;
  bio: string;
  shippingAddress: Partial<ShippingAddress>;
  subscriptionStart?: string;
  subscriptionEnd?: string;
  createdAt: string;
  updatedAt: string;
};

type LocalSession = {
  token: string;
  userId: string;
  expiresAt: string;
};

type LocalUpload = {
  id: string;
  userId: string;
  name: string;
  kind: 'base' | 'decoration' | 'avatar' | 'background';
  imageUrl: string;
  contentType: string;
  size: number;
  createdAt: string;
};

type LocalDesign = {
  id: string;
  userId: string;
  name: string;
  design: DesignState;
  createdAt: string;
  updatedAt: string;
};

type LocalOrder = {
  id: string;
  userId: string;
  order: Order;
};

type LocalDb = {
  users: LocalUser[];
  sessions: LocalSession[];
  designs: LocalDesign[];
  uploads: LocalUpload[];
  cartItems: Array<{ id: string; userId: string; item: CartItem; createdAt: string }>;
  orders: LocalOrder[];
  pricing?: PricingConfig;
  products?: Product[];
  assets?: AdminAssetRow[];
};

type ActionRequest = { action: string; [key: string]: unknown };

const dataDir = path.join(process.cwd(), '.dotti-data');
const dbPath = path.join(dataDir, 'db.json');
const sessionCookie = 'dotti_session';
const sessionMaxAge = 60 * 60 * 24 * 30;
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

const emptyDb = (): LocalDb => ({
  users: [],
  sessions: [],
  designs: [],
  uploads: [],
  cartItems: [],
  orders: [],
  pricing: defaultPricingConfig,
  products: seedProducts,
  assets: [],
});

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function readDb() {
  try {
    const db = JSON.parse(await readFile(dbPath, 'utf8')) as LocalDb;
    db.pricing = { ...defaultPricingConfig, ...(db.pricing ?? {}) };
    db.products ??= seedProducts;
    db.assets ??= [];
    ensureLocalTestAccounts(db);
    return db;
  } catch {
    const db = emptyDb();
    ensureLocalTestAccounts(db);
    return db;
  }
}

async function writeDb(db: LocalDb) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dbPath, JSON.stringify(db, null, 2), 'utf8');
}

function hashPassword(password: string, salt = randomBytes(16).toString('hex')) {
  const hash = pbkdf2Sync(password, salt, 120_000, 32, 'sha256').toString('hex');
  return { salt, hash };
}

function ensureLocalTestAccounts(db: LocalDb) {
  const now = new Date().toISOString();
  const accounts: Array<{ email: string; name: string; password: string; role: LocalUser['role']; membershipStatus: DottiUser['membershipStatus'] }> = [
    { email: 'admin@felti.test', name: 'Felti Admin', password: 'AdminTest123', role: 'admin', membershipStatus: 'Active' },
    { email: 'vip@felti.test', name: 'Felti VIP', password: 'VipTest123', role: 'vip', membershipStatus: 'Active' },
  ];

  for (const account of accounts) {
    const passwordRecord = hashPassword(account.password);
    const existing = db.users.find((user) => user.email === account.email);
    if (existing) {
      existing.passwordHash = passwordRecord.hash;
      existing.passwordSalt = passwordRecord.salt;
      existing.role = account.role;
      existing.membershipStatus = account.membershipStatus;
      existing.updatedAt = now;
      continue;
    }
    db.users.push({
      id: crypto.randomUUID(),
      email: account.email,
      name: account.name,
      passwordHash: passwordRecord.hash,
      passwordSalt: passwordRecord.salt,
      role: account.role,
      membershipStatus: account.membershipStatus,
      avatarUrl: null,
      phone: '',
      birthday: '',
      bio: '',
      shippingAddress: {},
      createdAt: now,
      updatedAt: now,
    });
  }
}

function verifyPassword(password: string, salt: string, expectedHash: string) {
  const actual = Buffer.from(hashPassword(password, salt).hash, 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function activateLocalVip(user: LocalUser, now: string) {
  user.role = 'vip';
  user.membershipStatus = 'Active';
  user.subscriptionStart = now;
  user.subscriptionEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  user.updatedAt = now;
}

function isVipMembershipOrder(order: Order) {
  return order.items.some((item) => item.itemType === 'membership' || item.productId === 'felti-vip-monthly');
}

function canUseVipFeatures(user: LocalUser | DottiUser) {
  return user.membershipStatus === 'Active' && (user.role === 'vip' || user.role === 'admin');
}

function userFromLocal(user: LocalUser): DottiUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    membershipStatus: user.membershipStatus,
    avatarUrl: user.avatarUrl,
    phone: user.phone,
    birthday: user.birthday,
    bio: user.bio,
    shippingAddress: user.shippingAddress,
    memberSince: user.createdAt.slice(0, 10),
    subscriptionStart: user.subscriptionStart,
    subscriptionEnd: user.subscriptionEnd,
  };
}

function requireLocalAdmin(user: LocalUser | null) {
  return user?.role === 'admin';
}

function officialAssetsForAdmin(db: LocalDb): AdminAssetRow[] {
  const overrides = new Map((db.assets ?? []).map((asset) => [asset.id, asset]));
  const official = pricedDottiAssets.map((asset) => ({
    id: asset.id,
    name: asset.name,
    category: asset.category,
    imageUrl: asset.imageUrl,
    source: asset.source ?? (asset.isVIP ? 'premium' : 'dotti'),
    isVIP: Boolean(asset.isVIP),
    productionPrice: asset.productionPrice ?? (asset.isVIP ? db.pricing!.premiumDecoration : db.pricing!.standardDecoration),
    colorEditable: Boolean(asset.colorEditable),
    active: true,
    ...overrides.get(asset.id),
  }));
  const custom = (db.assets ?? []).filter((asset) => !pricedDottiAssets.some((item) => item.id === asset.id));
  return [...official, ...custom];
}

function buildAdminDashboard(db: LocalDb): AdminDashboardData {
  const paidOrders = db.orders.filter((item) => item.order.paymentStatus === 'Paid');
  const users = db.users.map((user) => {
    const userOrders = db.orders.filter((order) => order.userId === user.id);
    return {
      ...userFromLocal(user),
      designCount: db.designs.filter((design) => design.userId === user.id).length,
      uploadCount: db.uploads.filter((upload) => upload.userId === user.id).length,
      orderCount: userOrders.length,
      totalSpending: userOrders
        .filter((order) => order.order.paymentStatus === 'Paid')
        .reduce((sum, order) => sum + order.order.total, 0),
    };
  });
  const orders = db.orders
    .map((record) => {
      const customer = db.users.find((user) => user.id === record.userId);
      return {
        ...record.order,
        customerName: customer?.name ?? 'Unknown customer',
        customerEmail: customer?.email ?? '',
        customerPhone: customer?.phone ?? '',
      };
    })
    .sort((a, b) => b.orderDate.localeCompare(a.orderDate));
  const designs = db.designs
    .map((record) => {
      const creator = db.users.find((user) => user.id === record.userId);
      return {
        id: record.id,
        name: record.name,
        userId: record.userId,
        creatorName: creator?.name ?? 'Unknown creator',
        creatorEmail: creator?.email ?? '',
        design: record.design,
        previewImage: record.design.previewImage,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        ordered: db.orders.some((order) => order.order.items.some((item) => item.designId === record.id)),
      };
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return {
    stats: {
      totalUsers: db.users.length,
      activeVipMembers: db.users.filter((user) => user.role === 'vip' && user.membershipStatus === 'Active').length,
      totalOrders: db.orders.length,
      paidOrders: paidOrders.length,
      pendingOrders: db.orders.filter((item) => item.order.paymentStatus === 'Pending').length,
      makingOrders: db.orders.filter((item) => item.order.orderStatus === 'Making').length,
      totalSales: paidOrders.reduce((sum, item) => sum + item.order.total, 0),
      totalSavedDesigns: db.designs.length,
    },
    users,
    orders,
    designs,
    assets: officialAssetsForAdmin(db),
    pricing: db.pricing ?? defaultPricingConfig,
    products: db.products ?? seedProducts,
    memberships: users.filter((user) => user.role === 'vip' || user.role === 'admin' || user.membershipStatus !== 'None'),
  };
}

function json(data: unknown, init: ResponseInit = {}) {
  return NextResponse.json(data, init);
}

function isSecureRequest(request: NextRequest) {
  return request.nextUrl.protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https';
}

function setSessionCookie(request: NextRequest, response: NextResponse, token: string) {
  response.cookies.set(sessionCookie, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureRequest(request),
    path: '/',
    maxAge: sessionMaxAge,
  });
  return response;
}

function clearSessionCookie(request: NextRequest, response: NextResponse) {
  response.cookies.set(sessionCookie, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureRequest(request),
    path: '/',
    maxAge: 0,
  });
  return response;
}

function parseDataImage(imageUrl: string) {
  const match = imageUrl.match(/^data:(image\/(?:png|jpe?g|webp));base64,(.+)$/i);
  if (!match) return { error: 'Please upload a PNG, JPG, JPEG, or WebP image.' } as const;
  const bytes = Buffer.from(match[2], 'base64');
  if (!bytes.length) return { error: 'The image file is empty.' } as const;
  if (bytes.byteLength > 2_000_000) return { error: 'Please choose an image under 2 MB.' } as const;
  return { contentType: match[1].toLowerCase(), bytes } as const;
}

async function currentLocalUser(request: NextRequest, db: LocalDb) {
  const token = request.cookies.get(sessionCookie)?.value;
  if (!token) return null;
  const session = db.sessions.find((item) => item.token === token);
  if (!session || new Date(session.expiresAt).getTime() <= Date.now()) return null;
  const user = db.users.find((item) => item.id === session.userId);
  return user ?? null;
}

async function requireLocalUser(request: NextRequest, db: LocalDb) {
  const user = await currentLocalUser(request, db);
  if (!user) return null;
  return user;
}

function uploadFromLocal(upload: LocalUpload): DottiAsset {
  return {
    id: upload.id,
    ownerId: upload.userId,
    name: upload.name,
    category: 'Shapes',
    imageUrl: upload.imageUrl,
    isVIP: true,
    productionPrice: 30,
    source: 'upload',
  };
}

function validateDesignPermission(db: LocalDb, user: LocalUser, design: DesignState) {
  const usesVipFeature =
    !!design.customBaseUrl ||
    design.background?.type === 'upload' ||
    design.elements.some((element) => element.source === 'premium' || element.source === 'upload' || element.productionPrice > 8);
  if (usesVipFeature && !canUseVipFeatures(user)) return 'VIP membership is required for premium assets and personal uploads.';

  const uploadedAssetIds = design.elements.filter((element) => element.source === 'upload').map((element) => element.assetId);
  for (const assetId of uploadedAssetIds) {
    if (!db.uploads.some((upload) => upload.id === assetId && upload.userId === user.id)) {
      return 'This uploaded asset does not belong to the current user.';
    }
  }
  return null;
}

export async function handleLocalDottiPost(request: NextRequest, body: ActionRequest) {
  const db = await readDb();
  const now = new Date().toISOString();

  if (body.action === 'register') {
    const name = String(body.name ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    const confirmPassword = String(body.confirmPassword ?? '');
    if (!name) return json({ error: 'Please enter a display name.' }, { status: 400 });
    if (!validateEmail(email)) return json({ error: 'Please enter a valid email address.' }, { status: 400 });
    if (password.length < 8) return json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    if (password !== confirmPassword) return json({ error: 'Passwords do not match.' }, { status: 400 });
    if (db.users.some((user) => user.email === email)) return json({ error: 'This email is already registered.' }, { status: 409 });

    const passwordRecord = hashPassword(password);
    const isAdminTest = email === 'admin@felti.test' || email === 'admin@dotti.test';
    const isVipTest = email === 'vip@felti.test' || email === 'vip@dotti.test';
    const user: LocalUser = {
      id: crypto.randomUUID(),
      email,
      name,
      passwordHash: passwordRecord.hash,
      passwordSalt: passwordRecord.salt,
      role: isAdminTest ? 'admin' : isVipTest ? 'vip' : 'registered',
      membershipStatus: isVipTest || isAdminTest ? 'Active' : 'None',
      avatarUrl: null,
      phone: '',
      birthday: '',
      bio: '',
      shippingAddress: {},
      createdAt: now,
      updatedAt: now,
    };
    const token = randomBytes(32).toString('hex');
    db.users.push(user);
    db.sessions.push({ token, userId: user.id, expiresAt: new Date(Date.now() + sessionMaxAge * 1000).toISOString() });
    await writeDb(db);
    return setSessionCookie(request, json({ user: userFromLocal(user) }), token);
  }

  if (body.action === 'login') {
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    const user = db.users.find((item) => item.email === email);
    if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
      return json({ error: 'Incorrect email or password.' }, { status: 401 });
    }
    const token = randomBytes(32).toString('hex');
    db.sessions = db.sessions.filter((session) => new Date(session.expiresAt).getTime() > Date.now());
    db.sessions.push({ token, userId: user.id, expiresAt: new Date(Date.now() + sessionMaxAge * 1000).toISOString() });
    await writeDb(db);
    return setSessionCookie(request, json({ user: userFromLocal(user) }), token);
  }

  if (body.action === 'resetPassword') {
    return json({ ok: true });
  }

  if (body.action === 'logout') {
    const token = request.cookies.get(sessionCookie)?.value;
    if (token) {
      db.sessions = db.sessions.filter((session) => session.token !== token);
      await writeDb(db);
    }
    return clearSessionCookie(request, json({ ok: true }));
  }

  if (body.action === 'me') {
    const user = await currentLocalUser(request, db);
    return json({ user: user ? userFromLocal(user) : null });
  }

  if (body.action === 'getPricing') return json({ pricing: db.pricing ?? defaultPricingConfig });

  if (body.action === 'listProducts') {
    return json({ products: (db.products ?? seedProducts).filter((product) => product.active) });
  }

  if (body.action === 'listOfficialAssets') {
    return json({ assets: officialAssetsForAdmin(db).filter((asset) => asset.active) });
  }

  const user = await requireLocalUser(request, db);
  if (!user) return json({ error: 'Please log in or sign up to continue.' }, { status: 401 });

  if (String(body.action).startsWith('admin')) {
    if (!requireLocalAdmin(user)) return json({ error: 'Admin access required.' }, { status: 403 });

    if (body.action === 'adminDashboard') return json({ admin: buildAdminDashboard(db) });

    if (body.action === 'adminGetOrder') {
      const order = buildAdminDashboard(db).orders.find((item) => item.id === String(body.orderId));
      return order ? json({ order }) : json({ error: 'Order not found.' }, { status: 404 });
    }

    if (body.action === 'adminUpdateOrder') {
      const order = db.orders.find((item) => item.id === String(body.orderId));
      if (!order) return json({ error: 'Order not found.' }, { status: 404 });
      const paymentStatus = body.paymentStatus as PaymentStatus | undefined;
      const orderStatus = body.orderStatus as Order['orderStatus'] | undefined;
      if (paymentStatus) order.order.paymentStatus = paymentStatus;
      if (orderStatus) order.order.orderStatus = orderStatus;
      order.order.trackingCompany = String(body.trackingCompany ?? order.order.trackingCompany ?? '');
      order.order.trackingNumber = String(body.trackingNumber ?? order.order.trackingNumber ?? '');
      await writeDb(db);
      return json({ order: buildAdminDashboard(db).orders.find((item) => item.id === order.order.id) });
    }

    if (body.action === 'adminUpdateUser') {
      const target = db.users.find((item) => item.id === String(body.userId));
      if (!target) return json({ error: 'User not found.' }, { status: 404 });
      if (body.role) target.role = body.role as LocalUser['role'];
      if (body.membershipStatus) target.membershipStatus = body.membershipStatus as LocalUser['membershipStatus'];
      if (body.subscriptionStart !== undefined) target.subscriptionStart = String(body.subscriptionStart || '');
      if (body.subscriptionEnd !== undefined) target.subscriptionEnd = String(body.subscriptionEnd || '');
      target.updatedAt = now;
      await writeDb(db);
      return json({ admin: buildAdminDashboard(db) });
    }

    if (body.action === 'adminUpdatePricing') {
      db.pricing = body.pricing as PricingConfig;
      await writeDb(db);
      return json({ pricing: db.pricing });
    }

    if (body.action === 'adminSaveProduct') {
      const product = body.product as Product;
      const products = db.products ?? seedProducts;
      const index = products.findIndex((item) => item.id === product.id);
      if (index >= 0) products[index] = product;
      else products.push({ ...product, id: product.id || crypto.randomUUID() });
      db.products = products;
      await writeDb(db);
      return json({ products: db.products });
    }

    if (body.action === 'adminDeleteProduct') {
      const productId = String(body.productId ?? '');
      db.products = (db.products ?? seedProducts).filter((product) => product.id !== productId);
      await writeDb(db);
      return json({ products: db.products });
    }

    if (body.action === 'adminSaveAsset') {
      const input = body.asset as AdminAssetRow;
      const assets = db.assets ?? [];
      const asset: AdminAssetRow = {
        id: input.id || crypto.randomUUID(),
        name: input.name || 'Felti Asset',
        category: input.category || 'Shapes',
        imageUrl: input.imageUrl || '',
        source: input.isVIP ? 'premium' : 'dotti',
        isVIP: Boolean(input.isVIP),
        productionPrice: Number(input.productionPrice || db.pricing?.standardDecoration || 8),
        colorEditable: Boolean(input.colorEditable),
        active: input.active !== false,
      };
      const index = assets.findIndex((item) => item.id === asset.id);
      if (index >= 0) assets[index] = asset;
      else assets.push(asset);
      db.assets = assets;
      await writeDb(db);
      return json({ assets: officialAssetsForAdmin(db) });
    }
  }

  if (body.action === 'updateProfile') {
    const profile = body.profile as Partial<DottiUser> | undefined;
    let avatarUrl = profile?.avatarUrl ? String(profile.avatarUrl) : user.avatarUrl;
    if (avatarUrl?.startsWith('data:')) {
      const image = parseDataImage(avatarUrl);
      if ('error' in image) return json({ error: image.error }, { status: 400 });
      const upload: LocalUpload = {
        id: crypto.randomUUID(),
        userId: user.id,
        name: 'Avatar',
        kind: 'avatar',
        imageUrl: avatarUrl,
        contentType: image.contentType,
        size: image.bytes.byteLength,
        createdAt: now,
      };
      db.uploads.push(upload);
    }
    user.name = String(profile?.name ?? user.name).trim();
    user.phone = String(profile?.phone ?? '');
    user.birthday = String(profile?.birthday ?? '');
    user.bio = String(profile?.bio ?? '');
    user.avatarUrl = avatarUrl ?? null;
    user.shippingAddress = profile?.shippingAddress ?? {};
    user.updatedAt = now;
    await writeDb(db);
    return json({ user: userFromLocal(user) });
  }

  if (body.action === 'upgradeVip') {
    return json({ error: 'VIP membership is activated after payment.' }, { status: 400 });
  }

  if (body.action === 'createVipOrder') {
    if (user.role === 'vip' && user.membershipStatus === 'Active') {
      return json({ error: 'Your Felti VIP membership is already active.' }, { status: 400 });
    }
    const total = db.pricing?.vipMonthly ?? defaultPricingConfig.vipMonthly;
    const order: Order = {
      id: crypto.randomUUID(),
      orderNumber: `FELTI-VIP-${Date.now().toString().slice(-8)}`,
      orderDate: now.slice(0, 10),
      items: [
        {
          id: crypto.randomUUID(),
          itemType: 'membership',
          productId: 'felti-vip-monthly',
          productName: 'Felti VIP Monthly',
          price: total,
          quantity: 1,
        },
      ],
      shippingAddress: { ...emptyShippingAddress, fullName: user.name, email: user.email, phone: user.phone },
      subtotal: total,
      shippingFee: 0,
      discount: 0,
      vipDiscount: 0,
      total,
      paymentStatus: 'Pending',
      orderStatus: 'Pending',
    };
    db.orders.push({ id: order.id, userId: user.id, order });
    await writeDb(db);
    return json({ order });
  }

  if (body.action === 'listDesigns') {
    return json({ designs: db.designs.filter((design) => design.userId === user.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map((design) => design.design) });
  }

  if (body.action === 'saveDesign') {
    const input = body.design as DesignState;
    const permissionError = validateDesignPermission(db, user, input);
    if (permissionError) return json({ error: permissionError }, { status: 403 });
    const design: DesignState = {
      ...input,
      id: input.id || crypto.randomUUID(),
      userId: user.id,
      baseSize: input.baseSize ?? 'M',
      previewImage: input.previewImage ?? null,
      createdDate: input.createdDate ?? now,
      updatedDate: now,
    };
    const index = db.designs.findIndex((item) => item.id === design.id && item.userId === user.id);
    const record = { id: design.id!, userId: user.id, name: design.name, design, createdAt: design.createdDate!, updatedAt: now };
    if (index >= 0) db.designs[index] = record;
    else db.designs.push(record);
    await writeDb(db);
    return json({ design });
  }

  if (body.action === 'getDesign') {
    const design = db.designs.find((item) => item.id === String(body.id) && item.userId === user.id);
    return design ? json({ design: design.design }) : json({ error: 'Design not found.' }, { status: 404 });
  }

  if (body.action === 'deleteDesign') {
    db.designs = db.designs.filter((item) => !(item.id === String(body.id) && item.userId === user.id));
    await writeDb(db);
    return json({ ok: true });
  }

  if (body.action === 'duplicateDesign') {
    const existing = db.designs.find((item) => item.id === String(body.id) && item.userId === user.id);
    if (!existing) return json({ error: 'Design not found.' }, { status: 404 });
    const copy: DesignState = { ...existing.design, id: crypto.randomUUID(), name: `${existing.design.name} Copy`, createdDate: now, updatedDate: now };
    db.designs.push({ id: copy.id!, userId: user.id, name: copy.name, design: copy, createdAt: now, updatedAt: now });
    await writeDb(db);
    return json({ design: copy });
  }

  if (body.action === 'listUploads') {
    if (!canUseVipFeatures(user)) return json({ error: 'VIP membership is required.' }, { status: 403 });
    return json({ uploads: db.uploads.filter((upload) => upload.userId === user.id && upload.kind === 'decoration').sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(uploadFromLocal) });
  }

  if (body.action === 'deleteUpload') {
    if (!canUseVipFeatures(user)) return json({ error: 'VIP membership is required.' }, { status: 403 });
    const uploadId = String(body.id ?? '');
    const upload = db.uploads.find((item) => item.id === uploadId && item.userId === user.id && item.kind === 'decoration');
    if (!upload) return json({ error: 'Upload not found.' }, { status: 404 });
    db.uploads = db.uploads.filter((item) => item.id !== uploadId);
    await writeDb(db);
    return json({ ok: true });
  }

  if (body.action === 'uploadAsset' || body.action === 'uploadBase' || body.action === 'uploadBackground') {
    if (!canUseVipFeatures(user)) return json({ error: 'VIP membership is required.' }, { status: 403 });
    const imageUrl = String(body.imageUrl ?? '');
    const image = parseDataImage(imageUrl);
    if ('error' in image) return json({ error: image.error }, { status: 400 });
    const kind = body.action === 'uploadBase' ? 'base' : body.action === 'uploadBackground' ? 'background' : 'decoration';
    const upload: LocalUpload = {
      id: crypto.randomUUID(),
      userId: user.id,
      name: String(body.name ?? 'My Upload').trim() || 'My Upload',
      kind,
      imageUrl,
      contentType: image.contentType,
      size: image.bytes.byteLength,
      createdAt: now,
    };
    db.uploads.push(upload);
    await writeDb(db);
    return json({ upload: uploadFromLocal(upload) });
  }

  if (body.action === 'getCart') {
    return json({ items: db.cartItems.filter((item) => item.userId === user.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map((item) => item.item) });
  }

  if (body.action === 'addCart') {
    const input = body.item as CartItem;
    if (input.designSnapshot) {
      const permissionError = validateDesignPermission(db, user, input.designSnapshot as DesignState);
      if (permissionError) return json({ error: permissionError }, { status: 403 });
    }
    const item = { ...input, id: input.id || crypto.randomUUID() };
    db.cartItems.push({ id: item.id, userId: user.id, item, createdAt: now });
    await writeDb(db);
    return json({ item });
  }

  if (body.action === 'updateCart') {
    const items = ((body.items as CartItem[]) ?? []).map((item) => ({ ...item, id: item.id || crypto.randomUUID() }));
    db.cartItems = db.cartItems.filter((item) => item.userId !== user.id);
    db.cartItems.push(...items.map((item) => ({ id: item.id, userId: user.id, item, createdAt: now })));
    await writeDb(db);
    return json({ items });
  }

  if (body.action === 'checkout') {
    const items = db.cartItems.filter((item) => item.userId === user.id).map((item) => item.item);
    if (!items.length) return json({ error: 'Your cart is empty.' }, { status: 400 });
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingFee = subtotal > 1000 ? 0 : 60;
    const order: Order = {
      id: crypto.randomUUID(),
      orderNumber: `FELTI-${Date.now().toString().slice(-8)}`,
      orderDate: now.slice(0, 10),
      items,
      shippingAddress: body.address as ShippingAddress,
      subtotal,
      shippingFee,
      discount: 0,
      vipDiscount: 0,
      total: subtotal + shippingFee,
      paymentStatus: 'Pending',
      orderStatus: 'Pending',
    };
    db.orders.push({ id: order.id, userId: user.id, order });
    await writeDb(db);
    return json({ order });
  }

  if (body.action === 'pay') {
    const order = db.orders.find((item) => item.id === String(body.orderId) && item.userId === user.id);
    if (!order) return json({ error: 'Order not found.' }, { status: 404 });
    if (order.order.paymentStatus !== 'Paid') {
      order.order.paymentStatus = 'Paid';
      order.order.orderStatus = 'Confirmed';
      if (isVipMembershipOrder(order.order)) {
        activateLocalVip(user, now);
      }
      db.cartItems = db.cartItems.filter((item) => item.userId !== user.id);
      await writeDb(db);
    }
    return json({ order: order.order });
  }

  if (body.action === 'listOrders') {
    return json({ orders: db.orders.filter((order) => order.userId === user.id).map((order) => order.order) });
  }

  if (body.action === 'getOrder') {
    const order = db.orders.find((item) => item.id === String(body.id) && item.userId === user.id);
    return order ? json({ order: order.order }) : json({ error: 'Order not found.' }, { status: 404 });
  }

  if (body.action === 'priceDesign') return json({ price: calculateDesignPrice(body.design as DesignState, db.pricing ?? defaultPricingConfig) });

  return json({ error: 'Unknown Felti action.' }, { status: 400 });
}
