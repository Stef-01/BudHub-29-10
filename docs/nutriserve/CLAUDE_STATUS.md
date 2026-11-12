# Claude engineering track: status

**On `main`:** the remaster is on `main` (ported without this branch's unrelated `old` history). Later NutriServe changes are synced to `main` with the same port: export the NutriServe paths from this branch's pushed commit, adapt them to `main`'s app shell, and regenerate the catalog from `main`'s sources. `main` records the branch commit it came from in `docs/nutriserve/PORT_SOURCE`; the port stops if a ported file on `main` was changed or added there since, so such work is carried back to this branch first. The port is `scripts/nutriserve-port-to-main.py` (branch tooling; it is not itself ported).

Branch `claude/continue-building-j1mrs7`. The build track asked for a dedicated `claude/nutriserve-mechanics` branch from `main`; this session may only push to `claude/continue-building-j1mrs7`, which is based on the default branch `old`. `origin/main` (the reference audit and pilot art) was merged in at `a04d905`. Every NutriServe change after that lives under `src/features/nutriserve/`, `tests/nutriserve-*`, `scripts/`, `docs/nutriserve/` and a small entry point in the app shell, so it can be cherry-picked onto `main`.

The catalog on this branch has **55 foods and 53 customers** (main has 49 and 33). `asset-roadmap.json` was re-reconciled for this branch.

## Task status

| ID | Status | Where | Notes |
|---|---|---|---|
| C01 | Implemented | `simulation/game.ts`, `types.ts`, `save.ts`, `rng.ts` | Pure TS, no clock reads, integer ms/mg/milli-units (advancing is chunk-invariant, tested). Seeded RNG in state, four prep slots, concurrent tickets, separate dishes, pause, save/restore with schema v2 + migration. |
| C02 | Implemented | `simulation/scoring.ts` `gradeBuild`, `params.ts` `BUILD_V1` (`build-v7`) | Held pour from simulation time; signed under/overfill. Every press pours at least 100 ms worth (8 g base, 9 g main, 5 g side), so a quick tap never pours nothing. A component holding no more than that one-tap amount can still be switched to another food, so a mis-tap never forces trashing the dish. A touch hold that turns into a slow scroll is undone (`cancelPour`). Click-only input (switch access, screen-reader browse mode, voice control) starts a pour with one click and stops it with the next. Grading is NutriServe's own (`build-v7`): base, main and side are worth 40, 35 and 25 points; a portion within 7% of its line counts as exact (15% with the matching serving tool), and the band always reaches at least 0.6 of one minimum press either side of the line, so a tap can land in it on every catalog portion; past the band, a short portion loses 2 of its credit per portion's worth missing, down to nothing, and a generous one loses 1, down to 0.2, so a portion a fifth short costs about a quarter of its share; the wrong food earns none of its share; the wrong vessel size costs 20. The gauges put the line at 62.5% of the track and shade the exact band around it. A vessel of the wrong size still shows the ticket's lines (grading uses them) and says the ticket wants another size. |
| C03 | Implemented, **provisional** | `params.ts` `PREP_V1` (`prep-v6-provisional`) | Four independent slots, held boost, heat/overheat lockout, offscreen cooking. Overheating lets go of the boost and takes the handi off the flame (nothing cooks) until it cools. A tap latches the boost on. Doneness is counted in milliseconds on the flame at normal heat (`prep-v4`; boost counts 2.5 ms a millisecond, 3 with pressure lids), and the slot shows seconds. Grading is NutriServe's own (`prep-v6`): marks at 8, 14 and 20 s on the flame (a quick dish is about one build long, a slow one two and a half, a regular one halfway between), a perfect window 1.2 s either side (1.8 s with copper handis), an undercooked dish earns its share of the way to the window, and an overcooked one loses 10 points per second on the flame past it. A dish stops cooking at 32 s, by when every dish has lost all its prep points, so a forgotten dish reads as burnt. The boost, heat model and these marks are play-testing values. |
| C04 | Implemented, **provisional** | `params.ts` `FINISH_V1` (`finish-v4-provisional`) | Held drizzle in local vessel coordinates (unit circle), spill outside the rim, coverage grid scaled to each drizzle's target, garnish count/type/fallen/balance, step order. Each drizzle has its own integer rate (about 1.7 s to a medium target), and what is poured between two pointer samples is spread along the path between them, so the score doesn't depend on the device's pointer or frame rate (tested from 8 to 60 ms sampling). Rank-locked drizzles and garnishes are refused. The drizzle amount costs nothing within 12% of its target, then up to 24 points, reached 60% further off (`finish-v4`). Garnish **rotation** is not modelled yet. Penalties are play-testing values; final vessel masks wait on art (A03). |
| C05 | Implemented (aggregation provisional) | `game.ts` serve/day, `progression.ts` | Any ready dish to any taken ticket (wrong ticket allowed, graded and flagged). Waiting, build, prep and finish are separate scores; the total is an equal-weight mean with a content gate (`aggregation-v2-provisional`). Waiting, prep and finish count in full only when the katori holds at least half the ordered food, so an empty katori now totals 0 instead of about 44. Five stars and the great-service bonus need a complete order: the right vessel; the right foods, each at 80% or more of its ordered grams; at least 80% of the ordered drizzle; and every ordered garnish piece on (`economy-v3`). A new dish is made for the ticket the player picked on the rail (`pickedTicketId`). Automatic follows don't count as picks; without a pick it goes to the oldest open ticket without a dish, and Build's paper ticket shows that ticket. Each serve records plain reasons for its scores (`notes`), such as "Base +40 g (line 128 g)", "No side", "Overcooked: 16 s on the flame; perfect up to 15.2 s (mark 14 s)", "Burnt: still on the flame at 32 s" or "Missing onion (−12)". Every station score under 100 has at least one, so "No points lost" is never shown when points were lost, and a note appears only for a loss the score shows (a portion whose loss rounds away has none, nor one beside a wrong vessel or a missing food that explains the whole build score; a time just outside the window never reads as its edge). They appear in the last-serve bar and the day summary. A dish remembers the ticket it was started for (`forTicketId`). That is used only to guide the player (per-slot prep targets, the paper ticket at Build and Finish); scoring uses the ticket it is served to. Tips, stars, ranks, and upgrades that each adjust one of NutriServe's rules (`progression-v6`; the garnish tray catches a dropped piece and halves what an off-centre garnish costs). Rewards are credited once per day; reports to the app are guarded by a ledger outside the save, keyed by run id. |
| C06 | Implemented | `nutrition/nutrition.ts` | Canonical per-100g × actual grams; drizzle that landed counts, spilled drizzle and fallen garnish don't; each portion counted once. Legacy meal goals. The day report (`serviceNutritionReport`) separates two things: what the player changed (portions off the ticket, wrong foods, drizzle, missing, extra or unordered garnish, spills, each with its kcal effect) and how the customer's own order fits their meal goal. A perfectly served order is never blamed on the player; the legacy goals are full-plate targets that a three-part katori rarely meets. Catalog validation (found and fixed four customers requiring nonexistent ids). Finish ingredients use cited USDA SR Legacy values (`data/finishItems.ts`). Not medical advice. |
| C07 | Implemented, **layout studies pending art** | `ui/**` | 640×480 stage in stage units with exact pointer transforms; sprites placed by manifest foot anchors behind a counter front; pointer/touch/keyboard (and click-only assistive input) drive the same commands; a compact mode (the rules below, with hysteresis) moves controls to a full-size dock. Dialogs are modal (background inert, Tab stays inside, Escape resumes, focus returns). A save that can't be restored says why and keeps the profile; a simulation error stops the clock and says so instead of freezing. React re-renders at most every 33 ms while the simulation still steps every frame. (See the compact rules above.) Stage text is 1.9% of the stage width at every window size (the wrapper is the size container). On wide layouts the stage shrinks to fit the window height, but never below 720 px (or the kitchen's width, if that is smaller). The last serve's result sits in a fixed-height bar above the stage (on an upright phone, after the station's controls, so they start right below the tabs and tickets; held sideways, under the tickets), so it never covers a control and nothing moves when it changes. On an upright phone Build's scene (the vessel from the side) collapses like Prep's and Finish's, and the Finish tools come before the vessel (in the Tab order everywhere), so picking a tool and using it fit on one screen. On touch, a press becomes a hold (pour, boost, drizzle) only after 120 ms without moving; a finger that moves first scrolls the page. A hold younger than 500 ms whose finger then moves more than 30 px, mostly up or down, was a slow scroll: it is undone, and the player is told. Later drift keeps pouring. Click-only input works at every station. At Finish, a bare click places the selected garnish at the next evenly spaced spot, or runs an automatic swirl that pours the ordered amount of drizzle. Compact layout (controls at least 44 px on an upright phone; 40–42 px on a phone held sideways, 36 px on a 568×320 one, so a station fits one short screen) applies when:

