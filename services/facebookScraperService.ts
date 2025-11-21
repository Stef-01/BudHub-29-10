// services/facebookScraperService.ts
// Service for scraping and parsing price data from Global Food Markets Facebook posts

import { supabase } from '../lib/supabase';

/**
 * Price data extracted from text
 */
export interface ExtractedPrice {
  produceName: string;
  pricePerKg?: number;
  pricePerUnit?: number;
  unitType?: string;
  confidence: number; // 0-1, how confident the extraction is
  rawText: string; // Original text snippet
}

/**
 * Facebook post data structure
 */
export interface FacebookPost {
  id: string;
  message: string;
  created_time: string;
  attachments?: {
    data: Array<{
      type: string;
      media?: {
        image?: {
          src: string;
        };
      };
    }>;
  };
}

/**
 * Parse price from text using regex patterns
 * Examples:
 * - "Bitter Melon $3.99/kg"
 * - "Okra - $4.50 per kg"
 * - "Fresh Coriander $2.00 bunch"
 */
export function extractPriceFromText(text: string): ExtractedPrice[] {
  const results: ExtractedPrice[] = [];

  // Common produce name variations (Indian staples)
  const producePatterns = [
    { name: 'Bitter Melon', variations: ['bitter melon', 'karela', 'bitter gourd'] },
    { name: 'Fresh Coriander', variations: ['coriander', 'cilantro', 'dhania'] },
    { name: 'Okra', variations: ['okra', 'bhindi', 'lady finger'] },
    { name: 'Green Chilies', variations: ['green chili', 'green chilli', 'hari mirch', 'green pepper'] },
    { name: 'Fresh Turmeric', variations: ['turmeric', 'haldi', 'fresh turmeric root'] },
    { name: 'Curry Leaves', variations: ['curry leaves', 'kadi patta', 'curry leaf'] },
    { name: 'Spinach', variations: ['spinach', 'palak'] },
    { name: 'Eggplant', variations: ['eggplant', 'brinjal', 'baingan', 'aubergine'] },
  ];

  // Price patterns
  // Matches: $3.99/kg, $3.99 per kg, $3.99 kg, $3.99/kilo
  const pricePerKgPattern = /\$(\d+\.?\d*)\s*(?:\/|per)?\s*k(?:g|ilo)/gi;
  // Matches: $2.00 bunch, $2.00/bunch, $2.00 per bunch
  const pricePerBunchPattern = /\$(\d+\.?\d*)\s*(?:\/|per)?\s*bunch/gi;
  // Matches: $1.50 each, $1.50/each
  const pricePerUnitPattern = /\$(\d+\.?\d*)\s*(?:\/|per)?\s*(?:each|unit|piece)/gi;

  // Split text into lines for better parsing
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  for (const line of lines) {
    // Check for produce names
    for (const produce of producePatterns) {
      const lowerLine = line.toLowerCase();

      // Check if any variation matches
      for (const variation of produce.variations) {
        if (lowerLine.includes(variation)) {
          // Found produce, now extract price
          let priceMatch = null;
          let unitType = 'kg';
          let confidence = 0.7;

          // Try kg price
          priceMatch = pricePerKgPattern.exec(line);
          if (priceMatch) {
            results.push({
              produceName: produce.name,
              pricePerKg: parseFloat(priceMatch[1]),
              unitType: 'kg',
              confidence: 0.9,
              rawText: line
            });
            pricePerKgPattern.lastIndex = 0; // Reset regex
            break;
          }

          // Try bunch price
          priceMatch = pricePerBunchPattern.exec(line);
          if (priceMatch) {
            results.push({
              produceName: produce.name,
              pricePerUnit: parseFloat(priceMatch[1]),
              unitType: 'bunch',
              confidence: 0.9,
              rawText: line
            });
            pricePerBunchPattern.lastIndex = 0;
            break;
          }

          // Try unit/each price
          priceMatch = pricePerUnitPattern.exec(line);
          if (priceMatch) {
            results.push({
              produceName: produce.name,
              pricePerUnit: parseFloat(priceMatch[1]),
              unitType: 'piece',
              confidence: 0.85,
              rawText: line
            });
            pricePerUnitPattern.lastIndex = 0;
            break;
          }

          // If found produce but no price in same line, lower confidence
          if (!priceMatch) {
            const anyPricePattern = /\$(\d+\.?\d*)/;
            const anyPrice = anyPricePattern.exec(line);
            if (anyPrice) {
              results.push({
                produceName: produce.name,
                pricePerKg: parseFloat(anyPrice[1]),
                unitType: 'kg',
                confidence: 0.5, // Low confidence
                rawText: line
              });
              break;
            }
          }
        }
      }
    }
  }

  return results;
}

