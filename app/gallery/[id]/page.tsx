'use client';

import { ProductArt } from '@/components/common/product-art';
import { PageShell } from '@/components/common/page-shell';
import { Button } from '@/components/ui/button';
import { galleryDesigns } from '@/data/mock-commerce';

export default function GalleryDetailPage({ params }: { params: { id: string } }) {
  const design = galleryDesigns.find((item) => item.id === params.id) ?? galleryDesigns[0];
  return (
    <PageShell title={design.title} eyebrow="Design Detail">
      <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1fr]">
        <ProductArt assetIds={design.assetIds} className="min-h-[480px]" />
        <section className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-[var(--dotti-border)]">
          <p className="font-bold text-[var(--dotti-muted)]">Created by {design.creator}</p>
          <p className="mt-3 text-lg leading-8 text-[var(--dotti-muted)]">
            A public Felti design saved as structured canvas data. Use it as inspiration, or start a separate editable copy in the studio.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button render={<a href="/gallery" />} variant="outline" className="rounded-full bg-white">Use as Inspiration</Button>
            <Button render={<a href={`/diy?template=${design.id}`} />} className="rounded-full bg-[var(--dotti-berry)] text-white hover:bg-[var(--dotti-berry-dark)]">Customize This Design</Button>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
