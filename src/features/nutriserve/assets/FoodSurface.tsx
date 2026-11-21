import React from 'react';
import { FOOD_SURFACES } from './foodSurfaces';
import { runtimeVariants } from './runtimeImages';

/** Decorative SVG child. Geometry and input continue to use the existing unit-circle contract. */
export function FoodSurface({ id, x, y, diameter }: { id?: string; x: number; y: number; diameter: number }) {
  if (!id || !Object.hasOwn(FOOD_SURFACES, id)) return null;
  const asset = FOOD_SURFACES[id as keyof typeof FOOD_SURFACES];
  return <svg x={x} y={y} width={diameter} height={diameter} viewBox={asset.viewBox}
    pointerEvents="none" aria-hidden="true" data-food-art={id}>
    <image href={runtimeVariants(asset.path)?.[0].path ?? asset.path} width={asset.width} height={asset.height} />
  </svg>;
}
