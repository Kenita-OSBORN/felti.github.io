'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Eye, PackageCheck, Save, Search, ShieldCheck } from 'lucide-react';

import { ProductArt } from '@/components/common/product-art';
import { PageShell } from '@/components/common/page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { dottiApi, fileToDataUrl } from '@/lib/dotti-api';
import { defaultPricingConfig } from '@/lib/pricing';
import type { AdminAssetRow, AdminDashboardData, AdminDesignRow, DottiUser, PricingConfig, Product } from '@/types/commerce';
import type { DesignState } from '@/types/dotti';

const sections = ['Dashboard', 'Users', 'Orders', 'Designs', 'DIY Assets', 'Products', 'Pricing', 'Settings'];
const userFilters = ['All', 'Free Users', 'VIP Users', 'Admin'];
const orderFilters = ['All', 'Pending Payment', 'Paid', 'Making', 'Ready', 'Shipped', 'Delivered', 'Cancelled'];

const emptyProduct: Product = {
  id: '',
  name: '',
  description: '',
  price: 0,
  stock: 0,
  category: 'Brooches',
  material: 'Wool felt',
  active: true,
  assetIds: [],
};

const emptyAsset: AdminAssetRow = {
  id: '',
  name: '',
  category: 'Shapes',
  imageUrl: '',
  source: 'dotti',
  isVIP: false,
  productionPrice: 8,
  colorEditable: false,
  active: true,
};

function statusClass(status: string) {
  if (['Paid', 'Delivered', 'Ready'].includes(status)) return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  if (['Making', 'Confirmed', 'Shipped'].includes(status)) return 'bg-blue-50 text-blue-700 ring-blue-200';
  if (['Failed', 'Cancelled', 'Refunded'].includes(status)) return 'bg-red-50 text-red-700 ring-red-200';
  return 'bg-amber-50 text-amber-700 ring-amber-200';
}

