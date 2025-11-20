// services/marketService.ts
// Service layer for Logan markets data

import { supabase } from '../lib/supabase';
import type { Market, MarketWithTags } from '../types/logan';

/**
 * Get all active Logan markets
 */
export async function getLoganMarkets(): Promise<Market[]> {
  try {
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[marketService] Error fetching markets:', error);
    return [];
  }
}

/**
 * Get markets that are open today
 */
export async function getMarketsOpenToday(): Promise<Market[]> {
  try {
    const today = new Date().getDay(); // 0=Sunday, 1=Monday, etc.

    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .eq('is_active', true)
      .or(`day_of_week.eq.${today},day_of_week.is.null`) // null means open daily
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[marketService] Error fetching markets open today:', error);
    return [];
  }
}

/**
 * Get a specific market by ID with its tags
 */
export async function getMarketWithTags(marketId: string): Promise<MarketWithTags | null> {
  try {
    // Get market details
    const { data: market, error: marketError } = await supabase
      .from('markets')
      .select('*')
      .eq('id', marketId)
      .single();

    if (marketError) throw marketError;
    if (!market) return null;

    // Get market tags
    const { data: tags, error: tagsError } = await supabase
      .from('market_tags')
      .select('tag')
      .eq('market_id', marketId);

    if (tagsError) throw tagsError;

    return {
      ...market,
      tags: tags?.map(t => t.tag) || []
    };
  } catch (error) {
    console.error('[marketService] Error fetching market with tags:', error);
    return null;
  }
}

/**
 * Get markets that carry a specific produce item
 */
export async function getMarketsByProduce(produceName: string): Promise<Market[]> {
  try {
    const { data, error } = await supabase
      .from('markets')
      .select(`
        *,
        market_tags!inner(tag)
      `)
      .eq('is_active', true)
      .ilike('market_tags.tag', `%${produceName}%`)
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[marketService] Error fetching markets by produce:', error);
    return [];
  }
}

/**
 * Get markets with Indian produce
 */
export async function getIndianMarkets(): Promise<Market[]> {
  try {
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .eq('is_active', true)
      .eq('has_indian_produce', true)
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[marketService] Error fetching Indian markets:', error);
    return [];
  }
}

/**
 * Get market schedule for the week
 */
export async function getWeeklyMarketSchedule(): Promise<{[key: number]: Market[]}> {
  try {
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .eq('is_active', true)
      .not('day_of_week', 'is', null)
      .order('day_of_week')
      .order('start_time');

    if (error) throw error;

    // Group by day of week
    const schedule: {[key: number]: Market[]} = {};
    data?.forEach(market => {
      if (market.day_of_week !== null) {
        if (!schedule[market.day_of_week]) {
          schedule[market.day_of_week] = [];
        }
        schedule[market.day_of_week].push(market);
      }
    });

    return schedule;
  } catch (error) {
    console.error('[marketService] Error fetching weekly schedule:', error);
    return {};
  }
}
