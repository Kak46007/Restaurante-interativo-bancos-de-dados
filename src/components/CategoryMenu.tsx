import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { CATEGORIES, PRODUCTS, type Category, type Product } from '@/data/products';
import { fetchProductConfigs, applyConfigs, getSoldOutIds, type ProductConfig } from '@/utils/productsConfig';
import ProductCard from '@/components/ProductCard';

interface CategoryMenuProps {
  onProductClick: (product: Product) => void;
  onProductAdd: (product: Product) => void;
  onSmartView: (product: Product) => void;
}

const CATEGORY_LABELS: Record<Category, string> = {
  'SMASH BURGERS': 'Smash Burguer artesanais',
  'HAMBÚRGUERES TRADICIONAIS': 'Lanches tradicionais',
  'DOGÃO GOURMET': 'Dogão gourmet',
  'MABELLY TACOS': 'Tacos os mexicanos',
  'COMBOS INDIVIDUAIS': 'Combos individuais com lanches artesanais',
  'COMBOS PROMOCIONAIS': 'Combos promocionais',
  'MABELLY PORÇÕES': 'Porções',
  'PIZZAS': 'Pizzas',
  'FRANGO': 'Frango',
  'BEBIDAS': 'Bebidas',
  'SOBREMESAS': 'Sobremesas',
};

export default function CategoryMenu({ onProductClick, onProductAdd, onSmartView }: CategoryMenuProps) {
  const [expanded, setExpanded] = useState<Category | null>(CATEGORIES[0] ?? null);
  const [configs, setConfigs] = useState<Record<string, ProductConfig>>({});

  useEffect(() => {
    fetchProductConfigs().then(setConfigs).catch(() => {});
  }, []);

  const toggle = (category: Category) => {
    setExpanded((prev) => (prev === category ? null : category));
  };

  const allProducts = applyConfigs(PRODUCTS, configs);
  const soldOutIds = getSoldOutIds(configs);

  return (
    <section className="relative z-20 border-y border-champagne-500/10 bg-ink-900/80 py-8 md:py-10">
      <div className="max-w-7xl mx-auto px-5 lg:px-10">
        <div className="flex items-end justify-between gap-4 mb-5 md:mb-6">
          <div>
            <span className="text-[10px] tracking-[0.3em] uppercase text-champagne-500">Explore o cardápio</span>
            <h2 className="font-display text-2xl md:text-3xl text-champagne-500 mt-1">Categorias</h2>
          </div>
          <span className="hidden sm:block text-xs text-champagne-500">Toque para abrir</span>
        </div>

        <div className="space-y-3">
          {CATEGORIES.map((category, index) => {
            const isOpen = expanded === category;
            const categoryProducts = allProducts.filter((p) => p.category === category);
            const categoryImage = categoryProducts[0]?.image ?? '/images/image.png';

            return (
              <div
                key={category}
                className={`rounded-2xl border overflow-hidden transition-colors duration-300 ${
                  isOpen
                    ? 'border-yellow-300/40 bg-champagne-500/8'
                    : 'border-champagne-500/15 bg-ink-800/70'
                }`}
              >
                {/* Category header — clickable */}
                <motion.button
                  type="button"
                  onClick={() => toggle(category)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.04 }}
                  className="w-full flex items-center gap-4 p-3 md:p-4 text-left"
                >
                  <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden shrink-0 bg-ink-800">
                    <img
                      src={categoryImage}
                      alt={CATEGORY_LABELS[category]}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-900/60 to-transparent" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className={`block text-sm md:text-base leading-tight ${isOpen ? 'text-champagne-500' : 'text-champagne-500'}`}>
                      {CATEGORY_LABELS[category]}
                    </span>
                    <span className="block text-[10px] uppercase tracking-[0.14em] text-champagne-500 mt-0.5">
                      {categoryProducts.length} {categoryProducts.length === 1 ? 'opção' : 'opções'}
                    </span>
                  </div>

                  <div className={`shrink-0 w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-300 ${
                    isOpen
                      ? 'border-yellow-300/50 bg-yellow-300/15 rotate-180'
                      : 'border-champagne-500/20'
                  }`}>
                    <ChevronDown className={`w-5 h-5 ${isOpen ? 'text-champagne-500' : 'text-champagne-500'}`} />
                  </div>
                </motion.button>

                {/* Products — expand inline */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-4 md:px-4 md:pb-5">
                        <div className="h-px bg-gradient-to-r from-transparent via-champagne-500/20 to-transparent mb-4" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                          {categoryProducts.map((product, pIndex) => (
                            <ProductCard
                              key={product.id}
                              product={product}
                              index={pIndex}
                              soldOut={soldOutIds.has(product.id)}
                              onClick={() => onProductClick(product)}
                              onAdd={() => onProductAdd(product)}
                              onSmartView={() => onSmartView(product)}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