function Badge({ children }: { children: string }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${statusClass(children)}`}>{children}</span>;
}

function pricingFormNumbers(pricing: PricingConfig): PricingConfig {
  return {
    base: { S: Number(pricing.base.S), M: Number(pricing.base.M), L: Number(pricing.base.L) },
    standardDecoration: Number(pricing.standardDecoration),
    premiumDecoration: Number(pricing.premiumDecoration),
    customDecoration: Number(pricing.customDecoration),
    customBase: Number(pricing.customBase),
    detachableDecoration: Number(pricing.detachableDecoration ?? 2),
    vipMonthly: Number(pricing.vipMonthly),
  };
}

export default function AdminPage() {
  const [user, setUser] = useState<DottiUser | null>(null);
  const [admin, setAdmin] = useState<AdminDashboardData | null>(null);
  const [active, setActive] = useState('Dashboard');
  const [query, setQuery] = useState('');
  const [userFilter, setUserFilter] = useState('All');
  const [orderFilter, setOrderFilter] = useState('All');
  const [hoverOrder, setHoverOrder] = useState<AdminDashboardData['orders'][number] | null>(null);
  const [hoverPoint, setHoverPoint] = useState({ x: 0, y: 0 });
  const [selectedDesign, setSelectedDesign] = useState<AdminDesignRow | null>(null);
  const [pricing, setPricing] = useState<PricingConfig>(defaultPricingConfig);
  const [productForm, setProductForm] = useState<Product>(emptyProduct);
  const [assetForm, setAssetForm] = useState<AdminAssetRow>(emptyAsset);
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState('');

  const refresh = async () => {
    const [{ user }, { admin }] = await Promise.all([dottiApi.me(), dottiApi.adminDashboard()]);
    setUser(user);
    setAdmin(admin);
    setPricing(admin.pricing);
    setAccessError('');
  };

  useEffect(() => {
    refresh()
      .catch(() => {
        setAdmin(null);
        setAccessError('Admin access required');
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = useMemo(() => {
    const text = query.toLowerCase();
    return (admin?.users ?? []).filter((item) => {
      const matchesText = item.name.toLowerCase().includes(text) || item.email.toLowerCase().includes(text);
      const matchesFilter =
        userFilter === 'All' ||
        (userFilter === 'Free Users' && item.role === 'registered') ||
        (userFilter === 'VIP Users' && item.role === 'vip') ||
        (userFilter === 'Admin' && item.role === 'admin');
      return matchesText && matchesFilter;
    });
  }, [admin, query, userFilter]);

  const filteredOrders = useMemo(() => {
    const text = query.toLowerCase();
    return (admin?.orders ?? []).filter((order) => {
      const matchesText =
        order.orderNumber.toLowerCase().includes(text) ||
        order.customerName.toLowerCase().includes(text) ||
        order.customerEmail.toLowerCase().includes(text);
      const matchesFilter =
        orderFilter === 'All' ||
        (orderFilter === 'Pending Payment' && order.paymentStatus === 'Pending') ||
        order.paymentStatus === orderFilter ||
        order.orderStatus === orderFilter;
      return matchesText && matchesFilter;
    });
  }, [admin, orderFilter, query]);

  const savePricing = async () => {
    setFormError('');
    setMessage('');
    try {
      const { pricing: savedPricing } = await dottiApi.adminUpdatePricing(pricingFormNumbers(pricing));
      setPricing(savedPricing);
      setMessage('Pricing saved. DIY pricing will use this configuration.');
      await refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Pricing could not be saved.');
    }
  };

  const saveProduct = async () => {
    setFormError('');
    setMessage('');
    try {
      await dottiApi.adminSaveProduct({ ...productForm, id: productForm.id || crypto.randomUUID(), price: Number(productForm.price), stock: Number(productForm.stock) });
      setProductForm(emptyProduct);
      setMessage('Product saved.');
      await refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Product could not be saved.');
    }
  };

  const saveAsset = async () => {
    setFormError('');
    setMessage('');
    try {
      await dottiApi.adminSaveAsset({ ...assetForm, id: assetForm.id || crypto.randomUUID(), productionPrice: Number(assetForm.productionPrice) });
      setAssetForm(emptyAsset);
      setMessage('DIY asset saved.');
      await refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'DIY asset could not be saved.');
    }
  };

  const updateUser = async (target: AdminDashboardData['users'][number], patch: Partial<DottiUser>) => {
    setFormError('');
    setMessage('');
    try {
      await dottiApi.adminUpdateUser({ userId: target.id, ...patch });
      setMessage('User membership updated.');
      await refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'User could not be updated.');
    }
  };

  if (loading) {
    return (
      <PageShell title="Admin Dashboard" eyebrow="Felti Admin">
        <div className="mt-8 rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-[var(--dotti-border)]">
          <div className="h-10 w-10 rounded-full bg-[var(--dotti-blush)]" />
          <div className="mt-5 h-8 w-60 rounded-full bg-[var(--dotti-bg)]" />
          <div className="mt-3 h-4 w-80 max-w-full rounded-full bg-[var(--dotti-bg)]" />
        </div>
      </PageShell>
    );
  }

  if (!admin) {
    return (
      <PageShell title="Admin Dashboard" eyebrow="Felti Admin">
        <div className="mt-8 rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-[var(--dotti-border)]">
          <ShieldCheck className="size-10 text-[var(--dotti-berry)]" />
          <h2 className="mt-4 text-2xl font-black">{accessError || 'Admin access required'}</h2>
          <p className="mt-2 text-[var(--dotti-muted)]">Log in with an admin Felti account to manage users, orders, pricing, and assets.</p>
          <Button render={<a href="/login?returnTo=/admin" />} className="mt-5 rounded-full bg-[var(--dotti-berry)] text-white">Log in as Admin</Button>
        </div>
      </PageShell>
    );
  }

  const stats = [
    ['Total Registered Users', admin.stats.totalUsers],
    ['Active VIP Members', admin.stats.activeVipMembers],
    ['Total Orders', admin.stats.totalOrders],
    ['Paid Orders', admin.stats.paidOrders],
    ['Pending Orders', admin.stats.pendingOrders],
    ['Orders Making', admin.stats.makingOrders],
    ['Total Sales', `฿${admin.stats.totalSales.toFixed(0)}`],
    ['Saved Designs', admin.stats.totalSavedDesigns],
  ];

  return (
    <PageShell title="Admin Dashboard" eyebrow={`Felti Admin${user ? ` · ${user.email}` : ''}`}>
      <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-[28px] bg-[var(--dotti-ink)] p-3 text-white shadow-[var(--dotti-shadow)]">
          {sections.map((section) => (
            <button key={section} onClick={() => { setActive(section); setMessage(''); setFormError(''); }} className={`mb-2 flex w-full items-center rounded-full px-4 py-3 text-left text-sm font-black ${active === section ? 'bg-white text-[var(--dotti-ink)]' : 'text-white/72 hover:bg-white/10'}`}>
              {section}
            </button>
          ))}
        </aside>

        <section className="min-w-0 rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-[var(--dotti-border)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-black">{active}</h2>
            {['Users', 'Orders', 'Designs', 'DIY Assets', 'Products'].includes(active) && (
              <label className="relative min-w-[260px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--dotti-muted)]" />
                <Input className="rounded-full pl-9" placeholder="Search admin data" value={query} onChange={(event) => setQuery(event.target.value)} />
              </label>
            )}
          </div>
          {message && <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{message}</p>}
          {formError && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{formError}</p>}

          {active === 'Dashboard' && (
            <div className="mt-5 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map(([label, value]) => (
                  <div key={label} className="rounded-[22px] bg-[var(--dotti-bg)] p-5 ring-1 ring-[var(--dotti-border)]">
                    <p className="text-xs font-black uppercase text-[var(--dotti-muted)]">{label}</p>
                    <p className="mt-2 text-3xl font-black">{value}</p>
                  </div>
                ))}
              </div>
              <div className="grid gap-5 xl:grid-cols-2">
                <AdminTable title="Recent Orders" headers={['Order', 'Customer', 'Total', 'Status', '']}>
                  {admin.orders.slice(0, 6).map((order) => (
                    <tr key={order.id}>
                      <td>{order.orderNumber}</td><td>{order.customerName}</td><td>฿{order.total.toFixed(0)}</td><td><Badge>{order.orderStatus}</Badge></td>
                      <td><Button size="sm" variant="outline" render={<a href={`/admin/orders/${order.id}`} />} className="rounded-full bg-white">View</Button></td>
                    </tr>
                  ))}
                </AdminTable>
                <AdminTable title="Recent Users" headers={['User', 'Email', 'Membership', 'Orders']}>
                  {admin.users.slice(0, 6).map((item) => (
                    <tr key={item.id}><td>{item.name}</td><td>{item.email}</td><td>{item.role}</td><td>{item.orderCount}</td></tr>
                  ))}
                </AdminTable>
              </div>
            </div>
          )}

          {active === 'Users' && (
            <div className="mt-5 space-y-4">
              <FilterBar values={userFilters} value={userFilter} onChange={setUserFilter} />
              <AdminTable title="Registered Users" headers={['User', 'Email', 'Password', 'Joined', 'Role', 'Membership', 'Designs', 'Orders', 'Spending', 'Action']}>
                {filteredUsers.map((item) => (
                  <tr key={item.id}>
                    <td className="font-bold">{item.name}</td><td>{item.email}</td><td><Badge>Protected</Badge></td><td>{item.memberSince}</td><td>{item.role}</td><td>{item.membershipStatus}</td><td>{item.designCount}</td><td>{item.orderCount}</td><td>฿{item.totalSpending.toFixed(0)}</td>
                    <td><Button size="sm" variant="outline" className="rounded-full bg-white" onClick={() => void updateUser(item, { role: item.role === 'vip' ? 'registered' : 'vip', membershipStatus: item.role === 'vip' ? 'None' : 'Active' })}>{item.role === 'vip' ? 'Set Free' : 'Set VIP'}</Button></td>
                  </tr>
                ))}
              </AdminTable>
            </div>
          )}

          {active === 'Orders' && (
            <div className="relative mt-5 space-y-4">
              <FilterBar values={orderFilters} value={orderFilter} onChange={setOrderFilter} />
              <AdminTable title="Customer Orders" headers={['Order', 'Customer', 'Date', 'Items', 'Total', 'Payment', 'Order', '']}>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.orderNumber}</td><td>{order.customerName}<span className="block text-xs text-[var(--dotti-muted)]">{order.customerEmail}</span></td><td>{order.orderDate}</td><td>{order.items.length}</td><td>฿{order.total.toFixed(0)}</td><td><Badge>{order.paymentStatus}</Badge></td><td><Badge>{order.orderStatus}</Badge></td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline"
                        render={<a href={`/admin/orders/${order.id}`} />}
                        className="rounded-full bg-white"
                        onMouseEnter={(event) => {
                          setHoverOrder(order);
                          setHoverPoint({ x: event.clientX, y: event.clientY });
                        }}
                        onMouseMove={(event) => setHoverPoint({ x: event.clientX, y: event.clientY })}
                        onMouseLeave={() => setHoverOrder(null)}
                      >
                        <Eye className="size-4" /> View
                      </Button>
                    </td>
                  </tr>
                ))}
              </AdminTable>
              <OrderHoverCard order={hoverOrder} point={hoverPoint} />
            </div>
          )}

          {active === 'Designs' && (
            <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_380px]">
              <AdminTable title="Saved Designs" headers={['Preview', 'Name', 'Creator', 'Updated', 'Ordered', '']}>
                {admin.designs.filter((design) => design.name.toLowerCase().includes(query.toLowerCase()) || design.creatorEmail.toLowerCase().includes(query.toLowerCase())).map((design) => (
                  <tr key={design.id}>
                    <td>{design.previewImage ? <img src={design.previewImage} alt="" className="size-14 rounded-xl object-cover" /> : 'No preview'}</td><td>{design.name}</td><td>{design.creatorName}<span className="block text-xs text-[var(--dotti-muted)]">{design.creatorEmail}</span></td><td>{design.updatedAt.slice(0, 10)}</td><td>{design.ordered ? 'Ordered' : 'Not ordered'}</td>
                    <td><Button size="sm" variant="outline" className="rounded-full bg-white" onClick={() => setSelectedDesign(design)}>View</Button></td>
                  </tr>
                ))}
              </AdminTable>
              <DesignDetail design={selectedDesign} />
            </div>
          )}

          {active === 'DIY Assets' && (
            <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
              <AdminTable title="Official DIY Assets" headers={['Preview', 'Asset', 'Category', 'Price', 'VIP', 'Color', 'Active', '']}>
                {admin.assets.filter((asset) => asset.name.toLowerCase().includes(query.toLowerCase()) || asset.category.toLowerCase().includes(query.toLowerCase())).map((asset) => (
                  <tr key={asset.id}>
                    <td>{asset.imageUrl ? <img src={asset.imageUrl} alt={asset.name} className="size-14 rounded-xl bg-[var(--dotti-bg)] p-2 object-contain" /> : 'No image'}</td><td>{asset.name}</td><td>{asset.category}</td><td>฿{asset.productionPrice}</td><td>{asset.isVIP ? 'VIP' : 'Free'}</td><td>{asset.colorEditable ? 'Yes' : 'No'}</td><td>{asset.active ? 'Active' : 'Inactive'}</td>
                    <td><Button size="sm" variant="outline" className="rounded-full bg-white" onClick={() => setAssetForm(asset)}>Edit</Button></td>
                  </tr>
                ))}
              </AdminTable>
              <AssetForm asset={assetForm} setAsset={setAssetForm} onSave={saveAsset} />
            </div>
          )}

          {active === 'Products' && (
            <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_380px]">
              <div className="space-y-3">
                {admin.products.filter((product) => product.name.toLowerCase().includes(query.toLowerCase()) || product.category.toLowerCase().includes(query.toLowerCase())).map((product) => (
                  <div key={product.id} className="grid gap-3 rounded-3xl bg-[var(--dotti-bg)] p-4 md:grid-cols-[80px_1fr_auto]">
                    <ProductArt assetIds={product.assetIds} imageUrl={product.imageUrl} alt={product.name} />
                    <div><b>{product.name}</b><p className="text-sm text-[var(--dotti-muted)]">฿{product.price} · Stock {product.stock} · {product.category} · {product.active ? 'Active' : 'Inactive'}</p></div>
                    <Button variant="outline" className="rounded-full bg-white" onClick={() => setProductForm(product)}>Edit</Button>
                  </div>
                ))}
              </div>
              <ProductForm product={productForm} setProduct={setProductForm} onSave={saveProduct} />
            </div>
          )}

          {active === 'Pricing' && <PricingForm pricing={pricing} setPricing={setPricing} onSave={savePricing} />}

          {active === 'Settings' && (
            <div className="mt-5 rounded-3xl bg-[var(--dotti-bg)] p-5">
              <PackageCheck className="size-8 text-[var(--dotti-berry)]" />
              <h3 className="mt-3 text-xl font-black">Secure Felti Admin</h3>
              <p className="mt-2 text-[var(--dotti-muted)]">Admin data is loaded through server-side role checks. Normal users receive a 403 response even if they enter the admin URL manually.</p>
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}

function FilterBar({ values, value, onChange }: { values: string[]; value: string; onChange: (value: string) => void }) {
  return <div className="flex flex-wrap gap-2">{values.map((item) => <button key={item} onClick={() => onChange(item)} className={`rounded-full px-4 py-2 text-sm font-black ${value === item ? 'bg-[var(--dotti-ink)] text-white' : 'bg-[var(--dotti-bg)] text-[var(--dotti-muted)]'}`}>{item}</button>)}</div>;
}

function AdminTable({ title, headers, children }: { title: string; headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[24px] ring-1 ring-[var(--dotti-border)]">
      <h3 className="bg-[var(--dotti-bg)] px-4 py-3 font-black">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-white text-xs uppercase text-[var(--dotti-muted)]">
            <tr>{headers.map((header) => <th key={header} className="px-4 py-3 font-black">{header}</th>)}</tr>
          </thead>
          <tbody className="[&_td]:border-t [&_td]:border-[var(--dotti-border)] [&_td]:px-4 [&_td]:py-3">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

function OrderHoverCard({ order, point }: { order: AdminDashboardData['orders'][number] | null; point: { x: number; y: number } }) {
  if (!order) return null;
  const preview = order.items.find((item) => item.previewImage)?.previewImage;
  const left = Math.min(point.x + 18, window.innerWidth - 340);
  const top = Math.min(point.y + 18, window.innerHeight - 300);
  return (
    <div
      className="pointer-events-none fixed z-[3000] w-[320px] rounded-[24px] border border-[var(--dotti-border)] bg-white p-4 text-sm shadow-2xl"
      style={{ left, top }}
    >
      <div className="flex gap-3">
        <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[var(--dotti-bg)]">
          {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : <span className="font-black text-[var(--dotti-berry)]">F</span>}
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-black">{order.orderNumber}</h3>
          <p className="mt-1 truncate text-[var(--dotti-muted)]">{order.customerName}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            <Badge>{order.paymentStatus}</Badge>
            <Badge>{order.orderStatus}</Badge>
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-[var(--dotti-bg)] p-3">
        <span className="text-[var(--dotti-muted)]">Items</span><b className="text-right">{order.items.length}</b>
        <span className="text-[var(--dotti-muted)]">Total</span><b className="text-right">฿{order.total.toFixed(0)}</b>
      </div>
      <p className="mt-3 text-xs font-bold text-[var(--dotti-muted)]">Click View to open the full order detail page.</p>
    </div>
  );
}

function DesignDetail({ design }: { design: AdminDesignRow | null }) {
  if (!design) return <div className="rounded-[24px] bg-[var(--dotti-bg)] p-5 text-[var(--dotti-muted)]">Select a design to inspect its saved state.</div>;
  const state = design.design as DesignState;
  return (
    <aside className="rounded-[24px] bg-[var(--dotti-bg)] p-5">
      <h3 className="text-xl font-black">{design.name}</h3>
      <p className="mt-1 text-sm text-[var(--dotti-muted)]">{design.creatorName} · {design.creatorEmail}</p>
      {design.previewImage && <img src={design.previewImage} alt="" className="mt-4 aspect-[4/3] w-full rounded-2xl object-cover" />}
      <p className="mt-4 text-sm text-[var(--dotti-muted)]">Base {state.baseShape} · Size {state.baseSize} · Background {state.background?.type}</p>
      <div className="mt-3 max-h-44 overflow-y-auto rounded-2xl bg-white p-3 text-sm">{state.elements.map((element) => <p key={element.id}>{element.assetName} · {element.source} {element.color ? `· ${element.color}` : ''}</p>)}</div>
    </aside>
  );
}

function PricingForm({ pricing, setPricing, onSave }: { pricing: PricingConfig; setPricing: (pricing: PricingConfig) => void; onSave: () => void }) {
  const fields: Array<[string, number, (value: number) => PricingConfig]> = [
    ['S · 5 cm Base', pricing.base.S, (value) => ({ ...pricing, base: { ...pricing.base, S: value } })],
    ['M · 7 cm Base', pricing.base.M, (value) => ({ ...pricing, base: { ...pricing.base, M: value } })],
    ['L · 9 cm Base', pricing.base.L, (value) => ({ ...pricing, base: { ...pricing.base, L: value } })],
    ['Standard Decoration', pricing.standardDecoration, (value) => ({ ...pricing, standardDecoration: value })],
    ['Premium Decoration', pricing.premiumDecoration, (value) => ({ ...pricing, premiumDecoration: value })],
    ['Custom Uploaded Decoration', pricing.customDecoration, (value) => ({ ...pricing, customDecoration: value })],
    ['Custom Uploaded Base', pricing.customBase, (value) => ({ ...pricing, customBase: value })],
    ['Detachable Decoration Velcro', pricing.detachableDecoration ?? 2, (value) => ({ ...pricing, detachableDecoration: value })],
    ['Felti VIP Monthly', pricing.vipMonthly, (value) => ({ ...pricing, vipMonthly: value })],
  ];
  return (
    <div className="mt-5 rounded-[24px] bg-[var(--dotti-bg)] p-5">
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map(([label, value, update]) => <label key={label} className="text-sm font-black">{label}<Input type="number" className="mt-2 rounded-full bg-white" value={value} onChange={(event) => setPricing(update(Number(event.target.value)))} /></label>)}
      </div>
      <Button onClick={onSave} className="mt-5 rounded-full bg-[var(--dotti-berry)] text-white"><Save className="size-4" /> Save Pricing</Button>
    </div>
  );
}

function ProductForm({ product, setProduct, onSave }: { product: Product; setProduct: (product: Product) => void; onSave: () => void }) {
  const upload = async (file: File | undefined) => {
    if (!file) return;
    setProduct({ ...product, imageUrl: await fileToDataUrl(file) });
  };
  return (
    <aside className="rounded-[24px] bg-[var(--dotti-bg)] p-5">
      <h3 className="text-xl font-black">{product.id ? 'Edit Product' : 'Add Product'}</h3>
      {product.imageUrl ? (
        <img src={product.imageUrl} alt="" className="mt-4 aspect-square w-full rounded-3xl bg-white object-cover" />
      ) : (
        <ProductArt assetIds={product.assetIds} className="mt-4" />
      )}
      <div className="mt-4 grid gap-3">
        <label className="text-sm font-black">Product Name<Input className="mt-2 rounded-full bg-white" placeholder="Blush Daisy Brooch" value={product.name} onChange={(event) => setProduct({ ...product, name: event.target.value })} /></label>
        <label className="text-sm font-black">Product Description<Textarea className="mt-2 rounded-3xl bg-white" placeholder="Short product information shown on the shop page" value={product.description} onChange={(event) => setProduct({ ...product, description: event.target.value })} /></label>
        <label className="cursor-pointer rounded-full bg-white px-4 py-2 text-sm font-black ring-1 ring-[var(--dotti-border)]">Product Image<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => void upload(event.target.files?.[0])} /></label>
        <label className="text-sm font-black">Category<Input className="mt-2 rounded-full bg-white" placeholder="Brooches" value={product.category} onChange={(event) => setProduct({ ...product, category: event.target.value })} /></label>
        <label className="text-sm font-black">Material<Input className="mt-2 rounded-full bg-white" placeholder="Wool felt" value={product.material} onChange={(event) => setProduct({ ...product, material: event.target.value })} /></label>
        <label className="text-sm font-black">DIY Asset IDs<Input className="mt-2 rounded-full bg-white" placeholder="daisy, soft-leaf" value={product.assetIds.join(', ')} onChange={(event) => setProduct({ ...product, assetIds: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} /></label>
        <label className="text-sm font-black">Price ฿<Input className="mt-2 rounded-full bg-white" type="number" placeholder="180" value={product.price} onChange={(event) => setProduct({ ...product, price: Number(event.target.value) })} /></label>
        <label className="text-sm font-black">Stock Quantity<Input className="mt-2 rounded-full bg-white" type="number" placeholder="20" value={product.stock} onChange={(event) => setProduct({ ...product, stock: Number(event.target.value) })} /></label>
        <label className="flex items-center gap-2 text-sm font-black"><input type="checkbox" checked={product.active} onChange={(event) => setProduct({ ...product, active: event.target.checked })} /> Active</label>
      </div>
      <Button onClick={onSave} className="mt-5 w-full rounded-full bg-[var(--dotti-berry)] text-white">Save Product</Button>
    </aside>
  );
}

function AssetForm({ asset, setAsset, onSave }: { asset: AdminAssetRow; setAsset: (asset: AdminAssetRow) => void; onSave: () => void }) {
  const upload = async (file: File | undefined) => {
    if (!file) return;
    setAsset({ ...asset, imageUrl: await fileToDataUrl(file) });
  };
  return (
    <aside className="rounded-[24px] bg-[var(--dotti-bg)] p-5">
      <h3 className="text-xl font-black">{asset.id ? 'Edit Asset' : 'Add Asset'}</h3>
      {asset.imageUrl && <img src={asset.imageUrl} alt="" className="mt-4 size-24 rounded-2xl bg-white p-2 object-contain" />}
      <div className="mt-4 grid gap-3">
        <label className="text-sm font-black">Asset Name<Input className="mt-2 rounded-full bg-white" placeholder="Daisy" value={asset.name} onChange={(event) => setAsset({ ...asset, name: event.target.value })} /></label>
        <label className="text-sm font-black">Category<Input className="mt-2 rounded-full bg-white" placeholder="Flowers" value={asset.category} onChange={(event) => setAsset({ ...asset, category: event.target.value })} /></label>
        <label className="text-sm font-black">Production Price ฿<Input type="number" className="mt-2 rounded-full bg-white" placeholder="8" value={asset.productionPrice} onChange={(event) => setAsset({ ...asset, productionPrice: Number(event.target.value) })} /></label>
        <label className="cursor-pointer rounded-full bg-white px-4 py-2 text-sm font-black ring-1 ring-[var(--dotti-border)]">Felt Asset Image<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => void upload(event.target.files?.[0])} /></label>
        <label className="flex items-center gap-2 text-sm font-black"><input type="checkbox" checked={asset.isVIP} onChange={(event) => setAsset({ ...asset, isVIP: event.target.checked, source: event.target.checked ? 'premium' : 'dotti' })} /> VIP only</label>
        <label className="flex items-center gap-2 text-sm font-black"><input type="checkbox" checked={asset.colorEditable} onChange={(event) => setAsset({ ...asset, colorEditable: event.target.checked })} /> Color editable</label>
        <label className="flex items-center gap-2 text-sm font-black"><input type="checkbox" checked={asset.active} onChange={(event) => setAsset({ ...asset, active: event.target.checked })} /> Active</label>
      </div>
      <Button onClick={onSave} className="mt-5 w-full rounded-full bg-[var(--dotti-berry)] text-white">Save Asset</Button>
    </aside>
  );
}
