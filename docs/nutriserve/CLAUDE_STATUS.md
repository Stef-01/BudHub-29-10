# Claude engineering track: status

Branch `claude/continue-building-j1mrs7`. The build track asked for a dedicated `claude/nutriserve-mechanics` branch from `main`; this session may only push to `claude/continue-building-j1mrs7`, which is based on the default branch `old`. `origin/main` (the reference audit and pilot art) was merged in at `a04d905`. Every NutriServe change after that lives under `src/features/nutriserve/`, `tests/nutriserve-*`, `scripts/`, `docs/nutriserve/` and a small entry point in the app shell, so it can be cherry-picked onto `main`.

The catalog on this branch has **55 foods and 53 customers** (main has 49 and 33). `asset-roadmap.json` was re-reconciled for this branch.

## Task status

| ID | Status | Where | Notes |
|---|---|---|---|
| C01 | Implemented | `simulation/game.ts`, `types.ts`, `save.ts`, `rng.ts` | Pure TS, no clock reads, integer ms/mg/milli-units (advancing is chunk-invariant, tested). Seeded RNG in state, four prep slots, concurrent tickets, separate dishes, pause, save/restore with schema v2 + migration. |
| C02 | Implemented | `simulation/scoring.ts` `gradeIndianBuildV1`, `params.ts` `BUILD_V1` (`build-v4`) | Held pour from simulation time; signed under/overfill. Every press pours at least 100 ms worth (8 g base, 9 g main, 5 g side), so a quick tap never pours nothing. A component holding no more than that one-tap amount can still be switched to another food, so a mis-tap never forces trashing the dish. A touch hold that turns into a slow scroll is undone (`cancelPour`). Click-only input (switch access, screen-reader browse mode, voice control) starts a pour with one click and stops it with the next. The reference `gradeReferenceBuild` is called unchanged; the adapter maps vessel+base→cup, main→mixable, side→syrup, adds a versioned base-mismatch penalty, and caps vessel+base loss at the wrong-cup share. |
| C03 | Implemented, **provisional** | `params.ts` `PREP_V1` (`prep-v2-provisional`) | Four independent slots, held boost, heat/overheat lockout, offscreen cooking. Overheating lets go of the boost and takes the handi off the flame (nothing cooks) until it cools; in v1 overheating cost nothing. A tap latches the boost on. Unit rate, boost multiplier, heat model and the 3600-unit cap are placeholders. **Blocked on Q08 / R01** for parity. Grading uses the unchanged `gradeReferenceMix`. |
| C04 | Implemented, **provisional** | `params.ts` `FINISH_V1` (`finish-v3-provisional`) | Held drizzle in local vessel coordinates (unit circle), spill outside the rim, coverage grid scaled to each drizzle's target, garnish count/type/fallen/balance, step order. Each drizzle has its own integer rate (about 1.7 s to a medium target), and what is poured between two pointer samples is spread along the path between them, so the score doesn't depend on the device's pointer or frame rate (tested from 8 to 60 ms sampling). Rank-locked drizzles and garnishes are refused. Garnish **rotation** is not modelled yet. **Blocked on Q09 / R02** and final vessel masks (A03). |
| C05 | Implemented (aggregation provisional) | `game.ts` serve/day, `progression.ts` | Any ready dish to any taken ticket (wrong ticket allowed, graded and flagged). Waiting, build, prep and finish are separate scores; the total is an equal-weight mean with a content gate (`aggregation-v2-provisional`, **R02**). Waiting, prep and finish count in full only when the katori holds at least half the ordered food, so an empty katori now totals 0 instead of about 44. Five stars and the great-service bonus need a complete order: right vessel, right foods, and every ordered drizzle and garnish piece on (`economy-v2`). Each serve records plain reasons for its scores (`notes`), such as "Base +40 g", "No side", "Undercooked: 0 of 1800 prep units" or "Missing onion (−12)". They appear in the last-serve bar and the day summary. A dish remembers the ticket it was started for (`forTicketId`). That is used only to guide the player (per-slot prep targets, the paper ticket at Build and Finish); scoring uses the ticket it is served to. Tips, stars, ranks, upgrades (reference furniture bonuses plus two provisional rules). Rewards are credited once per day; reports to the app are guarded by a ledger outside the save, keyed by run id. |
| C06 | Implemented | `nutrition/nutrition.ts` | Canonical per-100g × actual grams; drizzle that landed counts, spilled drizzle and fallen garnish don't; each portion counted once. Legacy meal goals. The day report (`serviceNutritionReport`) separates two things: what the player changed (portions off the ticket, wrong foods, drizzle, missing, extra or unordered garnish, spills, each with its kcal effect) and how the customer's own order fits their meal goal. A perfectly served order is never blamed on the player; the legacy goals are full-plate targets that a three-part katori rarely meets. Catalog validation (found and fixed four customers requiring nonexistent ids). Finish ingredients use cited USDA SR Legacy values (`data/finishItems.ts`). Not medical advice. |
| C07 | Implemented, **layout studies pending art** | `ui/**` | 640×480 stage in stage units with exact pointer transforms; sprites placed by manifest foot anchors behind a counter front; pointer/touch/keyboard (and click-only assistive input) drive the same commands; compact mode under 600 px (with hysteresis) moves controls to a full-size dock. Dialogs are modal (background inert, Tab stays inside, Escape resumes, focus returns). A save that can't be restored says why and keeps the profile; a simulation error stops the clock and says so instead of freezing. React re-renders at most every 33 ms while the simulation still steps every frame. Compact layout when the kitchen is under 700 px wide or the window under 500 px tall (leave at 720 / 540). Stage text is 1.9% of the stage width at every window size (the wrapper is the size container). On wide layouts the stage shrinks to fit the window height, but never below 720 px. The last serve's result sits in a fixed-height bar above the stage (on a phone, at the top of the dock), so it never covers a control and nothing moves when it changes. On touch, a press becomes a hold (pour, boost, drizzle) only after 120 ms without moving; a finger that moves first scrolls the page. Keyboard drizzle glides the cursor at a fixed speed (best measured finish score 89, or 96 with Shift; pointer 98–100), the same whatever the computer's key-repeat settings. Station scenery, vessels, food fills and garnish glyphs are code-native **layout studies** (`data-layout-study`), not final art. |
| C08 | Gate passed for mechanics; visual sign-off pending | `tests/nutriserve-release-gate.test.mjs`, `scripts/e2e/nutriserve-release-gate.cjs` | See below. A passing gate is not a visual or parity sign-off. |