- the kitchen's content box is under 700 px wide;
- the window is under 640 px tall;
- a touch-first window is under 1100 px wide.

In a landscape window 560 px or wider, it puts the scene, tabs, last result and tickets in the left column and the station's controls in the right (phones held sideways, tablets, short desktop windows). On a short one (a phone held sideways) Build's gauges and Finish's dish list take the left column, the HUD is one tight line, each food's four dispensers sit in one row, each handi shows Boost and Done side by side and the Finish tools sit beside the vessel, so every station's controls fit on one screen. Held sideways, the reading and Tab order follow the left column from the top (status line, gauges or dish list, tabs, tickets, last result) and then the controls. On an upright phone the Finish tools go four across (three at 360 px and below), and a long one-word name such as Pomegranate breaks at a syllable rather than spilling out of its button. On a desktop the Finish tools sit above the vessel, matching the Tab order. Vessel input uses the same scale as the drawing: the drawn food circle is local radius 1. Click-only pours with a fill line stop at it by themselves (`stopAtMg`). The automatic swirl pours only what is still missing, and reports where it stopped. When the focused control disappears, keyboard focus moves to the next sensible control. Keyboard drizzle glides the cursor at a fixed speed (best measured finish score 89, or 96 with Shift; pointer 98–100), the same whatever the computer's key-repeat settings. Station scenery, vessels, food fills and garnish glyphs are code-native **layout studies** (`data-layout-study`), not final art. |
| C08 | Gate passed for mechanics; visual sign-off pending | `tests/nutriserve-release-gate.test.mjs`, `scripts/e2e/nutriserve-release-gate.cjs` | See below. A passing gate is not a visual or parity sign-off. |

## Verification

