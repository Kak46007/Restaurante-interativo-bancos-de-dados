import { useState, useMemo, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingBag, RotateCw, Camera, Check } from 'lucide-react';
import type { Product } from '@/data/products';
import { useCart, type IngredientModification, type ItemCustomizations } from '@/context/CartContext';

const Product3DViewer = lazy(() => import('@/components/Product3DViewer'));

interface ProductModalProps {
  product: Product | null;
  soldOut?: boolean;
  onClose: () => void;
  onSmartView: () => void;
}

const COMMON_INGREDIENTS = [
  'cebola roxa',
  'cebola',
  'alface',
  'tomate',
  'maionese verde',
  'maionese',
  'queijo prato',
  'cheddar',
  'bacon',
  'calabresa',
  'milho',
  'ketchup',
  'batata palha',
  'ovo',
  'pimenta',
];

const EXTRA_OPTIONS = [
  { label: 'Adicional de bacon', price: 6 },
  { label: 'Cheddar cremoso', price: 6 },
  { label: 'Ovo', price: 3 },
  { label: 'Calabresa', price: 6 },
  { label: 'Ketchup', price: 3 },
  { label: 'Smash Burguer 60gms', price: 8 },
  { label: 'Onions empanado', price: 10 },
  { label: 'Maionese verde temperada', price: 4 },
];

const CUSTOMIZABLE_CATEGORIES = new Set([
  'SMASH BURGERS',
  'HAMBÚRGUERES TRADICIONAIS',
  'DOGÃO GOURMET',
  'MABELLY TACOS',
]);

function extractIngredients(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const ing of COMMON_INGREDIENTS) {
    if (lower.includes(ing) && !found.some((f) => f !== ing && f.includes(ing))) {
      found.push(ing);
    }
  }
  return found;
}

