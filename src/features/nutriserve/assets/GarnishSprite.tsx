import React from 'react';
import { GARNISH_SPRITES } from './garnishes';

/** SVG child: source art stays centered on the simulation's existing placement pivot. */
export function GarnishSprite({ id, size = 10 }: { id: string; size?: number }) {
  if (!Object.hasOwn(GARNISH_SPRITES, id)) return null;
  const asset = GARNISH_SPRITES[id as keyof typeof GARNISH_SPRITES];
  return (
    <svg x={-size} y={-size} width={size * 2} height={size * 2}
      viewBox={asset.viewBox} overflow="visible" aria-hidden="true"
      pointerEvents="none" data-garnish-art={id}>
      <image href={asset.path} width={asset.width} height={asset.height} />
    </svg>
  );
}
