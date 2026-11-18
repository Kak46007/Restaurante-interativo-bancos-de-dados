import { supabase } from '@/lib/supabase';
import { PRODUCTS, type Product } from '@/data/products';

export interface ProductConfig {
  product_id: string;
  sold_out: boolean;
  price: number | null;
  price_label: string | null;
  name: string | null;
  description: string | null;
  long_description: string | null;
}

export async function fetchProductConfigs(): Promise<Record<string, ProductConfig>> {
  const { data, error } = await supabase.from('products_config').select('*');
  if (error) return {};
  const map: Record<string, ProductConfig> = {};
  for (const row of data ?? []) {
    map[row.product_id] = row as ProductConfig;
  }
  return map;
}

export async function updateProductConfig(
  productId: string,
  fields: Partial<Omit<ProductConfig, 'product_id'>>,
): Promise<void> {
  const { error } = await supabase
    .from('products_config')
    .upsert({
      product_id: productId,
      ...fields,
      updated_at: new Date().toISOString(),
    });
  if (error) throw error;
}

export function applyConfigs(
  products: Product[],
  configs: Record<string, ProductConfig>,
): Product[] {
  return products.map((p) => {
    const cfg = configs[p.id];
    if (!cfg) return p;
    return {
      ...p,
      name: cfg.name ?? p.name,
      description: cfg.description ?? p.description,
      longDescription: cfg.long_description ?? p.longDescription,
      price: cfg.price != null ? Number(cfg.price) : p.price,
      priceLabel: cfg.price_label ?? p.priceLabel,
    };
  });
}

export function getSoldOutIds(configs: Record<string, ProductConfig>): Set<string> {
  const set = new Set<string>();
  for (const [id, cfg] of Object.entries(configs)) {
    if (cfg.sold_out) set.add(id);
  }
  return set;
}

export { PRODUCTS };
