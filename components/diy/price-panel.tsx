'use client';

import { ShoppingBag } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { calculateDesignPrice } from '@/lib/pricing';
import type { PricingConfig } from '@/types/commerce';
import type { DesignState } from '@/types/dotti';

type PricePanelProps = {
  design: DesignState;
  pricing?: PricingConfig;
  onNext: () => void;
  onToggleDetachable: (value: boolean) => void;
};

export function PricePanel({ design, pricing, onNext, onToggleDetachable }: PricePanelProps) {
  const price = calculateDesignPrice(design, pricing);
  const detachableUnitPrice = pricing?.detachableDecoration ?? 2;

  return (
    <aside className="flex h-full min-h-0 flex-col border-l border-[var(--dotti-border)] bg-white/88 p-5">
      <div className="shrink-0">
        <p className="text-xs font-black uppercase tracking-wide text-[var(--dotti-muted)]">How much will it cost?</p>
        <h2 className="mt-1 text-2xl font-black">Your Design</h2>
        <p className="mt-5 text-sm font-bold text-[var(--dotti-muted)]">{price.decorationCount} decorations added ♡</p>
      </div>
      <div className="mt-3 shrink-0 rounded-[28px] bg-[var(--dotti-blush)] p-5">
        <p className="text-sm font-black text-[var(--dotti-muted)]">Estimated Making Price</p>
        <p className="mt-1 text-5xl font-black text-[var(--dotti-berry)]">฿{price.total}</p>
      </div>
      <div className="mt-4 shrink-0 rounded-[28px] bg-white p-4 ring-1 ring-[var(--dotti-border)]">
        <div className="flex items-start gap-3">
          <input
            id="detachable-decorations"
            type="checkbox"
            checked={Boolean(design.decorationsDetachable)}
            onChange={(event) => onToggleDetachable(event.target.checked)}
            className="mt-1 size-4 accent-[var(--dotti-berry)]"
          />
          <label htmlFor="detachable-decorations" className="text-sm">
            <span className="block font-black">Make decorations detachable</span>
            <span className="mt-1 block text-xs font-bold leading-5 text-[var(--dotti-muted)]">
              Velcro between decorations and felt base. +฿{detachableUnitPrice} per decoration.
            </span>
            <span className="mt-1 block text-xs font-black text-[var(--dotti-berry)]">Connection: Velcro</span>
          </label>
        </div>
      </div>
      <div className="mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {price.lines.map((line) => (
          <div key={`${line.label}-${line.detail}`} className="flex justify-between gap-3 rounded-3xl bg-[var(--dotti-bg)] px-4 py-3 text-sm">
            <span>
              <b className="block">{line.label}</b>
              <span className="text-[var(--dotti-muted)]">{line.detail}</span>
            </span>
            <b>฿{line.amount}</b>
          </div>
        ))}
      </div>
      <div className="shrink-0">
        <Button onClick={onNext} className="mt-5 w-full rounded-full bg-[var(--dotti-berry)] text-white hover:bg-[var(--dotti-berry-dark)]">
          <ShoppingBag className="size-4" />
          Next →
        </Button>
        <p className="mt-3 text-center text-xs font-bold text-[var(--dotti-muted)]">Shipping calculated at checkout.</p>
      </div>
    </aside>
  );
}
