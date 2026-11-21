# Garnish art delivery — 15 November 2026

Five original overhead garnish pieces are integrated into NutriServe Kitchen: `coriander`, `onion`, `lemon`, `green_chilli`, and `pomegranate`. This completes the first discrete-garnish family within A03. Vessels, food layers, drizzle textures, reactions, station art and derivatives remain separate work.

## Current-main reconciliation

This change starts from `f6f05fa63d1d85c3774359be5b3e2a1b165c7eff`, preserving Claude's implemented game, nutrition, progression, versioned rules and audits. The older Codex four-station pilot was superseded by that work and is retained locally on `codex/nutriserve-simulation` at `0f70646`; it is not merged or offered as a second game. Its November 11 captures and reference timing notes remain historical task outputs. Nothing from that pilot restores the removed reference scoring contract or changes the current game's rules.

## Generation and integration

- Built-in OpenAI image generation, one call per asset. Inputs were the written Indian-food brief, with no other game's imagery. Lemon revision 2 uses the generated lemon as its edit target and the generated coriander as an outline reference.
- The first lemon candidate had a softer treatment; revision 2 was rendered and reviewed with its siblings. The raw image preview's surrounding glow is not the browser composite: transparency was checked on cream, dark and checkerboard backgrounds before acceptance.
- Versioned source PNGs and a manifest are in `public/assets/nutriserve/garnishes/`. Each entry records the exact prompt, source filename, input images, SHA-256, dimensions, alpha counts, visible bounds, centered pivot, render viewBox, revision and evidence IDs. Original generated files are retained separately in the task's generated-image directory.
- `assets/garnishes.ts` contains only accepted paths. `GarnishSprite` places each source around its measured center with six percent padding; it does not stretch the source. Existing `GarnishGlyph` consumers now show the art both in Finish tool buttons and on deposited pieces. Pointer coordinates, piece sizes, counts, score, nutrition, fallen opacity and accessible tool labels keep their existing behavior.
- `/nutriserve-art-lab.html` → **Review garnish art** shows 24/48/96px comparisons on three backgrounds and a 268px vessel using the actual `VesselTop` component. The vessel and base/main food fills remain layout studies.

## Visual evidence and checks

| REA evidence | Observation |
|---|---|
| `ev_cda67f8ca88a935e75a8fffc98bdf1ab063f6c04e36076e2fc2de00438da53fc` | Desktop 1280×1200; declared load and review-link click; all actions complete; no console errors. Five pieces at three sizes and three alpha backgrounds, plus actual vessel renderer. |
| `ev_ec77b7458b2d2796920cb273dcf1fcc99bbb45f863939b0efda41a22b4af223a` | 390px wide, tall review capture; same complete actions and no console errors. Pieces remain distinct at 24px; onion hole is transparent; clean composited edges. This is a mobile-width art review, not a physical-device gameplay test. |

Both captures report complete evidence and termination of provider-owned Chrome. Full evidence and screenshots are retained in task outputs; hashes are recorded in `garnish-evidence.json`. The first desktop capture did not scroll to the entire review because the hash target was created after navigation. A real review link was added and clicked in the final captures; the first frame is not the acceptance frame.

Validation: 107 existing simulation/station/nutrition/regression tests; strict simulation typecheck; focused feature typecheck; six existing character integrity checks; five new garnish integrity checks; production build. The garnish check also verifies the onion's center is transparent. These checks do not claim that the whole remaster or asset suite is complete. The production stylesheet's vessel/tool SVG selectors were narrowed to direct children so nested garnish viewports keep their own dimensions; the final captures load that stylesheet. The existing full-day browser release gate was not rerun for this rendering-only change; the changed shared renderer was captured directly.

## Cost and next handoff

The five unmodified PNG masters total **3,416,016 bytes** (3.26 MiB), and all five decoded at source dimensions occupy **31,451,712 RGBA bytes** (30.0 MiB). Browsers reuse a source across repeated placements, but these masters are oversized for 20–24px pieces. A05 must produce and visually compare small transparent derivatives before broader catalog expansion. Update, 20 November: reviewed 192px lossless WebP copies now total 76,598 bytes and are used by the runtime renderer. The master sizes above remain provenance figures; see FOOD_ASSETS.md for generation, decoded-memory figures and review evidence.

Codex owns the next art batches: A03 katori back/front/mask with a measured unit-circle contract, matching food layers and drizzle textures, followed by A02 character reactions and A04 station equipment. Claude can continue mechanics and input work using the existing IDs and pivots; no replacement glyphs or new scoring rules are needed for this family. Keep `CLAUDE_STATUS.md` as the engineering status source.

For each next family: pin IDs/camera/anchor → generate one master → inspect alpha and native-size silhouette → revise one concrete defect → render the actual consumer at desktop/mobile → retain REA evidence → record hashes and acceptance → integrate → verify. Do not extend a failed candidate to the rest of a family or mark unproduced assets complete.
