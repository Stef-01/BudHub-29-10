// services/produceService.ts
// Service layer for managing produce items

import { supabase } from '../lib/supabase';
import type { ProduceItem, ProduceCategory, GIRating } from '../types/logan';

/**
 * Get all produce items
 */
export async function getAllProduceItems(): Promise<ProduceItem[]> {
  try {
    const { data, error } = await supabase
      .from('produce_items')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[produceService] Error fetching produce items:', error);
    return [];
  }
}

/**
 * Get Indian staple produce items only
 */
export async function getIndianStaples(): Promise<ProduceItem[]> {
  try {
    const { data, error } = await supabase
      .from('produce_items')
      .select('*')
      .eq('is_indian_staple', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[produceService] Error fetching Indian staples:', error);
    return [];
  }
}

/**
 * Get produce items by category
 */
export async function getProduceByCategory(category: ProduceCategory): Promise<ProduceItem[]> {
  try {
    const { data, error } = await supabase
      .from('produce_items')
      .select('*')
      .eq('category', category)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[produceService] Error fetching produce by category:', error);
    return [];
  }
}

/**
 * Get a single produce item by ID
 */
export async function getProduceItemById(id: string): Promise<ProduceItem | null> {
  try {
    const { data, error } = await supabase
      .from('produce_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[produceService] Error fetching produce item:', error);
    return null;
  }
}

/**
 * Search produce items by name or variation
 */
export async function searchProduceItems(query: string): Promise<ProduceItem[]> {
  try {
    const { data, error } = await supabase
      .from('produce_items')
      .select('*')
      .or(`name.ilike.%${query}%,name_variations.cs.{${query}}`)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[produceService] Error searching produce items:', error);
    return [];
  }
}

/**
 * Create a new produce item
 */
export async function createProduceItem(
  produceData: Omit<ProduceItem, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; data?: ProduceItem; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('produce_items')
      .insert([produceData])
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create produce item'
    };
  }
}

/**
 * Update an existing produce item
 */
export async function updateProduceItem(
  id: string,
  updates: Partial<Omit<ProduceItem, 'id' | 'created_at' | 'updated_at'>>
): Promise<{ success: boolean; data?: ProduceItem; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('produce_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update produce item'
    };
  }
}

/**
 * Delete a produce item (soft delete by default - we could add is_active flag)
 * For now, this is a hard delete
 */
export async function deleteProduceItem(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('produce_items')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete produce item'
    };
  }
}

/**
 * Get produce items with price data
 */
export async function getProduceWithPrices(): Promise<Array<ProduceItem & { latest_price?: number; market_count: number }>> {
  try {
    const { data, error } = await supabase
      .rpc('get_produce_with_price_stats');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[produceService] Error fetching produce with prices:', error);
    // Fallback to basic query
    return getAllProduceItems() as any;
  }
}

/**
 * Add a name variation to a produce item
 */
export async function addNameVariation(
  produceId: string,
  variation: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current produce item
    const item = await getProduceItemById(produceId);
    if (!item) {
      return { success: false, error: 'Produce item not found' };
    }

    // Add variation if it doesn't exist
    const currentVariations = item.name_variations || [];
    if (!currentVariations.includes(variation.toLowerCase())) {
      const updatedVariations = [...currentVariations, variation.toLowerCase()];
      return updateProduceItem(produceId, { name_variations: updatedVariations });
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add name variation'
    };
  }
}

/**
 * Remove a name variation from a produce item
 */
export async function removeNameVariation(
  produceId: string,
  variation: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const item = await getProduceItemById(produceId);
    if (!item) {
      return { success: false, error: 'Produce item not found' };
    }

    const currentVariations = item.name_variations || [];
    const updatedVariations = currentVariations.filter(v => v !== variation.toLowerCase());

    return updateProduceItem(produceId, { name_variations: updatedVariations });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove name variation'
    };
  }
}
