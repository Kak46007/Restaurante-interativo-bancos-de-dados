import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Check,
  Loader2,
  Printer,
  RefreshCw,
  Receipt,
  Bell,
  Bluetooth,
  BluetoothConnected,
  AlertCircle,
  Smartphone,
} from 'lucide-react';
import { fetchNewOrders, markOrderPrinted, type SavedOrder } from '@/utils/orders';
import type { CartItem } from '@/context/CartContext';

function itemUnitPrice(item: CartItem): number {
  const extras = item.customizations?.modifications.reduce(
    (sum, m) => sum + (m.price ?? 0),
    0,
  ) ?? 0;
  return item.product.price + extras;
}
import {
  isWebBluetoothSupported,
  isPrinterConnected,
  connectPrinter,
  disconnectPrinter,
  printReceipt,
  printTestReceipt,
  getConnectedPrinterName,
  type ReceiptLine,
} from '@/utils/bluetoothPrinter';

function formatBRL(value: number) {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const PAYMENT_LABELS: Record<string, string> = {
  pix: 'Pix',
  cartao: 'Cartao',
  dinheiro: 'Dinheiro',
};

const DELIVERY_LABELS: Record<string, string> = {
  retirada: 'Retirada no restaurante',
  entrega: 'Entrega',
};

function buildReceiptLines(order: SavedOrder): ReceiptLine[] {
  const lines: ReceiptLine[] = [
    { text: 'MABELLY BURGUERS', center: true, bold: true, large: true },
    { text: 'Cardapio Digital', center: true },
    { text: '--------------------------------' },
    { text: `Pedido: #${order.id.slice(0, 8).toUpperCase()}` },
    { text: `Data: ${formatDateTime(order.created_at)}` },
    { text: `Modo: ${DELIVERY_LABELS[order.delivery_mode] ?? order.delivery_mode}` },
  ];

  if (order.delivery_mode === 'entrega' && order.delivery_address) {
    lines.push({ text: `End: ${order.delivery_address}` });
  }
  if (order.distance_km != null) {
    lines.push({ text: `Distancia: ${order.distance_km} km` });
  }

  lines.push({ text: '--------------------------------' });

  for (const item of order.items_json) {
    lines.push({
      text: `${item.quantity}x ${item.product.name}  ${formatBRL(itemUnitPrice(item) * item.quantity)}`,
    });
    if (item.customizations) {
      for (const mod of item.customizations.modifications) {
        lines.push({
          text: `  ${mod.action === 'remove' ? 'SEM' : 'COM'} ${mod.ingredient}`,
        });
      }
      if (item.customizations.notes) {
        lines.push({ text: `  Obs: ${item.customizations.notes}` });
      }
    }
  }

  lines.push({ text: '--------------------------------' });
  lines.push({ text: `Subtotal:        ${formatBRL(order.subtotal)}` });

  if (order.delivery_fee > 0) {
    lines.push({ text: `Entrega:         ${formatBRL(order.delivery_fee)}` });
  }

  lines.push({
    text: `TOTAL:           ${formatBRL(order.total)}`,
    bold: true,
    large: true,
  });

  lines.push({ text: '--------------------------------' });
  lines.push({ text: `Pagamento: ${PAYMENT_LABELS[order.payment_method] ?? order.payment_method}` });
  lines.push({ text: '--------------------------------' });
  lines.push({ text: 'Obrigado pela preferencia!', center: true });

  return lines;
}

export default function OrdersPanel() {
  const [orders, setOrders] = useState<SavedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [lastPrintedAt, setLastPrintedAt] = useState<string | null>(null);
  const supported = isWebBluetoothSupported();
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1 && /Macintosh/.test(userAgent));
  const isAndroid = /Android/.test(userAgent);
  const [autoPrint, setAutoPrint] = useState(supported);
  const [printerConnected, setPrinterConnected] = useState(false);
  const [printerName, setPrinterName] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [testingPrinter, setTestingPrinter] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const printingQueueRef = useRef(false);
  const lastSeenRef = useRef<string | null>(null);

  const loadOrders = useCallback(async () => {
    const data = await fetchNewOrders();
    setOrders(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 8000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  useEffect(() => {
    const interval = setInterval(() => {
      const connected = isPrinterConnected();
      setPrinterConnected(connected);
      setPrinterName(connected ? getConnectedPrinterName() : null);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleConnect = async () => {
    setError(null);
    setConnecting(true);
    try {
      await connectPrinter();
      setPrinterConnected(true);
      setPrinterName(getConnectedPrinterName());
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('cancelled') || msg.includes('User cancelled')) {
        setError('Selecao de dispositivo cancelada.');
      } else {
        setError(`Erro ao conectar: ${msg}`);
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnectPrinter();
    setPrinterConnected(false);
    setPrinterName(null);
  };

  const handleTestPrint = async () => {
    setTestingPrinter(true);
    setError(null);
    try {
      await printTestReceipt();
      setLastPrintedAt(new Date().toLocaleTimeString('pt-BR'));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Erro no teste de impressao: ${msg}`);
      setPrinterConnected(false);
      setPrinterName(null);
    } finally {
      setTestingPrinter(false);
    }
  };

  const printOrder = useCallback(async (order: SavedOrder) => {
    setPrintingId(order.id);
    setError(null);
    try {
      const lines = buildReceiptLines(order);
      await printReceipt(lines);
      await markOrderPrinted(order.id);
      setLastPrintedAt(new Date().toLocaleTimeString('pt-BR'));
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Erro ao imprimir pedido #${order.id.slice(0, 8)}: ${msg}`);
      setPrinterConnected(false);
    } finally {
      setPrintingId(null);
      printingQueueRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!autoPrint || orders.length === 0 || printingId || !printerConnected) return;
    const newest = orders[orders.length - 1];
    if (lastSeenRef.current === newest.id) return;
    lastSeenRef.current = newest.id;
    printOrder(newest);
  }, [orders, autoPrint, printingId, printerConnected, printOrder]);

  return (
    <div className="min-h-screen bg-ink-900 text-champagne-500">
      <div className="max-w-3xl mx-auto px-4 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:px-6 md:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400/20 to-yellow-600/10 border border-champagne-500/30 flex items-center justify-center shrink-0">
              <Receipt className="w-6 h-6 text-champagne-500" />
            </div>
            <div>
              <h1 className="font-display text-xl md:text-2xl text-gradient-gold">Painel Mabelly</h1>
              <p className="text-[11px] text-champagne-300/80">
                {supported ? (isAndroid ? 'Android · Bluetooth pronto' : 'Bluetooth pronto') : isIOS ? 'iPhone · impressão por Bluetooth limitada' : 'Bluetooth não disponível neste navegador'}
              </p>
            </div>
          </div>
          <button
            onClick={loadOrders}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-champagne-500/25 text-xs text-champagne-500 hover:bg-champagne-500/5 transition-colors shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Orders content */}
        <>
            {/* Bluetooth connection */}
            {!supported ? (
              <div className={`flex items-start gap-3 p-4 rounded-2xl border mb-4 ${isIOS ? 'border-sky-300/25 bg-sky-400/10' : 'border-red-400/30 bg-red-500/10'}`}>
                {isIOS ? <Smartphone className="w-5 h-5 text-sky-200 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 text-red-300 shrink-0 mt-0.5" />}
                <div className="min-w-0">
                  <p className={`text-sm leading-relaxed ${isIOS ? 'text-sky-100' : 'text-red-200/90'}`}>
                    {isIOS ? 'O iPhone consegue acompanhar os pedidos, mas o Safari e o Chrome no iPhone não permitem conectar impressoras Bluetooth BLE diretamente.' : 'Este navegador não oferece Bluetooth para páginas web. Use o Chrome ou Edge no Android para conectar a impressora.'}
                  </p>
                  {isIOS && <p className="mt-2 text-xs leading-relaxed text-sky-100/70">Para imprimir pelo iPhone, a impressora precisa oferecer AirPrint ou funcionar pelo aplicativo próprio do fabricante.</p>}
                </div>
              </div>
            ) : (
              <button
                onClick={printerConnected ? handleDisconnect : handleConnect}
                disabled={connecting}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border mb-4 transition-colors ${
                  printerConnected
                    ? 'border-green-400/30 bg-green-500/10'
                    : 'border-champagne-500/20 bg-ink-800/60 hover:border-champagne-500/35'
                } disabled:opacity-50`}
              >
                <span className="flex items-center gap-2.5 text-sm text-champagne-500">
                  {printerConnected ? (
                    <BluetoothConnected className="w-5 h-5 text-green-300" />
                  ) : (
                    <Bluetooth className="w-5 h-5 text-champagne-500" />
                  )}
                  {connecting
                    ? 'Conectando...'
                    : printerConnected
                      ? printerName ?? 'Impressora conectada'
                      : 'Conectar impressora Bluetooth'}
                </span>
                {printerConnected && !connecting && (
                  <span className="text-[11px] text-green-300/70">Tocar para desconectar</span>
                )}
              </button>
            )}

            {supported && printerConnected && (
              <button
                onClick={handleTestPrint}
                disabled={testingPrinter || Boolean(printingId)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-champagne-500/25 bg-champagne-500/5 text-sm text-champagne-500 hover:bg-champagne-500/10 transition-colors mb-4 disabled:opacity-50"
              >
                {testingPrinter ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Testando impressora...</>
                ) : (
                  <><Printer className="w-4 h-4" /> Imprimir teste</>
                )}
              </button>
            )}

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl border border-red-400/25 bg-red-500/5 mb-4">
                <AlertCircle className="w-4 h-4 text-red-300 shrink-0 mt-0.5" />
                <p className="text-xs text-red-200/80">{error}</p>
              </div>
            )}

            {/* Auto-print toggle */}
            <button
              onClick={() => setAutoPrint((v) => !v)}
              disabled={!supported}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border mb-5 transition-colors ${
                autoPrint
                  ? 'border-green-400/30 bg-green-500/10'
                  : 'border-champagne-500/15 bg-ink-800/60'
              } ${!supported ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <span className="flex items-center gap-2 text-sm text-champagne-500">
                <Bell className={`w-4 h-4 ${autoPrint && supported ? 'text-green-300' : 'text-champagne-500'}`} />
                Impressão automática
              </span>
              <span className={`relative w-11 h-6 rounded-full transition-colors ${autoPrint && supported ? 'bg-green-500' : 'bg-champagne-500/20'}`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${autoPrint && supported ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </span>
            </button>

            {/* Status bar */}
            <div className="flex items-center gap-2 mb-5 text-xs text-champagne-500">
              <span className={`w-2 h-2 rounded-full ${orders.length > 0 ? 'bg-yellow-300 animate-pulse' : 'bg-green-400'}`} />
              {orders.length > 0
                ? `${orders.length} pedido(s) aguardando`
                : 'Aguardando novos pedidos...'}
              {lastPrintedAt && <span className="ml-auto text-champagne-500">Ult. impressao: {lastPrintedAt}</span>}
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-champagne-500" />
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-400/30 flex items-center justify-center mb-4">
                  <Check className="w-7 h-7 text-green-300" />
                </div>
                <p className="text-sm text-champagne-500">Tudo impresso. Novos pedidos aparecem aqui automaticamente.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-champagne-500/20 bg-ink-800/80 p-4 shadow-lg"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-display text-base text-champagne-500">#{order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-[11px] text-champagne-500">{formatDateTime(order.created_at)}</p>
                      </div>
                      <button
                        onClick={() => printOrder(order)}
                        disabled={printingId === order.id || !printerConnected}
                        className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-yellow-500 text-black text-xs font-semibold hover:bg-yellow-400 transition-colors disabled:opacity-50 shrink-0"
                      >
                        {printingId === order.id ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Imprimindo</>
                        ) : (
                          <><Printer className="w-4 h-4" /> Imprimir</>
                        )}
                      </button>
                    </div>

                    <div className="space-y-1 mb-3">
                      {order.items_json.map((item, idx) => (
                        <div key={idx} className="space-y-0.5">
                          <div className="flex justify-between text-sm text-champagne-500">
                            <span>{item.quantity}x {item.product.name}</span>
                            <span className="text-champagne-500">{formatBRL(itemUnitPrice(item) * item.quantity)}</span>
                          </div>
                          {item.customizations && item.customizations.modifications.length > 0 && (
                            <div className="flex flex-wrap gap-1 pl-1">
                              {item.customizations.modifications.map((mod, mIdx) => (
                                <span
                                  key={mIdx}
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
                            <p className="text-[10px] text-champagne-500/60 italic pl-1">{item.customizations.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-champagne-500/10 pt-2.5 space-y-1 text-xs text-champagne-500">
                      <div className="flex justify-between"><span>Subtotal</span><span>{formatBRL(order.subtotal)}</span></div>
                      {order.delivery_fee > 0 && (
                        <div className="flex justify-between"><span>Entrega</span><span>{formatBRL(order.delivery_fee)}</span></div>
                      )}
                      <div className="flex justify-between text-sm font-semibold text-champagne-500">
                        <span>Total</span><span>{formatBRL(order.total)}</span>
                      </div>
                      <p className="pt-1">Pagamento: {PAYMENT_LABELS[order.payment_method] ?? order.payment_method}</p>
                      <p>Modo: {DELIVERY_LABELS[order.delivery_mode] ?? order.delivery_mode}</p>
                      {order.delivery_address && <p>Endereco: {order.delivery_address}</p>}
                    </div>

                    {!printerConnected && (
                      <p className="mt-2 text-[11px] text-champagne-500">
                        Conecte a impressora para imprimir.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <p className="mt-8 text-center text-xs text-champagne-500 px-4">
              Android: use Chrome ou Edge com uma impressora Bluetooth BLE. iPhone: use AirPrint ou o aplicativo da impressora, pois o navegador não libera Bluetooth BLE diretamente.
            </p>
          </>

      </div>
    </div>
  );
}
