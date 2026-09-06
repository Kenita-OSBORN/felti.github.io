'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Save, ShieldCheck } from 'lucide-react';
import { useParams } from 'next/navigation';

import { PageShell } from '@/components/common/page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { productConnectionLabels } from '@/components/diy/connection-method-step';
import { dottiApi } from '@/lib/dotti-api';
import type { AdminDashboardData, Order, OrderStatus, PaymentStatus } from '@/types/commerce';
import type { DesignState } from '@/types/dotti';

const paymentStatuses: PaymentStatus[] = ['Pending', 'Paid', 'Failed', 'Refunded'];
const orderStatuses: OrderStatus[] = ['Pending', 'Confirmed', 'Making', 'Ready', 'Shipped', 'Delivered', 'Cancelled'];

function statusClass(status: string) {
  if (['Paid', 'Delivered', 'Ready'].includes(status)) return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  if (['Making', 'Confirmed', 'Shipped'].includes(status)) return 'bg-blue-50 text-blue-700 ring-blue-200';
  if (['Failed', 'Cancelled', 'Refunded'].includes(status)) return 'bg-red-50 text-red-700 ring-red-200';
  return 'bg-amber-50 text-amber-700 ring-amber-200';
}

function Badge({ children }: { children: string }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${statusClass(children)}`}>{children}</span>;
}

function snapshotOf(order: Order) {
  return order.items.find((item) => item.designSnapshot)?.designSnapshot as DesignState | undefined;
}

function productConnectionLabel(snapshot?: DesignState, order?: Order) {
  const method = snapshot?.productConnectionMethod;
  if (method && method in productConnectionLabels) return productConnectionLabels[method];
  return order?.items.find((item) => item.productConnectionMethod)?.productConnectionMethod ?? 'Not selected';
}

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<AdminDashboardData['orders'][number] | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setError('');
    dottiApi.adminGetOrder(params.id)
      .then(({ order: found }) => {
        setOrder(found);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Admin access required.'));
  }, [params.id]);

  const save = async () => {
    if (!order) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const { order: updated } = await dottiApi.adminUpdateOrder({
        orderId: order.id,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        trackingCompany: order.trackingCompany,
        trackingNumber: order.trackingNumber,
      });
      setOrder(updated);
      setMessage('Order saved. Customer order history now shows the updated status and tracking.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Order could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  if (error || !order) {
    return (
      <PageShell title="Order Detail" eyebrow="Felti Admin">
        <div className="mt-8 rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-[var(--dotti-border)]">
          <ShieldCheck className="size-10 text-[var(--dotti-berry)]" />
          <h2 className="mt-4 text-2xl font-black">{error || 'Loading order...'}</h2>
          <Button render={<a href="/admin" />} className="mt-5 rounded-full bg-[var(--dotti-berry)] text-white">Back to Admin</Button>
        </div>
      </PageShell>
    );
  }

  const snapshot = snapshotOf(order);

  return (
    <PageShell title={order.orderNumber} eyebrow="Felti Admin · Order Detail">
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Button render={<a href="/admin" />} variant="outline" className="rounded-full bg-white">
          <ArrowLeft className="size-4" /> Back to Admin
        </Button>
        <div className="flex flex-wrap gap-2">
          <Badge>{order.paymentStatus}</Badge>
          <Badge>{order.orderStatus}</Badge>
        </div>
      </div>
      {message && <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{message}</p>}
      {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_420px]">
        <section className="space-y-5">
          <div className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-[var(--dotti-border)]">
            <h2 className="text-xl font-black">Customer</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Info label="Name" value={order.customerName} />
              <Info label="Email" value={order.customerEmail} />
              <Info label="Phone" value={order.customerPhone || order.shippingAddress.phone} />
            </div>
          </div>

          <div className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-[var(--dotti-border)]">
            <h2 className="text-xl font-black">Shipping</h2>
            <p className="mt-3 text-[var(--dotti-muted)]">
              {order.shippingAddress.fullName}, {order.shippingAddress.address}, {order.shippingAddress.district}, {order.shippingAddress.province} {order.shippingAddress.postalCode}, {order.shippingAddress.country}
            </p>
          </div>

          <div className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-[var(--dotti-border)]">
            <h2 className="text-xl font-black">Custom Felti Design</h2>
            {order.items[0]?.previewImage && <img src={order.items[0].previewImage} alt="Purchased Felti design snapshot" className="mt-4 aspect-[4/3] w-full max-w-xl rounded-3xl bg-[var(--dotti-bg)] object-cover" />}
            {snapshot ? (
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <Info label="Base Shape" value={snapshot.baseShape} />
                <Info label="Base Size" value={snapshot.baseSize} />
                <Info label="Base Color" value={snapshot.baseColor} />
                <Info label="Background" value={snapshot.background?.type ?? 'plain'} />
                <div className="lg:col-span-2">
                  <p className="text-xs font-black uppercase text-[var(--dotti-muted)]">Decorations</p>
                  <div className="mt-2 max-h-56 overflow-y-auto rounded-2xl bg-[var(--dotti-bg)] p-3 text-sm">
                    {snapshot.elements.map((element) => <p key={element.id}>{element.assetName} · {element.source} · ฿{element.productionPrice} {element.color ? `· ${element.color}` : ''}</p>)}
                  </div>
                </div>
              </div>
            ) : <p className="mt-3 text-[var(--dotti-muted)]">This order does not include a DIY design snapshot.</p>}
          </div>

          {snapshot && (
            <div className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-[var(--dotti-border)]">
              <h2 className="text-xl font-black">Production Instructions</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Info label="Base" value={`${snapshot.baseShape} / ${snapshot.baseSize} / ${snapshot.baseColor}`} />
                <Info label="Decorations" value={String(snapshot.elements.length)} />
                <Info label="Detachable Decorations" value={snapshot.decorationsDetachable ? 'Yes' : 'No'} />
                <Info label="Decoration Connection" value={snapshot.decorationsDetachable ? 'Velcro' : 'Fixed'} />
                <Info label="Detachable Fee" value={`฿${snapshot.detachableFee ?? 0}`} />
                <Info label="Product Connection" value={productConnectionLabel(snapshot, order)} />
              </div>
            </div>
          )}
        </section>

        <aside className="h-fit rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-[var(--dotti-border)]">
          <h2 className="text-xl font-black">Order Controls</h2>
          <div className="mt-4 grid gap-3">
            <label className="text-sm font-black">Payment Status<select className="mt-2 w-full rounded-full border border-[var(--dotti-border)] bg-white px-4 py-2" value={order.paymentStatus} onChange={(event) => setOrder({ ...order, paymentStatus: event.target.value as PaymentStatus })}>{paymentStatuses.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="text-sm font-black">Order Status<select className="mt-2 w-full rounded-full border border-[var(--dotti-border)] bg-white px-4 py-2" value={order.orderStatus} onChange={(event) => setOrder({ ...order, orderStatus: event.target.value as OrderStatus })}>{orderStatuses.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="text-sm font-black">Shipping Company<Input className="mt-2 rounded-full bg-white" value={order.trackingCompany ?? ''} onChange={(event) => setOrder({ ...order, trackingCompany: event.target.value })} /></label>
            <label className="text-sm font-black">Tracking Number<Input className="mt-2 rounded-full bg-white" value={order.trackingNumber ?? ''} onChange={(event) => setOrder({ ...order, trackingNumber: event.target.value })} /></label>
          </div>
          <div className="mt-5 rounded-3xl bg-[var(--dotti-bg)] p-4 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><b>฿{order.subtotal.toFixed(0)}</b></div>
            <div className="mt-2 flex justify-between"><span>Shipping</span><b>฿{order.shippingFee.toFixed(0)}</b></div>
            <div className="mt-2 flex justify-between"><span>Discount</span><b>฿{order.discount.toFixed(0)}</b></div>
            <div className="mt-3 flex justify-between border-t border-[var(--dotti-border)] pt-3 text-lg"><span>Total</span><b>฿{order.total.toFixed(0)}</b></div>
          </div>
          <Button onClick={save} disabled={saving} className="mt-5 w-full rounded-full bg-[var(--dotti-berry)] text-white"><Save className="size-4" /> {saving ? 'Saving...' : 'Save Order'}</Button>
        </aside>
      </div>
    </PageShell>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-2xl bg-[var(--dotti-bg)] p-3">
      <p className="text-xs font-black uppercase text-[var(--dotti-muted)]">{label}</p>
      <p className="mt-1 font-bold">{value || '-'}</p>
    </div>
  );
}