## Verification

```sh
npm run test:nutriserve            # 82 tests: 7 reference + simulation, stations, day, nutrition, catalog, audit regressions, release gate
npm run typecheck:nutriserve-sim   # strict TypeScript for simulation/nutrition/data/domain
npx tsc -p tsconfig.nutriserve.json --noEmit
npm run build
npm run dev   # then, in another terminal:
node scripts/e2e/nutriserve-release-gate.cjs http://localhost:5173   # needs the playwright package
```

Release gate (browser; full days at 1280 px, at 1920 px, and on an iPhone 13 played with real touch events): two concurrent orders cooking in two slots; Save & exit mid-prep then Continue with progress intact; a dish served to the wrong ticket is flagged and graded; the rest of the day served; day summary reached; no horizontal scroll; no app errors. Each prep slot must show its own dish's target. The gate first runs browser regression checks for the second and third audits:

- a drizzle held across a layout switch is released;
- one click starts and a second click stops a pour, and a quick mouse click pours the 9 g minimum;
- on a phone, a swipe that starts on a dispenser scrolls and pours nothing, and a quick tap pours the minimum;
- Tab stays inside the pause dialog, station keys do nothing behind it, and Escape resumes and returns focus;
- a save under changed rules explains itself and carries rank, coins and credited days into a new day.

Each run also checks that stage text is 1.9% of the stage width. 39/39 checks passed. The auditor's save/restore fuzzer (24,000 round trips) and 40-day bot (605 mid-hold restores) also pass under the stricter save validation: no throws, no false rejections, and coins exactly equal tips minus spending.

Independent audits (findings and fixes are below).

### Audit 1: simulation core

Ten issues, all fixed with regression tests in `tests/nutriserve-audit.test.mjs`.

### Audit 4: game feel, fairness and wide layouts, plus re-check of the audit 3 fixes

One high-severity and fourteen medium and low findings, all addressed. The gate now plays a 1920 px desktop day, and its phone day uses real touch events.

