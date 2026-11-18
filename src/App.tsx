import { useEffect, useState, useRef } from 'react';
import { CarFront, Clock3, ExternalLink, MapPin, Phone, Star, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import { CartProvider, useCart } from '@/context/CartContext';
import type { Product } from '@/data/products';
import { fetchProductConfigs, applyConfigs, getSoldOutIds, type ProductConfig } from '@/utils/productsConfig';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import CategoryMenu from '@/components/CategoryMenu';
import ProductCard from '@/components/ProductCard';
import ProductModal from '@/components/ProductModal';
import Cart from '@/components/Cart';
import Checkout from '@/components/Checkout';
import SmartMenu from '@/components/SmartMenu';
import OrdersPanel from '@/components/OrdersPanel';

function MenuApp() {
  const [route, setRoute] = useState<string>(window.location.pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [smartProduct, setSmartProduct] = useState<Product | null>(null);
  const [configs, setConfigs] = useState<Record<string, ProductConfig>>({});
  const { addItem } = useCart();

  const menuRef = useRef<HTMLDivElement>(null);
  const storeInfoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    fetchProductConfigs().then(setConfigs).catch(() => {});
  }, []);

  const isOrdersPanel = route.startsWith('/pedidos');

  const openMenu = () => {
    setMenuOpen(true);
  };

  const goHome = () => {
    setMenuOpen(false);
    setStoreOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (menuOpen) menuRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (storeOpen) storeInfoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [menuOpen, storeOpen]);

  const scrollToMenu = () => {
    setStoreOpen(false);
    openMenu();
  };

  const scrollToStore = () => {
    setMenuOpen(false);
    setStoreOpen(true);
  };

  const handleCheckout = () => {
    setCheckoutOpen(true);
  };

  const openSmartMenu = () => {
    setSmartProduct(selectedProduct);
    setSelectedProduct(null);
  };

  return (
    <div className="relative min-h-screen bg-ink-900">
      {isOrdersPanel ? (
        <OrdersPanel />
      ) : (
        <>
      <Header
        onMenuClick={scrollToMenu}
        onStoreClick={scrollToStore}
        onHomeClick={menuOpen ? goHome : undefined}
      />
      {!menuOpen && !storeOpen && <Hero onExplore={scrollToMenu} />}

      {/* Menu section */}
      {menuOpen && (
      <div ref={menuRef} className="relative min-h-screen">
        {/* Section ambient glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,_rgba(255,208,0,0.05)_0%,_transparent_50%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-5 lg:px-10 pt-24 md:pt-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 md:mb-10"
          >
            <span className="text-[10px] tracking-[0.35em] uppercase text-champagne-500">Mabelly Burguer&apos;s</span>
            <h2 className="font-display text-4xl md:text-6xl text-gradient-gold font-medium mt-3">Qual será o pedido de hoje?</h2>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-champagne-500/50 to-transparent mx-auto mt-5" />
          </motion.div>
        </div>

        <CategoryMenu
          onProductClick={setSelectedProduct}
          onProductAdd={addItem}
          onSmartView={setSmartProduct}
        />

        {/* Footer */}
        <footer className="border-t border-champagne-500/10 mt-10">
          <div className="max-w-7xl mx-auto px-5 lg:px-10 py-10 md:py-14">
            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              <div>
                <h3 className="font-display text-2xl text-gradient-gold font-medium mb-2">
                  Mabelly Burguer&apos;s
                </h3>
              </div>
              <div>
                <h4 className="text-[10px] tracking-[0.2em] uppercase text-champagne-500 mb-3">Horário</h4>
                <p className="text-sm text-champagne-500">Aberto hoje</p>
                <p className="text-sm text-champagne-500">Fecha às 02h00</p>
              </div>
              <div>
                <h4 className="text-[10px] tracking-[0.2em] uppercase text-champagne-500 mb-3">Contato</h4>
                <p className="text-sm text-champagne-500">(11) 97560-1131</p>
                <a href="https://maps.app.goo.gl/PedXE4ZwWo28mRmw5" target="_blank" rel="noreferrer" className="text-sm text-champagne-500 hover:text-champagne-500 transition-colors">Ver endereço exato no Google Maps</a>
              </div>
            </div>
            <div className="mt-10 pt-6 border-t border-champagne-500/5 text-center">
              <p className="text-xs text-champagne-500 tracking-wide">
                © 2026 Mabelly Burguer&apos;s · 4D Smart Menu
              </p>
            </div>
          </div>
        </footer>
      </div>
      )}

      {storeOpen && (
        <section ref={storeInfoRef} className="relative min-h-screen pt-28 pb-16 px-5 lg:px-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,_rgba(255,208,0,0.08)_0%,_transparent_55%)] pointer-events-none" />
          <div className="relative max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-10 md:mb-14"
            >
              <span className="text-[10px] tracking-[0.35em] uppercase text-champagne-500">Mabelly Burguer&apos;s</span>
              <h1 className="font-display text-4xl md:text-6xl text-gradient-gold font-medium mt-3">Loja física</h1>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-champagne-500/50 to-transparent mx-auto mt-5" />
            </motion.div>

            <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-6 md:gap-8 items-stretch">
              <div className="glass border border-champagne-500/15 rounded-3xl p-6 md:p-8">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-champagne-500">Hamburgueria</span>
                  <span className="text-champagne-500">·</span>
                  <span className="flex items-center gap-1 text-sm text-champagne-500"><Star className="w-4 h-4 fill-yellow-400 text-champagne-500" /> 4,1 <span className="text-champagne-500">(34 avaliações)</span></span>
                </div>
                <h2 className="font-display text-4xl md:text-5xl text-gradient-gold font-semibold">Mabelly Burguer&apos;s</h2>
                <p className="text-sm text-champagne-500 mt-2">R$ 20–120 por pessoa</p>
                <div className="space-y-4 mt-7 text-sm text-champagne-500">
                  <a href="https://maps.app.goo.gl/PedXE4ZwWo28mRmw5" target="_blank" rel="noreferrer" className="flex items-start gap-3 text-champagne-500 hover:text-champagne-500 transition-colors"><MapPin className="w-5 h-5 shrink-0 text-champagne-500" /> Ver endereço exato da loja no Google Maps</a>
                  <p className="flex items-center gap-3"><Clock3 className="w-5 h-5 text-champagne-500" /> Aberto · fecha 02:00</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-7 pt-5 border-t border-champagne-500/10">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-champagne-500/5 text-xs text-champagne-500"><Star className="w-3.5 h-3.5 text-champagne-500" /> Refeição no local</span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-champagne-500/5 text-xs text-champagne-500"><CarFront className="w-3.5 h-3.5 text-champagne-500" /> Drive-through</span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-champagne-500/5 text-xs text-champagne-500"><Truck className="w-3.5 h-3.5 text-champagne-500" /> Entrega sem contato</span>
                </div>
                <div className="flex flex-wrap gap-3 mt-7">
                  <a href="tel:+5511975601131" className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-champagne-500/20 text-sm text-champagne-500 hover:border-yellow-300/50 transition-colors"><Phone className="w-4 h-4 text-champagne-500" /> (11) 97560-1131</a>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-3xl border border-champagne-500/15 min-h-[360px] bg-[radial-gradient(circle_at_50%_35%,_rgba(255,208,0,0.16),_transparent_48%),linear-gradient(135deg,#211f1a,#11110f)] flex items-center justify-center p-8 text-center">
                <div className="absolute inset-0 opacity-30 bg-[linear-gradient(35deg,transparent_48%,rgba(255,208,0,0.18)_49%,transparent_50%),linear-gradient(125deg,transparent_48%,rgba(255,208,0,0.12)_49%,transparent_50%)] bg-[length:90px_90px]" />
                <div className="relative max-w-sm">
                  <div className="mx-auto mb-5 w-14 h-14 rounded-full border border-yellow-300/40 bg-yellow-300/10 flex items-center justify-center">
                    <MapPin className="w-7 h-7 text-champagne-500" />
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-champagne-500">Como chegar</p>
                  <h2 className="font-display text-2xl md:text-3xl text-champagne-500 mt-2">Encontre a gente no mapa</h2>
                  <p className="text-sm leading-relaxed text-champagne-500 mt-3">Consulte a localização exata e trace sua rota pelo Google Maps.</p>
                  <a
                    href="https://maps.app.goo.gl/PedXE4ZwWo28mRmw5"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 mt-6 px-5 py-3 rounded-full bg-yellow-500 text-black text-sm font-semibold hover:bg-yellow-400 hover:scale-[1.02] transition-all"
                  >
                    Abrir no Google Maps <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Overlays */}
      <ProductModal product={selectedProduct} soldOut={selectedProduct ? getSoldOutIds(configs).has(selectedProduct.id) : false} onClose={() => setSelectedProduct(null)} onSmartView={openSmartMenu} />
      <SmartMenu product={smartProduct} onClose={() => setSmartProduct(null)} />
      <Cart onCheckout={handleCheckout} />
      <Checkout isOpen={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <MenuApp />
    </CartProvider>
  );
}
