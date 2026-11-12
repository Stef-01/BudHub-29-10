# Asset production

Revision: 10 November 2026. Owner: Codex for generation and visual acceptance; Claude for consuming approved assets and implementing mechanics. This supersedes the earlier soft hand-painted art direction.

## Originality (12 November 2026)

The owner's direction is a game **inspired by** the kitchen-serving genre, not a recreation of any one game. From this revision on:

- Don't use another game's screenshots, sprites, UI or logos as image-generation inputs or style references, and don't trace, paint over or match them. References are NutriServe's own approved masters, real Indian food and kitchenware, and the written brief.
- NutriServe's characters, faces, station screens, tabs, tickets and colours are its own. Genre conventions (taking orders at a counter, a ticket, several stations, a cartoon cast) are fine; another game's specific character design or screen layout is not.
- The six accepted idle sprites were made under the earlier brief, which used another game's screenshots as a style reference. Whether to redraw or rework them is the art owner's decision; engineering hasn't changed them.
- The earlier brief's character proportions (very large heads, narrow limbs, heavy dark contours, a head of about 36–40% of body height) came from prompts aimed at another game's style. They are recorded below as history, not as targets: the art owner sets NutriServe's own proportions and records them here.

## The style contract

A flat, outlined, friendly cartoon look for original NutriServe characters and Indian food — not modern realistic food illustration or a mobile advertising portrait.

Characters use simplified, readable shapes, clear outlines and restrained flat color. Their proportions, line weight and face design are NutriServe's own, set by the art owner (the earlier brief's large-head proportions came from prompts aimed at another game's style and are not a target; see Originality). Preserve individual face/hair/clothing silhouettes; do not clone the same head across the full cast. Richer character/body/age variation is still needed beyond the six-person pilot.

At the 640 × 480 stage, the sprite must remain readable at 120–180 CSS pixels in a queue and at larger serving scale. Gameplay machinery needs distinct silhouettes and high-contrast controls. The code-native UI has a paper order ticket on a rail and compact station tabs. Four prep slots are required. Order/build/prep/finish use NutriServe's own colours: peacock teal, turmeric, terracotta and rani pink (`STATION_COLORS` in `src/features/nutriserve/ui/LayoutStudy.tsx`).

Reject realistic skin, photographic anatomy, painterly textures, detailed irises, soft portrait lighting, glossy 3D characters, ambiguous food silhouettes, flattened alpha, or assets that only look good enlarged. Backgrounds should support customer/tool readability. The current room and bowl in the review bench are editable layout studies, not approved final station/food assets.

## Repeatable production loop

1. **Pin the brief.** Name the asset id and state, the approved NutriServe master it must match, and any real-world reference (a photo of the dish or vessel). Record the source of every input image; another game's imagery is never an input.
2. **Choose one master.** Approve a representative character, vessel or machine at native display size before expanding a family. Arjun V3 is the current idle-character master. The rejected realistic V1 and long-body V2 remain local comparison evidence, outside the shipping registry.
3. **Write a structured prompt.** Specify subject identity, required silhouette, palette, orientation, size/padding, transparent background, style reference roles and prohibited details. Keep approved parts fixed during edits. One generation call per asset/state; do not ask a sheet of unrelated sprites to serve as individual production files.
4. **Generate with the built-in image tool.** Use the approved NutriServe master and real-world references only. Preserve the original output file. Copy accepted candidates into versioned repo filenames; never silently overwrite a reviewed revision.
5. **Inspect the actual file.** Measure dimensions, alpha, opaque-like area, visible bounds and foot anchor. The tool's RGB preview can show a halo in pixels whose alpha is zero. Judge edges after compositing on cream, saturated green, dark and checkerboard backgrounds. Do not erase hidden RGB by hand unless a real render defect is established.
6. **Render with neighbors.** Use `/nutriserve-art-lab.html`. Check the complete cast at 120/180/260px, then in the scene. Inspect cropped/occluded feet, outline weight, apparent age, face readability and visual consistency. Inspect phone and desktop widths. Avoid filtering/tinting a character to simulate another identity.
7. **Capture the review with REA.** Use a declared browser scenario to select characters, switch station and change the alpha background. Retain the complete Evidence record, screenshots, step outcomes, console findings and cleanup status. A successful capture is not an automatic aesthetic pass.
8. **Reject → target one defect → regenerate → rerender.** Each revision records failures and the corrective prompt. Do not propagate a failed style into the rest of the catalog. A sibling asset change triggers a family check, not a re-investigation of every unrelated subsystem.
9. **Promote deliberately.** Set `review.status` to `accepted-pilot-idle` only after visual inspection and technical checks. Record the Evidence ID. The production registry contains accepted files only; unfinished states remain listed explicitly, never aliased to an idle image.
10. **Integrate and verify.** Run asset integrity checks, focused typecheck, scoring tests when relevant, production build and a browser review of the actual consuming component. Re-capture only where the change or failure warrants it.

