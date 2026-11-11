# NutriServe remaster: current handoff

This release corrects the pilot character art and establishes the reference/audit/build handoff. It does not replace the existing planner with a completed four-station game.

Open **Games → Preview the NutriServe remaster art**, or `/nutriserve-art-lab.html`, to inspect the six-character cast, 640×480 station composition, four prep slots, alpha backgrounds and recovered scoring arithmetic. The legacy NutriServe header consumes the six new idle sprites by customer ID and falls back to existing art for other customers. Result expressions are still legacy art until the reaction assets are delivered.

| Read | Purpose |
|---|---|
| [REA findings](REA_FINDINGS.md) | Exact artifact identity, observations, static transcriptions, REA IDs and unresolved questions |
| [Evidence index](evidence-index.json) | Digests, byte ranges and retained-record metadata |
| [Asset workflow](ASSET_WORKFLOW.md) | Generate → inspect → composite → capture → reject/refine → promote loop |
| [Asset roadmap](asset-roadmap.json) | Exact current-main 49 food / 33 customer IDs and production status |
| [Prompts](asset-prompts.json) | Built-in image generation inputs and source identities |
| [Claude track](CLAUDE_BUILD_TRACK.md) | Ready-to-execute engineering handoff and ownership boundary |
| [Track CSV](build-track.csv) | Concrete tasks and evidence/asset dependencies |

Codex owns asset generation and visual acceptance. Claude's gameplay track is prepared but has not been dispatched to an actual Claude session.

Validation for this change: seven reference arithmetic tests; all six source PNG hash/alpha/dimension checks; focused NutriServe typecheck; production build; REA desktop/390px review scenarios; BudHub game-entry smoke test. The repository-wide typecheck has 65 existing diagnostics; comparison against an archive of the untouched main baseline found no new or removed diagnostic lines.

Do not claim exact Freezeria parity yet. Outstanding evidence includes original mix time conversion/boost behavior, waiting/topping formulas and runtime score oracles. Outstanding production includes full station interactions, progression, all reaction/animation states, final food/equipment/scene art, audio, and optimized derivatives.
