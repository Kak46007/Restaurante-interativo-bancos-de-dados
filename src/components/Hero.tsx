import { motion } from 'framer-motion';
import { ArrowDown, MapPin, Sparkles, Star } from 'lucide-react';
interface HeroProps {
  onExplore: () => void;
}

export default function Hero({ onExplore }: HeroProps) {
  return (
    <section className="relative min-h-screen w-full flex items-center overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-ink-900" />
      <img
        src="/images/WhatsApp_Image_2026-10-27_at_22.46.35.jpeg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover object-center opacity-60"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,17,15,0.9)_0%,rgba(17,17,15,0.58)_43%,rgba(17,17,15,0.18)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,208,0,0.08)_0%,_transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,_rgba(255,208,0,0.06)_0%,_transparent_50%)]" />

      {/* Grid texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,208,0,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,208,0,1) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      {/* Floating particles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-champagne-400/30"
          style={{
            left: `${15 + (i * 7) % 70}%`,
            top: `${20 + (i * 11) % 60}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 4 + (i % 3),
            repeat: Infinity,
            delay: i * 0.3,
          }}
        />
      ))}

      <div className="relative z-10 max-w-7xl mx-auto px-5 lg:px-10 w-full grid lg:grid-cols-2 gap-8 lg:gap-4 items-center pt-20 pb-10">
        {/* Left: Text */}
        <div className="order-2 lg:order-1 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-champagne-500/20 bg-champagne-500/5 mb-6"
          >
            <Sparkles className="w-3.5 h-3.5 text-champagne-500" />
            <span className="text-[10px] md:text-xs tracking-[0.25em] text-champagne-500 uppercase">
              Mabelly Burguer&apos;s · Guarulhos
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="font-display text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-light leading-[1.05] tracking-tight"
          >
            <span className="block text-champagne-500">SABOR DE VERDADE</span>
            <span className="block text-gradient-gold font-medium italic">na sua melhor versão</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="mt-6 text-base md:text-lg text-champagne-500 max-w-md mx-auto lg:mx-0 leading-relaxed"
          >
            Hambúrgueres artesanais, ingredientes generosos e aquele molho verde da casa que já virou assinatura. Venha viver a experiência na loja.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
          >
            <button
              onClick={onExplore}
              className="group relative px-8 py-4 rounded-full bg-gradient-to-r from-champagne-500 to-champagne-600 text-ink-900 font-semibold text-sm tracking-wide overflow-hidden transition-all duration-300 hover:gold-glow-strong hover:scale-[1.03]"
            >
              <span className="relative z-10 flex items-center gap-2 justify-center">
                VER O CARDÁPIO
                <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              </span>
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.85 }}
            className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 text-xs text-champagne-500"
          >
            <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 fill-yellow-400 text-champagne-500" /> 4,1 · 34 avaliações</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-champagne-500" /> Jardim São Domingos</span>
          </motion.div>
        </div>

      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] tracking-[0.3em] text-champagne-500 uppercase">
          Explore o cardápio
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-px h-10 bg-gradient-to-b from-champagne-500/40 to-transparent"
        />
      </motion.div>
    </section>
  );
}
