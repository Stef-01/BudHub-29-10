// services/cookventure/labels.ts
// Bilingual (English + Hindi) labels and display-name helpers for Cookventure India.
import type { TasteAxes } from '../../types/cookventure';
import regionsData from '../../data/cookventure/regions.json';
import masalasData from '../../data/cookventure/masalas.json';
import tadkaData from '../../data/cookventure/tadka.json';

export interface BilingualLabel {
  en: string;
  hi: string;
}

export type CookventureStep = 'craving' | 'region' | 'pantry' | 'flavor' | 'masala_tadka' | 'results';

export const STEP_ORDER: CookventureStep[] = [
  'craving',
  'region',
  'pantry',
  'flavor',
  'masala_tadka',
  'results',
];

export const STEP_LABELS: Record<CookventureStep, BilingualLabel> = {
  craving: { en: 'Cravings', hi: 'इच्छा' },
  region: { en: 'Region', hi: 'क्षेत्र' },
  pantry: { en: 'Pantry', hi: 'भंडार' },
  flavor: { en: 'Flavor', hi: 'स्वाद' },
  masala_tadka: { en: 'Masala', hi: 'मसाला' },
  results: { en: 'Results', hi: 'नतीजे' },
};

export interface TasteAxisMeta extends BilingualLabel {
  key: keyof TasteAxes;
  /** Romanised Hindi name used as the primary label, e.g. "Teekha" */
  roman: string;
  emoji: string;
  help: string;
}

export const TASTE_AXES: TasteAxisMeta[] = [
  { key: 'heat', roman: 'Teekha', en: 'Heat', hi: 'तीखा', emoji: '🌶️', help: 'Chili heat level' },
  {
    key: 'masala',
    roman: 'Masaledar',
    en: 'Spice-rich',
    hi: 'मसालेदार',
    emoji: '🧄',
    help: 'Aroma & warmth from spices (not just heat)',
  },
  { key: 'tangy', roman: 'Khata', en: 'Tangy', hi: 'खट्टा', emoji: '🍋', help: 'Sourness from tamarind, kokum, amchur' },
  { key: 'sweet', roman: 'Meetha', en: 'Sweet', hi: 'मीठा', emoji: '🍯', help: 'Sweetness or caramelization' },
];

export const TASTE_LEVEL_LABELS = ['None', 'Mild', 'Medium', 'High'];

/** "mustard_curry_leaf" -> "mustard curry leaf" */
export function humanizeId(id: string): string {
  return id.replace(/_/g, ' ');
}

export function getRegionName(regionId: string): string {
  return (regionsData as Record<string, { name: string }>)[regionId]?.name ?? humanizeId(regionId);
}

export function getMasalaName(masalaId: string): string {
  return (masalasData as Record<string, { name: string }>)[masalaId]?.name ?? humanizeId(masalaId);
}

export function getTadkaName(tadkaId: string): string {
  return (tadkaData as Record<string, { name: string }>)[tadkaId]?.name ?? humanizeId(tadkaId);
}
