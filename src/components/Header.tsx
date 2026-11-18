import { motion } from 'framer-motion';
import { ShoppingBag, UtensilsCrossed } from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface HeaderProps {
  onMenuClick: () => void;
  onStoreClick: () => void;
  onHomeClick?: () => void;
}

export default function Header({ onMenuClick, onStoreClick, onHomeClick }: HeaderProps) {
  const { totalItems, openCart } = useCart();

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="glass border-b border-champagne-500/10">
        <div className="max-w-7xl mx-auto px-5 lg:px-10 h-16 md:h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-champagne-500/30 flex items-center justify-center gold-glow">
              <UtensilsCrossed className="w-4 h-4 md:w-5 md:h-5 text-champagne-500" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-lg md:text-2xl font-semibold text-gradient-gold tracking-wide">
                Mabelly Burguer&apos;s
              </span>
              <span className="text-[9px] md:text-[10px] tracking-[0.3em] text-champagne-500 uppercase">
                Hamburgueria · Guarulhos
              </span>
            </div>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {onHomeClick && (
              <button
                onClick={onHomeClick}
                className="text-sm tracking-wide text-champagne-500 hover:text-champagne-500 transition-colors duration-300"
              >
                Início
              </button>
            )}
            <button
              onClick={onMenuClick}
              className="text-sm tracking-wide text-champagne-500 hover:text-champagne-500 transition-colors duration-300"
            >
              Cardápio
            </button>
            <button
              type="button"
              onClick={onStoreClick}
              className="text-sm tracking-wide text-champagne-500 hover:text-champagne-500 transition-colors"
            >
              Loja física
            </button>
          </nav>

          {/* Cart */}
          <button
            onClick={openCart}
            className="relative flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-full border border-champagne-500/20 hover:border-champagne-500/50 hover:bg-champagne-500/5 transition-all duration-300 group"
          >
            <ShoppingBag className="w-4 h-4 md:w-5 md:h-5 text-champagne-500 group-hover:text-champagne-500" />
            <span className="hidden sm:inline text-xs md:text-sm text-champagne-500">
              Pedido
            </span>
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-champagne-500 text-ink-900 text-[10px] font-bold flex items-center justify-center gold-glow-strong">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </motion.header>
  );
}
