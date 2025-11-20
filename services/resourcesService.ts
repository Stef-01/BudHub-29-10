// services/resourcesService.ts
// Service layer for Indian dietary and health resources

import { supabase } from '../lib/supabase';
import type { Resource, ResourceLanguage, ResourceTopic } from '../types/logan';

/**
 * Get all active resources
 */
export async function getAllResources(): Promise<Resource[]> {
  try {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .order('is_local', { ascending: false }) // Local resources first
      .order('title');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[resourcesService] Error fetching resources:', error);
    return [];
  }
}

/**
 * Get Logan/Brisbane specific resources
 */
export async function getLocalResources(): Promise<Resource[]> {
  try {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('is_local', true)
      .order('title');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[resourcesService] Error fetching local resources:', error);
    return [];
  }
}

/**
 * Get resources by topic
 */
export async function getResourcesByTopic(topic: ResourceTopic): Promise<Resource[]> {
  try {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('topic', topic)
      .order('is_local', { ascending: false })
      .order('title');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[resourcesService] Error fetching resources by topic:', error);
    return [];
  }
}

/**
 * Get resources by language
 */
export async function getResourcesByLanguage(language: ResourceLanguage): Promise<Resource[]> {
  try {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('language', language)
      .order('is_local', { ascending: false})
      .order('title');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[resourcesService] Error fetching resources by language:', error);
    return [];
  }
}

/**
 * Get Indian dietary resources (combination of cultural and nutrition topics)
 */
export async function getIndianDietaryResources(): Promise<Resource[]> {
  try {
    const { data, error} = await supabase
      .from('resources')
      .select('*')
      .in('topic', ['Indian food culture', 'healthy eating', 'healthy cooking', 'recipes', 'diabetes management'])
      .order('is_local', { ascending: false })
      .order('title');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[resourcesService] Error fetching Indian dietary resources:', error);
    return [];
  }
}

/**
 * Get resources for patients/families
 */
export async function getPatientResources(): Promise<Resource[]> {
  try {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .in('target_audience', ['patients', 'families', 'general'])
      .order('is_local', { ascending: false })
      .order('title');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[resourcesService] Error fetching patient resources:', error);
    return [];
  }
}

/**
 * Search resources by title or description
 */
export async function searchResources(searchTerm: string): Promise<Resource[]> {
  try {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order('is_local', { ascending: false })
      .order('title');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[resourcesService] Error searching resources:', error);
    return [];
  }
}

/**
 * Get resources with specific tag
 */
export async function getResourcesByTag(tag: string): Promise<Resource[]> {
  try {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .contains('tags', [tag])
      .order('is_local', { ascending: false })
      .order('title');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[resourcesService] Error fetching resources by tag:', error);
    return [];
  }
}

/**
 * Get featured resources for homepage
 * (Local resources + diabetes management + cultural resources)
 */
export async function getFeaturedResources(limit: number = 6): Promise<Resource[]> {
  try {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .or('is_local.eq.true,topic.in.("diabetes management","Indian food culture","healthy eating")')
      .order('is_local', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[resourcesService] Error fetching featured resources:', error);
    return [];
  }
}
