import type { BaseSize, DesignState } from '@/types/dotti';
import type { PricingConfig } from '@/types/commerce';

export const defaultPricingConfig: PricingConfig = {
  base: {
    S: 99,
    M: 119,
    L: 139,
  },
  standardDecoration: 8,
  premiumDecoration: 15,
  customDecoration: 30,
  customBase: 30,
  detachableDecoration: 2,
  vipMonthly: 79,
};

export const basePrices: Record<BaseSize, number> = {
  S: 99,
  M: 119,
  L: 139,
};

export const baseSizeLabels: Record<BaseSize, string> = {
  S: 'S · 5 cm',
  M: 'M · 7 cm',
  L: 'L · 9 cm',
};

export type PriceLine = {
  label: string;
  detail: string;
  amount: number;
};

export function calculateDesignPrice(design: DesignState, pricing: PricingConfig = defaultPricingConfig) {
  const baseSize = design.baseSize ?? 'M';
  const lines: PriceLine[] = [
    {
      label: 'Base',
      detail: `${baseSizeLabels[baseSize]} felt base`,
      amount: pricing.base[baseSize],
    },
  ];

  if (design.customBaseUrl) {
    lines.push({ label: 'Custom base', detail: 'Uploaded base image', amount: pricing.customBase });
  }

  const grouped = new Map<string, { name: string; count: number; amount: number; crown: boolean }>();
  for (const element of design.elements) {
    const price =
      element.source === 'upload'
        ? pricing.customDecoration
        : element.source === 'premium'
          ? pricing.premiumDecoration
          : element.productionPrice ?? pricing.standardDecoration;
    const key = `${element.assetId}:${price}:${element.source}`;
    const current = grouped.get(key) ?? {
      name: element.assetName,
      count: 0,
      amount: price,
      crown: element.source === 'premium' || element.source === 'upload',
    };
    current.count += 1;
    grouped.set(key, current);
  }

  for (const item of grouped.values()) {
    lines.push({
      label: item.crown ? `${item.name} 👑` : item.name,
      detail: `${item.name} × ${item.count}`,
      amount: item.amount * item.count,
    });
  }

  const detachableFee = design.decorationsDetachable
    ? design.elements.length * (pricing.detachableDecoration ?? defaultPricingConfig.detachableDecoration)
    : 0;
  if (detachableFee > 0) {
    lines.push({
      label: 'Detachable Velcro',
      detail: `${design.elements.length} decorations × ฿${pricing.detachableDecoration ?? defaultPricingConfig.detachableDecoration}`,
      amount: detachableFee,
    });
  }

  return {
    baseSize,
    lines,
    decorationCount: design.elements.length,
    detachableFee,
    total: lines.reduce((sum, line) => sum + line.amount, 0),
  };
}