/**
 * Save scraped prices to Supabase
 */
export async function savePricesToSupabase(
  prices: ExtractedPrice[],
  marketId: string,
  snapshotDate: Date = new Date(),
  sourceUrl?: string
): Promise<{ success: number; failed: number; errors: string[] }> {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const price of prices) {
    try {
      // Only save if confidence is high enough
      if (price.confidence < 0.6) {
        console.log(`[facebookScraper] Skipping low confidence price: ${price.produceName} (${price.confidence})`);
        continue;
      }

      // Look up produce item ID
      const { data: produceItem, error: lookupError } = await supabase
        .from('produce_items')
        .select('id')
        .ilike('name', price.produceName)
        .single();

      if (lookupError || !produceItem) {
        errors.push(`Produce not found: ${price.produceName}`);
        failed++;
        continue;
      }

      // Insert price snapshot
      const { error: insertError } = await supabase
        .from('price_snapshots')
        .insert({
          produce_item_id: produceItem.id,
          market_id: marketId,
          price_per_kg: price.pricePerKg,
          price_per_unit: price.pricePerUnit,
          unit_type: price.unitType,
          snapshot_date: snapshotDate.toISOString().split('T')[0],
          source_type: 'facebook_scrape',
          source_url: sourceUrl,
          notes: `Scraped from: "${price.rawText}" (confidence: ${price.confidence})`,
          verified: price.confidence >= 0.85
        });

      if (insertError) {
        errors.push(`Failed to save ${price.produceName}: ${insertError.message}`);
        failed++;
      } else {
        success++;
      }
    } catch (error) {
      errors.push(`Error processing ${price.produceName}: ${error}`);
      failed++;
    }
  }

  return { success, failed, errors };
}

/**
 * Scrape Global Food Markets Facebook page
 *
 * NOTE: This is a placeholder for actual Facebook scraping
 * Facebook's API requires authentication and has strict rate limits
 *
 * Real implementation options:
 * 1. Use Facebook Graph API with page access token
 * 2. Use a web scraping service (Apify, Browserless)
 * 3. Manual copy/paste from Facebook into this parser
 * 4. RSS feed if available
 */
export async function scrapeGlobalFoodMarkets(): Promise<ExtractedPrice[]> {
  console.log('[facebookScraper] Facebook scraping not yet implemented');
  console.log('[facebookScraper] Use parseFacebookPostText() with manual copy/paste');

  // Placeholder - would fetch from Facebook Graph API
  // const response = await fetch(
  //   'https://graph.facebook.com/v18.0/{page-id}/posts?access_token={token}'
  // );

  return [];
}

/**
 * Parse manually copied Facebook post text
 * This is the recommended approach until Facebook API is set up
 */
export function parseFacebookPostText(postText: string): ExtractedPrice[] {
  return extractPriceFromText(postText);
}

/**
 * Get Global Food Markets market ID from Supabase
 */
export async function getGlobalFoodMarketsId(): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('markets')
      .select('id')
      .eq('name', 'Global Food Markets')
      .single();

    if (error || !data) {
      console.error('[facebookScraper] Could not find Global Food Markets');
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('[facebookScraper] Error fetching market ID:', error);
    return null;
  }
}

/**
 * Complete workflow: Parse text and save to Supabase
 */
export async function processManualFacebookPost(
  postText: string,
  postUrl?: string
): Promise<{ success: number; failed: number; errors: string[]; prices: ExtractedPrice[] }> {
  // Extract prices from text
  const prices = parseFacebookPostText(postText);
  console.log(`[facebookScraper] Extracted ${prices.length} prices from post`);

  if (prices.length === 0) {
    return { success: 0, failed: 0, errors: ['No prices found in text'], prices: [] };
  }

  // Get market ID
  const marketId = await getGlobalFoodMarketsId();
  if (!marketId) {
    return {
      success: 0,
      failed: prices.length,
      errors: ['Could not find Global Food Markets in database'],
      prices
    };
  }

  // Save to Supabase
  const result = await savePricesToSupabase(prices, marketId, new Date(), postUrl);

  return { ...result, prices };
}