| # | Finding | Fix |
|---|---|---|
| H1 | Stage text grew with the window, not the stage (`cqw` on the container itself). At 1920 px the side dispensers were clipped and couldn't be clicked; at 1280 px the gauges overflowed | `container-type` on a wrapper; text is 18 px on a 948 px stage at every window width; a gate check at 1280 and 1920 |
| M1 | Finish guidance kept the old ticket after Done, serve or trash | The paper ticket re-follows the dish now on the vessel |
| M2 | The phone snackbar's padding made the page jump 177 px when it expired | Replaced by a fixed-height last-serve bar |
| M3 | A dish missing a component still got five stars and the bonus | `economy-v2`: a complete order is needed |
| M4 | Scores were never explained | Per-serve notes in the bar and the summary; the content-gate explanation is visible text, not a tooltip |
| M5 | The nutrition report ignored garnish | Missing, fewer, extra and unordered garnish are listed |
| L-M1 | A boost click across an overheat re-armed the boost | `setBoost` on is refused while overheated; a forced release is never a tap |
| L-M2 | A phantom arrow key kept the keyboard glide running | Window keyup and blur clear held keys; unmount clears and stops the loop |
| L-M3 | A slow touch drag from a dispenser poured | A touch hold whose finger travels more than 30 px is cancelled and undone |
| L-M4 | Build suggested a ticket that already had a dish | `ticketForNewDish`: the oldest open ticket without one |
| L-M5 | The wide-layout toast covered dispensers | Gone (last-serve bar) |
| Low | Stopping a latched pour showed an error; a pending touch drizzle could start on a changed dish; touch had a longer tap window on Boost; a retired upgrade discarded the saved day; a stray tap locked the food; XP ignored the score; the gate's phone day used the mouse; iPhone SE landscape vessel taller than the screen; 1366×768 stage off screen | All fixed: no restart of a latched pour; the dish is checked when the timer fires; the tap window is timed from contact; the save loads with the retired upgrade named; `build-v4` mis-tap swap; XP tier from the day's average (none below 25); touch in the gate; vessel capped at 75% of the viewport height; stage height cap |
| Suspected | A second finger ending the first finger's hold; no audible progress for a latched pour | The hold belongs to its pointer; latched pours announce start, "at the line" and "over the line" |

### Audit 3: renderer and game fairness, plus re-check of the audit 2 fixes

Seventeen confirmed findings, all addressed. The auditor's own repro scripts were re-run against the fixes (results below), and the release gate gained browser checks for the input paths.

| # | Finding | Fix | Re-run |
|---|---|---|---|
| 1 | A phone swipe starting on a dispenser or the vessel poured or drizzled instead of scrolling | Touch presses become holds only after 120 ms still; panning allowed until then, blocked once the hold starts; no finish tool picked by default | Swipe scrolls, 0 g poured; vessel swipe scrolls 127 px, 0 g; hold-then-drag drizzles 7.2 g |
| 2 | Prep and finish guidance followed the rail selection, not the dish | `dish.forTicketId`; per-slot targets; Build and Finish show the dish's ticket | Slot 1 keeps "#1 wants Quick" after taking #2 |
| 3 | The phone snackbar hid controls and passed taps through to them | The snackbar takes taps and has a 44 px dismiss button; extra scroll room while it shows | A tap on it no longer sends the dish to prep |
| 4 | Very short taps poured nothing | `build-v3` minimum pour per press | Taps of 0–100 ms on the phone: exactly one step each; mouse click +9 g |
| 5 | Holding Space scrolled the page; keyboard drizzle score depended on key-repeat settings | `preventDefault` on every Space; fixed-speed glide | scrollY stays 0; best 89/96 on every machine |
| 6 | An error thrown by a command didn't stop the clock | The frame loop checks the failure flag | The clock stays at 0:00 behind the dialog |
| 7 | An empty katori scored about 44 | `aggregation-v2-provisional` content gate | Empty katori totals 0, tip 0 (node test) |
| 8 | The nutrition report blamed every perfect order | `serviceNutritionReport` | A perfect order shows "Served exactly as ordered" (node test) |
| 9 | A retired upgrade id wiped all progress | Salvage drops unknown or duplicate upgrades (and names them) and recomputes rank | Node test |
| 10 | Phone landscape and 610–760 px windows were unreadable | Compact layout by width or height | Landscape and 640/700 px use the compact layout |
| 11 | Self-disabling controls dropped focus | `aria-disabled` on hold controls and upgrade buttons | Focus stays on Boost and on "Owned" |
| 12 | The status line went stale; repeats weren't announced | One timed status line with a sequence number | Error shows, then clears after 6 s |
| 13 | A second finger steered or ended the drizzle | Only the primary pointer counts; per-pointer release | The second finger is ignored |
| 14 | A clicked boost cycled forever; overheating cost nothing | `prep-v2-provisional` | Overheats once, then stays off |
| 15 | Click-only portioning took about 60 activations | A click starts and a second click stops a pour (2 per component) | Gate check |
| 16 | Hand-edited saves with impossible combinations were accepted | Validated: served ticket ⇔ customer gone, completed ⇒ credited, grid size, unique upgrades, rank = rank for points, ticket catalog id, `forTicketId` | Node test |
| 17 | Jargon in player text ("Reference … bonus", "pending evidence Q08") | Plain descriptions; every provisional rule named on the start screen | — |

