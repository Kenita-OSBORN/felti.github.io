'use client';

import { useEffect, useState } from 'react';

import { PageShell } from '@/components/common/page-shell';
import { DesignThumbnail } from '@/components/diy/design-thumbnail';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { dottiApi } from '@/lib/dotti-api';
import type { CartItem, ShippingAddress } from '@/types/commerce';
import type { DesignState } from '@/types/dotti';

const defaultAddress: ShippingAddress = {
  fullName: 'Felti Friend',
  phone: '+1 555 0199',
  email: 'friend@felti.local',
  address: '12 Soft Studio Road',
  district: 'Craft District',
  province: 'CA',
  postalCode: '90001',
  country: 'United States',
};

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [address, setAddress] = useState(defaultAddress);

  useEffect(() => {
    Promise.all([dottiApi.me(), dottiApi.getCart()])
      .then(([{ user }, { items }]) => {
        if (!user) {
          window.location.href = '/login?returnTo=/checkout';
          return;
        }
        setItems(items);
        setAddress((current) => ({
          ...current,
          fullName: user.name,
          email: user.email,
          phone: user.phone || current.phone,
          ...user.shippingAddress,
        }));
      })
      .catch(() => {
        window.location.href = '/login?returnTo=/checkout';
      });
  }, []);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 1000 || subtotal === 0 ? 0 : 60;
  const total = subtotal + shipping;

  const continueToPayment = async () => {
    if (!items.length) {
      window.location.href = '/cart';
      return;
    }
    await dottiApi.updateProfile({ shippingAddress: address, phone: address.phone });
    const { order } = await dottiApi.checkout(address);
    window.location.href = `/payment?order=${order.id}`;
  };

  return (
    <PageShell title="Checkout" eyebrow="Shipping">
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-[var(--dotti-border)]">
          <h2 className="text-2xl font-black">Contact Information</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {Object.entries(address).map(([key, value]) => (
              <label key={key} className="text-sm font-bold capitalize">
                {key.replace(/([A-Z])/g, ' $1')}
                <Input className="mt-2 rounded-full" value={value} onChange={(event) => setAddress({ ...address, [key]: event.target.value })} />
              </label>
            ))}
          </div>
          <label className="mt-5 flex items-center gap-2 text-sm text-[var(--dotti-muted)]"><input type="checkbox" defaultChecked /> Save this address</label>
        </section>
        <aside className="h-fit rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-[var(--dotti-border)]">
          <h2 className="text-2xl font-black">Order Summary</h2>
          <div className="mt-5 space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3 rounded-3xl bg-[var(--dotti-bg)] p-3">
                <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white text-xs font-black text-[var(--dotti-berry)]">
                  {item.designSnapshot ? (
                    <DesignThumbnail design={item.designSnapshot as DesignState} className="rounded-2xl" />
                  ) : item.previewImage ? (
                    <img src={item.previewImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    'F'
                  )}
                </div>
                <div className="flex flex-1 justify-between gap-3 text-sm">
                  <span>
                    <b>{item.productName} x {item.quantity}</b>
                    {Boolean(item.designSnapshot) && <CheckoutProductionSummary item={item} />}
                  </span>
                  <b>฿{(item.price * item.quantity).toFixed(0)}</b>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 flex justify-between border-t border-[var(--dotti-border)] pt-5 font-black"><span>Total</span><span>฿{total.toFixed(0)}</span></p>
          <Button onClick={() => void continueToPayment()} className="mt-6 w-full rounded-full bg-[var(--dotti-berry)] text-white hover:bg-[var(--dotti-berry-dark)]">Continue to Payment</Button>
        </aside>
      </div>
    </PageShell>
  );
}

function CheckoutProductionSummary({ item }: { item: CartItem }) {
  const snapshot = item.designSnapshot as DesignState;
  return (
    <span className="mt-1 block text-xs font-bold leading-5 text-[var(--dotti-muted)]">
      {snapshot.baseShape} · {snapshot.baseSize} · {snapshot.elements.length} decorations
      <br />
      Detachable: {snapshot.decorationsDetachable ? 'Yes · Velcro' : 'No'} · Product: {item.productConnectionMethod ?? 'Not selected'}
    </span>
  );
}
