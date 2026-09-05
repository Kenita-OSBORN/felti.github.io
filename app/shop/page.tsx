'use client';

import { ProductArt } from '@/components/common/product-art';
import { PageShell } from '@/components/common/page-shell';
import { Button } from '@/components/ui/button';
import { products } from '@/data/mock-commerce';
import { dottiApi } from '@/lib/dotti-api';

export default function ShopPage() {
  const addProduct = async (product: (typeof products)[number]) => {
    try {
      await dottiApi.addCart({ productId: product.id, productName: product.name, price: product.price, quantity: 1 });
      window.dispatchEvent(new Event('dotti-storage'));
    } catch {
      window.location.href = '/login?returnTo=/shop';
    }
  };

  return (
    <PageShell title="Shop" eyebrow="Finished Accessories">
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <article key={product.id} className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-[var(--dotti-border)]">
            <ProductArt assetIds={product.assetIds} />
            <p className="mt-4 text-xs font-black uppercase text-[var(--dotti-berry)]">{product.category}</p>
            <h2 className="mt-1 text-xl font-black">{product.name}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--dotti-muted)]">{product.description}</p>
            <p className="mt-3 font-black">฿{product.price}</p>
            <p className="text-sm text-[var(--dotti-muted)]">{product.stock} in stock</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button onClick={() => void addProduct(product)} className="rounded-full bg-[var(--dotti-berry)] text-white hover:bg-[var(--dotti-berry-dark)]">Add</Button>
              <Button render={<a href={`/shop/${product.id}`} />} variant="outline" className="rounded-full bg-white">View</Button>
            </div>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
