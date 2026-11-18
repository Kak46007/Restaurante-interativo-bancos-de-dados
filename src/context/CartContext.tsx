import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { Product } from '@/data/products';

export interface IngredientModification {
  action: 'remove' | 'add';
  ingredient: string;
  price?: number;
}

export interface ItemCustomizations {
  modifications: IngredientModification[];
  notes: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  customizations?: ItemCustomizations;
}

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  totalItems: number;
  subtotal: number;
  addItem: (product: Product, quantity?: number, customizations?: ItemCustomizations) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = useCallback((product: Product, quantity = 1, customizations?: ItemCustomizations) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) =>
          i.product.id === product.id &&
          JSON.stringify(i.customizations) === JSON.stringify(customizations),
      );
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id &&
          JSON.stringify(i.customizations) === JSON.stringify(customizations)
            ? { ...i, quantity: i.quantity + quantity }
            : i,
        );
      }
      return [...prev, { product, quantity, customizations }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === productId ? { ...i, quantity } : i,
      ),
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => {
    const extrasTotal = i.customizations?.modifications.reduce(
      (extrasSum, modification) => extrasSum + (modification.price ?? 0),
      0,
    ) ?? 0;
    return sum + (i.product.price + extrasTotal) * i.quantity;
  }, 0);

  const value: CartContextValue = {
    items,
    isOpen,
    totalItems,
    subtotal,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    openCart,
    closeCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
