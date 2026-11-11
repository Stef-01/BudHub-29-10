// Placement metadata for the accepted sprites, read from the asset manifest (the source of truth
// for sizes, visible bounds and foot anchors). Rendering code places a sprite by its foot anchor so
// feet land on the floor/counter line regardless of each image's padding.
import manifest from '../../../../public/assets/nutriserve/manifest.json' with { type: 'json' };

export interface SpritePlacement {
  width: number;
  height: number;
  /** Foot anchor as fractions of the image (x across, y down). */
  footAnchor: [number, number];
  visibleBounds: { left: number; top: number; right: number; bottom: number };
  /** States the asset track has not produced yet (never alias these to idle). */
  statesNotProduced: string[];
}

type ManifestCharacter = {
  id: string;
  width: number;
  height: number;
  footAnchor: number[];
  visibleBounds: SpritePlacement['visibleBounds'];
  statesNotProduced?: string[];
  review?: { status?: string };
};

const PLACEMENTS = new Map<string, SpritePlacement>(
  (manifest.characters as ManifestCharacter[])
    .filter((c) => c.review?.status === 'accepted-pilot-idle')
    .map((c) => [
      c.id,
      {
        width: c.width,
        height: c.height,
        footAnchor: [c.footAnchor[0], c.footAnchor[1]] as [number, number],
        visibleBounds: c.visibleBounds,
        statesNotProduced: c.statesNotProduced ?? [],
      },
    ])
);

export function getSpritePlacement(customerId: string): SpritePlacement | undefined {
  return PLACEMENTS.get(customerId);
}

/**
 * Stage-space box for a sprite whose foot anchor should sit at (footX, footY) with a given
 * rendered height. All values are in the 640x480 stage coordinate system.
 */
export function spriteBoxAtFoot(placement: SpritePlacement, footX: number, footY: number, height: number) {
  const width = (height * placement.width) / placement.height;
  return {
    left: footX - placement.footAnchor[0] * width,
    top: footY - placement.footAnchor[1] * height,
    width,
    height,
  };
}
