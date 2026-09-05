'use client';

import { Check, RotateCcw, ShoppingCart } from 'lucide-react';

import { DesignThumbnail } from '@/components/diy/design-thumbnail';
import { Button } from '@/components/ui/button';
import { calculateDesignPrice } from '@/lib/pricing';
import type { PricingConfig } from '@/types/commerce';
import type { DesignState, ProductConnectionMethod } from '@/types/dotti';

export const productConnectionLabels: Record<ProductConnectionMethod, string> = {
  pin: 'Pin (Brooch)',
  velcro: 'Adhesive Velcro',
  pendant: 'Pendant',
  strap: 'Hanging Strap',
};

const options: {
  id: ProductConnectionMethod;
  description: string;
  suitable: string;
  image: string;
}[] = [
  {
    id: 'pin',
    description: 'A pin attachment on the back for clothes, cardigans, totes, and fabric accessories.',
    suitable: 'Clothes · Cardigans · Tote bags',
    image: '/connection-pin-brooch.png',
  },
  {
    id: 'velcro',
    description: 'Adhesive Velcro on the back for detachable placement on compatible surfaces.',
    suitable: 'Soft boards · Displays · Compatible surfaces',
    image: '/connection-velcro.png',
  },
  {
    id: 'pendant',
    description: 'A small top attachment point for necklaces, chains, and decorative hanging.',
    suitable: 'Necklaces · Chains · Hanging decor',
    image: '/connection-pendant.png',
  },
  {
    id: 'strap',
    description: 'A strap loop for bags, backpacks, keys, and small hanging accessories.',
    suitable: 'Bags · Backpacks · Keys',
    image: '/connection-hanging-strap.png',
  },
];

const previewImages = options.reduce(
  (acc, option) => {
    acc[option.id] = option.image;
    return acc;
  },
  {} as Record<ProductConnectionMethod, string>,
);

export function ConnectionMethodStep({
  design,
  pricing,
  selected,
  onSelect,
  onBack,
  onConfirm,
}: {
  design: DesignState;
  pricing: PricingConfig;
  selected: ProductConnectionMethod;
  onSelect: (method: ProductConnectionMethod) => void;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const price = calculateDesignPrice(design, pricing);

  return (
    <section className="flex min-h-0 flex-1 overflow-y-auto bg-[var(--dotti-bg)] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-5 xl:grid-cols-[1fr_420px]">
        <div className="rounded-[32px] bg-white p-5 shadow-sm ring-1 ring-[var(--dotti-border)]">
          <p className="text-xs font-black uppercase tracking-wide text-[var(--dotti-berry)]">Production Options</p>
          <h1 className="mt-2 text-3xl font-black">How would you like to use your Felti?</h1>
          <p className="mt-2 text-sm font-bold text-[var(--dotti-muted)]">
            Choose how your finished Felti accessory will attach or hang.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {options.map((option) => {
              const isSelected = selected === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onSelect(option.id)}
                  aria-label={`${productConnectionLabels[option.id]}. ${option.description}`}
                  className={`group rounded-[28px] border bg-white p-3 text-left transition-all ${
                    isSelected
                      ? 'border-[var(--dotti-berry)] bg-[var(--dotti-blush)] shadow-sm'
                      : 'border-[var(--dotti-border)] hover:border-[var(--dotti-pink)]'
                  }`}
                >
                  <ConnectionPreview method={option.id} selected={isSelected} />
                  <span className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-lg font-black">{productConnectionLabels[option.id]}</span>
                    <span
                      className={`grid size-7 place-items-center rounded-full ${
                        isSelected ? 'bg-[var(--dotti-berry)] text-white' : 'bg-[var(--dotti-bg)] text-[var(--dotti-muted)]'
                      }`}
                    >
                      {isSelected && <Check className="size-4" />}
                    </span>
                  </span>
                  <span className="mt-2 block text-sm font-bold leading-6 text-[var(--dotti-muted)]">{option.description}</span>
                  <span className="mt-3 block rounded-full bg-white/80 px-3 py-2 text-xs font-black text-[var(--dotti-berry)]">
                    {option.suitable}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="rounded-[32px] bg-white p-5 shadow-sm ring-1 ring-[var(--dotti-border)] xl:sticky xl:top-5 xl:self-start">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-[var(--dotti-berry)]">Your Design</p>
              <h2 className="mt-1 text-2xl font-black">Your Felti Preview</h2>
              <p className="mt-1 text-sm font-bold text-[var(--dotti-muted)]">The accessory you just designed.</p>
            </div>
            <div className="grid size-32 shrink-0 place-items-center overflow-hidden rounded-[26px] bg-[var(--dotti-bg)] ring-1 ring-[var(--dotti-border)] sm:size-36 xl:size-40">
              <DesignThumbnail design={design} />
            </div>
          </div>
          <div className="mt-4 rounded-[28px] bg-[var(--dotti-bg)] p-4">
            <p className="mb-3 text-xs font-black uppercase tracking-wide text-[var(--dotti-berry)]">Connection</p>
            <ConnectionPreview method={selected} compact selected />
            <p className="mt-3 text-sm font-black">Selected: {productConnectionLabels[selected]}</p>
          </div>
          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between rounded-2xl bg-[var(--dotti-bg)] px-4 py-3"><dt>Decorations</dt><dd className="font-black">{price.decorationCount}</dd></div>
            <div className="flex justify-between rounded-2xl bg-[var(--dotti-bg)] px-4 py-3"><dt>Detachable</dt><dd className="font-black">{design.decorationsDetachable ? 'Yes · Velcro' : 'No'}</dd></div>
            <div className="flex justify-between rounded-2xl bg-[var(--dotti-bg)] px-4 py-3"><dt>Total</dt><dd className="font-black">฿{price.total}</dd></div>
          </dl>
          <div className="mt-5 grid gap-2">
            <Button variant="outline" className="rounded-full bg-white" onClick={onBack}>
              <RotateCcw className="size-4" />
              Back to Design
            </Button>
            <Button className="rounded-full bg-[var(--dotti-berry)] text-white hover:bg-[var(--dotti-berry-dark)]" onClick={onConfirm}>
              <ShoppingCart className="size-4" />
              Confirm & Add to Cart
            </Button>
          </div>
        </aside>
      </div>
    </section>
  );
}

function ConnectionPreview({
  method,
  compact = false,
  selected = false,
}: {
  method: ProductConnectionMethod;
  compact?: boolean;
  selected?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[24px] bg-white shadow-sm ring-1 ring-[var(--dotti-border)] ${
        compact ? 'aspect-[16/7]' : 'aspect-[16/7] transition-transform group-hover:scale-[1.015]'
      }`}
    >
      <img
        src={previewImages[method]}
        alt={`${productConnectionLabels[method]} connection preview`}
        className="h-full w-full object-contain"
        draggable={false}
      />
      <span className="absolute right-3 top-3 size-12 rounded-full bg-white/85 backdrop-blur-sm" />
      {selected && (
        <span className="absolute right-3 top-3 grid size-12 place-items-center rounded-full bg-[var(--dotti-berry)] text-white shadow-sm">
          <Check className="size-6" />
        </span>
      )}
    </div>
  );
}
