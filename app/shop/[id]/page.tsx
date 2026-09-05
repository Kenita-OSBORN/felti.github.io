'use client';

import { Heart } from 'lucide-react';

import { ProductArt } from '@/components/common/product-art';
import { PageShell } from '@/components/common/page-shell';
import { Button } from '@/components/ui/button';
import { products } from '@/data/mock-commerce';
import { dottiApi } from '@/lib/dotti-api';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = products.find((item) => item.id === params.id) ?? products[0];
  const addProduct = async (goCheckout = false) => {
    try {
      await dottiApi.addCart({ productId: product.id, productName: product.name, price: product.price, quantity: 1 });
      window.location.href = goCheckout ? '/checkout' : '/cart';
    } catch {
      window.location.href = `/login?returnTo=${encodeURIComponent(`/shop/${product.id}`)}`;
    }
  };
  return (
    <PageShell title={product.name} eyebrow="Product Detail">
      <div className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1fr]">
        <div>
          <ProductArt assetIds={product.assetIds} className="min-h-[520px]" />
          <div className="mt-3 grid grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((item) => <ProductArt key={item} assetIds={product.assetIds} />)}
          </div>
        </div>
        <section className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-[var(--dotti-border)]">
          <p className="text-3xl font-black">฿{product.price}</p>
          <p className="mt-4 text-lg leading-8 text-[var(--dotti-muted)]">{product.description}</p>
          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl bg-[var(--dotti-bg)] p-4"><dt className="text-sm font-bold text-[var(--dotti-muted)]">Material</dt><dd className="font-black">{product.material}</dd></div>
            <div className="rounded-3xl bg-[var(--dotti-bg)] p-4"><dt className="text-sm font-bold text-[var(--dotti-muted)]">Stock</dt><dd className="font-black">{product.stock} available</dd></div>
          </dl>
          <label className="mt-6 block text-sm font-bold">Quantity<input className="mt-2 h-11 w-24 rounded-full border border-[var(--dotti-border)] px-4" type="number" min="1" defaultValue="1" /></label>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => void addProduct()} className="rounded-full bg-[var(--dotti-berry)] text-white hover:bg-[var(--dotti-berry-dark)]">Add to Cart</Button>
            <Button onClick={() => void addProduct(true)} className="rounded-full bg-[var(--dotti-ink)] text-white">Buy Now</Button>
            <Button variant="outline" className="rounded-full bg-white"><Heart className="size-4" /> Favorite</Button>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
