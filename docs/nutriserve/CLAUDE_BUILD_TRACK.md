# Claude parallel implementation track

Start from current `main`, on a dedicated `claude/nutriserve-mechanics` branch. This is a ready-to-execute handoff, **not a claim that a Claude process has been dispatched**. No Claude executable/service was available in this Codex session.

> **Update, 12 November 2026.** The owner clarified the goal as a game *inspired by* Freezeria-style kitchen-serving games, not a recreation of one. The engineering track therefore uses NutriServe's own rules (build-v5, prep-v3 and the provisional finish/waiting rules) instead of the transcribed reference contract, which was removed with its tests, and the station UI uses its own colours. See `CLAUDE_STATUS.md` (audit 11) and the Originality section of `ASSET_WORKFLOW.md`.

User objective: a nutrition serving game inspired by the genre's four-station structure (order, build, cook, finish), adapted to Indian food. Read `REA_FINDINGS.md`, `ASSET_WORKFLOW.md`, `evidence-index.json`, `asset-roadmap.json`, and `build-track.csv` first. Current-main catalogs contain 49 foods and 33 customers; six idle sprites are accepted. The accidental Word document is irrelevant. The repository default branch was `old`; this work is based on `main`. Do not merge unrelated `old` history.

## Ownership

| Codex asset/evidence track | Claude engineering track |
|---|---|
| Generate/edit all custom raster characters, food, scenes and tools | Deterministic simulation, input systems, station interactions and persistence |
| Compare replacements to original reference and approve visual quality | Consume approved IDs/anchors and implement code-native UI geometry |
| Produce variants, alpha/size derivatives, animation source parts and provenance | Accessibility, touch/keyboard equivalents, performance and regression checks |
| Trace unresolved reference behavior and publish findings | Implement evidence-backed rules; isolate explicitly provisional adaptations |

Claude must not mark unavailable assets complete, generate fake image filenames, use emoji or generic avatars as final art, overwrite accepted art, or stretch/recolor one sprite into other cast members. Missing assets are a dependency, not permission to invent production art. Work on independent mechanics while Codex supplies them. Do not modify the existing unrelated root `CLAUDE.md` merely to add this handoff.

## Files already available

- `src/features/nutriserve/assets/characters.ts` / `CustomerSprite.tsx`: six original pilot idle sprites, shared component, deterministic identity lookup.
- `public/assets/nutriserve/manifest.json`: source hashes, sizes, alpha measurements, visible bounds, foot anchors, review status, missing pose states.
- ~~`src/features/nutriserve/domain/referenceScoring.ts`~~: removed 12 November 2026; the game's rules live in `simulation/params.ts` and `simulation/scoring.ts`.
- `nutriserve-art-lab.html`: responsive scene/cast/alpha review and interactive arithmetic probes. This is a review bench, not a playable remaster.
- ~~`tests/nutriserve-reference.test.mjs`~~: removed with it.
- `scripts/check-nutriserve-assets.mjs`: hash, PNG decoding, alpha, identity and review-gate validation.

## Proposed simulation boundary

Implement pure TypeScript under `src/features/nutriserve/simulation/`, separate from React and nutrition data adapters. No wall-clock calls inside reducers. Use a seeded RNG and an explicit `advanceGame(state, dtMs)`. Maintain four prep slots, multiple concurrent tickets and separate physical dishes; a dish is associated with a ticket only when the player serves it.

State should include schema version, seed/RNG state, day, elapsed simulation time, selected station/ticket/dish, ticket queue, dishes, **four** prep slots, earned tips, served results, upgrades, paused/completed flags. IDs must be stable through save/restore. Offscreen preparation continues; pause freezes all simulation clocks. Large background-tab deltas need a documented cap or deterministic catch-up policy.

Commands: select station/ticket/dish, take order, start dish(size), portion(slot/food/actual grams/signed meter position), start prep(dish/slot), boost(slot/held), finish prep(slot), deposit topping(dish/local position/amount), finish dish, serve(dish/ticket), trash, pause, next day, buy upgrade. Reject invalid transitions and double rewards. Keep all four scores distinct: waiting/order, build, prep, finish. Nutrition is a separate report.

Portion error is signed and affects actual grams; a single unsigned accuracy value cannot distinguish underfill from overfill. Prepared dishes already contain their nutrients; do not count the same food again when drawing sauce/layer animation. Derive totals from canonical per-100g food data, never display layers. Record actual grams and spilled garnish amount. Do not turn nutrition output into medical guarantees.

## Build sequence and gates

1. **C01 — simulation spine:** queue, taking orders, concurrent dishes, station switching, four independent prep slots, seeded replay, pause/save/restore. Test a second customer arriving while prep continues offscreen.
2. **C02 — Build station:** size choice, ingredient choice, timed meter with pointer and keyboard input, distinct under/overfill. (Superseded 12 November 2026: graded by NutriServe's own build-v5 rules.)
3. **C03 — Prep station:** four slots, different targets, finish timing, held boost and overheat behavior. Time conversion/boost rules remain blocked on Q08 evidence; prototype parameters must be named/versioned and never presented as exact parity.
4. **C04 — Finish station:** continuous held-pointer deposition, local coordinates, amount/distribution/spill accounting, discrete garnishes and order. Depends on Q09 topping trace and final vessel masks. Keyboard/touch input must drive the same simulation commands.
5. **C05 — serve/day/progression:** associate any ready dish with any taken ticket, independently grade four stations, tips/ranks/customer stars, unlocks and upgrades. Trace original aggregation and waiting curves before claiming exactness. Never double-save rewards on exit/replay.
6. **C06 — nutrition integration:** canonical IDs, actual grams, required dish validation, clear educational feedback. Keep service mastery separate from nutrition targets. Character conditions must not dictate visual stereotypes.
7. **C07 — renderer/input:** adapt the 640×480 scene with proper coordinate transforms, pointer capture, scalable ticket rail and station tabs. Use manifest anchors. Full-scene art from Codex replaces layout studies without touching simulation logic.
8. **C08 — release gate:** complete one end-to-end day with two concurrent orders, score a wrong ticket, save mid-prep then restore, test all stations at desktop/mobile, run visual comparisons and measure image memory/load costs. Preserve legacy access until the replacement passes this gate. The current six-character pilot is not full-catalog completion.

## Verification commands

Use Node 22.18+ (or Node 24/26) for TypeScript stripping in the focused tests.

```sh
npm ci
npm run test:nutriserve
npm run check:nutriserve-assets
npm run catalog:nutriserve
npx tsc -p tsconfig.nutriserve.json --noEmit
npm run build
npm run dev -- --host 127.0.0.1
```

Open `/nutriserve-art-lab.html` for art reviews. Use REA declared scenarios for DOM interactions/captures. For the original Flash canvas, preserve the documented browser fallback/action attribution and emulator limitations. Keep golden runtime traces separate from transcribed arithmetic tests.

## Status reporting

Report each task as queued/in progress/blocked on named evidence or asset/reviewed. Include exact commit, changed ownership area, test outcomes, screenshot/Evidence IDs and unresolved fidelity gaps. Codex handles assets and visual review; Claude handles gameplay code. A passing production build is not a whole-game visual or mechanics sign-off.
