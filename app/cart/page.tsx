'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';

import { PageShell } from '@/components/common/page-shell';
import { DesignThumbnail } from '@/components/diy/design-thumbnail';
import { Button } from '@/components/ui/button';
import { dottiApi } from '@/lib/dotti-api';
import type { CartItem } from '@/types/commerce';
import type { DesignState } from '@/types/dotti';

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    dottiApi.getCart().then(({ items }) => setItems(items)).catch(() => {
      window.location.href = '/login?returnTo=/cart';
    });
  }, []);

  const update = async (next: CartItem[]) => {
    setItems(next);
    await dottiApi.updateCart(next);
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 1000 || subtotal === 0 ? 0 : 60;
  const total = subtotal + shipping;

  return (
    <PageShell title="Shopping Cart" eyebrow="Cart">
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="space-y-4">
          {items.length === 0 && (
            <div className="rounded-[32px] bg-white p-8 text-center shadow-sm ring-1 ring-[var(--dotti-border)]">
              <p className="text-lg font-bold text-[var(--dotti-muted)]">Your cart is empty.</p>
              <Button render={<a href="/shop" />} className="mt-5 rounded-full bg-[var(--dotti-berry)] text-white hover:bg-[var(--dotti-berry-dark)]">Continue Shopping</Button>
            </div>
          )}
          {items.map((item) => (
            <article key={item.id} className="grid gap-4 rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-[var(--dotti-border)] sm:grid-cols-[92px_1fr_auto]">
              <div className="grid aspect-square place-items-center overflow-hidden rounded-3xl bg-[var(--dotti-felt)] font-black text-[var(--dotti-berry)]">
                {item.designSnapshot ? (
                  <DesignThumbnail design={item.designSnapshot as DesignState} />
                ) : item.previewImage ? (
                  <img src={item.previewImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  'F'
                )}
              </div>
              <div>
                <h2 className="text-xl font-black">{item.productName}</h2>
                {item.designSnapshot ? <CartProductionSummary item={item} /> : <p className="text-sm text-[var(--dotti-muted)]">Finished Felti accessory</p>}
                <p className="mt-2 font-black">฿{item.price}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  aria-label={`Quantity for ${item.productName}`}
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(event) => void update(items.map((current) => current.id === item.id ? { ...current, quantity: Number(event.target.value) || 1 } : current))}
                  className="h-10 w-20 rounded-full border border-[var(--dotti-border)] px-3"
                />
                <Button variant="ghost" size="icon" className="rounded-full text-red-600" onClick={() => void update(items.filter((current) => current.id !== item.id))}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </article>
          ))}
        </section>

        <aside className="h-fit rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-[var(--dotti-border)]">
          <h2 className="text-2xl font-black">Order Summary</h2>
          <div className="mt-5 space-y-3 text-sm">
            <p className="flex justify-between"><span>Product subtotal</span><b>฿{subtotal.toFixed(0)}</b></p>
            <p className="flex justify-between"><span>Shipping fee</span><b>฿{shipping.toFixed(0)}</b></p>
            <p className="flex justify-between"><span>Discount</span><b>฿0</b></p>
            <p className="flex justify-between"><span>VIP discount</span><b>฿0</b></p>
          </div>
          <p className="mt-5 flex justify-between border-t border-[var(--dotti-border)] pt-5 text-xl font-black"><span>Total</span><span>฿{total.toFixed(0)}</span></p>
          <div className="mt-6 grid gap-2">
            <Button render={<a href="/shop" />} variant="outline" className="rounded-full bg-white">Continue Shopping</Button>
            <Button render={<a href="/checkout" />} disabled={!items.length} className="rounded-full bg-[var(--dotti-berry)] text-white hover:bg-[var(--dotti-berry-dark)]">Proceed to Checkout</Button>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}

function CartProductionSummary({ item }: { item: CartItem }) {
  const snapshot = item.designSnapshot as DesignState;
  return (
    <div className="mt-1 space-y-1 text-sm text-[var(--dotti-muted)]">
      <p>{item.baseShape ?? snapshot.baseShape} · {item.baseSize ?? snapshot.baseSize ?? 'M'} · {item.baseColor ?? snapshot.baseColor}</p>
      <p>{item.decorationCount ?? snapshot.elements?.length ?? 0} Decorations</p>
      <p>Detachable Decorations: {item.decorationsDetachable ? 'Yes' : 'No'}</p>
      {item.decorationsDetachable && <p>Decoration Connection: {item.decorationConnectionMethod ?? 'Velcro'} · +฿{item.detachableFee ?? snapshot.detachableFee ?? 0}</p>}
      <p>Product Connection: {item.productConnectionMethod ?? 'Not selected'}</p>
    </div>
  );
}
