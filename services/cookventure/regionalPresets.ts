// services/cookventure/regionalPresets.ts
import type { UserPreferences, TasteAxes } from '../../types/cookventure';
import regionsData from '../../data/cookventure/regions.json';
import masalasData from '../../data/cookventure/masalas.json';
import tadkaData from '../../data/cookventure/tadka.json';
import subregionsData from '../../data/cookventure/subregions.json';

export interface RegionalPreset {
  id: string;
  title: string;
  description: string;
  emoji: string;
  regionId: string;
  /** Set for sub-regional kits (Kerala, Chettinad, ...) */
  subregionId?: string;
  pantry: string[];
  masalas: string[];
  tadkas: string[];
  taste: TasteAxes;
}

/**
 * Get regional starter kits for quick setup
 */
export function getRegionalStarterKits(regionId: string): RegionalPreset[] {
  const region = (regionsData as any)[regionId];
  if (!region) return [];

  const presets: RegionalPreset[] = [];

  // Define presets based on region
  if (regionId === 'south') {
    presets.push({
      id: 'south_sambar',
      title: 'Classic Sambar',
      description: 'Tangy lentil stew with vegetables',
      emoji: '🍲',
      regionId: 'south',
      pantry: ['curry leaves', 'tamarind', 'toor dal', 'drumstick', 'tomato', 'mustard seeds'],
      masalas: ['sambar_powder'],
      tadkas: ['mustard_curry_leaf'],
      taste: { heat: 1, masala: 2, tangy: 2, sweet: 1 },
    });

    presets.push({
      id: 'south_rasam',
      title: 'Tangy Rasam',
      description: 'Peppery, sour tomato soup',
      emoji: '🍵',
      regionId: 'south',
      pantry: ['curry leaves', 'tamarind', 'tomato', 'black pepper', 'toor dal'],
      masalas: ['rasam_powder'],
      tadkas: ['mustard_curry_leaf'],
      taste: { heat: 2, masala: 2, tangy: 3, sweet: 0 },
    });

    presets.push({
      id: 'south_coconut_chutney',
      title: 'Coconut Chutney',
      description: 'Creamy coconut condiment',
      emoji: '🥥',
      regionId: 'south',
      pantry: ['coconut', 'curry leaves', 'ginger', 'green chilli', 'urad dal'],
      masalas: [],
      tadkas: ['mustard_curry_leaf'],
      taste: { heat: 1, masala: 1, tangy: 1, sweet: 0 },
    });
  } else if (regionId === 'north') {
    presets.push({
      id: 'north_dal_tadka',
      title: 'Dal Tadka',
      description: 'Tempered yellow lentils',
      emoji: '🍛',
      regionId: 'north',
      pantry: ['toor dal', 'onion', 'tomato', 'garlic', 'ginger', 'cumin'],
      masalas: ['garam_masala'],
      tadkas: ['hing_jeera', 'lehsun_lal_mirch'],
      taste: { heat: 2, masala: 2, tangy: 1, sweet: 0 },
    });

    presets.push({
      id: 'north_chana_masala',
      title: 'Chana Masala',
      description: 'Spiced chickpea curry',
      emoji: '🫘',
      regionId: 'north',
      pantry: ['chickpea', 'onion', 'tomato', 'ginger', 'garlic'],
      masalas: ['garam_masala', 'chaat_masala'],
      tadkas: ['hing_jeera'],
      taste: { heat: 2, masala: 3, tangy: 1, sweet: 0 },
    });
  } else if (regionId === 'west') {
    presets.push({
      id: 'west_varan',
      title: 'Maharashtrian Varan',
      description: 'Simple, sweet dal',
      emoji: '🍲',
      regionId: 'west',
      pantry: ['toor dal', 'jaggery', 'turmeric', 'kokum'],
      masalas: ['goda_masala'],
      tadkas: ['hing_jeera'],
      taste: { heat: 0, masala: 2, tangy: 1, sweet: 2 },
    });
  } else if (regionId === 'east') {
    presets.push({
      id: 'east_shukto',
      title: 'Bengali Shukto',
      description: 'Bittersweet vegetable medley',
      emoji: '🥬',
      regionId: 'east',
      pantry: ['mustard oil', 'ginger', 'bitter gourd', 'potato', 'milk'],
      masalas: ['panch_phoron'],
      tadkas: ['panch_phoron'],
      taste: { heat: 1, masala: 2, tangy: 0, sweet: 1 },
    });
  } else if (regionId === 'northeast') {
    presets.push({
      id: 'northeast_aloo_pitika',
      title: 'Aloo Pitika',
      description: 'Assamese mash with raw mustard oil',
      emoji: '🥔',
      regionId: 'northeast',
      pantry: ['potato', 'mustard oil', 'onion', 'green chilli', 'coriander'],
      masalas: [],
      tadkas: [],
      taste: { heat: 2, masala: 0, tangy: 0, sweet: 0 },
    });
  } else if (regionId === 'deccan') {
    presets.push({
      id: 'deccan_bagara_baingan',
      title: 'Bagara Baingan',
      description: 'Hyderabadi eggplant in peanut-tamarind gravy',
      emoji: '🍆',
      regionId: 'deccan',
      pantry: ['eggplant', 'peanuts', 'coconut', 'tamarind', 'curry leaves', 'onion'],
      masalas: [],
      tadkas: ['mustard_curry_leaf'],
      taste: { heat: 2, masala: 3, tangy: 2, sweet: 1 },
    });
  }

  return presets;
}

