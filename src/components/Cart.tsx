import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import type { CartItem } from '@/context/CartContext';

function getItemUnitPrice(item: CartItem): number {
  const extras = item.customizations?.modifications.reduce(
    (sum, modification) => sum + (modification.price ?? 0),
    0,
  ) ?? 0;
  return item.product.price + extras;
}

interface CartProps {
  onCheckout: () => void;
}

export default function Cart({ onCheckout }: CartProps) {
  const { items, isOpen, closeCart, updateQuantity, removeItem, subtotal, totalItems } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-[55] bg-ink-900/70 backdrop-blur-sm"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="fixed top-0 right-0 bottom-0 z-[56] w-full sm:w-[400px] glass-strong border-l border-champagne-500/15 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-champagne-500/10">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-champagne-500" />
                <h2 className="font-display text-xl font-medium text-champagne-500">
                  Seu pedido
                </h2>
                {totalItems > 0 && (
                  <span className="text-xs text-champagne-500">
                    ({totalItems} {totalItems === 1 ? 'item' : 'itens'})
                  </span>
                )}
              </div>
              <button
                onClick={closeCart}
                className="w-8 h-8 rounded-full glass border border-champagne-500/15 flex items-center justify-center hover:border-champagne-500/40 transition-colors"
              >
                <X className="w-4 h-4 text-champagne-500" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-full border border-champagne-500/15 flex items-center justify-center">
                    <ShoppingBag className="w-7 h-7 text-champagne-500" />
                  </div>
                  <p className="text-sm text-champagne-500">
                    Seu pedido está vazio.<br />Explore o cardápio e adicione pratos.
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.div
                      key={item.product.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex gap-3 p-3 rounded-xl border border-champagne-500/10 hover:border-champagne-500/20 transition-colors"
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display text-sm font-medium text-champagne-500 truncate">
                          {item.product.name}
                        </h4>
                        {item.customizations && item.customizations.modifications.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.customizations.modifications.map((mod, idx) => (
                              <span
                                key={idx}
                                className={`text-[9px] px-1.5 py-0.5 rounded-full border ${
                                  mod.action === 'remove'
                                    ? 'border-red-400/25 bg-red-500/10 text-red-300/90'
                                    : 'border-green-400/25 bg-green-500/10 text-green-300/90'
                                }`}
                              >
                                {mod.action === 'remove' ? 'Sem' : '+'} {mod.ingredient}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.customizations?.notes && (
                          <p className="text-[10px] text-champagne-500/70 italic mt-1 line-clamp-2">
                            {item.customizations.notes}
                          </p>
                        )}
                        <p className="text-xs text-champagne-500 mt-0.5">
                          R$ {getItemUnitPrice(item).toFixed(2).replace('.', ',')}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="w-6 h-6 rounded-full glass border border-champagne-500/15 flex items-center justify-center hover:border-champagne-500/40 transition-colors"
                            >
                              <Minus className="w-3 h-3 text-champagne-500" />
                            </button>
                            <span className="text-sm text-champagne-500 w-5 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="w-6 h-6 rounded-full glass border border-champagne-500/15 flex items-center justify-center hover:border-champagne-500/40 transition-colors"
                            >
                              <Plus className="w-3 h-3 text-champagne-500" />
                            </button>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-display text-sm font-semibold text-gradient-gold">
                              R$ {(getItemUnitPrice(item) * item.quantity).toFixed(2).replace('.', ',')}
                            </span>
                            <button
                              onClick={() => removeItem(item.product.id)}
                              className="text-champagne-500 hover:text-red-400/70 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="p-5 border-t border-champagne-500/10 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm tracking-wide text-champagne-500">Subtotal</span>
                  <span className="font-display text-2xl font-semibold text-gradient-gold">
                    R$ {subtotal.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <button
                  onClick={onCheckout}
                  className="w-full py-4 rounded-full bg-gradient-to-r from-champagne-500 to-champagne-600 text-ink-900 font-semibold text-sm tracking-wide hover:gold-glow-strong hover:scale-[1.01] transition-all duration-300"
                >
                  FINALIZAR PEDIDO
                </button>
              </motion.div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
