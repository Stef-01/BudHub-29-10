# AI Studio Coding Guardrails for the Game

Goal: Let AI help us **add features fast** while **never breaking saved data or existing UX**.

**Non-negotiables**
- ✅ Backward compatible saves and content packs
- ✅ Zero data loss across app updates
- ✅ Feature-flagged rollouts + kill switches
- ✅ Tests + migrations shipped with every change
- ✅ Semantic versioning + changelog

**Repo map (reference)**
- /app            → front end (React Native or web)
- /engine         → game systems, rules, simulation
- /content        → content packs (JSON/SQLite/images) versioned + migratable
- /services       → APIs / cloud functions (if any)
- /shared         → schemas, types, utilities (single source of truth)
- /tests          → unit + integration + migration tests
- /AI_STUDIO      → prompts & instructions for agents


You are a Staff Engineer assigned to this game.

Absolute rules:
1) **Do not remove or rename** public exports, storage keys, JSON fields, DB columns, or route paths without providing a **backward-compatible adapter** and a **migration**.
2) **Never delete user data.** If a field is deprecated, keep reading it and map it to new fields until at least 2 minor releases have passed.
3) Every change ships with:
   - Unit tests + integration tests + migration tests
   - A feature flag (default OFF unless instructed otherwise)
   - A CHANGELOG entry and version bump (semver)
4) Produce output as: 
   - A short design note (what/why)
   - A patch (files with diffs or full files)
   - Tests
   - Migration script(s)
   - Rollback plan
5) Use the **shared schemas** (TypeScript types + JSON Schema) as the contract. If the schema changes, **bump version** and write **upgrade + downgrade** adapters.

Style:
- Small, composable components; single responsibility.
- No hardcoded colors/strings; use theme + i18n.
- Avoid deep prop drilling; use store selectors or context scoped to leaf.
- Keep public API surface stable; add not break.

Security/Privacy:
- No secrets in source. 
- Log only non-PII gameplay telemetry unless flagged otherwise.

Performance:
- Avoid O(n²) loops on every frame. Use memoization, pooling, batched updates.



# FEATURE REQUEST (fill and paste in AI Studio)

## Summary
Add: <feature name> (e.g., “Daily 3 micro-quests timeline”)

## User Story
As a <player persona>, I want <goal> so that <outcome>.

## Acceptance Criteria
- [ ] Works offline
- [ ] Backward compatible with save v{current}
- [ ] Feature-flag key: feature.<key>
- [ ] Telemetry: events added <list>
- [ ] Tests: unit, integration, migration

## Data / Contracts
Existing schema: /shared/schemas/savegame.v{current}.schema.json  
If schema must change → propose v{next} with **upgrade + downgrade** adapters.

## UI
Screens: <list>  
Figma/refs: <links or describe components>

## Non-Functional
Accessibility, performance, battery, error handling.

## Deliverables
- Code patch
- New/updated schemas + migrations
- Tests
- Changelog entry
- Rollback steps


# BUGFIX TEMPLATE

Bug: <title>  
Repro: <steps>  
Expected / Actual: <…>  
Logs/screens: <…>

Scope constraints:
- No breaking changes. 
- If a contract change is truly required, include migration + rollback and bump patch/minor accordingly.

Deliverables:
- Minimal fix patch
- Unit test reproducing bug (fails pre-fix, passes post-fix)
- Changelog patch note


# Component & Module Guidelines

## Planning & Structure
- **Purpose**: Each component/module does one thing.
- **Search first**: Reuse existing components before creating new.
- **Naming**: PascalCase for components (e.g., UserProfile), kebab-case for files if web, snake_case keys for storage only if already in use.
- **Directory**: Feature-based grouping; keep trees shallow.
- **Hierarchy**: Favor flat composition over deep nesting.

## Props & State
- Type every prop (TypeScript). No `any`.
- Use minimal props; pass callbacks not stores.
- Use store selectors or local state; avoid global writes in renders.

## Reusability
- No hardcoded values; use theme/tokens/config.
- Extract hooks for shared logic (`useTimer`, `useFeatureFlag`).

## Context
- Only for cross-cutting concerns (auth, theme, i18n, feature flags).
- Scope context narrowly; avoid app-wide singletons for UI state.

## Styling
- Respect theme tokens (light/dark). No inline hex.

## Accessibility
- Focus order, labels, hit target sizes, color contrast.



# State & Data Contracts

## Save Game Storage
- Format: JSON persisted to `savegame_v{N}.json`.
- Versioned via `meta.version`.
- Atomic writes: write to temp, fsync, then swap.
- Backups: keep last 2 versions.

## Content Packs
- Immutable bundles (images/levels/config) with their own `contentVersion`.
- Engine loads `contentAdapters` to bridge old packs.

## Single Source of Truth
- All contracts live in `/shared/schemas`.
- Every runtime encoder/decoder is generated from JSON Schema to avoid drift.

## Keys (do not rename)
- Storage key prefix: `game.<domain>.<name>` (e.g., `game.save.v3`).
- Analytics keys: kebab-case, documented in `/shared/telemetry.md`.

## Example: savegame
{
  "meta": { "version": 3, "createdAt": "...", "lastPlayedAt": "..." },
  "player": { "id": "uuid", "name": "string" },
  "progress": { "xp": 123, "level": 4, "unlocks": ["feat.daily3"] },
  "inventory": { "seeds": { "bean": 12, "okra": 4 } },
  "settings": { "difficulty": "normal", "a11y": { "textScale": 1.0 } }
}