```sh
npm run test:nutriserve            # 99 tests: simulation, stations, day, nutrition, catalog, audit regressions, release gate
npm run typecheck:nutriserve-sim   # strict TypeScript for simulation/nutrition/data
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

Each run also checks that stage text is 1.9% of the stage width. The regressions also cover:

- click-only finishing completes an order;
- "Why?" lists every reason and Escape closes it;
- a long phone pour that drifts 40 px keeps its pour;
- the station tabs fit a 1366×657 window;
- a second click-only swirl doesn't double the drizzle;
- pausing closes the Why? panel;
- a 1280×600 window puts the controls beside the scene;
- a long mouse drizzle is never topped up by the click-only swirl;
- a wiggled touch on a dispenser pours nothing;
- a locked dispenser's reason is one line, key words first;
- phone station tabs keep one height with and without badges, and stay pinned while the controls scroll;
- a dish's dispenser rows keep their order when a ticket arrives, and offer its foods;
- side by side at 560 px, every tab label fits inside its tab;
- after a garnish press cut off by a layout switch, every click places a piece;
- a second tab takes over the save, the first says so and stops writing, and Continue here picks up the latest save, paused;
- on a phone, a handi at its mark is announced in its own region, and opening Prep brings its Done button into view below the pinned tabs;
- in forced colours, the selected tab, the prep fill and the at-mark handi stay distinguishable;
- the Why? panel scrolls under the pinned tabs;
- at 400% zoom the station tabs are not pinned;
- a second window opened beside the first gets its latest state, not its last autosave;
- a failing save is shown, and Save & exit asks before leaving unsaved;
- a restored game's handis at their mark are announced, and the cue drops a handi taken out;
- tapping Prep while on Prep doesn't scroll;
- on a phone, Build's controls start on the first screen, before the result bar, and the finish tools sit above the vessel;
- a wrong-size vessel still shows the ticket's lines and says so;
- a tab back from the back/forward cache keeps newer progress made in another tab, and says so;
- with storage full, a handover still brings the newest state and the can't-save warning;
- a holder busy past the wait hands over late, and the asking tab takes its newer state;
- a new day after a handover keeps what the other tab bought a moment before, and the rule changes are listed;
- on a phone held sideways each station's controls fit on one screen;
- on an upright phone, switching station brings its controls into view under the pinned tabs;
- on a desktop the Finish tools sit above the vessel, as in Tab order;
- in forced colours the suggested vessel size keeps a ring;
- a holder that answers 0.9 to 1.5 s late (while the asking tab opens, or after), with storage working or full, still hands over its newest state;
- with storage full, a handover the asking tab never opened comes back on Continue here;
- after a kitchen stops, its "Start a new day" doesn't overwrite another tab's newer progress;
- the port's union edit passes its self-test.

84/84 checks passed (`GATE_ONLY=regressions|audit11|audit12|audit13|audit14|devices` runs one part while working on it). The auditor's save/restore fuzzer (24,000 round trips) and 40-day bot (605 mid-hold restores) also pass under the stricter save validation: no throws, no false rejections, and coins exactly equal tips minus spending.

Independent audits (findings and fixes are below).

### Audit 1: simulation core

Ten issues, all fixed with regression tests in `tests/nutriserve-audit.test.mjs`.

### Audit 13: stale tabs, handover with full storage, phones held sideways, the port's rollback, plus re-check of the audit 12 fixes

| # | Finding | Fix |
|---|---|---|
| H1 | A tab coming back from the back/forward cache (or a frozen tab waking) overwrote newer progress made in another tab: audit 12's "a left kitchen lets go of the save" left no writer record, and a missing record counted as "I hold the save" | A stale tab never writes. Each kitchen remembers the save as it last wrote it (or found it when it took the save), and before every write checks that storage still holds exactly that; a tab restored from the back/forward cache or woken from a freeze finds another tab's newer save there and stops ("Open in another tab") instead of overwriting it. It checks as soon as it is shown again (`pageshow`, `resume`, `visibilitychange`, `focus`), so it says so at once, and takes the save back only when nobody wrote it meanwhile. A page that goes into the cache lets go of the save, so the next tab doesn't wait for it |
| M1 | A handover while storage was failing silently dropped the holder's newest state (about 9 s, possibly a whole day), and the can't-save warning disappeared with it | The holder now sends its state straight to the asking tab over a `BroadcastChannel` as well as saving it, so the newest state arrives even when storage can't keep it; the asking tab opens that state, and its own failing save shows the warning there |
| M2 | Port: a signal turned into an exception made Python kill the running git command, leaving `.git/index.lock` and a half-changed or moved worktree, and the rollback printed "rolled back" anyway | Signals are only noted; the running command finishes, then the port stops at its next checkpoint and rolls back (signals ignored from there, including by the rollback's git commands). Every rollback step is checked and the result verified (HEAD, branch, clean tree); otherwise it prints ROLLBACK INCOMPLETE with the commands to run and exits 2. A signal before the port has changed anything says so. On scratch clones with the worktree at an old `main` commit (the case that broke): SIGTERM and SIGINT at 0.05 to 0.8 s all leave HEAD, branch and tree as they were and no `index.lock`; two signals and a SIGHUP during the rollback too |
| M3 | The prep-v4 marks were still the other game's numbers (12 s and 18 s were its blend targets at the old conversion rate, 7 s the prep-v3 quick mark) | `prep-v5`: marks at 8, 13 and 20 s from NutriServe's own pacing (a quick dish is about one build long, regular five seconds more, slow seven more again), a perfect window of 1 s either side (1.8 s with copper handis), 10 points lost per second overcooked |
| M4 | The docs still pointed work at parity with the other game (build-track rows, the handoff's steps and ownership table), the asset workflow set new art's proportions from prompts aimed at its style, and the shipped manifest misstated how the pilot sprites were made | The parity tasks are retired in `build-track.csv` and `CLAUDE_BUILD_TRACK.md` (Q08, Q09, R01, R02 and the "original" comparisons); `ASSET_WORKFLOW.md` keeps the earlier proportions as history and leaves NutriServe's own to the art owner; the manifest says a screenshot of another game was given to image generation as a style reference, and its style tag is now `pilot-2026-11-10`. The manifest is now ported to `main` too |
| M5 | Prep-v4 was not fair across devices, and a phone held sideways was the worst case (13 of 16 overcooked, prep 56 against desktop's 6 and 87; 191 scroll swipes) | Every phone layout is compacted so each station fits on about one screen: each food's four dispensers in one row, each handi's Boost and Done side by side, the Finish tools four across (beside the vessel when held sideways), the live grams in place of the dispenser's name while pouring, and the phone gauges naming the food the ticket wants. Held sideways, Build's gauges and Finish's dish list take the left column and the HUD is one tight line. Switching station on a phone now brings that station's controls into view under the pinned tabs (unless they already are). Same bot, same seed, days 11 and 12 (16 serves each); "before" is audit 13's run under prep-v4, "after" is prep-v5 with these layouts:<br>desktop 1280×900: 6/16 overcooked, prep 87 → 4/16, 96 (0 swipes)<br>iPhone 13 held sideways: 13/16, 56, 191 swipes → 4/16, 96, 44<br>iPhone 13: 10/16, 72, 94 → 5/16, 95, 52<br>Pixel 7: 7/16, 84, 40 → 5/16, 97, 9<br>iPhone SE (320×568): 8/14, 82, 177 → 8/16, 90, 70<br>Part of the gain is the wider prep window, which every device gets (desktop 87 → 96); the rest is the phones' reach. The 320 px phone is still the slowest |
| L1 | "Start a new day with your progress" used the profile read before the handover (a purchase made a moment before in the other tab was lost) | Every start-screen button acts on the save as it is after the handover; Continue no longer falls back to the save shown before it |
| L2 | Port: the union edit misread a Prettier-style union, a member only in a comment, a `;` in a comment and double quotes | The union is read as code (comments and strings skipped, multi-line, with or without a `;`, either quote style) and the member is added in the union's own style. `--self-test` checks 14 cases. On scratch clones: a Prettier-style union with and without the member, the member only in a comment (one line and several), a `;` in a comment, double quotes and a renamed type all give a valid union (or, for the rename, stop and roll back); the audit-12 scenarios (main-side doc edits stop the port, main's own docs are kept, a repeat port changes nothing) still hold |
| L3 | The garnish tray was worth almost nothing (0–2.4% of pieces land outside) and the serving tools only a little | The tray also halves what an off-centre garnish costs, and costs 30 instead of 35 (`progression-v6`). The tools stay as they are (they turn 58% perfect builds into 91% at 100 ms of release jitter); how much upgrades should matter is listed as a design question |
| L4 | Two tabs asking at the same moment: the last one gets the save, and the first is told within 0.8 s | Kept, and documented: the most recently opened kitchen holds the save. Both tabs arrive paused, so nothing is lost |
| L5 | A note claimed a loss where none was scored (137 g on a 128 g line scored 100 but said "Base +10 g"), and prep notes showed the window's edge (6.2 s) for a dish just outside it | Notes appear only for a loss the score shows (portions costing under half a point are named only when nothing larger explains a lost point), and prep notes round away from the window: "Overcooked: 15.1 s on the flame; perfect up to 14 s (mark 13 s)" |
| L6 | The 25 s cap hid how long a dish was overcooked: a forgotten slow dish kept 26 points and the note always said 25 s | The cap is 32 s, past the point where every dish has lost all its prep points, and a dish at the cap is "Burnt" |
| Nits | Rice scoop wording; desktop Finish Tab order; the wrong-size caption in title case; forced-colour rings on the pressed dispenser and the suggested size; a side overfilled past its band cost 0.3 a percent (the other game's build slope); a 60 g main's exact band was narrower than one tap; "NaN s"; two rejections in one event; the tray's new effect without notice; the start-screen storage probe; README's "seven reference arithmetic tests" | "Every base"; the desktop tools now sit above the vessel; sentence case; system colours for both rings; `build-v7` (generous portions lose 1 of their credit per portion's worth, so a side costs 0.25 a percent, and every exact band reaches 0.6 of a tap either side); NaN reads as not cooked; every rejection is announced; the start screen lists what changed in the rules when it carries a save over; the probe writes 8 KB; README updated |
| Suspected | Frozen phone tabs (same path as H1); a slow holder ceding after the asker read the save; a restored game's cue landing 5 ms after its live region appears; Continue's fallback; legacy drag and drop | Frozen tabs take H1's path (checked on `resume` and when shown). A slow holder's late handover is taken, not fought: a Continue whose holder didn't answer in 0.8 s opens paused, and while nothing has been played there it adopts the holder's newer state when it arrives (same game and day only); otherwise the stale check stops the older tab. Tested with the holder busy 0.7 to 1.8 s: the asking tab always ended with the newest state. The cue's first words wait 0.6 s (the game is paused). Continue no longer falls back. The legacy game is unchanged |

- `build-v7`, `prep-v5-provisional` and `progression-v6` are new rule versions: a save from earlier rules starts a new day with the player's rank, coins and upgrades, and the start screen lists what changed.
- Re-checked from audit 12: an independent scorer matched every fuzzed serve and every station score under 100 had a note (20,000 serves); chunk invariance held with every upgrade; 40,000 fuzzed saves gave no false rejects; the whistle lets go in its window in every combination; a real old save is rejected and salvaged; the audit-12 handover cases (a holder on the summary, a fatal holder, New game during a handover, three-tab ping-pong, Save & exit with storage failing) all held; the port's 41 audit-12 scenarios behaved as expected.

### Audit 12: leftover constants, windows side by side, failing saves, phone reach, plus re-check of the audit 11 fixes

| # | Finding | Fix |
|---|---|---|
| M1 | On busy late days an iPhone-size phone still overcooked far more than desktop (11/16 vs 3/16; prep 71 vs 90). The prep reveal worked; the time went on scrolling elsewhere (117 swipes in two days), because every station's controls started below the fold | On an upright phone the station's controls now come straight after the tabs and tickets (the last-serve bar moved below them), Build's scene collapses (its gauges say the same), empty handis take one line, and the Finish tools sit just above the vessel. Same bot, two late days (days 11 and 12, eight customers each): an iPhone 13 now needs 92 scroll swipes (was 117) and ends with a prep average of 78 and 9 of 16 dishes off their window (was 71 and 11 of 16); a desktop window, 86 and 6 of 16 under the same rules. A phone is still slower per action; the gap went from about 3.7× to 1.5× |
| M2 | Numbers from the other game survived in the "original" rules: the prep marks were its blend targets plus 150 at the rate chosen to convert them, the garnish tray was its "+3 capped at 100" furniture bonus, the gauge line sat at its meter's 50%, and the drizzle penalty had its 0.3-per-percent slope. The prompt and evidence records still read as current | `prep-v4`: doneness in ms on the flame, marks at 7, 12 and 18 s. `progression-v5`: the garnish tray catches a piece dropped outside the katori instead of adding points. `build-v6`: the line sits at 62.5% of the gauge. `finish-v4`: the drizzle amount is free within 12%, then rises evenly to 24 points over the next 60%. `asset-prompts.json` and `evidence-index.json` carry a status line saying they are history and not for reuse (and are now ported to `main`); a test title no longer says "reference furniture". The 640×480 stage and four handis are the owner's design and stay |
| M3 | With two windows open side by side, the second one loaded the first one's last autosave, so up to 4 s of play was lost (a purchase made a second before was gone) | Handover: before a tab reads the save (Continue, a new day, a new game, Continue here) it asks the tab holding it to hand it over (`handoffKey`). The holder pauses, saves its latest state, records the asking tab as the writer and stops; the asking tab waits for that (at most 0.8 s, for a holder that is closed or frozen) and only then reads the save. A request older than 2 s is ignored, so a tab waking from a freeze can't hand over stale state. A kitchen that is left (Save & exit, Exit) lets go of the save, so the next tab doesn't wait. The handed-over game arrives paused |
| M4 | "No points lost." showed when prep or waiting had lost up to 10 points, and build could lose a point with no note | Every station score under 100 gets a note: any portion outside its exact band, any prep under 100 (in seconds on the flame against the mark), any waiting under 100, and finish penalties down to under a point ("(−<1)") |
| L1 | A full or blocked storage lost progress silently, and Save & exit left without a word | A failing save shows a warning in the HUD; Save & exit asks before leaving unsaved; the start screen says when the browser can't store anything |
| L2 | Port: SIGTERM mid-run left a half-ported worktree with a moved branch | SIGTERM and SIGHUP roll back like Ctrl-C (and a second signal can't interrupt the rollback). Tested on scratch clones at 0.3 and 0.5 s |
| L3 | Port: an unrelated new game mode on `main` stopped the port as if the NutriServe entry had changed | The GameMode member is added to the union wherever `main` keeps the others; a new mode on `main` ports cleanly |
| L4 | The prep cue missed handis already at their mark in a restored game, and kept naming a handi after it was taken out | The cue always describes the current set of at-mark handis: it is announced on arrival in a restored game and changes as handis are taken out |
| L5 | Browse mode read the hidden older status messages ("Game is paused" three times) | Older messages stay in the live region but are hidden from browse mode |
| L6 | Forced colours: the live grams on the dispenser being poured were white on yellow; the wanted prep mark vanished into the fill | The live grams use the pressed button's colours with a border; prep marks are CanvasText with a Canvas ring, the wanted one wider and taller |
| L7 | The prep reveal scrolled when tapping Prep while already there, and held sideways it scrolled the tabs off screen | It runs only when coming to Prep from another station; held sideways, the station tabs stay pinned at the top of their column. A revealed Done button keeps 64 px clear of a phone browser's bottom toolbar |
| L8 | Build grading was so flat that the serving tools barely mattered (99.5 vs 99.9 with 100 ms of release jitter) | `build-v6` (C02). With 100 ms of release jitter, perfect builds go from 58% without the tools to 91% with them (150 ms: 34% to 75%; average 95.7 to 98.6) |
| L9 | A wrong-size vessel hid its gauges' lines, though grading still used the ticket's | The ticket's lines stay, with "ticket wants medium (−20)" in the caption |
| L10 | A record left by a closed tab plus a failing write made the only tab supersede itself every 4 s | When recording the writer fails, the old record is removed (with no record, the open kitchen holds the save) |
| Nits | Pressure lid wording; the tray's gross penalty in notes; `portionCredit(NaN)` and `gradePrep(NaN)`; an App.tsx comment | Reworded; the tray no longer adjusts scores; NaN earns nothing; comment fixed |
| Suspected | The screen layout (tabs along the bottom, ticket rail, paper ticket) may mirror the other game; iOS Safari's toolbar over a revealed Done; tabs on different versions trading saves; a doubled day report if both the save and the ledger fail | The layout is the genre's common structure that the owner asked for; the reveal keeps a bottom margin; the other two are not reproduced |

- `build-v6`, `prep-v4-provisional`, `finish-v4-provisional` and `progression-v5` are new rule versions: a save from earlier rules starts a new day with the player's rank, coins and upgrades.
- Re-checked from audit 11: the original rules matched an independent scorer on every fuzzed serve; the single writer held in every listed scenario (gaps above: M3, L1, L10); port branch safety, the 400% zoom tabs, the Why? panel layering, the whistle, reduced motion and the guarded score save all held.

### Audit 11: originality, two tabs, reach on phones, high contrast, the port, plus re-check of the audit 10 fixes

| # | Finding | Fix |
|---|---|---|
| H1 | Build and Prep were graded by a transcription of another game's decompiled scoring code, the art lab showed it as a "recovered scoring contract" with that game's terms, the station colours matched that game's scheme, and the art brief told artists to work from its screenshots. The owner's direction is a game *inspired by* the genre, not a recreation | NutriServe's own rules: `build-v5` and `prep-v3` (C02, C03 above) and `progression-v4` (below). The transcribed contract (`domain/referenceScoring.ts`) and its tests are removed; the art lab's scoring panel is gone; stations use NutriServe's own colours (peacock teal, turmeric, terracotta, rani pink) in the game and the art lab. `ASSET_WORKFLOW.md` has a new Originality section (no other game's imagery as inputs or references), and `CLAUDE_BUILD_TRACK.md`, `README.md` and `REA_FINDINGS.md` say the reference investigation is history, not a source of rules. The six accepted idle sprites were made under the earlier brief; whether to rework them is the art owner's call, and they are unchanged |
| M1 | Two tabs overwrote each other's save: the stale one erased a purchase on close and brought an old run back after a new game | One writer per save (`writerKey`). A kitchen claims the save when it opens and saves at once; another tab that sees the claim (storage event, or at its next autosave) stops saving, pauses, and shows "Open in another tab" with Continue here (loads the latest save, paused) or Exit. A tab also saves when hidden, and the start screen re-reads the save when another tab changes it |
| M2 | Phones still overcooked far more than desktop (11/16 vs 7/16 late-day): the cue showed, but the at-mark slot's Done button was often below the fold | Opening Prep (tab or key 3) scrolls the most overdue at-mark slot's Done button into view, below the pinned tabs, without moving focus |
| M3 | A failed port could move a checked-out local branch back to origin/main, and a successful one ignored its unpushed commits | The port refuses a checked-out branch with commits origin/main lacks, detaches before touching anything, and on failure checks the original branch or commit out again (never moved) |
| M4 | Forced colours (high contrast): meter fills and heat looked empty; the selected tab, tool, dish and ticket looked like the rest; the at-mark and overheated highlights vanished | A `forced-colors` block: Highlight/HighlightText for anything pressed, system-colour meter fills and marks, outlines for at-mark (solid) and overheated (dashed) |
| L1 | Port: main-side edits to the app-shell insert added a second copy (duplicate declarations, duplicate keys); a ported file deleted on main was restored; main-only edits to the status doc were discarded | Each app-shell patch has a marker: if main changed the insert, the port stops. Files deleted on main, a mode change, and an edit below the status doc's head also stop it. It archives the commit it checked, skips branch-deleted fixed paths, explains an empty `PORT_SOURCE`, and says "pull" when the branch is behind. A second port after committing the first changes nothing |
| L2 | At 300–400% zoom the pinned tabs took a third of the viewport and the finish vessel never fit below them | Under 500 px of height the tabs scroll with the page |
| L3 | The Why? panel covered the pinned tabs (and their badges) while scrolling | It sits under them in the compact layout |
| L4 | Pressure lids made a late release worse (a latched boost overshot further), ranks 9–10 unlock nothing, and coins pile up once everything is bought | Pressure lids now also whistle: the boost lets go when the dish reaches the start of its perfect window (`progression-v4`). Late-game content is an open design question (below) |
| L5 | Screen readers: the one status line replaced time-critical cues before they were read | Prep cues have their own polite region that names every handi at its mark; the status line keeps each message as its own node (the last three stay, visually hidden), so each is read once |
| L6 | Branch only: reduced motion didn't stop smooth page scrolling | `index.css` turns it off under `prefers-reduced-motion` |
| L7 | Branch only: the score save wasn't guarded | Wrapped as on `main` |
| L8 | The locked-dispenser notice was announced twice | It is announced once, through the station's status region |
| Nits | No coverage for the audit 10 garnish fix; port wording and archive-by-name | Gate check; port fixes above |
| Suspected | Two tabs finishing the same day at the same instant could both pass the ledger | Not reproduced; the single writer makes it far less likely (only one tab plays at a time) |

- `build-v5`, `prep-v3-provisional` and `progression-v4` are new rule versions: a save from earlier rules can't be restored as is, so the start screen offers a new day with the player's rank, coins and upgrades.
- `progression-v4`: the brass rice scoop widens the base's exact band (10% to 20%), the steel ladles the main's and side's, copper handis the perfect prep window (0.8 s to 1.4 s either side), and pressure lids add the whistle. Upgrade ids, costs and ranks are unchanged.

### Audit 10: cue visibility on phones, the port to `main`, upgrade balance, plus re-check of the audit 9 fixes

The auditor's fuzzer, adapted to the new upgrades, mid-day purchases and day pacing, found no false rejections, throws, chunk breaks, ledger or economy mismatches, or stop-line overshoots: 72,000 round trips and 66,538 mid-hold restores on the branch, 36,000 and 33,346 on `main`. Tips, points, waiting and heat were recomputed independently with no mismatches. On `main` the card, one score and 50 XP per day, and the legacy game were checked; `main`'s catalog is a strict subset of the branch's with identical entries.

Findings, all addressed:

| # | Finding | Fix |
|---|---|---|
| M1 | Phones held upright: while working Build or Finish, the Prep tab's "Done!" and the status line were off screen. On 8-customer days a UI bot overcooked 11 of 16 dishes there, against 5 of 16 on desktop | In the compact layout the station tabs are pinned to the top of the window while the controls scroll under them; scrolled-to and focused controls land below the tabs |
| M2 | The port to `main` silently undid `main`-only edits, left files the branch had deleted, wiped uncommitted work in the target, could stop half-done, ported whatever `HEAD` was, and wrote doc text that changed between runs | The port refuses a dirty target, ports the named branch only once it matches its pushed copy, records the source commit in `docs/nutriserve/PORT_SOURCE` and stops if any ported file on `main` differs from it, deletes files the branch deleted, rolls back on any failure, and writes the same doc text every run, listing every file it touches |
| L3 | A dish's dispensers changed under it: a food already in the katori could vanish from its row (5 of 6 trials), and a new order moved 6 of 24 dispensers | Each dish keeps the rows it started with for its whole life, its own foods always included; a new ticket's foods are added at the end of their row |
| L4 | Notes still named portion and finish errors that owned upgrades made free | Notes are graded with the player's upgrades, and finish problems are named only when the finish lost points |
| L5 | The dock's tab row grew 19 px when a badge appeared, moving the controls below | Dock tabs have one fixed height, and "Done!" is the same height as a count badge |
| L6 | The two-line locked notice (audit 9 L1) covered the first row of dispensers for 3.5 s | One line again, with messages that lead with what matters ("Locked to Brown Rice: trash the dish to change base") |
| L7 | A garnish press held across a layout switch swallowed the next click | A press is forgotten when its vessel element is replaced, or when its pointer is released anywhere |
| L8 | Three of the four rank 5–8 upgrades gave little: rank points stop mattering at rank 10, spare coins have no use, and queue time costs far less than ticket time | `progression-v3` (below) |
| L9 | On `main`, the id fix in `services/nutriserveCharacters.ts` changes the legacy game: its result screen now shows "You prepared: Brown Rice" or "Red Rice" for the two customers whose required food was unreadable before (read in code, `services/nutriserveUtils.ts`) | Intended: those customers' orders were broken. Documented here |
| Nits | A click-only pour on a dish with no ticket said "this vessel size isn't the ticket's"; a comment called the mark window "the last half second" at every rate; side-by-side tab labels nearly filled their tabs at 560 px | "No fill line: no ticket for this dish"; the comment gives both rates; side-by-side tabs have their own fixed height (54 px), no side padding and thin gaps, so at 560 px "Finish" (38 px) has 42 px |
| Suspected | `main`'s `handleRemasterDay` did not handle a failed score save | The port wraps it, so a failed save is ignored rather than an unhandled rejection |

Accepted (not changed):
- A day that is credited but not yet reported (the page closes between a render and its effect) and whose save is then salvaged under new rules is never reported to the app. The window is one render; a same-rules reload reports it normally.
- In the side-by-side layout the status line is one line high, so two announcements at the same moment can be cut off on screen. Screen readers still hear both.

Design (new provisional version):
- `progression-v3`: the rank 5–8 upgrades now help where busy days cost points. Insulated handis (rank 5) heat 40% more slowly; the chai stall (rank 6, now 50 coins) gives 12 s more queue patience; the tiffin rack (rank 7) gives 15 s more ticket grace; pressure lids (rank 8) cook 3× instead of 2.5× while boosting. The serving trolley and head chef's whites are retired: a save that owned one gets its coins back (90 and 140), and the start screen says so.

### Audit 9: transitions mid-press, multi-day play, plus re-check of the audit 8 fixes

The auditor's fuzzer found no false rejections, throws, chunk breaks, invariant or ledger mismatches, and no stop-at pour overshot its line. That covered 200,050 round trips, 180,033 mid-hold restores, 34,828 chunk checks and 2,750 walks continued from restored saves. It also checked:

- multi-day play with every input;
- Save & exit and Continue mid-action at every station;
- app integration (one score and XP per day, the legacy game still loads);
- 124 dishes on screen (p95 16.7 ms; 33 ms on a throttled phone);
- 20 save and continue cycles (no DOM or listener growth).

Findings, all addressed:

| # | Finding | Fix |
|---|---|---|
| M1 | A touch or pen press on a disabled dispenser that re-enabled before release started a pour with no stop line | A blocked press is reported only if the control is still disabled; Build works out the reason without dispatching a real pour |
| M2 | Side by side on landscape phones: no portion display in view while pouring | The live grams ("45/66 g") are shown on the dispenser being poured |
| M3 | Nothing said a handi had reached its mark from another station (prep was the only score separating players) | "Prep slot N is at its mark: take it out" is announced; the Prep tab shows "Done!"; the slot is highlighted |
| L1 | The one-line locked notice cut off the part that mattered | Two lines, shorter messages, key part first |
| L2 | A mouse or pen garnish press released off the vessel swallowed the next click | Garnish presses capture the pointer too |
| L3 | Serve notes named portion errors that cost no points | A portion is named only if a perfect portion would have scored higher |
| L4 | Side by side at 560–600 px: tab labels filled their tabs; the status line moved the controls by 1–2 px | Smaller tab labels; the status line has a fixed height |
| Suspected | Another pointer's release could end a press's timing | The window-level release listeners only end their own pointer's press |

Design (new provisional versions):
- `day-v2`: arrival gaps shrink each day, from 22–38 s down to 12–20 s, and up to 8 customers come, so later days are busier and not only longer. Under v1 the waiting score was 100 on every day for every player.
- `progression-v2` (replaced by `progression-v3` in audit 10): four upgrades at ranks 5–8 with effects a strong player still feels. Insulated handis heat 40% more slowly, the serving trolley adds 2 coins on each complete order, the chai stall gives 12 s more queue patience, and head chef's whites give +20% rank points. In v1 everything was bought by about day 6.

### Audit 8: every press type on every control, side by side, plus re-check of the audit 7 fixes

The auditor's fuzzer found no false rejections, throws or chunk breaks: 120,000 round trips, 107,905 mid-hold restores and 21,570 chunk checks. Whole days in six setups averaged 97–100 with no app errors. Findings, all addressed:

| # | Finding | Fix |
|---|---|---|
| H1 | On the hold buttons, a touch that wiggled past the slop, a pen drag, or a press on a disabled dispenser was followed by a click that counted as click-only (a pour to the line, or forever with no line; a latched boost) | HoldButton records every primary press, disabled or not, and a click counts only with no press down and none ended in the last 600 ms; a release anywhere ends the timing (as on the vessel). A disabled control reports a mouse press at once, and a touch on release unless it turned into a scroll |
| M1 | Help text described click-only behaviour as if it applied to mouse and touch | It says which behaviours are for switch, voice and screen-reader activation |
| L1 | The compact threshold moved 32 px (the root's padding was counted) | Content width, as before |
| L2 | The locked-dispenser notice covered a whole row | One line over the legend |
| L3 | P didn't pause with focus on the finish vessel | Shortcuts work there (the vessel uses only arrows, Space and Enter) |
| L4 | "Already at the line" was screen-reader-only; a stopped latched pour left stale text; "Already holding a control" on another dispenser | Visible notice as well; stopping by press or scroll announces the grams; "X is still pouring: stop it first" |
| L5 | Side by side on short windows: an empty Prep/Finish scene pushed controls down; status line last | The empty scene collapses; the status line sits under the HUD; the vessel is at most 45% of the window height |
| L6 | Doc drift about the compact rules | Corrected (this section and C07) |
| Obs. | A stop-at-line pour stopped within the minimum press could go up to 9 g past its line | The minimum is capped at the line |
| Obs. | A quick touch tap with a drizzle tool did nothing, silently | "Press and hold, then drag" |
| Obs. | iPhone SE landscape stayed stacked | Side by side from 560 px |
| Suspected | A 2-in-1 switching input without resizing | The layout also listens for pointer-type changes |

### Audit 7: long presses, layouts across devices, plus re-check of the audit 6 fixes

The auditor's fuzzer (200,000 round trips, 16,216 chunk checks, now including stop-at-line pours and picks) and whole days on every input found no crashes or save problems. Findings, all addressed:

| # | Finding | Fix |
|---|---|---|
| H1 | A mouse press on the vessel held longer than 0.6 s counted as a click-only activation (automatic swirl, double garnish) | A click is click-only only when no press is down and none ended in the last 600 ms (timed from the release, like the hold buttons); a release anywhere ends the timing |
| M1 | A second click-only pour after the line poured without limit, announced as stopping by itself | Refused in the simulation (`Already at the line`) and in the UI ("already at the line, N of M grams"); a click that stops a pour announces the grams |
| M2 | Resuming from pause with the keyboard scrolled the focused control off screen | Focus recovery stays out of the way while a dialog closes, and never scrolls (`preventScroll`) |
| M3 | The locked-dispenser reason reshuffled the dispenser grid | An overlay over the row's legend; the grid never moves |
| M4 | Phones in landscape never got side by side | Any landscape compact window 640 px or wider |
| L1 | Side by side left only an empty wall beside Prep and Finish | The left column holds the scene, station tabs, last result and tickets; the right column the station's controls |
| L2 | The layout flapped on diagonal resizes | The current width is read on every resize |
| L3 | A pick of the ticket being built outlived its dish | Cleared when that dish goes to prep |
| L4 | Some click-only garnish spots overlapped | One ring per garnish type, at least 0.13 apart |
| L5 | "+0 kcal" on swap and portion lines | All kcal amounts that round to zero are omitted |
| L6 | Help text still said "a second click stops" | Updated |
| L8 | The front customer was announced twice | The sprite is decorative; the text names them |

On L7: click-only play reaches full Build and Finish marks, because pours stop at the line and the swirl lays down an even drizzle. That is deliberate. It is an accessibility assist for players who can't hold or drag, and it is no longer reachable with a mouse (H1).

### Audit 6: click-only and keyboard details, tablets, plus re-check of the audit 5 fixes

The auditor's fuzzer (213,600 round trips, 16,696 chunk checks) and whole days with touch, mouse, keyboard and click-only input found no crashes or save problems. Twelve findings, all addressed:

| # | Finding | Fix |
|---|---|---|
| C1 | A second click-only swirl poured the whole drizzle again; an interrupted swirl said "done" | It pours only what is still missing (or says it is already at the target), and reports "stopped at N of M grams" when interrupted |
| C2 | The swirl's path capped finish at 93 | Six passes at width 0.85 |
| C3 | The swirl kept pouring onto a dish after another was picked | `selectDish` ends a drizzle on the dish being left; the swirl stops when the shown dish changes |
| C4 | Click-only garnish spacing clustered without a count; two types shared a spot | Count from the dish's ticket or a matching open ticket, else opposite pairs; per-type angle and ring |
| C5 | Vessel input was scaled to the element, not the drawn rim (clicks past the rim counted as on the dish) | `VESSEL_RIM_SHARE` shared by drawing and input |
| C6 | Focus recovery could land on Done or Serve; held Enter repeated actions | Recovery targets only the suggested size or the station tab; held Enter/Space never repeat a button; keyboard Done at Finish moves focus to the tab; a post-render check covers Firefox |
| C7 | The Why? panel drew over the pause dialog and the day summary | Dialogs close it and sit above it |
| C8 | Automatic follows steered the next dish onto a ticket that had one | Only the player's rail pick counts (`pickedTicketId`) |
| C9 | The locked-dispenser reason used a raw id and showed off screen on phones | Food label; the reason shows beside the dispensers |
| C10 | Every touch screen got the compact layout; landscape tablets had controls below the fold | Window width decides; side-by-side layout in landscape |
| C11 | Station tabs below the fold in desktop windows 540–633 px tall | Compact (side by side) under 640 px tall |
| C12 | The 75% cue for click pours came too late to act on | Click pours with a line stop at it exactly |
| Nit | "+0 kcal" in the nutrition report | Omitted when it rounds to zero |

Still to check on real devices: whether iOS VoiceOver and Switch Control taps send pointer events. The click-only path now triggers on any click that isn't preceded by a press, whatever the click's `detail`.

### Audit 5: end-to-end play, click-only and touch, plus re-check of the audit 4 fixes

The auditor's save fuzzer ran 320,400 round trips and 25,090 chunk-invariance checks with no failures. Eleven findings, all addressed:

| # | Finding | Fix |
|---|---|---|
| 1 | Click-only input could do nothing at Finish, so it could never complete an order | A bare click places the selected garnish at the next balanced spot, or runs an automatic swirl that pours the ordered amount; progress is announced |
| 2 | Half portions counted as a complete order (five stars, bonus) | `economy-v3`: every food and the drizzle must be at 80% or more of the ordered amount |
| 3 | The slow-scroll undo also wiped genuine long touch pours | Only a hold younger than 500 ms with a mostly vertical drag is undone; a press that stops a latched pour keeps it; "Pour cancelled" is announced |
| 4 | `ticketForNewDish` overrode the player's pick, and the paper ticket disagreed with the gauges | The selection is always honoured; finishBuild moves it to the next ticket without a dish; startDish selects the dish's ticket |
| 5 | The result bar hid most of its reasons | "Why?" opens every reason over the stage (Escape closes); the duplicate content note is dropped from the bar |
| 6 | Note wording: raw ids, "(−0)", no drizzle direction, unnamed unordered garnish | Labels, "Too much / Too little", rounding-zero penalties skipped, named garnish, "Only N% of the ordered food" |
| 7 | Latched pours were announced only at the line, too late to stop | A "nearly at the line" cue at 75%; a note when there is no fill line |
| 8 | Station tabs below a 1366×657 window | Tighter HUD and two-line bar on short windows |
| 9 | Phone landscape scene taller than the screen | Compact stage limited to about half the window height |
| 10 | Keyboard focus fell to the page after main actions | Focus moves to the suggested or primary control, or the station tab (keyboard users only, so taps never scroll) |
| 11 | Tab badges over labels at 320 px; a locked dispenser said nothing | Badge below the label; pressing a locked dispenser shows the reason |
| Suspected | Tablet stage targets of 24–27 px | Touch-first screens under 1100 px use the compact layout |

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

## Open design questions

Every rule is NutriServe's own; none waits on evidence from another game any more.

- **Tuning:** portion bands and slopes, prep marks, the heat model, waiting grace, finish penalties, upgrade prices and the equal-weight total are play-testing values (`BUILD_V1`, `PREP_V1`, `WAITING_V1`, `FINISH_V1`, `AGGREGATION_V2`, `UPGRADES`). The serving tools and the garnish tray change scores by a point or two a serve; whether upgrades should matter more is a design call.
- **Late game:** ranks 9 and 10 unlock nothing, and by about day 15 every upgrade is owned and coins pile up. New upgrades or a coin sink need a design decision (and, for anything shown, art).
- **Art style:** the six pilot sprites follow the earlier brief, and NutriServe's own character proportions are not set yet (see `ASSET_WORKFLOW.md`, Originality); both are the art owner's decisions.

Changes go in new versioned parameter sets, never edits to shipped ones; saves record the versions they were played with and refuse to load under different rules (the profile carries over).
