// services/priceService.ts
// Service layer for produce prices

import { supabase } from '../lib/supabase';
import type { LatestPrice, CheapestPrice, ProduceItem, PriceSnapshot } from '../types/logan';

/**
 * Get cheapest prices today across all markets
 * @param limit - Number of items to return (default: 20)
 */
export async function getCheapestPricesToday(limit: number = 20): Promise<CheapestPrice[]> {
  try {
    const { data, error } = await supabase
      .from('cheapest_prices')
      .select('*')
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[priceService] Error fetching cheapest prices:', error);
    return [];
  }
}

/**
 * Get cheapest Indian staples today
 * @param limit - Number of items to return (default: 10)
 */
export async function getCheapestIndianStaples(limit: number = 10): Promise<CheapestPrice[]> {
  try {
    const { data, error } = await supabase
      .from('cheapest_prices')
      .select('*')
      .eq('is_indian_staple', true)
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[priceService] Error fetching cheapest Indian staples:', error);
    return [];
  }
}

/**
 * Get latest prices for a specific produce item across all markets
 */
export async function getLatestPricesForProduce(produceItemId: string): Promise<LatestPrice[]> {
  try {
    const { data, error } = await supabase
      .from('latest_prices')
      .select('*')
      .eq('produce_item_id', produceItemId)
      .order('price_per_kg', { ascending: true, nullsFirst: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[priceService] Error fetching latest prices for produce:', error);
    return [];
  }
}

/**
 * Get price history for a produce item at a specific market
 */
export async function getPriceHistory(
  produceItemId: string,
  marketId: string,
  days: number = 30
): Promise<PriceSnapshot[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('price_snapshots')
      .select('*')
      .eq('produce_item_id', produceItemId)
      .eq('market_id', marketId)
      .eq('verified', true)
      .gte('snapshot_date', startDate.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[priceService] Error fetching price history:', error);
    return [];
  }
}

/**
 * Get all produce items
 */
export async function getAllProduceItems(): Promise<ProduceItem[]> {
  try {
    const { data, error } = await supabase
      .from('produce_items')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[priceService] Error fetching produce items:', error);
    return [];
  }
}

/**
 * Get Indian staple produce items
 */
export async function getIndianStaples(): Promise<ProduceItem[]> {
  try {
    const { data, error } = await supabase
      .from('produce_items')
      .select('*')
      .eq('is_indian_staple', true)
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[priceService] Error fetching Indian staples:', error);
    return [];
  }
}

/**
 * Search produce by name or variation
 */
export async function searchProduce(searchTerm: string): Promise<ProduceItem[]> {
  try {
    const { data, error } = await supabase
      .from('produce_items')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,name_variations.cs.{${searchTerm}}`)
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[priceService] Error searching produce:', error);
    return [];
  }
}

/**
 * Get price comparison for multiple markets
 */
export async function comparePricesAcrossMarkets(produceItemId: string): Promise<{
  produce: ProduceItem | null;
  prices: LatestPrice[];
  cheapest: LatestPrice | null;
  average: number;
}> {
  try {
    // Get produce details
    const { data: produce, error: produceError } = await supabase
      .from('produce_items')
      .select('*')
      .eq('id', produceItemId)
      .single();

    if (produceError) throw produceError;

    // Get latest prices across markets
    const prices = await getLatestPricesForProduce(produceItemId);

    // Calculate cheapest and average
    const validPrices = prices.filter(p => p.price_per_kg !== null && p.price_per_kg !== undefined);
    const cheapest = validPrices.length > 0 ? validPrices[0] : null;
    const average = validPrices.length > 0
      ? validPrices.reduce((sum, p) => sum + (p.price_per_kg || 0), 0) / validPrices.length
      : 0;

    return { produce, prices, cheapest, average };
  } catch (error) {
    console.error('[priceService] Error comparing prices:', error);
    return { produce: null, prices: [], cheapest: null, average: 0 };
  }
}

/**
 * Add a new price snapshot (for admin/scraper)
 */
export async function addPriceSnapshot(snapshot: Omit<PriceSnapshot, 'id' | 'created_at' | 'updated_at'>): Promise<PriceSnapshot | null> {
  try {
    const { data, error } = await supabase
      .from('price_snapshots')
      .insert(snapshot)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[priceService] Error adding price snapshot:', error);
    return null;
  }
}
