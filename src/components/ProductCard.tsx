import { motion } from 'framer-motion';
import { Camera, Plus } from 'lucide-react';
import type { Product } from '@/data/products';

interface ProductCardProps {
  product: Product;
  index: number;
  soldOut?: boolean;
  onClick: () => void;
  onAdd: () => void;
  onSmartView: () => void;
}

export default function ProductCard({ product, index, soldOut, onClick, onAdd, onSmartView }: ProductCardProps) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.06, 0.4) }}
      onClick={onClick}
      className={`group relative cursor-pointer rounded-2xl overflow-hidden glass border transition-all duration-500 hover:gold-glow ${
        soldOut ? 'border-red-400/30 opacity-70' : 'border-champagne-500/10 hover:border-champagne-500/30'
      }`}
    >
      {/* Image */}
      <div className="relative h-56 md:h-64 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className={`w-full h-full object-contain bg-black p-2 transition-transform duration-700 group-hover:scale-105 ${soldOut ? 'grayscale' : ''}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/30 to-transparent" />

        {/* Sold-out badge */}
        {soldOut && (
          <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-[10px] tracking-[0.15em] uppercase bg-red-500/90 text-white font-semibold border border-red-300/40">
            Esgotado
          </div>
        )}

        {/* Tags */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {product.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-full text-[9px] tracking-[0.1em] uppercase glass-strong text-champagne-500 border border-champagne-500/15"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* 3D badge */}
        {product.model3d && (
          <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-[9px] tracking-wider uppercase bg-champagne-500/20 border border-champagne-500/30 text-champagne-500 backdrop-blur-sm">
            3D
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 md:p-6">
        <h3 className="font-display text-xl md:text-2xl font-medium text-champagne-500 mb-2 group-hover:text-gradient-gold transition-all duration-300">
          {product.name}
        </h3>
        <p className="text-sm text-champagne-500 leading-relaxed mb-4 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center justify-between gap-2">
          <span className="font-display text-2xl font-semibold text-gradient-gold">
            {product.priceLabel ?? `R$ ${product.price.toFixed(2).replace('.', ',')}`}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSmartView();
              }}
              aria-label={`Ver ${product.name} na câmera`}
              className="w-9 h-9 rounded-full border border-yellow-400/30 text-champagne-500 flex items-center justify-center hover:bg-yellow-500/15 transition-all duration-300"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!product.priceLabel && !soldOut) onAdd();
              }}
              disabled={Boolean(product.priceLabel) || soldOut}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-champagne-500/25 hover:border-champagne-500/50 hover:bg-champagne-500/10 transition-all duration-300 group-hover:bg-champagne-500/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5 text-champagne-500" />
              <span className="text-[10px] tracking-[0.15em] uppercase text-champagne-500">
                {soldOut ? 'Esgotado' : product.priceLabel ? 'Consultar' : 'Adicionar'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Hover glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-champagne-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </motion.article>
  );
}
