# NutriServe remaster: current handoff

This folder started as the pilot character art and the engineering handoff. The four-station game itself, NutriServe Kitchen, is now playable as a preview (**Games → NutriServe Kitchen (preview)**); `CLAUDE_STATUS.md` is its current status.

Open **Games → Preview the NutriServe remaster art**, or `/nutriserve-art-lab.html`, to inspect the six-character cast, 640×480 station composition, four prep slots and alpha backgrounds. The legacy NutriServe header consumes the six new idle sprites by customer ID and falls back to existing art for other customers. Result expressions are still legacy art until the reaction assets are delivered.

| Read | Purpose |
|---|---|
| [REA findings](REA_FINDINGS.md) | Historical record of the earlier reference investigation; the game no longer uses it |
| [Evidence index](evidence-index.json) | Historical: digests and record metadata of the earlier reference investigation |
| [Asset workflow](ASSET_WORKFLOW.md) | Generate → inspect → composite → capture → reject/refine → promote loop |
| [Asset roadmap](asset-roadmap.json) | Every food and customer ID with its production status, reconciled against the catalog of the tree it is in (on `main`: 49 foods, 33 customers) |
| [Prompts](asset-prompts.json) | Historical: how the pilot sprites were made (not for reuse; see the asset workflow's Originality section) |
| [Claude track](CLAUDE_BUILD_TRACK.md) | Ready-to-execute engineering handoff and ownership boundary |
| [Track CSV](build-track.csv) | Concrete tasks and evidence/asset dependencies |
| [Claude status](CLAUDE_STATUS.md) | Engineering status, verification, measured costs, asset requests by id/state |

Codex owns asset generation and visual acceptance. Claude's gameplay track has been implemented (see `CLAUDE_STATUS.md`).

Validation of the art handoff (10 November 2026): all six source PNG hash/alpha/dimension checks; focused NutriServe typecheck; production build; REA desktop/390px review scenarios; BudHub game-entry smoke test (its seven reference arithmetic tests were removed with the reference contract on 12 November). The repository-wide typecheck had 65 existing diagnostics; comparison against an archive of the untouched main baseline found no new or removed diagnostic lines. The game's own tests and release gate are listed in `CLAUDE_STATUS.md`.

NutriServe Kitchen is inspired by the kitchen-serving genre; it doesn't aim for or claim parity with any other game, and every one of its rules is its own since `prep-v9` (audit 16; before it, some prep numbers were still derived from the other game's; see `CLAUDE_STATUS.md`). Outstanding production includes all reaction/animation states, final food/equipment/scene art, audio, and optimized derivatives (the station interactions and progression are implemented, with provisional numbers).
