# NutriServe reference investigation — 10 November 2026

This pass follows `reverse-engineer-anything` v49: identify the artifact, ask bounded questions, keep static interpretation separate from runtime observations, retain complete Evidence, and publish unresolved questions. It supersedes the earlier painterly character direction and the proposed three-slot prep layout.

## Artifact identity and tool boundary

| Artifact | Pinned identity |
|---|---|
| BudHub implementation base | `origin/main` at `913c4ef8f5a41c5573b8ac722dc6d30f311ad912` |
| Reference archive | `SJRNoodles/Flash-Game-Archive`, `eaab9d2c23ec9b876f4fec670ce4713aa3f68a1a` |
| Outer SWF | 5,238,421 bytes; SHA-256 `665cd0ec91becc26c96867765903e330a2da4480cc7890365fbe1426cd06b509` |
| Recovered inner SWF | 7,062,999 bytes; SHA-256 `143df3e9a57e038711b3442e252d14bb03946e31ad1dd7ac27a0889dca5f26de` |

REA MCP tools were absent. One doctor run established that registration/provider setup was incomplete. No global configuration was changed. The pinned REA 6.8.0 CLI was used for supported browser investigations. Its artifact inspector rejected SWF as `unsupported_target/file_format_rejected`. SWF parsing and AVM2 transcription therefore use custom scripts; **they are not REA decompilation results and have no invented REA Evidence IDs**.

The encrypted payload was recovered by a static transcription of the archive wrapper's `Preloader.finish`: use the trailing 32-byte key, RC4 the first `min(payloadLength-32,131072)` bytes, then zlib inflate. Outer tag: DefineBinaryData character 7. No embedded remote URL was needed for recovery. Full parsers, inputs, byte ranges and original Evidence records are retained in the companion local audit package; the original game is not included in the shipping app.

The earlier source audit used the repository's default `old` branch. This change starts from `main` instead; old-branch round counts and diagnostics must not be described as the main baseline. On this main baseline, legacy NutriServe has `MAX_ROUNDS = 20`.

## Questions and answers

| ID | Question | Status | Evidence / boundary |
|---|---|---|---|
| Q01 | Are we studying the supplied classic game? | Answered | Outer/inner hashes, archive commit, recovered title shows version 1.02. |
| Q02 | What stage dimensions and nominal frame rate are declared? | Answered, static | Inner SWF RECT: 640 × 480; declared 30 fps. This does not prove a simulation clock conversion. |
| Q03 | What character style must the new art match? | Answered, visual | Official screenshots 06/09/10: large heads, small oval eyes, simplified narrow bodies, outlined flat color shapes. These are observed visual features, not numerical bytecode constants. |
| Q04 | How many preparation slots? | Answered, visual | Official screenshot 05 visibly has four numbered mixers. Contract corrected to four. |
| Q05 | What station structure is visible? | Answered, visual | Official screenshots 03/04/05/09 show Order, Build, Mix, Top; paper ticket at right, station navigation along the bottom. Indian names map to Order, Build, Prep, Finish. |
| Q06 | How is Build scored? | Answered, static transcription | AVM2 method 141, owner `_-OW`, name `_-1f`, byte offset 603484, length 2207. See formula below. No original-runtime score oracle yet. |
| Q07 | How is Mix scored? | Answered, static transcription | Method 139, owner `_-OW`, name `_-4x`, offset 593192, length 941; constants from `_-BZ.$staticinit`, method 749, offset 828237, length 118. |
| Q08 | How many real seconds correspond to Mix units? | Partial | Writer found in `_-BZ._-Jh`, method 789, at relative PCs 350–363: add its numeric argument to `_-FZ`. Method 200 (`_-5A._-Tb`) supplies local 6 at PC 1564. Its argument construction, boost branches and wall-time relationship still need tracing/runtime timing. Never label 900/1800/2700 as milliseconds or seconds. |
| Q09 | Are waiting and topping formulas reproduced? | Partial | Grading methods 138/140 identified at offsets 592344/594143. Topping code references placement, rotation, order, distribution, balance and spills. Full paths/formulas not yet transcribed or tested. |
| Q10 | Does the recovered game run? | Partial | REA captures intro and stable title through Ruffle 0.7.1. Gameplay navigation did not advance under bounded coordinate clicks; cause unresolved. This does not establish in-game timing or scoring. |
| Q11 | Does the replacement fix the male character mismatch? | Answered for pilot idle art | Three iterations rendered beside official screenshots. V1 rejected for realism; V2 has overly long proportions; V3 has corrected large head/short torso. Browser alpha compositing removes misleading hidden-RGB halos. |
| Q12 | Is the remaster or full asset suite complete? | No | Six idle sprites and a review bench are delivered. Gameplay parity, emotions/walk cycles, full food catalog, equipment, final station art and audio remain gated work. |

## Recovered Build contract

Start at 100. A wrong cup loses 34, wrong mixable loses 33, and wrong syrup loses 33. A wrong category skips its meter penalty. For a correct cup, compare `round(actualFill / idealFill * 100)` to 100. For correct mixable/syrup, compare `round(meterFraction * 100)` to 50. Subtract `0.3 * max(0, abs(observed-target)-4)` for each correct category. Matching furniture adds one per corresponding correct category, capped at 100. Finish with `max(0, round(score))`.

