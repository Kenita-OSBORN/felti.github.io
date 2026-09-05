'use client';

import { useEffect, useState } from 'react';

import { PageShell } from '@/components/common/page-shell';
import { DesignThumbnail } from '@/components/diy/design-thumbnail';
import { Button } from '@/components/ui/button';
import { dottiApi } from '@/lib/dotti-api';
import type { Order } from '@/types/commerce';
import type { DesignState } from '@/types/dotti';

export default function OrderConfirmationPage() {
  const [order, setOrder] = useState<Order | undefined>();

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('order');
    if (!id) return;
    dottiApi.getOrder(id).then(({ order }) => setOrder(order)).catch(() => undefined);
  }, []);

  return (
    <PageShell title="Payment Successful" eyebrow="Order Confirmation">
      <div className="mt-8 rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-[var(--dotti-border)]">
        {order ? (
          <>
            <h2 className="text-2xl font-black">Thank you! Your Felti order is confirmed.</h2>
            <p className="mt-3 text-lg font-black">{order.orderNumber}</p>
            <p className="mt-2 text-[var(--dotti-muted)]">Order date: {order.orderDate}</p>
            <div className="mt-6 grid gap-3">
              {order.items.map((item) => (
                <div key={item.id} className="grid gap-4 rounded-3xl bg-[var(--dotti-bg)] p-4 sm:grid-cols-[96px_1fr_auto]">
                  <div className="grid aspect-square place-items-center overflow-hidden rounded-3xl bg-white text-sm font-black text-[var(--dotti-berry)]">
                    {item.designSnapshot ? (
                      <DesignThumbnail design={item.designSnapshot as DesignState} />
                    ) : item.previewImage ? (
                      <img src={item.previewImage} alt="" className="h-full w-full object-cover" />
                    ) : (
                      'F'
                    )}
                  </div>
                  <div>
                    <b>{item.productName} x {item.quantity}</b>
                    <p className="mt-1 text-sm text-[var(--dotti-muted)]">Base size: {item.baseSize ?? 'M'}</p>
                    {Boolean(item.designSnapshot) && <OrderProductionSummary snapshot={item.designSnapshot as DesignState} productConnection={item.productConnectionMethod} />}
                  </div>
                  <b>฿{(item.price * item.quantity).toFixed(0)}</b>
                </div>
              ))}
            </div>
            <dl className="mt-6 grid gap-3 sm:grid-cols-3">
              <div><dt className="text-sm text-[var(--dotti-muted)]">Payment</dt><dd className="font-black">{order.paymentStatus}</dd></div>
              <div><dt className="text-sm text-[var(--dotti-muted)]">Status</dt><dd className="font-black">{order.orderStatus}</dd></div>
              <div><dt className="text-sm text-[var(--dotti-muted)]">Total</dt><dd className="font-black">฿{order.total.toFixed(0)}</dd></div>
            </dl>
            <p className="mt-6 rounded-3xl bg-[var(--dotti-blush)] p-4 text-sm text-[var(--dotti-muted)]">{order.shippingAddress.address}, {order.shippingAddress.province}, {order.shippingAddress.country}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button render={<a href="/account?tab=My%20Orders" />} className="rounded-full bg-[var(--dotti-berry)] text-white hover:bg-[var(--dotti-berry-dark)]">View My Orders</Button>
              <Button render={<a href="/diy" />} variant="outline" className="rounded-full bg-white">Continue Creating</Button>
            </div>
          </>
        ) : (
          <p className="text-[var(--dotti-muted)]">No order was found.</p>
        )}
      </div>
    </PageShell>
  );
}

function OrderProductionSummary({ snapshot, productConnection }: { snapshot: DesignState; productConnection?: string }) {
  return (
    <div className="mt-2 space-y-1 text-sm text-[var(--dotti-muted)]">
      <p>Base: {snapshot.baseShape} · {snapshot.baseSize} · {snapshot.baseColor}</p>
      <p>Decorations: {snapshot.elements.length}</p>
      <p>Detachable Decorations: {snapshot.decorationsDetachable ? 'Yes' : 'No'}</p>
      {snapshot.decorationsDetachable && <p>Decoration Connection: Velcro · Fee ฿{snapshot.detachableFee ?? 0}</p>}
      <p>Product Connection: {productConnection ?? snapshot.productConnectionMethod ?? 'Not selected'}</p>
    </div>
  );
}
