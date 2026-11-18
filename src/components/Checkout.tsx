import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Store, Bike, QrCode, CreditCard, Banknote, Check, MapPin, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { saveOrder } from '@/utils/orders';
import {
  lookupCep,
  getStoreCoordinates,
  geocodeAddressFallback,
  calculateDistanceKm,
  calculateDeliveryFee,
  type CepResult,
} from '@/utils/delivery';

interface CheckoutProps {
  isOpen: boolean;
  onClose: () => void;
}

type DeliveryMode = 'retirada' | 'entrega';
type PaymentMethod = 'pix' | 'cartao' | 'dinheiro';

export default function Checkout({ isOpen, onClose }: CheckoutProps) {
  const { items, subtotal, clearCart } = useCart();
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('retirada');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [reference, setReference] = useState('');
  const [cepResult, setCepResult] = useState<CepResult | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);

  const deliveryFee =
    deliveryMode === 'entrega' && distanceKm !== null
      ? calculateDeliveryFee(distanceKm)
      : 0;
  const total = subtotal + deliveryFee;

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  };

  const handleCepBlur = async () => {
    const clean = cep.replace(/\D/g, '');
    if (clean.length !== 8) return;
    setCalculating(false);
    const result = await lookupCep(cep);
    if (result) {
      setCepResult(result);
      setStreet(result.logradouro || street);
      setNeighborhood(result.bairro || neighborhood);
      setCity(result.localidade ? `${result.localidade} - ${result.uf}` : city);
      setCalcError(null);
    }
  };

  const calculateDistance = async () => {
    if (!cep && !street && !neighborhood) {
      setCalcError('Preencha o CEP ou o endereço para calcular a distância.');
      return;
    }
    setCalculating(true);
    setCalcError(null);
    setDistanceKm(null);
    try {
      const storeCoords = await getStoreCoordinates();
      if (!storeCoords) {
        setCalcError('Não foi possível localizar a loja. Tente novamente.');
        setCalculating(false);
        return;
      }
      const cityName = city.split(' - ')[0].trim() || 'Guarulhos';
      const fullAddress = [
        `${street}${number ? ', ' + number : ''}`,
        neighborhood,
        cityName,
        'Brasil',
      ]
        .filter(Boolean)
        .join(', ');
      const destCoords = await geocodeAddressFallback(fullAddress, {
        street: street || undefined,
        number: number || undefined,
        neighborhood: neighborhood || undefined,
        city: cityName,
        cep: cep || undefined,
      });
      if (!destCoords) {
        setCalcError('Endereço não encontrado. Confira os dados e tente novamente.');
        setCalculating(false);
        return;
      }
      const km = await calculateDistanceKm(storeCoords, destCoords);
      setDistanceKm(km);
    } catch {
      setCalcError('Erro ao calcular a distância. Tente novamente.');
    } finally {
      setCalculating(false);
    }
  };

  const fullDeliveryAddress = [
    `${street}${number ? ', ' + number : ''}`,
    neighborhood,
    city,
    `CEP ${cep}`,
    reference ? `Ref: ${reference}` : '',
  ]
    .filter(Boolean)
    .join(' — ');

  const handleConfirmOrder = async () => {
    setSaving(true);
    setSaveError(null);
    const orderId = await saveOrder({
      items_json: items,
      subtotal,
      delivery_fee: deliveryFee,
      total,
      delivery_mode: deliveryMode,
      payment_method: paymentMethod,
      delivery_address: deliveryMode === 'entrega' ? fullDeliveryAddress : undefined,
      distance_km: deliveryMode === 'entrega' && distanceKm !== null ? distanceKm : undefined,
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
    });

    if (!orderId) {
      setSaveError('Não foi possível enviar o pedido. Confira sua conexão e tente novamente.');
      setSaving(false);
      return;
    }

    setConfirmed(true);
    setTimeout(() => {
      setConfirmed(false);
      setSaving(false);
      clearCart();
      onClose();
    }, 2000);
  };

  const canConfirmDelivery =
    Boolean(customerName.trim() && customerPhone.trim()) &&
    (deliveryMode !== 'entrega' ||
      Boolean(distanceKm !== null && cep && street && number && neighborhood));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[65] flex items-center justify-center p-3 md:p-6"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-ink-900/85 backdrop-blur-md" />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-lg max-h-[92vh] overflow-y-auto hide-scrollbar rounded-3xl glass-strong border border-champagne-500/20 gold-glow p-6 md:p-8"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-full glass border border-champagne-500/20 flex items-center justify-center hover:border-champagne-500/50 transition-colors"
            >
              <X className="w-4 h-4 text-champagne-500" />
            </button>

            <h2 className="font-display text-2xl md:text-3xl font-medium text-gradient-gold mb-6">
              Finalizar pedido
            </h2>

            {confirmed ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-champagne-500/20 border border-champagne-500/40 flex items-center justify-center mb-4 gold-glow">
                  <Check className="w-8 h-8 text-champagne-500" />
                </div>
                <p className="font-display text-xl text-champagne-500">Pedido enviado!</p>
                <p className="text-sm text-champagne-500 mt-1">Seu pedido foi enviado para a loja e será impresso automaticamente.</p>
              </motion.div>
            ) : (
              <>
                {/* Customer contact */}
                <div className="mb-6 space-y-3">
                  <label className="text-[10px] tracking-[0.2em] uppercase text-champagne-500 block">
                    Seus dados
                  </label>
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nome completo"
                    autoComplete="name"
                    className="w-full px-3 py-2.5 rounded-xl bg-ink-900/60 border border-champagne-500/15 text-sm text-champagne-500 placeholder:text-champagne-500 focus:border-champagne-500/40 focus:outline-none transition-colors"
                  />
                  <input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Número de telefone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    className="w-full px-3 py-2.5 rounded-xl bg-ink-900/60 border border-champagne-500/15 text-sm text-champagne-500 placeholder:text-champagne-500 focus:border-champagne-500/40 focus:outline-none transition-colors"
                  />
                </div>

                {/* Delivery mode */}
                <div className="mb-6">
                  <label className="text-[10px] tracking-[0.2em] uppercase text-champagne-500 mb-3 block">
                    Modo de entrega
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'retirada' as const, label: 'Retirada', icon: Store, desc: 'No restaurante' },
                      { id: 'entrega' as const, label: 'Entrega', icon: Bike, desc: 'A partir de R$ 4,00' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setDeliveryMode(opt.id);
                          setDistanceKm(null);
                          setCalcError(null);
                        }}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-300 ${
                          deliveryMode === opt.id
                            ? 'border-champagne-500/40 bg-champagne-500/10 gold-glow'
                            : 'border-champagne-500/10 hover:border-champagne-500/25'
                        }`}
                      >
                        <opt.icon className={`w-5 h-5 ${deliveryMode === opt.id ? 'text-champagne-500' : 'text-champagne-500'}`} />
                        <span className={`text-sm font-medium ${deliveryMode === opt.id ? 'text-champagne-500' : 'text-champagne-500'}`}>
                          {opt.label}
                        </span>
                        <span className="text-[10px] text-champagne-500">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Delivery address */}
                {deliveryMode === 'entrega' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 space-y-3"
                  >
                    <label className="text-[10px] tracking-[0.2em] uppercase text-champagne-500 block">
                      Endereço de entrega
                    </label>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-1">
                        <input
                          value={cep}
                          onChange={(e) => setCep(formatCep(e.target.value))}
                          onBlur={handleCepBlur}
                          placeholder="CEP"
                          inputMode="numeric"
                          className="w-full px-3 py-2.5 rounded-xl bg-ink-900/60 border border-champagne-500/15 text-sm text-champagne-500 placeholder:text-champagne-500 focus:border-champagne-500/40 focus:outline-none transition-colors"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          placeholder="Rua / Avenida"
                          className="w-full px-3 py-2.5 rounded-xl bg-ink-900/60 border border-champagne-500/15 text-sm text-champagne-500 placeholder:text-champagne-500 focus:border-champagne-500/40 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <input
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        placeholder="Número"
                        className="px-3 py-2.5 rounded-xl bg-ink-900/60 border border-champagne-500/15 text-sm text-champagne-500 placeholder:text-champagne-500 focus:border-champagne-500/40 focus:outline-none transition-colors"
                      />
                      <input
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        placeholder="Bairro"
                        className="col-span-2 px-3 py-2.5 rounded-xl bg-ink-900/60 border border-champagne-500/15 text-sm text-champagne-500 placeholder:text-champagne-500 focus:border-champagne-500/40 focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Cidade - UF"
                        className="px-3 py-2.5 rounded-xl bg-ink-900/60 border border-champagne-500/15 text-sm text-champagne-500 placeholder:text-champagne-500 focus:border-champagne-500/40 focus:outline-none transition-colors"
                      />
                      <input
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder="Referência (opcional)"
                        className="px-3 py-2.5 rounded-xl bg-ink-900/60 border border-champagne-500/15 text-sm text-champagne-500 placeholder:text-champagne-500 focus:border-champagne-500/40 focus:outline-none transition-colors"
                      />
                    </div>

                    <button
                      onClick={calculateDistance}
                      disabled={calculating}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-champagne-500/25 text-champagne-500 text-xs tracking-wide hover:bg-champagne-500/5 transition-all disabled:opacity-50"
                    >
                      {calculating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Calculando distância...
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4" />
                          {distanceKm !== null
                            ? `Recalcular distância (${distanceKm.toFixed(1)} km)`
                            : 'Calcular distância e taxa'}
                        </>
                      )}
                    </button>

                    {calcError && (
                      <p className="text-xs text-red-400/80 px-1">{calcError}</p>
                    )}

                    {distanceKm !== null && !calcError && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between px-4 py-3 rounded-xl bg-champagne-500/5 border border-champagne-500/15"
                      >
                        <span className="text-xs text-champagne-500">
                          Distância: <span className="text-champagne-500">{distanceKm.toFixed(1)} km</span>
                        </span>
                        <span className="text-xs text-champagne-500">
                          Taxa: <span className="text-champagne-500">R$ {deliveryFee.toFixed(2).replace('.', ',')}</span>
                        </span>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* Payment */}
                <div className="mb-6">
                  <label className="text-[10px] tracking-[0.2em] uppercase text-champagne-500 mb-3 block">
                    Forma de pagamento
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'pix' as const, label: 'Pix', icon: QrCode },
                      { id: 'cartao' as const, label: 'Cartão', icon: CreditCard },
                      { id: 'dinheiro' as const, label: 'Dinheiro', icon: Banknote },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setPaymentMethod(opt.id)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-300 ${
                          paymentMethod === opt.id
                            ? 'border-champagne-500/40 bg-champagne-500/10 gold-glow'
                            : 'border-champagne-500/10 hover:border-champagne-500/25'
                        }`}
                      >
                        <opt.icon className={`w-5 h-5 ${paymentMethod === opt.id ? 'text-champagne-500' : 'text-champagne-500'}`} />
                        <span className={`text-xs font-medium ${paymentMethod === opt.id ? 'text-champagne-500' : 'text-champagne-500'}`}>
                          {opt.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="p-4 rounded-xl border border-champagne-500/10 space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-champagne-500">Subtotal</span>
                    <span className="text-champagne-500">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-champagne-500">Entrega</span>
                    <span className="text-champagne-500">
                      {deliveryMode === 'entrega'
                        ? distanceKm === null
                          ? 'Calcule a distância'
                          : deliveryFee > 0
                            ? `R$ ${deliveryFee.toFixed(2).replace('.', ',')}`
                            : 'Grátis'
                        : 'Grátis'}
                    </span>
                  </div>
                  <div className="h-px bg-champagne-500/10 my-2" />
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm tracking-wide text-champagne-500">Total</span>
                    <span className="font-display text-2xl font-semibold text-gradient-gold">
                      R$ {total.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                {saveError && (
                  <p className="mb-3 text-center text-xs text-red-300">{saveError}</p>
                )}

                <button
                  onClick={handleConfirmOrder}
                  disabled={!canConfirmDelivery || saving}
                  className="w-full flex items-center justify-center gap-2.5 py-4 rounded-full bg-gradient-to-r from-champagne-500 to-champagne-600 text-ink-900 font-semibold text-sm tracking-wide hover:gold-glow-strong hover:scale-[1.01] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {saving ? 'ENVIANDO PEDIDO...' : 'CONFIRMAR PEDIDO'}
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
