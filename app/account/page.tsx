'use client';

import { useEffect, useState } from 'react';
import { Crown, Trash2 } from 'lucide-react';

import { PageShell } from '@/components/common/page-shell';
import { DesignThumbnail } from '@/components/diy/design-thumbnail';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { dottiApi, fileToDataUrl } from '@/lib/dotti-api';
import { calculateDesignPrice } from '@/lib/pricing';
import type { DottiUser, Order, ShippingAddress } from '@/types/commerce';
import type { DesignState, DottiAsset } from '@/types/dotti';

const menu = ['My Profile', 'My Designs', 'My Orders', 'My Uploads', 'VIP Membership', 'Addresses', 'Account Settings', 'Logout'];

const emptyAddress: ShippingAddress = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  district: '',
  province: '',
  postalCode: '',
  country: '',
};

export default function AccountPage() {
  const [user, setUser] = useState<DottiUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [designs, setDesigns] = useState<DesignState[]>([]);
  const [uploads, setUploads] = useState<DottiAsset[]>([]);
  const [active, setActive] = useState('My Profile');
  const [profile, setProfile] = useState<Partial<DottiUser>>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [joiningVip, setJoiningVip] = useState(false);

  const refresh = async () => {
    const { user } = await dottiApi.me();
    if (!user) {
      setUser(null);
      return;
    }
    setUser(user);
    setProfile(user);
    const [{ designs }, { orders }, uploadResult] = await Promise.all([
      dottiApi.listDesigns(),
      dottiApi.listOrders(),
      user.role === 'vip' ? dottiApi.listUploads() : Promise.resolve({ uploads: [] }),
    ]);
    setDesigns(designs);
    setOrders(orders);
    setUploads(uploadResult.uploads);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setActive(params.get('tab') || 'My Profile');
    refresh().catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    await dottiApi.logout();
    window.location.href = '/';
  };

  const saveProfile = async () => {
    setError('');
    const { user } = await dottiApi.updateProfile(profile);
    setUser(user);
    setProfile(user);
    setMessage('Profile saved.');
  };

  const joinVip = async () => {
    setError('');
    setMessage('');
    setJoiningVip(true);
    try {
      const result = await dottiApi.upgradeVip();
      if (result.user.role !== 'vip' || result.user.membershipStatus !== 'Active') {
        throw new Error('VIP membership could not be activated. Please try again.');
      }
      setUser(result.user);
      setProfile(result.user);
      await refresh();
      setMessage('Felti VIP is active.');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'VIP membership could not be activated. Please try again.');
    } finally {
      setJoiningVip(false);
    }
  };

  const uploadAvatar = async (file: File | undefined) => {
    if (!file) return;
    const avatarUrl = await fileToDataUrl(file);
    setProfile((current) => ({ ...current, avatarUrl }));
  };

  const duplicateDesign = async (designId: string) => {
    await dottiApi.duplicateDesign(designId);
    await refresh();
  };

  const deleteDesign = async (designId: string) => {
    if (!window.confirm('Delete this saved Felti design?')) return;
    await dottiApi.deleteDesign(designId);
    await refresh();
  };

  const deleteUpload = async (upload: DottiAsset) => {
    if (!window.confirm(`Delete "${upload.name}" from My Uploads?`)) return;
    await dottiApi.deleteUpload(upload.id);
    setUploads((current) => current.filter((item) => item.id !== upload.id));
  };

  const orderDesign = async (design: DesignState) => {
    const price = calculateDesignPrice(design);
    await dottiApi.addCart({
      designId: design.id,
      productName: design.name,
      price: price.total,
      quantity: 1,
      baseSize: price.baseSize,
      previewImage: design.previewImage,
      designSnapshot: { ...design },
    });
    window.location.href = '/cart';
  };

  if (loading) {
    return (
      <PageShell title="My Felti" eyebrow="Account">
        <div className="mt-8 rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-[var(--dotti-border)]">
          <div className="h-10 w-10 rounded-full bg-[var(--dotti-blush)]" />
          <div className="mt-5 h-8 w-48 rounded-full bg-[var(--dotti-bg)]" />
          <div className="mt-3 h-4 w-80 max-w-full rounded-full bg-[var(--dotti-bg)]" />
        </div>
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell title="My Felti" eyebrow="Account">
        <div className="mt-8 rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-[var(--dotti-border)]">
          <p className="text-lg text-[var(--dotti-muted)]">Log in or register to save designs, view orders, and manage membership.</p>
          <Button render={<a href="/login?returnTo=/account" />} className="mt-6 rounded-full bg-[var(--dotti-berry)] text-white hover:bg-[var(--dotti-berry-dark)]">Log in / Register</Button>
        </div>
      </PageShell>
    );
  }

  const shippingAddress = { ...emptyAddress, ...(profile.shippingAddress ?? {}) };
  const openOrder = orders.find((order) => order.id === openOrderId);

  return (
    <PageShell title="My Felti" eyebrow={user.role === 'vip' ? 'VIP Member' : 'Registered User'}>
      <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-[32px] bg-white p-4 shadow-sm ring-1 ring-[var(--dotti-border)]">
          {menu.map((item) => (
            <button key={item} onClick={() => item === 'Logout' ? void logout() : setActive(item)} className={`mb-2 w-full rounded-full px-4 py-3 text-left text-sm font-bold ${active === item ? 'bg-[var(--dotti-blush)] text-[var(--dotti-berry)]' : 'hover:bg-[var(--dotti-bg)]'}`}>{item}</button>
          ))}
        </aside>

        <section className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-[var(--dotti-border)]">
          {active === 'My Profile' && (
            <div>
              <div className="flex flex-wrap items-center gap-5">
                <label className="grid size-24 cursor-pointer place-items-center overflow-hidden rounded-full bg-[var(--dotti-blush)] text-3xl font-black text-[var(--dotti-berry)] ring-1 ring-[var(--dotti-border)]">
                  {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" /> : user.name.slice(0, 1).toUpperCase()}
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => void uploadAvatar(event.target.files?.[0])} />
                </label>
                <div>
                  <h2 className="text-2xl font-black">{user.name} {user.role === 'vip' && <Crown className="inline size-5 text-[var(--dotti-gold)]" />}</h2>
                  <p className="mt-1 text-[var(--dotti-muted)]">{user.email}</p>
                  <p className="mt-1 text-sm text-[var(--dotti-muted)]">Member since {user.memberSince}</p>
                </div>
              </div>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-bold">Display Name<Input className="mt-2 rounded-full" value={profile.name ?? ''} onChange={(event) => setProfile({ ...profile, name: event.target.value })} /></label>
                <label className="text-sm font-bold">Email<Input className="mt-2 rounded-full" value={user.email} disabled /></label>
                <label className="text-sm font-bold">Phone Number<Input className="mt-2 rounded-full" value={profile.phone ?? ''} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} /></label>
                <label className="text-sm font-bold">Birthday<Input className="mt-2 rounded-full" type="date" value={profile.birthday ?? ''} onChange={(event) => setProfile({ ...profile, birthday: event.target.value })} /></label>
              </div>
              <label className="mt-4 block text-sm font-bold">Bio<Textarea className="mt-2 rounded-3xl" value={profile.bio ?? ''} onChange={(event) => setProfile({ ...profile, bio: event.target.value })} placeholder="I love flowers and cute things ♡" /></label>
              <Button onClick={() => void saveProfile()} className="mt-6 rounded-full bg-[var(--dotti-berry)] text-white hover:bg-[var(--dotti-berry-dark)]">Save Profile</Button>
              {message && <p className="mt-3 text-sm font-bold text-[var(--dotti-success)]">{message}</p>}
            </div>
          )}

          {active === 'My Designs' && (
            <div>
              <h2 className="text-2xl font-black">My Designs</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {designs.length ? designs.map((design) => (
                  <article key={design.id} className="rounded-[28px] bg-[var(--dotti-bg)] p-4">
                    <div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-3xl bg-white">
                      <DesignThumbnail design={design} />
                    </div>
                    <h3 className="mt-4 text-lg font-black">{design.name}</h3>
                    <p className="text-sm text-[var(--dotti-muted)]">Last edited {design.updatedDate?.slice(0, 10)}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button render={<a href={`/diy?design=${design.id}`} />} className="rounded-full">Edit</Button>
                      <Button variant="outline" className="rounded-full bg-white" onClick={() => void duplicateDesign(design.id!)}>Duplicate</Button>
                      <Button variant="outline" className="rounded-full bg-white" onClick={() => void orderDesign(design)}>Order This Design</Button>
                      <Button variant="ghost" size="icon" className="rounded-full text-red-600" onClick={() => void deleteDesign(design.id!)}><Trash2 className="size-4" /></Button>
                    </div>
                  </article>
                )) : <p className="text-[var(--dotti-muted)]">No saved designs yet.</p>}
              </div>
            </div>
          )}

          {active === 'My Orders' && (
            <div>
              <h2 className="text-2xl font-black">My Orders</h2>
              <div className="mt-5 space-y-3">
                {orders.length ? orders.map((order) => (
                  <button key={order.id} onClick={() => setOpenOrderId(order.id)} className="grid w-full gap-3 rounded-3xl bg-[var(--dotti-bg)] p-5 text-left sm:grid-cols-[1fr_auto_auto_auto]">
                    <b>{order.orderNumber}</b><span>{order.orderDate}</span><span>{order.paymentStatus}</span><span>{order.orderStatus}</span>
                  </button>
                )) : <p className="text-[var(--dotti-muted)]">No orders yet.</p>}
              </div>
              {openOrder && (
                <div className="mt-6 rounded-[28px] border border-[var(--dotti-border)] p-5">
                  <h3 className="text-xl font-black">{openOrder.orderNumber}</h3>
                  <div className="mt-4 grid gap-3">
                    {openOrder.items.map((item) => (
                      <div key={item.id} className="grid gap-3 rounded-3xl bg-[var(--dotti-bg)] p-3 sm:grid-cols-[80px_1fr_auto]">
                        <div className="grid aspect-square place-items-center overflow-hidden rounded-2xl bg-white">
                          {item.designSnapshot ? (
                            <DesignThumbnail design={item.designSnapshot as DesignState} className="rounded-2xl" />
                          ) : item.previewImage ? (
                            <img src={item.previewImage} alt="" className="h-full w-full object-cover" />
                          ) : (
                            'F'
                          )}
                        </div>
                        <span><b>{item.productName}</b><span className="block text-sm text-[var(--dotti-muted)]">Purchased design snapshot</span></span>
                        <b>฿{(item.price * item.quantity).toFixed(0)}</b>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 font-black">Total ฿{openOrder.total.toFixed(0)}</p>
                  {(openOrder.trackingCompany || openOrder.trackingNumber) && (
                    <p className="mt-2 rounded-2xl bg-[var(--dotti-blush)] px-4 py-3 text-sm font-bold text-[var(--dotti-ink)]">
                      Tracking: {openOrder.trackingCompany || 'Shipping'} {openOrder.trackingNumber}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {active === 'My Uploads' && (
            <div>
              <h2 className="text-2xl font-black">My Uploads</h2>
              {user.role !== 'vip' ? (
                <div className="mt-5 rounded-3xl bg-[var(--dotti-blush)] p-5 text-[var(--dotti-muted)]">My Uploads is a VIP creative feature.</div>
              ) : (
                <div>
                  <p className="mt-3 text-[var(--dotti-muted)]">Your private decoration uploads. Deleted assets are removed from your upload library.</p>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {uploads.length ? uploads.map((upload) => (
                      <article key={upload.id} className="rounded-[28px] bg-[var(--dotti-bg)] p-4">
                        <div className="grid aspect-square place-items-center overflow-hidden rounded-3xl bg-white">
                          <img src={upload.imageUrl} alt={upload.name} className="h-full w-full object-contain p-4" />
                        </div>
                        <h3 className="mt-4 text-base font-black">{upload.name}</h3>
                        <p className="text-sm text-[var(--dotti-muted)]">Private decoration</p>
                        <Button
                          variant="outline"
                          className="mt-4 rounded-full bg-white text-red-600 hover:bg-red-50"
                          onClick={() => void deleteUpload(upload)}
                        >
                          <Trash2 className="size-4" />
                          Delete
                        </Button>
                      </article>
                    )) : (
                      <div className="col-span-full rounded-3xl bg-[var(--dotti-bg)] p-6 text-[var(--dotti-muted)]">
                        No uploaded decorations yet. Open DIY Studio to upload your first one.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {active === 'VIP Membership' && (
            <div>
              <h2 className="text-2xl font-black">VIP Membership</h2>
              <p className="mt-3 text-[var(--dotti-muted)]">Felti VIP is ฿79 / month for creative tools, premium assets, and personal uploads. Physical production is still priced per design.</p>
              {user.role === 'vip' ? (
                <div className="mt-5 rounded-3xl bg-[var(--dotti-blush)] p-5 font-bold text-[var(--dotti-berry)]">
                  Your Felti VIP membership is active.
                </div>
              ) : (
                <Button disabled={joiningVip} onClick={() => void joinVip()} className="mt-5 rounded-full bg-[var(--dotti-berry)] text-white hover:bg-[var(--dotti-berry-dark)]">
                  {joiningVip ? 'Joining...' : 'Join VIP'}
                </Button>
              )}
              {message && <p className="mt-3 text-sm font-bold text-[var(--dotti-success)]">{message}</p>}
              {error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p>}
            </div>
          )}

          {active === 'Addresses' && (
            <div>
              <h2 className="text-2xl font-black">Addresses</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {Object.entries(shippingAddress).map(([key, value]) => (
                  <label key={key} className="text-sm font-bold capitalize">
                    {key.replace(/([A-Z])/g, ' $1')}
                    <Input className="mt-2 rounded-full" value={String(value ?? '')} onChange={(event) => setProfile({ ...profile, shippingAddress: { ...shippingAddress, [key]: event.target.value } })} />
                  </label>
                ))}
              </div>
              <Button onClick={() => void saveProfile()} className="mt-6 rounded-full bg-[var(--dotti-berry)] text-white hover:bg-[var(--dotti-berry-dark)]">Save Address</Button>
            </div>
          )}

          {active === 'Account Settings' && <div><h2 className="text-2xl font-black">Account Settings</h2><p className="mt-3 text-[var(--dotti-muted)]">Logout keeps your Felti account, saved designs, uploads, and orders intact.</p></div>}
        </section>
      </div>
    </PageShell>
  );
}
