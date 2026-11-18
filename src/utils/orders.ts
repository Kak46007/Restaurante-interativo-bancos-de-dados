import { supabase } from '@/lib/supabase';
import type { CartItem } from '@/context/CartContext';

export interface SavedOrder {
  id: string;
  items_json: CartItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  delivery_mode: string;
  payment_method: string;
  delivery_address: string | null;
  distance_km: number | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_note: string | null;
  status: string;
  created_at: string;
}

export interface OrderInsert {
  items_json: CartItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  delivery_mode: string;
  payment_method: string;
  delivery_address?: string;
  distance_km?: number;
  customer_name: string;
  customer_phone: string;
  customer_note?: string;
}

export async function saveOrder(order: OrderInsert): Promise<string | null> {
  const { data, error } = await supabase
    .from('orders')
    .insert({
      items_json: order.items_json,
      subtotal: order.subtotal,
      delivery_fee: order.delivery_fee,
      total: order.total,
      delivery_mode: order.delivery_mode,
      payment_method: order.payment_method,
      delivery_address: order.delivery_address ?? null,
      distance_km: order.distance_km ?? null,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      customer_note: order.customer_note ?? null,
      status: 'novo',
    })
    .select('id')
    .single();

  if (error) {
    console.error('saveOrder error', error);
    return null;
  }
  return data?.id ?? null;
}

export async function fetchNewOrders(): Promise<SavedOrder[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('status', 'novo')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('fetchNewOrders error', error);
    return [];
  }
  return (data ?? []) as SavedOrder[];
}

export async function markOrderPrinted(id: string): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ status: 'impresso' })
    .eq('id', id);
  if (error) console.error('markOrderPrinted error', error);
}
