'use client';

import type { ComponentType } from 'react';
import { useEffect, useState } from 'react';
import { CreditCard, Landmark, QrCode } from 'lucide-react';

import { PageShell } from '@/components/common/page-shell';
import { Button } from '@/components/ui/button';
import { dottiApi } from '@/lib/dotti-api';
import type { Order } from '@/types/commerce';

type PaymentMethod = 'card' | 'qr' | 'bank';

const paymentMethods: {
  id: PaymentMethod;
  label: string;
  note: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  {
    id: 'card',
    label: 'Credit / Debit Card',
    note: 'Enter card details for demo payment.',
    icon: CreditCard,
  },
  {
    id: 'qr',
    label: 'QR Payment',
    note: 'Scan Thai QR / PromptPay to transfer.',
    icon: QrCode,
  },
  {
    id: 'bank',
    label: 'Bank Transfer',
    note: 'Use manual bank transfer information.',
    icon: Landmark,
  },
];

export default function PaymentPage() {
  const [order, setOrder] = useState<Order | undefined>();
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [purpose, setPurpose] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('order');
    setPurpose(params.get('purpose') ?? '');
    if (!id) return;
    dottiApi.getOrder(id).then(({ order }) => setOrder(order)).catch(() => {
      window.location.href = '/account?tab=My%20Orders';
    });
  }, []);

  const pay = async () => {
    if (!order) return;
    await dottiApi.pay(order.id);
    if (isVipOrder(order) || purpose === 'vip') {
      window.location.href = '/account?tab=VIP%20Membership&vip=active';
      return;
    }
    window.location.href = `/order-confirmation?order=${order.id}`;
  };

  const vipOrder = isVipOrder(order);

  return (
    <PageShell title={vipOrder ? 'VIP Payment' : 'Payment'} eyebrow="Mock Payment">
      <div className="mt-8 grid max-w-5xl gap-5 rounded-[32px] bg-white p-5 shadow-sm ring-1 ring-[var(--dotti-border)] lg:grid-cols-[0.9fr_1.1fr] lg:p-6">
        <div className="rounded-[28px] bg-[var(--dotti-bg)] p-5">
          <p className="text-sm font-black uppercase text-[var(--dotti-berry)]">{vipOrder ? 'Membership' : 'Order'}</p>
          <h2 className="mt-2 text-2xl font-black">{order ? order.orderNumber : 'No pending order'}</h2>
          <p className="mt-2 text-sm text-[var(--dotti-muted)]">
            {vipOrder
              ? 'Complete demo payment to activate Felti VIP. Card details are not saved.'
              : 'Demo payment completes the same Felti order workflow without storing raw card details.'}
          </p>

          <div className="mt-6 grid gap-3">
            {paymentMethods.map((item) => {
              const Icon = item.icon;
              const selected = method === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMethod(item.id)}
                  className={`flex items-center gap-3 rounded-3xl border p-4 text-left transition-all ${
                    selected
                      ? 'border-[var(--dotti-berry)] bg-white shadow-sm'
                      : 'border-[var(--dotti-border)] bg-white/70 hover:bg-white'
                  }`}
                >
                  <span className={`grid size-11 place-items-center rounded-full ${selected ? 'bg-[var(--dotti-blush)] text-[var(--dotti-berry)]' : 'bg-[var(--dotti-bg)] text-[var(--dotti-muted)]'}`}>
                    <Icon className="size-5" />
                  </span>
                  <span>
                    <span className="block font-black">{item.label}</span>
                    <span className="mt-1 block text-xs font-bold text-[var(--dotti-muted)]">{item.note}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 rounded-3xl bg-white p-4 ring-1 ring-[var(--dotti-border)]">
            <div className="flex items-center justify-between text-sm font-bold text-[var(--dotti-muted)]">
              <span>Total due</span>
              <span className="text-2xl font-black text-[var(--dotti-ink)]">฿{order?.total.toFixed(0) ?? '0'}</span>
            </div>
          </div>

          <Button onClick={() => void pay()} disabled={!order} className="mt-5 h-11 w-full rounded-full bg-[var(--dotti-berry)] text-white hover:bg-[var(--dotti-berry-dark)]">
            {vipOrder ? 'Pay and Activate VIP' : `Pay ฿${order?.total.toFixed(0) ?? '0'}`}
          </Button>
        </div>

        <div className="flex min-h-[430px] items-center justify-center rounded-[28px] border border-[var(--dotti-border)] bg-white p-5">
          {method === 'qr' && <QrPaymentPanel order={order} />}
          {method === 'card' && <CardPaymentPanel />}
          {method === 'bank' && <BankTransferPanel order={order} />}
        </div>
      </div>
    </PageShell>
  );
}

function isVipOrder(order?: Order) {
  return Boolean(order?.items.some((item) => item.itemType === 'membership' || item.productId === 'felti-vip-monthly'));
}

function QrPaymentPanel({ order }: { order?: Order }) {
  return (
    <div className="w-full max-w-sm overflow-hidden rounded-[28px] border border-[var(--dotti-border)] bg-white text-center shadow-sm">
      <div className="bg-[#245879] px-6 py-5 text-white">
        <div className="mx-auto flex items-center justify-center gap-3">
          <QrCode className="size-10" />
          <div className="text-left text-2xl font-black leading-none tracking-wide">
            <span className="block">THAI QR</span>
            <span className="block">PAYMENT</span>
          </div>
        </div>
      </div>
      <div className="p-5">
        <div className="mx-auto mb-4 inline-flex rounded-sm border border-[#7d91a1] px-3 py-1 text-xl font-black text-[#245879]">
          PromptPay
        </div>
        <img
          src="/felti-promptpay-qr.png"
          alt="PromptPay QR payment code"
          className="mx-auto aspect-square w-full max-w-[260px] rounded-2xl bg-white object-contain"
        />
        <p className="mt-4 text-lg font-black text-[#55c8bd]">Scan QR to transfer</p>
        <p className="mt-1 text-sm font-bold text-[var(--dotti-muted)]">Name: MS. YUEXI HUANG</p>
        <p className="text-sm font-bold text-[var(--dotti-muted)]">Account No.: xxx-x-x5659-x</p>
        <div className="mt-4 rounded-2xl bg-[var(--dotti-bg)] px-4 py-3 text-sm font-black">
          Amount: ฿{order?.total.toFixed(0) ?? '0'}
        </div>
      </div>
    </div>
  );
}

function CardPaymentPanel() {
  return (
    <div className="w-full max-w-md">
      <div className="rounded-[28px] bg-[var(--dotti-ink)] p-5 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-black uppercase tracking-wide">Felti Card</span>
          <CreditCard className="size-6" />
        </div>
        <div className="mt-10 text-2xl font-black tracking-[0.18em]">•••• •••• •••• 4242</div>
        <div className="mt-6 flex justify-between text-xs font-bold uppercase text-white/70">
          <span>Card Holder</span>
          <span>MM / YY</span>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        <label className="text-sm font-black">
          Card Number
          <input className="mt-2 h-12 w-full rounded-2xl border border-[var(--dotti-border)] px-4 text-sm font-bold outline-none focus:border-[var(--dotti-berry)]" inputMode="numeric" placeholder="4242 4242 4242 4242" />
        </label>
        <label className="text-sm font-black">
          Name on Card
          <input className="mt-2 h-12 w-full rounded-2xl border border-[var(--dotti-border)] px-4 text-sm font-bold outline-none focus:border-[var(--dotti-berry)]" placeholder="YOUR FULL NAME" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm font-black">
            Expiry
            <input className="mt-2 h-12 w-full rounded-2xl border border-[var(--dotti-border)] px-4 text-sm font-bold outline-none focus:border-[var(--dotti-berry)]" inputMode="numeric" placeholder="12 / 28" />
          </label>
          <label className="text-sm font-black">
            CVC
            <input className="mt-2 h-12 w-full rounded-2xl border border-[var(--dotti-border)] px-4 text-sm font-bold outline-none focus:border-[var(--dotti-berry)]" inputMode="numeric" placeholder="123" />
          </label>
        </div>
        <p className="text-xs font-bold text-[var(--dotti-muted)]">
          Demo only. Card details are not saved to Felti.
        </p>
      </div>
    </div>
  );
}

function BankTransferPanel({ order }: { order?: Order }) {
  return (
    <div className="w-full max-w-md rounded-[28px] bg-[var(--dotti-bg)] p-6">
      <div className="grid size-14 place-items-center rounded-full bg-white text-[var(--dotti-berry)] shadow-sm">
        <Landmark className="size-7" />
      </div>
      <h3 className="mt-5 text-2xl font-black">Bank Transfer</h3>
      <dl className="mt-5 grid gap-3 text-sm">
        <div className="flex justify-between rounded-2xl bg-white px-4 py-3">
          <dt className="font-bold text-[var(--dotti-muted)]">Account Name</dt>
          <dd className="font-black">MS. YUEXI HUANG</dd>
        </div>
        <div className="flex justify-between rounded-2xl bg-white px-4 py-3">
          <dt className="font-bold text-[var(--dotti-muted)]">Account No.</dt>
          <dd className="font-black">163-3-65659-9</dd>
        </div>
        <div className="flex justify-between rounded-2xl bg-white px-4 py-3">
          <dt className="font-bold text-[var(--dotti-muted)]">Amount</dt>
          <dd className="font-black">฿{order?.total.toFixed(0) ?? '0'}</dd>
        </div>
      </dl>
    </div>
  );
}
