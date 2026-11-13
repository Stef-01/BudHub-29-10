/**
 * NutriServe's six pilot customer sprites, idle states only. They were made with another game's
 * screenshot as a style input (see the manifest's referenceUse and docs/nutriserve/ASSET_WORKFLOW.md,
 * Originality); whether to redraw them is the art owner's decision. See
 * public/assets/nutriserve/manifest.json.
 */
export const CUSTOMER_SPRITES = {
  arjun_fit: { name: 'Arjun', src: '/assets/nutriserve/characters/arjun_fit-idle-v3.png', revision: 3 },
  priya_balanced: { name: 'Priya', src: '/assets/nutriserve/characters/priya_balanced-idle-v2.png', revision: 2 },
  rohan_light: { name: 'Rohan', src: '/assets/nutriserve/characters/rohan_light-idle-v2.png', revision: 2 },
  maya_protein: { name: 'Maya', src: '/assets/nutriserve/characters/maya_protein-idle-v2.png', revision: 2 },
  vikram_lowsodium: { name: 'Vikram', src: '/assets/nutriserve/characters/vikram_lowsodium-idle-v2.png', revision: 2 },
  ananya_breakfast: { name: 'Ananya', src: '/assets/nutriserve/characters/ananya_breakfast-idle-v2.png', revision: 2 },
} as const;

export type SpriteCustomerId = keyof typeof CUSTOMER_SPRITES;
export function getCustomerSprite(id: string) {
  return Object.hasOwn(CUSTOMER_SPRITES, id) ? CUSTOMER_SPRITES[id as SpriteCustomerId] : undefined;
}
