// services/cookventure/assets.ts
// Drop-in artwork for Cookventure. Put a file at assets/cookventure/<category>/<id>.<ext>
// (png, jpg, webp, avif or svg) and it is picked up at build time; until then the UI shows the
// emoji fallback. See docs/COOKVENTURE_ASSET_BRIEF.md for the full list of slots.
import regionsData from '../../data/cookventure/regions.json';
import subregionsData from '../../data/cookventure/subregions.json';
import masalasData from '../../data/cookventure/masalas.json';
import tadkaData from '../../data/cookventure/tadka.json';
import playlistsData from '../../data/cookventure/playlists.json';
import { getRegionalStarterKits, getSubregionKit } from './regionalPresets';

export type AssetCategory = 'regions' | 'subregions' | 'masalas' | 'tadkas' | 'kits' | 'playlists';

const files = import.meta.glob('../../assets/cookventure/**/*.{png,jpg,jpeg,webp,avif,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

/** "../../assets/cookventure/regions/south.webp" -> "regions/south" */
const ASSET_URLS: Record<string, string> = {};
Object.entries(files).forEach(([path, url]) => {
  const match = path.match(/assets\/cookventure\/([a-z]+)\/([a-z0-9_]+)\.[a-z]+$/);
  if (match) ASSET_URLS[`${match[1]}/${match[2]}`] = url;
});

/** URL of the artwork for a slot, or undefined when it hasn't been added yet */
export function getAssetUrl(category: AssetCategory, id: string): string | undefined {
  return ASSET_URLS[`${category}/${id}`];
}

export interface AssetSlot {
  category: AssetCategory;
  id: string;
  name: string;
  /** What the artwork should show */
  subject: string;
  fallback: string;
  filled: boolean;
}

type Named = { name: string; emoji?: string };

/** Every artwork slot Cookventure can use, and whether it has a file yet */
export function listAssetSlots(): AssetSlot[] {
  const slots: Omit<AssetSlot, 'filled'>[] = [];

  Object.entries(regionsData as Record<string, Named & { notes: string }>).forEach(([id, r]) =>
    slots.push({ category: 'regions', id, name: r.name, subject: r.notes, fallback: r.emoji ?? '🍛' })
  );
  Object.entries(subregionsData as Record<string, Named & { notes: string }>).forEach(([id, r]) =>
    slots.push({ category: 'subregions', id, name: r.name, subject: r.notes, fallback: r.emoji ?? '🍛' })
  );
  Object.entries(masalasData as Record<string, Named & { description: string; spices: string[] }>).forEach(([id, m]) =>
    slots.push({
      category: 'masalas',
      id,
      name: m.name,
      subject: `${m.description}: ${m.spices.map((s) => s.replace(/_/g, ' ')).join(', ')}`,
      fallback: '🫙',
    })
  );
  Object.entries(tadkaData as Record<string, Named & { aroma: string; seeds: string[]; aromatics: string[] }>).forEach(([id, t]) =>
    slots.push({
      category: 'tadkas',
      id,
      name: t.name,
      subject: `Tempering in a small pan: ${[...t.seeds, ...t.aromatics].map((s) => s.replace(/_/g, ' ')).join(', ')} (${t.aroma})`,
      fallback: t.emoji ?? '🍳',
    })
  );

  const kits = [
    ...Object.keys(regionsData).flatMap((id) => getRegionalStarterKits(id)),
    ...Object.keys(subregionsData).map((id) => getSubregionKit(id)!),
  ];
  kits.forEach((k) => slots.push({ category: 'kits', id: k.id, name: k.title, subject: k.description, fallback: k.emoji }));

  Object.entries(playlistsData as Record<string, Named & { description: string }>).forEach(([id, p]) =>
    slots.push({ category: 'playlists', id, name: p.name, subject: p.description, fallback: p.emoji ?? '🎵' })
  );

  return slots.map((slot) => ({ ...slot, filled: !!getAssetUrl(slot.category, slot.id) }));
}
