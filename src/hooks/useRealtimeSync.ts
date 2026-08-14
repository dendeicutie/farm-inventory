import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Rooster, Supply, SaleRecord } from '../types/database';

export function useRealtimeSync() {
  const [roosters, setRoosters] = useState<Rooster[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState<true | false>(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [roostersRes, suppliesRes, salesRes] = await Promise.all([
      supabase.from('roosters').select('*').order('created_at', { ascending: false }),
      supabase.from('supplies').select('*').order('created_at', { ascending: false }),
      supabase.from('sales_records').select('*').order('sale_date', { ascending: false }),
    ]);

    if (roostersRes.data) setRoosters(roostersRes.data as Rooster[]);
    if (suppliesRes.data) setSupplies(suppliesRes.data as Supply[]);
    if (salesRes.data) setSales(salesRes.data as SaleRecord[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();

    // Enable multi-device Realtime Sync
    const channel = supabase
      .channel('farm_inventory_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'roosters' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'supplies' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_records' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  // Handle Marking a Rooster as Sold OR Undoing a Sale
  const toggleRoosterSold = async (rooster: Rooster, buyerName: string = 'Walk-in Buyer') => {
    const isNowSold = rooster.status === 'Available';
    const newStatus: Rooster['status'] = isNowSold ? 'Sold' : 'Available';

    // 1. Update the Rooster Status
    const { error: updateError } = await supabase
      .from('roosters')
      .update({ status: newStatus })
      .eq('id', rooster.id);

    if (updateError) return alert('Failed to update rooster status.');

    // 2. If changing to SOLD -> Insert new Sale Record
    if (isNowSold) {
      await supabase.from('sales_records').insert([
        {
          rooster_id: rooster.id,
          buyer_name: buyerName,
          sale_price: rooster.price,
          sale_date: new Date().toISOString(),
          notes: `Sold: Wing Band #${rooster.wing_band_no} (${rooster.breed})`,
        },
      ]);
    } 
    // 3. If changing BACK TO AVAILABLE -> Delete the linked Sale Record
    else {
      await supabase
        .from('sales_records')
        .delete()
        .eq('rooster_id', rooster.id);
    }
  };

  const updateSupplyQuantity = async (id: string, newQuantity: number) => {
    await supabase.from('supplies').update({ quantity: newQuantity }).eq('id', id);
  };

  return {
    roosters,
    supplies,
    sales,
    loading,
    toggleRoosterSold,
    updateSupplyQuantity,
    refreshData: fetchData,
  };
}