Not reproducible in headless Chromium: real iOS VoiceOver and Switch Control taps. The code paths are covered (a click-only activation latches; a quick touch is a minimum pour), but they still need a device check.

### Audit 2: renderer, plus re-check of the audit 1 fixes

Sixteen confirmed findings and three suspected ones, all fixed. Simulation fixes have node tests (the second half of `tests/nutriserve-audit.test.mjs`); renderer fixes have browser checks in the release gate (`regressions:` lines).

| # | Finding | Fix |
|---|---|---|
| 1 | A drizzle stayed on when the layout switched mid-hold (the remounted vessel lost pointer capture silently) | `releaseHolds` command, sent on every layout switch; a window-level release backstop while drizzling; release on unmount |
| 2 | A rejected save was wiped without a word, losing rank, coins and upgrades | The start screen says why. `salvageSave` keeps the profile for "Start a new day with your progress". New game asks first whenever any save exists. A renamed customer id no longer rejects a save: that customer leaves. |
| 3 | A restored save resumed a held pour, drizzle or boost on its own | `deserializeGame` releases every held control (an empty portion is dropped; a pending drizzle lands) |
| 4 | Save validation gaps (held fields, results, phase invariants, ticket links) and an unguarded clock | All validated; every frame and command is wrapped, and a failure stops the clock, stops autosave and shows an error with a way out |
| 5 | Drizzle score depended on the pointer/refresh rate (ghee capped at 88 on 30 Hz) | `finish-v3-provisional`: per-drizzle rates and path-spread deposits |
| 6 | Hold controls ignored plain clicks (switch access, screen readers) | Click fallback: one tap step for dispensers, boost toggles |
| 7 | Dialogs didn't manage focus | Inert background, Tab trap, Escape resumes pause, focus restored |
| 8 | A touch swipe over the finish vessel placed a garnish and didn't scroll | Garnish placed on release only if the press moved under 8 px; the vessel allows panning while a garnish is selected; the stage allows panning (`manipulation`) |
| 9 | Muted text on the counter and wall below 3:1; focus ring 1.7:1 on the tab bar | Paper backing plates (7.8:1); two-tone white/navy focus ring |
| 10 | Shortcut repeats; shortcuts acting behind dialogs; a false `aria-keyshortcuts` | Repeats ignored; only P/Escape (resume) work in the pause dialog; attribute removed |
| 11 | A false "Not pouring" after leaving mid-pour | End-of-hold commands are silent |
| 12 | The whole tree re-rendered every frame | Renders throttled to 33 ms; commands render at once |
| 13 | Compact controls jumped when the serve toast went; the waiting list clipped on busy days | Snackbar outside the flow; the waiting panel grows |
| 14 | Prep showed no target after a serve | Falls back to the oldest open ticket, like the rail and Build |
| 15 | Rank-locked items accepted | Refused with the unlock rank |
| 16 | 22 px thumbnails load the full 1024×1536 masters | Recorded under A05 below (needs derivative art) |
| S1–S3 | Suspected: layout flapping near 600 px; iOS long-press selection cancelling a hold; `touch-action:none` blocking scroll in landscape | 10 px hysteresis; `user-select:none` and no touch callout on hold controls; stage `touch-action: manipulation` |

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
| A05 derivatives | WebP/scaled derivatives of each accepted sprite (suggest 96, 360 and 720 px tall) with identical anchors | Cut download about 10× and decoded memory about 6–25×; wire through `CustomerSprite` with `srcset`. The waiting list and day summary show 22–33 px thumbnails that currently load the 1.1–1.2 MB masters; a 96 px derivative covers those. |
| Audio | pour, ladle, sizzle/tadka crackle, bell, serve, overheat cue, ambience | No audio is implemented yet. |

## Open evidence questions

- **Q08 / R01:** prep unit producer, time conversion and boost behaviour. `PREP_V1` values are placeholders.
- **Q09 / R02:** waiting, topping and total-score formulas. `WAITING_V1`, `FINISH_V1` and `AGGREGATION_V1` are placeholders.

When those land, add new versioned parameter sets instead of editing shipped ones; saves record the versions they were played with and refuse to load under different rules.
