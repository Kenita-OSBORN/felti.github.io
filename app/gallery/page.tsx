'use client';

import { Heart } from 'lucide-react';

import { PageShell } from '@/components/common/page-shell';
import { ProductArt } from '@/components/common/product-art';
import { Button } from '@/components/ui/button';
import { galleryDesigns } from '@/data/mock-commerce';

export default function GalleryPage() {
  const filters = ['Popular', 'Newest', 'Cute', 'Floral', 'Animal', 'Food', 'Seasonal', 'VIP designs'];
  return (
    <PageShell title="Design Gallery" eyebrow="Explore">
      <div className="mt-6 flex flex-wrap gap-2">
        {filters.map((filter) => <Button key={filter} variant="outline" className="rounded-full bg-white">{filter}</Button>)}
      </div>
      <div className="mt-8 columns-1 gap-5 sm:columns-2 lg:columns-3">
        {galleryDesigns.map((design, index) => (
          <article key={design.id} className="mb-5 break-inside-avoid rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-[var(--dotti-border)]">
            <ProductArt assetIds={design.assetIds} className={index % 2 ? 'min-h-[280px]' : 'min-h-[220px]'} />
            <div className="mt-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">{design.title}</h2>
                <p className="text-sm text-[var(--dotti-muted)]">by {design.creator} · {design.likes} likes</p>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full"><Heart className="size-5" /></Button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button render={<a href={`/gallery/${design.id}`} />} variant="outline" className="rounded-full">View</Button>
              <Button render={<a href={`/diy?template=${design.id}`} />} className="rounded-full bg-[var(--dotti-berry)] text-white hover:bg-[var(--dotti-berry-dark)]">Customize This</Button>
            </div>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
