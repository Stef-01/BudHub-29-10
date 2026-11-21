# Food surfaces and runtime delivery — 20 November 2026

Four new top-view assets are integrated into the actual Finish renderer: steel `katori`, `rice_white` revision 2, `chana_masala`, and `palak_dal`. Other food IDs keep their solid-color fallback. This is partial A03 delivery: it does not complete side-view layers, all vessel sizes/states, drizzle textures, or the 49-food catalog.

The generated PNG masters and exact prompts are in `public/assets/nutriserve/food/manifest.json`. Generation used the built-in OpenAI image tool. The rice revision edited its own first generated image; no other game's imagery was supplied to generate this family. All source PNGs remain unchanged. Codex's review is recorded as `accepted-pilot-top`, not user sign-off.

## Quality review and iteration

The user's latest request explicitly asks for comparison with Papa's Freezeria for quality. This review uses the [official screenshot gallery](https://i.flipline.com/games/papasfreezeria/screenshots.html), specifically [Build](https://i.flipline.com/gamefiles/papasfreezeria/images/screenshot_03.jpg) and [Top](https://i.flipline.com/gamefiles/papasfreezeria/images/screenshot_04.jpg), as observation evidence for readability and hierarchy. It does not reintroduce the retired parity contract or change NutriServe's versioned gameplay rules.

| Criterion | Observation and correction | Current result / remaining gap |
|---|---|---|
| Ingredient identity | The reference separates ingredients by silhouette, color and layers. NutriServe's previous flat circles did not identify the food. | White rice, chickpeas and palak dal now read as distinct surfaces at 140px and 268px. Unproduced foods remain visibly unfinished. |
| Hierarchy | Rice v1 had dark internal contours that competed with the curry. | Regenerated v2 with light tan contours and ivory faces; curry remains the focal ingredient. |
| Garnish contrast | Green coriander was hard to distinguish on green palak. | A narrow cream edge around placed garnish improves separation without changing placement or scoring. Toolbar art retains its unfiltered source appearance. |
| Vessel boundary | Decorative steel must agree with the serving target. | Food clip remains center (120,120), radius 100; main radius 62; vessel radius 112 in the 240px SVG. Input unit radius stays 1. All source-to-runtime scaling is uncropped. |
| Missing ingredients | The old translucent main fallback let rice show through an unproduced curry. | Main fallback is opaque; unknown food IDs do not silently receive another food's texture. |
| Whole-scene finish | The reference has illustrated equipment, containers and coherent environmental detail. | NutriServe's room, side-view bowl and equipment still use layout studies. This pass does not establish whole-game visual parity or completion. |
| Character quality | Existing six idle sprites are unchanged except for scaled copies. | Their documented provenance and outstanding redesign/reaction work remain. Optimization does not count as a character redesign. |

## Runtime copies

The user explicitly approved deterministic image processing on 20 November. `scripts/optimize-nutriserve-assets.py` uses pinned Pillow 11.3.0: premultiplied-alpha Lanczos resizing, followed by lossless WebP encoding (`exact=True`, method 6). Resizing reduces resolution; “lossless” describes the subsequent WebP encoding, not equivalence to every full-resolution source pixel. `--check` verifies exact decoded equality to the intended resized RGBA image.

| Family | Original file bytes | Runtime file bytes | Original decoded RGBA | Runtime decoded RGBA |
|---|---:|---:|---:|---:|
| Four food/vessel surfaces, 512px | 5,384,736 | 692,160 | 25,160,256 | 4,194,304 |
| Five garnishes, 192px longest edge | 3,416,016 | 76,598 | 31,451,712 | 688,128 |
| Six characters, 96px tall | 7,123,123 | 38,386 | 37,748,736 | 147,456 |
| Six characters, 360px tall | same sources | 240,938 | same sources | 2,073,600 |
| Six characters, 720px tall | same sources | 725,612 | same sources | 8,294,400 |

All 27 variants together total **1,773,694 bytes**, versus **15,923,875 bytes** for the 15 masters (88.9% less). This is an on-disk asset comparison, not a measured network benchmark. Character `srcset` lets the browser choose the appropriate candidate. Summary thumbnails declare a 22px image width; waiting-list thumbnails declare 1.6em. Stage characters default to a conservative 240px width, covering up to 480 device pixels at 2×. The art lab intentionally fetches originals for comparison; ordinary game components use runtime paths.

SVG food and garnish artwork retains master coordinate dimensions/viewBoxes while referencing scaled image data. This preserves the existing pivots and placement math. Character copies retain the full uncropped 2:3 canvas and foot-anchor coordinates.

## Reproduce and verify

```sh
python -m pip install Pillow==11.3.0
python scripts/optimize-nutriserve-assets.py --check
npm run check:nutriserve-runtime
npm run check:nutriserve-food-art
npm run check:nutriserve-garnishes
npm run check:nutriserve-assets
npx tsc -p tsconfig.nutriserve.json --noEmit
npm run test:nutriserve
npm run build
```

Omit `--check` to regenerate derivatives and the runtime registry. Preserve the PNG masters and manifests. New assets require a new review before extending the explicit accepted-family lists in validators.

REA scenarios are retained under `review-scenarios/`. Launch the dev server on 127.0.0.1:4323 and run each JSON input with REA 6.8.0 `capture-browser-scenario ... --format json --full-output`. Scenario inputs include an isolated, synthetic saved-game fixture; the fixture deliberately renders a white-rice/chana dish against a different ticket and does not assert correct-order scoring. These captures verify rendering, navigation, and save restoration, not a new full-day release-gate run.

Five reviewed captures are indexed by evidence ID, source digest, screenshot digest, completed steps, console errors and browser cleanup in `food-runtime-evidence.json`. Full evidence and PNGs are retained in the task's `outputs/` directory. Desktop/mobile food captures, the master/runtime sheet, and actual desktop/mobile Finish captures completed. Art-lab captures had no console errors; game captures each logged an existing `/favicon.ico` 404. All owned browser processes terminated. Visual inspection found no missing food/garnish assets or mobile clipping in these captured states.

Validation: 15 master integrity checks, 27 runtime file checks, exact resized-pixel verification, focused feature TypeScript check, 107 game tests and production build passed. Existing build warnings concern browser-data age and mixed static/dynamic database imports. The full browser day-release gate was not rerun for these decorative asset changes.

## Next work and Claude handoff

Codex owns the next source-art batches: matching side-view katori shell/front rim/fill layers, the remaining pilot food surfaces, drizzle deposition textures, then character reactions and station equipment. Keep native-size and dark/checker-background review before expanding a family.

Claude can independently prepare component contracts for back shell → food layers → front rim; retain the current input transform and simulation schema; exercise mixed produced/unproduced food IDs; and measure actual request/decoded-image costs on a cold-cache phone. Use `FoodSurface`/`GarnishSprite` and the runtime registry rather than reintroducing full PNG paths into gameplay. Re-run the complete browser release gate when scene layering or hit areas change. Request missing art by exact ID/state; leave missing states explicit. No new scoring/parity work is implied by this quality comparison.
