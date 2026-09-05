'use client';

import { ArrowLeft, Crown, Lock, Search, Trash2, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { assetCategories, pricedDottiAssets } from '@/data/assets';
import type { AssetCategory, DottiAsset } from '@/types/dotti';

type AssetSidebarProps = {
  selectedCategory: AssetCategory | 'All';
  assetFilter: 'All' | 'Free' | 'VIP' | 'Recently used' | 'Favorites';
  searchTerm: string;
  onCategoryChange: (category: AssetCategory | 'All') => void;
  onAssetFilterChange: (filter: 'All' | 'Free' | 'VIP' | 'Recently used' | 'Favorites') => void;
  onSearchChange: (value: string) => void;
  onAddAsset: (asset: DottiAsset) => void;
  canUseVIP: boolean;
  uploads: DottiAsset[];
  onLockedVIP: () => void;
  onUploadDecoration: () => void;
  onDeleteUpload: (asset: DottiAsset) => void;
};

export function AssetSidebar({
  selectedCategory,
  assetFilter,
  searchTerm,
  onCategoryChange,
  onAssetFilterChange,
  onSearchChange,
  onAddAsset,
  canUseVIP,
  uploads,
  onLockedVIP,
  onUploadDecoration,
  onDeleteUpload,
}: AssetSidebarProps) {
  const allAssets = [...pricedDottiAssets, ...uploads];
  const categories = [
    ...assetCategories.map((category) => ({
      key: category,
      label: category === 'Fruits' ? 'Food & Fruits' : category,
      count: allAssets.filter((asset) => asset.category === category).length,
      vip: false,
    })),
    { key: 'My Uploads' as const, label: 'My Uploads', count: uploads.length, vip: true },
  ];
  const showingUploads = selectedCategory === 'All' && assetFilter === 'Recently used';
  const assets = allAssets.filter((asset) => {
    const categoryMatch =
      showingUploads || selectedCategory === 'All' ? true : asset.category === selectedCategory;
    const uploadMatch = showingUploads ? asset.source === 'upload' : true;
    const filterMatch =
      assetFilter === 'All' ||
      (assetFilter === 'Free' && !asset.isVIP) ||
      (assetFilter === 'VIP' && asset.isVIP) ||
      (assetFilter === 'Recently used' && asset.source === 'upload') ||
      assetFilter === 'Favorites';
    const searchMatch = asset.name.toLowerCase().includes(searchTerm.toLowerCase());
    return categoryMatch && uploadMatch && filterMatch && searchMatch;
  });

  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-[var(--dotti-border)] bg-white/86">
      <div className="border-b border-[var(--dotti-border)] p-4">
        <p className="text-xs font-black uppercase tracking-wide text-[var(--dotti-muted)]">What do I want to add?</p>
        <h2 className="text-lg font-black">Decorations</h2>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--dotti-muted)]" />
          <Input
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search decorations"
            className="rounded-full border-[var(--dotti-border)] bg-[var(--dotti-bg)] pl-9"
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-[var(--dotti-border)] p-3">
        {(['All', 'Free', 'VIP', 'Favorites'] as const).map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => onAssetFilterChange(filter)}
            className={`shrink-0 rounded-full px-3 py-2 text-xs font-black ${
              assetFilter === filter ? 'bg-[var(--dotti-berry)] text-white' : 'bg-[var(--dotti-bg)] text-[var(--dotti-muted)]'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>
      <div className="border-b border-[var(--dotti-border)] p-3">
        <div className="mb-3 rounded-2xl bg-[var(--dotti-bg)] px-3 py-2 text-xs font-bold leading-5 text-[var(--dotti-muted)]">
          <b className="text-[var(--dotti-ink)]">Keep your design simple.</b> Clear outlines, few colors, and larger details work best for handmade felt production.
        </div>
        <button
          type="button"
          onClick={canUseVIP ? onUploadDecoration : onLockedVIP}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-[var(--dotti-muted)] ring-1 ring-[var(--dotti-border)] hover:bg-[var(--dotti-blush)]"
        >
          <Upload className="size-4" />
          Upload Decoration
          <Crown className={`size-4 ${canUseVIP ? 'text-[var(--dotti-gold)]' : 'text-[var(--dotti-muted)]'}`} />
        </button>
      </div>
      {selectedCategory === 'All' && !showingUploads ? (
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="grid gap-3">
            {categories.map((category) => (
              <button
                key={category.key}
                type="button"
                onClick={() => {
                  if (category.key === 'My Uploads') {
                    if (!canUseVIP) onLockedVIP();
                    else onAssetFilterChange('Recently used');
                    return;
                  }
                  onCategoryChange(category.key);
                }}
                className="flex items-center justify-between rounded-3xl border border-[var(--dotti-border)] bg-white px-4 py-4 text-left shadow-sm hover:border-[var(--dotti-pink)] hover:bg-[var(--dotti-blush)]"
              >
                <span>
                  <span className="block font-black">
                    {category.label} {category.vip && <Crown className="inline size-4 text-[var(--dotti-gold)]" />}
                  </span>
                  <span className="text-sm text-[var(--dotti-muted)]">{category.count} items →</span>
                </span>
                {category.vip && !canUseVIP ? <Lock className="size-4 text-[var(--dotti-muted)]" /> : <span className="text-[var(--dotti-muted)]">→</span>}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <button
            type="button"
            onClick={() => {
              onCategoryChange('All');
              if (assetFilter === 'Recently used') onAssetFilterChange('All');
            }}
            className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--dotti-bg)] px-3 py-2 text-sm font-black text-[var(--dotti-muted)]"
          >
            <ArrowLeft className="size-4" />
            All Categories
          </button>
          <div className="grid grid-cols-2 gap-3">
            {assets.map((asset) => (
              <div key={asset.id} className="relative">
                <Button
                  variant="outline"
                  draggable={!asset.isVIP || canUseVIP}
                  onDragStart={(event) => {
                    if (asset.isVIP && !canUseVIP) {
                      event.preventDefault();
                      onLockedVIP();
                      return;
                    }
                    event.dataTransfer.setData('text/dotti-asset', asset.id);
                    event.dataTransfer.effectAllowed = 'copy';
                  }}
                  onClick={() => onAddAsset(asset)}
                  className="relative h-36 w-full flex-col gap-2 rounded-3xl border-[var(--dotti-border)] bg-white p-3 hover:border-[var(--dotti-pink)] hover:bg-[var(--dotti-blush)]"
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
                  <span className="text-xs font-black text-[var(--dotti-berry)]">+฿{asset.productionPrice ?? (asset.isVIP ? 15 : 8)}</span>
                </Button>
                {asset.source === 'upload' && (
                  <button
                    type="button"
                    aria-label={`Delete ${asset.name}`}
                    title={`Delete ${asset.name}`}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onDeleteUpload(asset);
                    }}
                    className="absolute left-2 top-2 grid size-8 place-items-center rounded-full bg-white/95 text-red-600 shadow-sm ring-1 ring-[var(--dotti-border)] hover:bg-red-50"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            ))}
            {assets.length === 0 && (
              <div className="col-span-2 rounded-3xl bg-[var(--dotti-bg)] p-6 text-center text-sm text-[var(--dotti-muted)]">
                No decorations found.
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
