# Claude parallel implementation track

Start from current `main`, on a dedicated `claude/nutriserve-mechanics` branch. This is a ready-to-execute handoff, **not a claim that a Claude process has been dispatched**. No Claude executable/service was available in this Codex session.

> **Update, 12 November 2026.** The owner clarified the goal as a game *inspired by* Freezeria-style kitchen-serving games, not a recreation of one. The engineering track therefore uses NutriServe's own rules (now build-v7, prep-v9, finish-v4 and the provisional waiting rules; `simulation/params.ts`) instead of the transcribed reference contract, which was removed with its tests, and the station UI uses its own colours. Every task aimed at parity with the other game is retired: the Q08/Q09 traces, R01 and R02, and the "original" comparisons in A04, A05 and C08 (see `build-track.csv`). The steps below keep their original wording where it is still true and say where it was superseded. See `CLAUDE_STATUS.md` (audits 11 to 15) and the Originality section of `ASSET_WORKFLOW.md`.
>
> The gameplay track has since been implemented on `claude/continue-building-j1mrs7` and ported to `main`; `CLAUDE_STATUS.md` is its current status.

User objective: a nutrition serving game inspired by the genre's four-station structure (order, build, cook, finish), adapted to Indian food. Read `CLAUDE_STATUS.md`, `ASSET_WORKFLOW.md`, `asset-roadmap.json` and `build-track.csv` first (`REA_FINDINGS.md` and `evidence-index.json` are a historical record of an earlier reference investigation; the game doesn't use them). Current-main catalogs contain 49 foods and 33 customers; six idle sprites are accepted. The accidental Word document is irrelevant. The repository default branch was `old`; this work is based on `main`. Do not merge unrelated `old` history.

## Ownership

| Codex asset/evidence track | Claude engineering track |
|---|---|
| Generate/edit all custom raster characters, food, scenes and tools | Deterministic simulation, input systems, station interactions and persistence |
| Review replacements against NutriServe's own approved masters and approve visual quality | Consume approved IDs/anchors and implement code-native UI geometry |
| Produce variants, alpha/size derivatives, animation source parts and provenance | Accessibility, touch/keyboard equivalents, performance and regression checks |
| Record asset provenance (reference tracing retired 12 November 2026) | Implement NutriServe's own versioned rules; mark provisional ones as such |

Claude must not mark unavailable assets complete, generate fake image filenames, use emoji or generic avatars as final art, overwrite accepted art, or stretch/recolor one sprite into other cast members. Missing assets are a dependency, not permission to invent production art. Work on independent mechanics while Codex supplies them. Do not modify the existing unrelated root `CLAUDE.md` merely to add this handoff.

## Files already available

