'use client';

import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ProductArt } from '@/components/common/product-art';
import { PageShell } from '@/components/common/page-shell';
import { Button } from '@/components/ui/button';
import { products } from '@/data/mock-commerce';
import { dottiApi } from '@/lib/dotti-api';
import type { Product } from '@/types/commerce';

const favoritesKey = 'felti-product-favorites-v1';

function readFavorites() {
  try {
    return JSON.parse(localStorage.getItem(favoritesKey) ?? '[]') as string[];
  } catch {
    return [];
  }
}

export default function ShopPage() {
  const [shopProducts, setShopProducts] = useState<Product[]>(products);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setFavorites(readFavorites());
    dottiApi.listProducts().then(({ products }) => setShopProducts(products)).catch(() => setShopProducts(products));
  }, []);

  const addProduct = async (product: Product) => {
    try {
      await dottiApi.addCart({ itemType: 'product', productId: product.id, productName: product.name, price: product.price, quantity: 1, previewImage: product.imageUrl });
      window.dispatchEvent(new Event('dotti-storage'));
    } catch {
      window.location.href = '/login?returnTo=/shop';
    }
  };

  const toggleFavorite = (productId: string) => {
    const next = favorites.includes(productId) ? favorites.filter((id) => id !== productId) : [...favorites, productId];
    setFavorites(next);
    localStorage.setItem(favoritesKey, JSON.stringify(next));
  };

  return (
    <PageShell title="Shop" eyebrow="Finished Accessories">
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {shopProducts.map((product) => {
          const favorite = favorites.includes(product.id);
          return (
          <article key={product.id} className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-[var(--dotti-border)]">
            <ProductArt assetIds={product.assetIds} imageUrl={product.imageUrl} alt={product.name} />
            <p className="mt-4 text-xs font-black uppercase text-[var(--dotti-berry)]">{product.category}</p>
            <h2 className="mt-1 text-xl font-black">{product.name}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--dotti-muted)]">{product.description}</p>
            <p className="mt-3 font-black">฿{product.price}</p>
            <p className="text-sm text-[var(--dotti-muted)]">{product.stock} in stock</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button onClick={() => void addProduct(product)} className="rounded-full bg-[var(--dotti-berry)] text-white hover:bg-[var(--dotti-berry-dark)]">Add</Button>
              <Button render={<a href={`/shop/${product.id}`} />} variant="outline" className="rounded-full bg-white">View</Button>
            </div>
            <Button
              variant="ghost"
              className={`mt-3 w-full rounded-full ${favorite ? 'text-[var(--dotti-berry)]' : 'text-[var(--dotti-muted)]'}`}
              onClick={() => toggleFavorite(product.id)}
            >
              <Heart className={`size-4 ${favorite ? 'fill-current' : ''}`} />
              {favorite ? 'Favorited' : 'Favorite'}
            </Button>
          </article>
          );
        })}
      </div>
    </PageShell>
  );
}
