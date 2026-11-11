// 640x480 stage geometry. Everything on the stage is laid out in stage units and converted to
// percentages, so the scene scales to any width while pointer input maps back exactly.
export const STAGE_W = 640;
export const STAGE_H = 480;

/** CSS for an absolutely positioned box given in stage units. */
export function box(x: number, y: number, w: number, h: number): Record<string, string> {
  return {
    left: `${(x / STAGE_W) * 100}%`,
    top: `${(y / STAGE_H) * 100}%`,
    width: `${(w / STAGE_W) * 100}%`,
    height: `${(h / STAGE_H) * 100}%`,
  };
}

/** Like box() but the height follows the content. */
export function boxAuto(x: number, y: number, w: number): Record<string, string> {
  return { left: `${(x / STAGE_W) * 100}%`, top: `${(y / STAGE_H) * 100}%`, width: `${(w / STAGE_W) * 100}%` };
}

/** Client (viewport) point -> stage units, using the stage element's rendered rectangle. */
export function clientToStage(rect: DOMRect, clientX: number, clientY: number) {
  return {
    x: ((clientX - rect.left) / rect.width) * STAGE_W,
    y: ((clientY - rect.top) / rect.height) * STAGE_H,
  };
}

/**
 * Client point -> vessel-local coordinates (-1..1 on both axes; the vessel top is the unit circle),
 * using the vessel element's rendered rectangle.
 */
export function clientToLocal(rect: DOMRect, clientX: number, clientY: number) {
  return {
    x: ((clientX - rect.left) / rect.width) * 2 - 1,
    y: ((clientY - rect.top) / rect.height) * 2 - 1,
  };
}