export default function ProductModal({ product, soldOut, onClose, onSmartView }: ProductModalProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [removedIngredients, setRemovedIngredients] = useState<Set<string>>(new Set());
  const [addedExtras, setAddedExtras] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');

  const availableIngredients = useMemo(() => {
    if (!product || !CUSTOMIZABLE_CATEGORIES.has(product.category)) return [];
    return extractIngredients(product.longDescription);
  }, [product]);

  const extraTotal = useMemo(
    () => EXTRA_OPTIONS.reduce((sum, extra) => (addedExtras.has(extra.label) ? sum + extra.price : sum), 0),
    [addedExtras],
  );

  useEffect(() => {
    setQuantity(1);
    setRemovedIngredients(new Set());
    setAddedExtras(new Set());
    setNotes('');
  }, [product?.id]);

  const toggleRemove = (ingredient: string) => {
    setRemovedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(ingredient)) next.delete(ingredient);
      else next.add(ingredient);
      return next;
    });
  };

  const toggleAdd = (extra: string) => {
    setAddedExtras((prev) => {
      const next = new Set(prev);
      if (next.has(extra)) next.delete(extra);
      else next.add(extra);
      return next;
    });
  };

  const handleAdd = () => {
    if (!product || product.priceLabel || soldOut) return;
    const modifications: IngredientModification[] = [];
    for (const ing of removedIngredients) {
      modifications.push({ action: 'remove', ingredient: ing });
    }
    for (const extra of EXTRA_OPTIONS) {
      if (addedExtras.has(extra.label)) {
        modifications.push({ action: 'add', ingredient: extra.label, price: extra.price });
      }
    }
    const customizations: ItemCustomizations | undefined =
      modifications.length > 0 || notes.trim()
        ? { modifications, notes: notes.trim() }
        : undefined;
    addItem(product, quantity, customizations);
    setQuantity(1);
    setRemovedIngredients(new Set());
    setAddedExtras(new Set());
    setNotes('');
    onClose();
  };

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 md:p-6"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-ink-900/85 backdrop-blur-md" />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-4xl max-h-[92vh] overflow-y-auto hide-scrollbar rounded-3xl glass-strong border border-champagne-500/20 gold-glow"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 w-9 h-9 md:w-10 md:h-10 rounded-full glass border border-champagne-500/20 flex items-center justify-center hover:border-champagne-500/50 transition-colors duration-300"
            >
              <X className="w-4 h-4 md:w-5 h-5 text-champagne-500" />
            </button>

            <div className="grid md:grid-cols-2 gap-0">
              {/* Visual */}
              <div className="relative h-64 sm:h-80 md:h-full md:min-h-[480px] bg-gradient-to-br from-ink-700 to-ink-900">
                <Suspense
                  fallback={
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-12 h-12 border-2 border-champagne-500/20 border-t-champagne-500 rounded-full animate-spin" />
                    </div>
                  }
                >
                  <Product3DViewer
                    modelPath={product.model3d}
                    image={product.image}
                    alt={product.name}
                    autoRotate
                    className="w-full h-full min-h-[280px]"
                  />
                </Suspense>

                <button
                  onClick={onSmartView}
                  className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-full bg-yellow-500/90 text-black text-[10px] tracking-[0.12em] uppercase hover:bg-yellow-400 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Ver na câmera
                </button>

                {/* Drag hint */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full glass-strong border border-champagne-500/15">
                  <RotateCw className="w-3 h-3 text-champagne-500 animate-spin" style={{ animationDuration: '3s' }} />
                  <span className="text-[10px] tracking-[0.15em] uppercase text-champagne-500">
                    Arraste para visualizar
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="p-6 md:p-8 lg:p-10 flex flex-col">
                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-full text-[9px] tracking-[0.1em] uppercase glass text-champagne-500 border border-champagne-500/15"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <h2 className="font-display text-3xl md:text-4xl font-medium text-gradient-gold mb-3">
                  {product.name}
                </h2>

                <p className="text-sm md:text-base text-champagne-500 leading-relaxed mb-5">
                  {product.longDescription}
                </p>

                {/* Ingredient customization */}
                {availableIngredients.length > 0 && !product.priceLabel && !soldOut && (
                  <div className="mb-5 space-y-4">
                    {/* Remove ingredients */}
                    <div>
                      <p className="text-[10px] tracking-[0.2em] uppercase text-champagne-500 mb-2">
                        Retirar ingredientes
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {availableIngredients.map((ing) => {
                          const isRemoved = removedIngredients.has(ing);
                          return (
                            <button
                              key={ing}
                              onClick={() => toggleRemove(ing)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all duration-200 capitalize ${
                                isRemoved
                                  ? 'border-red-400/40 bg-red-500/15 text-red-300'
                                  : 'border-champagne-500/15 bg-ink-800/60 text-champagne-500 hover:border-champagne-500/30'
                              }`}
                            >
                              {isRemoved && <X className="w-3 h-3" />}
                              {isRemoved ? `Sem ${ing}` : ing}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Add extras */}
                    <div>
                      <p className="text-[10px] tracking-[0.2em] uppercase text-champagne-500 mb-2">
                        Adicionar extras
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {EXTRA_OPTIONS.map((extra) => {
                          const isAdded = addedExtras.has(extra.label);
                          return (
                            <button
                              key={extra.label}
                              onClick={() => toggleAdd(extra.label)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all duration-200 ${
                                isAdded
                                  ? 'border-green-400/40 bg-green-500/15 text-green-300'
                                  : 'border-champagne-500/15 bg-ink-800/60 text-champagne-500 hover:border-champagne-500/30'
                              }`}
                            >
                              {isAdded && <Check className="w-3 h-3" />}
                              {extra.label} · R$ {extra.price.toFixed(2).replace('.', ',')}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Free-form notes */}
                    <div>
                      <p className="text-[10px] tracking-[0.2em] uppercase text-champagne-500 mb-2">
                        Observações
                      </p>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        placeholder="Ex: caprichar no molho, ponto da carne, etc."
                        className="w-full px-3 py-2.5 rounded-xl bg-ink-900/60 border border-champagne-500/15 text-sm text-champagne-500 placeholder:text-champagne-500/40 focus:outline-none focus:border-yellow-300/50 transition-colors resize-none"
                      />
                    </div>
                  </div>
                )}

                <div className="mt-auto space-y-6">
                  {/* Price */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs tracking-[0.2em] uppercase text-champagne-500">Valor</span>
                    <span className="font-display text-3xl md:text-4xl font-semibold text-gradient-gold">
                      {product.priceLabel ?? `R$ ${(product.price + extraTotal).toFixed(2).replace('.', ',')}`}
                    </span>
                  </div>

                  {/* Quantity + Add */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 px-2 py-2 rounded-full border border-champagne-500/20">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="w-8 h-8 rounded-full glass border border-champagne-500/20 flex items-center justify-center hover:border-champagne-500/50 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5 text-champagne-500" />
                      </button>
                      <span className="font-display text-lg text-champagne-500 w-6 text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity((q) => q + 1)}
                        className="w-8 h-8 rounded-full glass border border-champagne-500/20 flex items-center justify-center hover:border-champagne-500/50 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 text-champagne-500" />
                      </button>
                    </div>

                    <button
                      onClick={handleAdd}
                      disabled={Boolean(product.priceLabel) || soldOut}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-gradient-to-r from-champagne-500 to-champagne-600 text-ink-900 font-semibold text-sm tracking-wide hover:gold-glow-strong hover:scale-[1.02] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      {soldOut ? 'ESGOTADO' : product.priceLabel ? 'CONSULTAR DISPONIBILIDADE' : 'ADICIONAR AO PEDIDO'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