## Current delivery and limits

Six original transparent 1024 × 1536 PNG idle sprites: `arjun_fit`, `priya_balanced`, `rohan_light`, `maya_protein`, `vikram_lowsodium`, `ananya_breakfast`. Source RGBA interiors mostly have alpha 252–254; they render as visually solid. The validator deliberately uses an explicit opaque-like threshold of 245 and also records exact transparent-pixel counts. It never claims all interior pixels equal 255.

The runtime registry is `src/features/nutriserve/assets/characters.ts`; metadata/provenance is `public/assets/nutriserve/manifest.json`; shared rendering is `CustomerSprite.tsx`. The current game header uses these six sprites when their IDs appear; other customers keep their existing visuals. Happy/sad result art is **not** replaced by idle sprites. That mixed-style transition is a known pilot limitation until reaction states are delivered.

Sprite source files are approximately 1.1–1.2 MB each. This pass preserves the generated masters without lossy processing. Mobile delivery needs explicitly reviewed scaled/WebP derivatives before full-catalog expansion; keep anchors identical and compare composited derivatives to source. Do not ship 53 full-resolution masters in an eagerly loaded scene.

## Production queue and dependencies

| Family | Required work | Acceptance dependency |
|---|---|---|
| Pilot cast reactions | Happy, impatient, disappointed, taking-order poses for the six pilot IDs | Preserve identity, clothes, scale, foot anchor; do not paint emotions into UI text |
| Animation | Walk/enter/leave and small idle motion; separate parts or authored frames | Rig/pivot test, no sliding feet, reduced-motion mode; changing expressions must not stretch the face |
| Remaining cast | Reconcile every actual `CUSTOMER_CHARACTERS` ID on the branch being built | Unique silhouettes and full-state coverage; palette/age/body variation review |
| Vessel master | Steel katori in three sizes, back shell/front rim/food mask | Camera pitch, fill geometry and pointer target approved together |
| Food pilot | `rice_white`, `rice_brown`, `rice_red`, `chana_masala`, `palak_dal`, `rajma_masala`, `paneer_butter_masala`, `mixed_veg_curry`, `raita`, `roti`, `sprouts_salad`, `samosa` | Fixed camera and light; native-size identification; food IDs must exist in current main catalog |
| Food states | Portion/pour/prepared/garnish layers only where reachable by mechanics | Vessel masks and recipe adapter locked; prepared food nutrients counted once |
| Stations | Order background, build dispensers, four prep machines, finish shelves/tools | Placement contract and a NutriServe station UI review; no interactive text baked into images |
| UI | Ticket icons, tool cursors, meter face, stars, buttons, upgrade icons | Code-native geometry/text where practical; keyboard focus and large touch targets |
| Decor/progression | Shop props and placements for implemented upgrades | Only generate items reachable in the progression model |
| Audio | Original bowl/ladle/pour/counter Foley, UI cues, ambience, music | Provenance and source project, levels/loop checks; image generation does not create audio |

The TypeScript AST reconciliation of the exact current-main `FOOD_LIBRARY` and `CUSTOMER_CHARACTERS` initializers found **49 foods and 33 customers**, with six accepted idle sprites and 27 remaining idle identities. See `asset-roadmap.json` for every ID and status. Earlier 55-food/53-customer counts came from `old`. Re-run reconciliation when the catalog changes; a runtime registry must never silently claim planned IDs have accepted assets.

## Prompt family

The source prompts and per-character identities are retained in `asset-prompts.json` as a provenance record of how the pilot sprites were made (they used another game's screenshot as a style input and aimed at its proportions; new prompts must not, see Originality above). The constraints that carry over to new work are the technical and originality ones: a flat outlined cartoon in NutriServe's own proportions and face design, one hard-edged shadow at most, full-body left-facing idle, transparent padding, no realistic portrait/irises/texture/lighting.

For each later pose, pass the exact approved identity as the edit target and change only pose/expression. Asset IDs, states and dimensions are part of the contract. Claude should request a missing asset by ID/state and proceed with unrelated mechanics, rather than fabricate or recolor a substitute and mark it complete.
