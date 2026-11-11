# Claude engineering track: status

Branch `claude/continue-building-j1mrs7`. The build track asked for a dedicated `claude/nutriserve-mechanics` branch from `main`; this session may only push to `claude/continue-building-j1mrs7`, which is based on the default branch `old`. `origin/main` (the reference audit and pilot art) was merged in at `a04d905`. Every NutriServe change after that lives under `src/features/nutriserve/`, `tests/nutriserve-*`, `scripts/`, `docs/nutriserve/` and a small entry point in the app shell, so it can be cherry-picked onto `main`.

The catalog on this branch has **55 foods and 53 customers** (main has 49 and 33). `asset-roadmap.json` was re-reconciled for this branch.

## Task status

| ID | Status | Where | Notes |
|---|---|---|---|
| C01 | Implemented | `simulation/game.ts`, `types.ts`, `save.ts`, `rng.ts` | Pure TS, no clock reads, integer ms/mg/milli-units (advancing is chunk-invariant, tested). Seeded RNG in state, four prep slots, concurrent tickets, separate dishes, pause, save/restore with schema v2 + migration. |
| C02 | Implemented | `simulation/scoring.ts` `gradeIndianBuildV1` | Held pour from simulation time; signed under/overfill. The reference `gradeReferenceBuild` is called unchanged; the adapter maps vessel+base→cup, main→mixable, side→syrup, adds a versioned base-mismatch penalty, and caps vessel+base loss at the wrong-cup share. |
| C03 | Implemented, **provisional** | `params.ts` `PREP_V1` (`prep-v1-provisional`) | Four independent slots, held boost, heat/overheat lockout, offscreen cooking. Unit rate, boost multiplier, heat model and the 3600-unit cap are placeholders. **Blocked on Q08 / R01** for parity. Grading uses the unchanged `gradeReferenceMix`. |
| C04 | Implemented, **provisional** | `params.ts` `FINISH_V1` (`finish-v2-provisional`) | Held drizzle in local vessel coordinates (unit circle), spill outside the rim, coverage grid scaled to each drizzle's target, garnish count/type/fallen/balance, step order. Garnish **rotation** is not modelled yet. **Blocked on Q09 / R02** and final vessel masks (A03). |
| C05 | Implemented (aggregation provisional) | `game.ts` serve/day, `progression.ts` | Any ready dish to any taken ticket (wrong ticket allowed, graded and flagged). Waiting, build, prep and finish are separate scores; total is an equal-weight mean (`aggregation-v1-provisional`, **R02**). Tips, stars, ranks, upgrades (reference furniture bonuses plus two provisional rules). Rewards are credited once per day; reports to the app are guarded by a ledger outside the save, keyed by run id. |
| C06 | Implemented | `nutrition/nutrition.ts` | Canonical per-100g × actual grams; drizzle that landed counts, spilled drizzle and fallen garnish don't; each portion counted once. Legacy meal goals. Catalog validation (found and fixed four customers requiring nonexistent ids). Finish ingredients use cited USDA SR Legacy values (`data/finishItems.ts`). Not medical advice. |
| C07 | Implemented, **layout studies pending art** | `ui/**` | 640×480 stage in stage units with exact pointer transforms; sprites placed by manifest foot anchors behind a counter front; pointer/touch/keyboard drive the same commands; compact mode under 600 px moves controls to a full-size dock. Station scenery, vessels, food fills and garnish glyphs are code-native **layout studies** (`data-layout-study`), not final art. |
| C08 | Gate passed for mechanics; visual sign-off pending | `tests/nutriserve-release-gate.test.mjs`, `scripts/e2e/nutriserve-release-gate.cjs` | See below. A passing gate is not a visual or parity sign-off. |

## Verification

```sh
npm run test:nutriserve            # 61 tests: 7 reference + simulation, stations, day, nutrition, catalog, audit regressions, release gate
npm run typecheck:nutriserve-sim   # strict TypeScript for simulation/nutrition/data/domain
npx tsc -p tsconfig.nutriserve.json --noEmit
npm run build
npm run dev   # then, in another terminal:
node scripts/e2e/nutriserve-release-gate.cjs http://localhost:5173   # needs the playwright package
```