The original has no rice-base category. Any additional Indian base choice and its penalty allocation are an **adaptation decision**, not evidence of the original mechanics. Keep the original reference function unchanged and create a separately named adapter.

## Recovered Mix contract

The static initializer declares `_‑JP = 3600`, `_‑4j = 4`. Targets are 900, 1800 and 2700 for the three blend levels. With `error = min(abs(actual-target),900)`, the score is `max(0,round(100 - 100*max(0,error-150)/900))`. Matching furniture adds 3, capped at 100. The minimum for a finite nonnegative input is 17 because error is clamped before the 150-unit tolerance is removed. Do not “fix” that surprising result into a different curve.

`src/features/nutriserve/domain/referenceScoring.ts` is an explicit static contract with golden arithmetic cases. Passing its tests proves the transcription implementation matches those cases; it does not prove runtime parity with Flash.

## Actual REA records

| Operation | Evidence ID | What it establishes |
|---|---|---|
| `capture_browser_scenario` | `ev_0c4f0dba2ef94557c6ee00296e7469263696e1dbc832af371f1b4396509bdde7` | Recovered SWF reached animated intro after 12-second wait; owned browser terminated. |
| `capture_browser_scenario` | `ev_77f0995919935c2e85a1427fa81ac3f8c864fd789d0928e2f00ad756c31d3e6e` | Title reached after 35-second wait, but viewport clipped the 960px wrapper. Retained as a failed framing check. |
| `list_browser_targets` | `ev_bf55f7c4e1744737a2faf7550e1c5f4a0563dfda9a181000e9dfb9e6a0a531f7` | Selected isolated browser page at localhost 4319. |
| `capture_web_screenshot` | `ev_04c5d347a6dcc57543ea56183fc7f114fd1e94720da761db55f78a9465875ae8` | Correctly framed recovered 640 × 480 title in 660 × 510 viewport. Passive capture, not a REA click. |
| `capture_browser_scenario` | `ev_5196bb9eaa5e7fcb036dd66ae9d49750f7abb6eae339acd08188b8f6f0695863` | Local reference comparison of realistic V1 and cartoon V2/V3 at 260/180px. |
| `capture_browser_scenario` | `ev_656c3b33a1ab15fd71725d13023a0fd4f87aa0ae300a1573b992c4ff5e3b363b` | Six-customer review, Priya selection, four-slot preview and dark alpha backdrop. |
| `capture_browser_scenario` | `ev_9ee460a3f330c4c4cdc77ecc827c027419cb5b145c90de10d6e0a8c8d0086437` | 390px viewport: select Maya and switch to Finish. |
| `capture_browser_scenario` | `ev_0a39e3f6e8d8327edc559dadac9d36d52b0faaf630bec3992d3bb23f2f119b3d` | Final desktop composition after correcting counter occlusion; all actions complete, no console errors. |
| `capture_browser_scenario` | `ev_0d098dfd01dd766246efe4a8d86197afc43e669df9af838d636d6ecbbf85b0c7` | Final 390px Order composition; no console errors. |
| `capture_browser_scenario` | `ev_0f1ff6c536bb754b262e59a441b37b771793001dd13268aa87041daf06e0c7e5` | BudHub → Games → NutriServe opens successfully. Random first customer was Riya, outside the pilot; this exercises the legacy fallback, not the new pilot header image. |

Browser Evidence reports missing direct executable artifact identity; the loopback harness and separately hashed served SWF bind this investigation operationally, not through a provider-attested artifact join. Browser platform/architecture are also unknown in REA's records. Preserve those limitations. Official JPEGs are independent primary visual references, not frames captured by REA from gameplay.

The in-app browser failed before establishing a connection. A task-owned Playwright fallback performed bounded coordinate clicks because REA 6.8.0 scenario clicks support locators but not canvas coordinates. Those actions are labeled in a separate JSONL log. No user browser profile or existing sessions were attached. Ruffle reported emulation stubs/audio warnings. Do not infer behavior from the absence of console errors.

## Primary visual references

- [Flipline official screenshot index](https://i.flipline.com/games/papasfreezeria/screenshots.html)
- [Build station, screenshot 03](https://i.flipline.com/gamefiles/papasfreezeria/images/screenshot_03.jpg)
- [Top station, screenshot 04](https://i.flipline.com/gamefiles/papasfreezeria/images/screenshot_04.jpg)
- [Four mixers, screenshot 05](https://i.flipline.com/gamefiles/papasfreezeria/images/screenshot_05.jpg)
- [Serving character, screenshot 06](https://i.flipline.com/gamefiles/papasfreezeria/images/screenshot_06.jpg)
- [Customer lobby, screenshot 09](https://i.flipline.com/gamefiles/papasfreezeria/images/screenshot_09.jpg)

The next investigation should start at Q08/Q09 using the retained bytecode, not repeat setup or analyze the same artifact again without a concrete unanswered question.