export interface Subregion {
  id: string;
  region: string;
  name: string;
  name_hi: string;
  emoji: string;
  notes: string;
  signature: string[];
  default_masalas: string[];
  default_tadka: string[];
  default_taste: TasteAxes;
  kit: Omit<RegionalPreset, 'id' | 'regionId' | 'subregionId'>;
}

const SUBREGIONS = Object.entries(subregionsData as Record<string, Omit<Subregion, 'id'>>).map(
  ([id, sub]) => ({ ...sub, id }) as Subregion
);

/** Sub-regions of a region, in data order */
export function getSubregions(regionId: string): Subregion[] {
  return SUBREGIONS.filter((sub) => sub.region === regionId);
}

export function getSubregion(subregionId: string): Subregion | undefined {
  return SUBREGIONS.find((sub) => sub.id === subregionId);
}

/** The starter kit for a sub-region (e.g. Kerala coconut-pepper, Andhra gongura) */
export function getSubregionKit(subregionId: string): RegionalPreset | undefined {
  const sub = getSubregion(subregionId);
  if (!sub) return undefined;
  return { ...sub.kit, id: `sub_${sub.id}`, regionId: sub.region, subregionId: sub.id };
}

/**
 * Apply a regional preset to user preferences
 */
export function applyRegionalPreset(
  preset: RegionalPreset,
  currentPrefs: UserPreferences
): UserPreferences {
  return {
    ...currentPrefs,
    selectedRegions: [...new Set([...currentPrefs.selectedRegions, preset.regionId])],
    selectedSubregions: preset.subregionId
      ? [...new Set([...(currentPrefs.selectedSubregions || []), preset.subregionId])]
      : currentPrefs.selectedSubregions,
    pantry: [...new Set([...currentPrefs.pantry, ...preset.pantry])],
    masalaLocker: [...new Set([...currentPrefs.masalaLocker, ...preset.masalas])],
    favouriteTadkas: [...new Set([...currentPrefs.favouriteTadkas, ...preset.tadkas])],
    tastePrefs: preset.taste,
  };
}

/**
 * Get default preferences for a region
 */
export function getDefaultRegionPreferences(regionId: string): Partial<UserPreferences> {
  const region = (regionsData as any)[regionId];
  if (!region) return {};

  return {
    selectedRegions: [regionId],
    pantry: region.staple_packs || [],
    masalaLocker: region.default_masalas || [],
    favouriteTadkas: region.default_tadka || [],
    tastePrefs: region.default_taste || { heat: 1, masala: 1, tangy: 1, sweet: 0 },
  };
}

/**
 * Load all taxonomy data
 */
export function loadCookventureData() {
  return {
    regions: regionsData,
    masalas: masalasData,
    tadkas: tadkaData,
  };
}