- `src/features/nutriserve/assets/characters.ts` / `CustomerSprite.tsx`: six pilot idle sprites (made with another game's screenshot as a style input, so not masters for new work; see `ASSET_WORKFLOW.md`, Originality), shared component, deterministic identity lookup.
- `public/assets/nutriserve/manifest.json`: source hashes, sizes, alpha measurements, visible bounds, foot anchors, review status, missing pose states.
- ~~`src/features/nutriserve/domain/referenceScoring.ts`~~: removed 12 November 2026; the game's rules live in `simulation/params.ts` and `simulation/scoring.ts`.
- `nutriserve-art-lab.html`: responsive scene, cast and alpha review. This is a review bench, not the game.
- ~~`tests/nutriserve-reference.test.mjs`~~: removed with it.
- `scripts/check-nutriserve-assets.mjs`: hash, PNG decoding, alpha, identity and review-gate validation.

## Proposed simulation boundary

Implement pure TypeScript under `src/features/nutriserve/simulation/`, separate from React and nutrition data adapters. No wall-clock calls inside reducers. Use a seeded RNG and an explicit `advanceGame(state, dtMs)`. Maintain four prep slots, multiple concurrent tickets and separate physical dishes; a dish is associated with a ticket only when the player serves it.

State should include schema version, seed/RNG state, day, elapsed simulation time, selected station/ticket/dish, ticket queue, dishes, **four** prep slots, earned tips, served results, upgrades, paused/completed flags. IDs must be stable through save/restore. Offscreen preparation continues; pause freezes all simulation clocks. Large background-tab deltas need a documented cap or deterministic catch-up policy.

Commands: select station/ticket/dish, take order, start dish(size), portion(slot/food/actual grams/signed meter position), start prep(dish/slot), boost(slot/held), finish prep(slot), deposit topping(dish/local position/amount), finish dish, serve(dish/ticket), trash, pause, next day, buy upgrade. Reject invalid transitions and double rewards. Keep all four scores distinct: waiting/order, build, prep, finish. Nutrition is a separate report.

Portion error is signed and affects actual grams; a single unsigned accuracy value cannot distinguish underfill from overfill. Prepared dishes already contain their nutrients; do not count the same food again when drawing sauce/layer animation. Derive totals from canonical per-100g food data, never display layers. Record actual grams and spilled garnish amount. Do not turn nutrition output into medical guarantees.

## Build sequence and gates

1. **C01 — simulation spine:** queue, taking orders, concurrent dishes, station switching, four independent prep slots, seeded replay, pause/save/restore. Test a second customer arriving while prep continues offscreen.
2. **C02 — Build station:** size choice, ingredient choice, timed meter with pointer and keyboard input, distinct under/overfill. (Superseded 12 November 2026: graded by NutriServe's own build rules, now build-v7; see `CLAUDE_STATUS.md`.)
3. **C03 — Prep station:** four slots, different targets, finish timing, held boost and overheat behavior. Parameters are named and versioned (now NutriServe's own `prep-v9`, provisional); the Q08 trace this step once waited on is retired, and nothing is presented as parity.
4. **C04 — Finish station:** continuous held-pointer deposition, local coordinates, amount/distribution/spill accounting, discrete garnishes and order. Depends on final vessel masks (A03); the Q09 topping trace is retired. Keyboard/touch input must drive the same simulation commands.
5. **C05 — serve/day/progression:** associate any ready dish with any taken ticket, independently grade four stations, tips/ranks/customer stars, unlocks and upgrades. Aggregation and waiting curves are NutriServe's own, provisional, and never claimed as exact (the aggregation trace is retired). Never double-save rewards on exit/replay.
6. **C06 — nutrition integration:** canonical IDs, actual grams, required dish validation, clear educational feedback. Keep service mastery separate from nutrition targets. Character conditions must not dictate visual stereotypes.
7. **C07 — renderer/input:** adapt the 640×480 scene with proper coordinate transforms, pointer capture, scalable ticket rail and station tabs. Use manifest anchors. Full-scene art from Codex replaces layout studies without touching simulation logic.
8. **C08 — release gate:** complete one end-to-end day with two concurrent orders, score a wrong ticket, save mid-prep then restore, test all stations at desktop/mobile, review final art in the game (against NutriServe's own masters, not another game) and measure image memory/load costs. Preserve legacy access until the replacement passes this gate. The current six-character pilot is not full-catalog completion.

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

Open `/nutriserve-art-lab.html` for art reviews. Use REA declared scenarios for DOM interactions/captures. The earlier reference investigation (`REA_FINDINGS.md`, `evidence-index.json`) is historical: the game uses nothing from it, and there are no golden runtime traces or transcribed arithmetic tests any more. One unit test lists the other game's recovered prep numbers only to check that NutriServe's prep numbers are not derived from them.

## Status reporting

Report each task as queued/in progress/blocked on named evidence or asset/reviewed. Include exact commit, changed ownership area, test outcomes, screenshot/Evidence IDs and open questions. Codex handles assets and visual review; Claude handles gameplay code. A passing production build is not a whole-game visual or mechanics sign-off.
