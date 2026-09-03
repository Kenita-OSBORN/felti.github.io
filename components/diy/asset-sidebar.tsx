'use client';

import { Crown, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { assetCategories, dottiAssets } from '@/data/assets';
import type { AssetCategory, DottiAsset } from '@/types/dotti';

type AssetSidebarProps = {
  selectedCategory: AssetCategory | 'All';
  searchTerm: string;
  onCategoryChange: (category: AssetCategory | 'All') => void;
  onSearchChange: (value: string) => void;
  onAddAsset: (asset: DottiAsset) => void;
};

export function AssetSidebar({
  selectedCategory,
  searchTerm,
  onCategoryChange,
  onSearchChange,
  onAddAsset,
}: AssetSidebarProps) {
  const assets = dottiAssets.filter((asset) => {
    const categoryMatch = selectedCategory === 'All' || asset.category === selectedCategory;
    const searchMatch = asset.name.toLowerCase().includes(searchTerm.toLowerCase());
    return categoryMatch && searchMatch;
  });

  return (
    <aside className="flex min-h-0 flex-col border-r border-[var(--dotti-border)] bg-white/86">
      <div className="border-b border-[var(--dotti-border)] p-4">
        <h2 className="text-lg font-black">Decorations</h2>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--dotti-muted)]" />
          <Input
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search assets"
            className="rounded-full border-[var(--dotti-border)] bg-[var(--dotti-bg)] pl-9"
          />
        </div>
      </div>

      <Tabs value={selectedCategory} onValueChange={(value) => onCategoryChange(value as AssetCategory | 'All')} className="min-h-0 flex-1">
        <div className="border-b border-[var(--dotti-border)] p-3">
          <TabsList className="grid h-auto grid-cols-2 gap-2 rounded-3xl bg-[var(--dotti-bg)] p-2">
            {(['All', ...assetCategories] as const).map((category) => (
              <TabsTrigger key={category} value={category} className="rounded-full text-xs">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-y-auto p-4">
          {assets.map((asset) => (
            <Button
              key={asset.id}
              variant="outline"
              draggable={!asset.isVIP}
              onDragStart={(event) => {
                event.dataTransfer.setData('text/dotti-asset', asset.id);
                event.dataTransfer.effectAllowed = 'copy';
              }}
              onClick={() => onAddAsset(asset)}
              className="relative h-32 flex-col gap-2 rounded-3xl border-[var(--dotti-border)] bg-white p-3 hover:border-[var(--dotti-pink)] hover:bg-[var(--dotti-blush)]"
              title={asset.isVIP ? 'VIP decoration' : `Add ${asset.name}`}
            >
              {asset.isVIP && (
                <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-[var(--dotti-gold)] px-2 py-0.5 text-[10px] font-black text-[var(--dotti-brown)]">
                  <Crown className="size-3" />
                  VIP
                </span>
              )}
              <img src={asset.imageUrl} alt="" className="h-14 w-14 object-contain" />
              <span className="whitespace-normal text-center text-xs font-bold leading-tight text-[var(--dotti-ink)]">
                {asset.name}
              </span>
            </Button>
          ))}
          {assets.length === 0 && (
            <div className="col-span-2 rounded-3xl bg-[var(--dotti-bg)] p-6 text-center text-sm text-[var(--dotti-muted)]">
              No decorations found.
            </div>
          )}
        </div>
      </Tabs>
    </aside>
  );
}
