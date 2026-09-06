import { products as seedProducts } from '@/data/mock-commerce';
import { hasSupabaseEnv } from '@/lib/supabase/env';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import type { Product } from '@/types/commerce';

import { ShopClient } from './shop-client';

export const dynamic = 'force-dynamic';

type ProductRow = {
  id: string;
  product_json: Product;
  active: boolean;
};

async function getInitialProducts() {
  if (!hasSupabaseEnv()) return seedProducts;

  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from('products')
      .select('id, product_json, active')
      .eq('active', true)
      .order('updated_at', { ascending: false });

    if (error) return seedProducts;
    return ((data ?? []) as ProductRow[]).map((row) => ({ ...row.product_json, id: row.id, active: row.active }));
  } catch {
    return seedProducts;
  }
}

export default async function ShopPage() {
  const initialProducts = await getInitialProducts();
  return <ShopClient initialProducts={initialProducts} />;
}