# Migrations Playbook

## When schema changes
1. Create `/shared/schemas/savegame.v{next}.schema.json`.
2. Write `upgradeSave_v{curr}_to_v{next}(old: SaveV{curr}) => SaveV{next}`.
3. Write `downgradeSave_v{next}_to_v{curr}(new: SaveV{next}) => SaveV{curr}` (rollback).
4. Add migration test vectors: `/tests/migrations/save_v{curr}_sample.json`.
5. Bump loader: engine detects version and applies upgrade chain.
6. Preserve unknown fields under `_legacy` if needed.

## Data safety
- Perform dry-run (validate only) before write.
- Back up original file; only delete after successful validation.

## Example (TS pseudo)
export function upgrade3to4(s: SaveV3): SaveV4 {
  return {
    ...copyCommon(s),
    progress: { ...s.progress, streaks: s.progress.streaks ?? { daily:0, weekly:0 } },
    meta: { ...s.meta, version: 4 }
  };
}


# Feature Flags

- Key shape: `feature.<area>.<name>` e.g., `feature.quests.daily3`
- Default: OFF for new features; ENABLE in beta builds only.
- Flags stored in `settings.flags` and mirrored for server experiments if present.
- Every flagged block must include a fallback path.

Example:
if (useFlag('feature.quests.daily3')) { renderDaily3(); } else { renderLegacyTasks(); }

# Testing & Quality Gates

## Required with every PR
- Unit tests for new logic
- Integration test for user flows
- Migration tests (if schema changed)
- Snapshot for critical UI (stable props)
- Lint + typecheck passes
- Performance budget: frame time <16ms on target device for main screens

## Test matrix
- Fresh install
- Upgrade from (N-2) → (N)
- Corrupt save recovery (graceful)
- Offline mode

## Example commands
- `pnpm test`
- `pnpm test:migration`
- `pnpm build && pnpm perf:smoke`

# Versioning & Release

- **SemVer**: MAJOR.MINOR.PATCH
  - MAJOR: breaking runtime engine or content format (rare; requires migration toolkit)
  - MINOR: new features, flags, non-breaking schema additions
  - PATCH: fixes, perf, copy
- Each PR updates `/CHANGELOG.md` under "Unreleased".
- Release checklist:
  1) Bump version
  2) Freeze and sign content pack
  3) Run upgrade tests (N-2 → N)
  4) Enable flags for canary cohort
  5) Rollout staged (10% → 50% → 100%)
- Rollback: downgrade adapter + flag disable + revert tag.


# Security & Privacy

- No secrets in repo. Use env vaults for services.
- Telemetry: non-PII gameplay only (counts, durations).
- Data export & delete: one-tap export JSON + wipe, for compliance.
- Encryption at rest for saves if platform supports secure storage.
- Validate all content pack manifests before loading.

# Developer & AI Checklists

## New Component
- [ ] Purpose stated
- [ ] Props typed
- [ ] No hardcoded colors/strings
- [ ] Tests written
- [ ] Docs updated

## Change that touches data
- [ ] Schema bumped
- [ ] Upgrade + downgrade adapters
- [ ] Migration tests with sample saves
- [ ] Backups on write
- [ ] Changelog + semver bump

## Risky UI change
- [ ] Feature-flagged
- [ ] A11y pass
- [ ] Perf check
- [ ] Analytics updated


# PR Title: <feature/bug>: short description

## What & Why
<1–3 sentences>

## Screens / GIF
<attach>

## Flags
- Feature flag: `feature.<...>` (default OFF)

## Data
- Schema change? yes/no
- Migrations included? yes/no
- Test vectors added? yes/no

## Tests
<Unit> <Integration> <Migration> (commands + results)

## Risks & Rollback
<Risks> — Rollback: disable flag + apply downgrade adapter.

{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "savegame.v3.schema.json",
  "title": "SaveGame v3",
  "type": "object",
  "required": ["meta","player","progress","inventory","settings"],
  "properties": {
    "meta": {
      "type": "object",
      "required": ["version","createdAt","lastPlayedAt"],
      "properties": {
        "version": { "const": 3 },
        "createdAt": { "type": "string", "format": "date-time" },
        "lastPlayedAt": { "type": "string", "format": "date-time" }
      }
    },
    "player": { "type": "object", "required": ["id","name"], "properties": {
      "id": { "type": "string" }, "name": { "type": "string" }
    }},
    "progress": {
      "type": "object",
      "properties": {
        "xp": { "type": "integer", "minimum": 0 },
        "level": { "type": "integer", "minimum": 1 },
        "unlocks": { "type": "array", "items": { "type": "string" } },
        "streaks": { "type": "object", "properties": {
          "daily": { "type": "integer", "minimum": 0 },
          "weekly": { "type": "integer", "minimum": 0 }
        }, "additionalProperties": false }
      },
      "additionalProperties": false
    },
    "inventory": { "type": "object", "additionalProperties": true },
    "settings": { "type": "object", "properties": {
      "difficulty": { "enum": ["easy","normal","hard"] },
      "a11y": { "type": "object", "properties": { "textScale": { "type":"number","minimum":0.8,"maximum":1.6 }}, "additionalProperties": false }
    }, "additionalProperties": false }
  },
  "additionalProperties": false
}


# Changelog

## Unreleased
- 

## vX.Y.Z (YYYY-MM-DD)
### Added
- 
### Changed
- 
### Fixed
- 
### Migrations
- savegame vN→vN+1 adapter included