Release gate (browser, desktop 1280 px and iPhone 13): two concurrent orders cooking in two slots; Save & exit mid-prep then Continue with progress intact; a dish served to the wrong ticket is flagged and graded; the rest of the day served; day summary reached; no horizontal scroll; no app errors. 14/14 checks passed.

Independent audits: the first (simulation core) found ten issues, all fixed with regression tests in `tests/nutriserve-audit.test.mjs`. A second audit (renderer and fix verification) is recorded below once complete.

## Measured cost

With three customers on screen: 3 sprite files, about 3.6 MB downloaded and about 19 MB of decoded RGBA (each 1024×1536 master decodes to 6.3 MB whatever its display size). A full six-customer day would be about 7 MB and 38 MB. Sprites are displayed at 120–290 CSS px. This is the main mobile cost and needs the A05 derivatives below.

Frame timing with four prep slots cooking (3 s sample): desktop 1280 px median 16.7 ms, p95 16.7 ms; iPhone 13 emulation with 4× CPU throttling median 16.7 ms, p95 33.3 ms. The legacy NutriServe Chef and the art lab still load without errors.

## Asset requests (by id and state)

Nothing below is faked in code; until it arrives the game uses idle art plus code-native layout studies and says so.

| Request | Ids / states | Consumer and contract |
|---|---|---|
| A02 reactions | `taking-order`, `happy`, `impatient`, `disappointed` for `arjun_fit`, `priya_balanced`, `rohan_light`, `maya_protein`, `vikram_lowsodium`, `ananya_breakfast` | Order station (taking-order while the ticket is written), serve result (happy ≥ 80 total, disappointed < 50), lobby queue (impatient once the waiting score starts dropping). Same canvas, scale and `footAnchor` as the idle master. |
| A02 walk | `walk` (enter/leave) for the same six | Customers are currently not drawn while walking. Needs frames or parts plus a pivot. |
| A03 vessel | steel katori `small`/`medium`/`large`: back shell, front rim, food mask, side and top views | Build (`VesselSide`, fill line at the base ideal) and Finish (`VesselTop`). The top-view food mask must map to the simulation's unit circle: provide the mask's centre and radius in image pixels. |
| A03 foods | bases `rice_white`, `rice_brown`, `rice_red`, `idli_plain`; mains `chana_masala`, `palak_dal`, `sambar`, `chicken_curry`, `sprouts_salad`; sides `raita`, `sprouts_salad`, `okra_pachadi`, `moru_curry_pulissery` | Fill layers in the vessel (side view) and the top surface (finish). These are the foods the six pilot customers can order; dispenser distractors can keep text labels. |
| A03 finish | drizzles `curd_swirl`, `ghee_tadka` (deposit texture); garnish pieces `coriander`, `onion`, `lemon`, `green_chilli`, `pomegranate` (top view, centred pivot, about 24 px at 268 px vessel width) | Finish station: replaces the code-native glyphs and drizzle blobs. |
| A04 stations | Order backdrop **with the counter front as a separate layer** (drawn in front of the customer); Build dispensers; Prep: four handis on burners with heat states; Finish shelves | Interactive hit areas stay code-native; no text baked into images. |
| A05 derivatives | WebP/scaled derivatives of each accepted sprite (suggest 360 and 720 px tall) with identical anchors | Cut download about 10× and decoded memory about 6–25×; wire through `CustomerSprite` with `srcset`. |
| Audio | pour, ladle, sizzle/tadka crackle, bell, serve, overheat cue, ambience | No audio is implemented yet. |

## Open evidence questions

- **Q08 / R01:** prep unit producer, time conversion and boost behaviour. `PREP_V1` values are placeholders.
- **Q09 / R02:** waiting, topping and total-score formulas. `WAITING_V1`, `FINISH_V1` and `AGGREGATION_V1` are placeholders.

When those land, add new versioned parameter sets instead of editing shipped ones; saves record the versions they were played with and refuse to load under different rules.
