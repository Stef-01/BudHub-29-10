#!/usr/bin/env python3
"""Port the NutriServe Kitchen remaster from claude/continue-building-j1mrs7 onto main.

Only the NutriServe work moves: the unrelated `old`-branch history (Cookventure, Upgradeplan, other
services) stays out of main, as docs/nutriserve/CLAUDE_BUILD_TRACK.md asks.

Safety:
- the main worktree must be clean (nothing of yours is reset away);
- the source is the named branch, and it must match its pushed copy (main never gets unpushed work);
- main records the source commit it was ported from (docs/nutriserve/PORT_SOURCE). Before porting,
  every ported file on main is compared with that commit: an edit made on main, or a file added on
  main, stops the port so it can be carried back to the branch first;
- files deleted on the branch are deleted on main;
- any failure rolls the worktree back to origin/main.

It does not commit: run the tests and the release gate on the result, then commit and push.

Usage: scripts/nutriserve-port-to-main.py <source repo> <main worktree> [--assume-source <commit>]
  (a main worktree: git worktree add <dir> origin/main, with node_modules linked in)
  --assume-source: the commit main was last ported from, for a main that has no PORT_SOURCE yet.
"""
import json
import re
import subprocess
import sys

SOURCE_REF = 'claude/continue-building-j1mrs7'
PORT_SOURCE = 'docs/nutriserve/PORT_SOURCE'
# Ported files that the port itself rewrites on main (their main copy never equals the source's).
REWRITTEN = {'docs/nutriserve/CLAUDE_STATUS.md', 'src/features/nutriserve/data/catalog.generated.ts', PORT_SOURCE}

args = sys.argv[1:]
assume = None
if '--assume-source' in args:
    i = args.index('--assume-source')
    assume = args[i + 1]
    del args[i:i + 2]
SRC, W = args


def sh(*cmd, cwd=W, check=True):
    return subprocess.run(cmd, cwd=cwd, check=check, text=True, capture_output=True).stdout


def fail(msg):
    raise SystemExit(f'port stopped: {msg}')


def patch(path, pairs, upgrades=()):
    """Apply (anchor, replacement) pairs once each. `upgrades` first turn an earlier port's text
    into the current replacement, so a re-run never inserts a second copy."""
    p = f'{W}/{path}'
    s = open(p).read()
    for old, new in upgrades:
        if old in s and new not in s:
            s = s.replace(old, new, 1)
    for a, b in pairs:
        if b in s:
            continue  # already applied by an earlier port
        if a not in s:
            fail(f'{path}: anchor not found: {a[:70]!r}')
        s = s.replace(a, b, 1)
    open(p, 'w').write(s)


def ported_paths(ref):
    tests = [t for t in sh('git', 'ls-tree', '-r', '--name-only', ref, 'tests', cwd=SRC).split() if re.match(r'tests/nutriserve-.*\.mjs$', t)]
    return [
        'src/features/nutriserve',
        *tests,
        'scripts/generate-nutriserve-catalog.mjs',
        'scripts/e2e/nutriserve-release-gate.cjs',
        'tsconfig.nutriserve-sim.json',
        'docs/nutriserve/CLAUDE_STATUS.md',
        'docs/nutriserve/build-track.csv',
        'docs/nutriserve/README.md',
    ]


def ported_files(ref, cwd):
    """Every file at `ref` that the port owns (whatever tests exist there, not only the source's)."""
    fixed = set(ported_paths(SOURCE_REF)[1:]) - {t for t in ported_paths(SOURCE_REF) if t.startswith('tests/')}
    return {
        f for f in sh('git', 'ls-tree', '-r', '--name-only', ref, cwd=cwd).split()
        if f.startswith('src/features/nutriserve/') or re.match(r'tests/nutriserve-.*\.mjs$', f) or f in fixed or f == PORT_SOURCE
    }


def blob(ref, path, cwd):
    r = subprocess.run(['git', 'rev-parse', '--verify', '--quiet', f'{ref}:{path}'], cwd=cwd, text=True, capture_output=True)
    return r.stdout.strip() or None


# 0. Preconditions.
if sh('git', 'status', '--porcelain'):
    fail(f'{W} has uncommitted changes; commit or discard them first')
sh('git', 'fetch', '--quiet', 'origin', 'main', SOURCE_REF, cwd=SRC)
source = sh('git', 'rev-parse', SOURCE_REF, cwd=SRC).strip()
pushed = sh('git', 'rev-parse', f'origin/{SOURCE_REF}', cwd=SRC).strip()
if source != pushed:
    fail(f'{SOURCE_REF} ({source[:8]}) differs from origin/{SOURCE_REF} ({pushed[:8]}); push it first')

try:
    # 1. Fresh main.
    sh('git', 'fetch', '--quiet', 'origin', 'main')
    sh('git', 'checkout', '--quiet', '--detach', 'origin/main')
    sh('git', 'reset', '--quiet', '--hard', 'origin/main')
    sh('git', 'clean', '-fdq', '-e', 'node_modules')

    # 2. Main-only work in the ported files stops the port.
    try:
        recorded = open(f'{W}/{PORT_SOURCE}').read().split()[0]
    except FileNotFoundError:
        recorded = assume
    paths = ported_paths(SOURCE_REF)
    on_main = ported_files('HEAD', W)
    if recorded:
        if subprocess.run(['git', 'cat-file', '-e', f'{recorded}^{{commit}}'], cwd=SRC, capture_output=True).returncode:
            fail(f'recorded source commit {recorded} is not in {SRC}')
        problems = []
        for f in sorted(on_main - REWRITTEN):
            then = blob(recorded, f, SRC)
            if then is None:
                problems.append(f'added on main: {f}')
            elif blob('HEAD', f, W) != then:
                problems.append(f'edited on main: {f}')
        if problems:
            fail('main has NutriServe changes the branch does not:\n  ' + '\n  '.join(problems))
    else:
        print('note: main has no PORT_SOURCE and no --assume-source was given; main-only edits are not checked this time')

    # 3. Files deleted on the branch are deleted on main.
    on_source = ported_files(SOURCE_REF, SRC)
    removed = sorted(f for f in on_main - on_source - REWRITTEN)
    for f in removed:
        sh('git', 'rm', '--quiet', f)

    # 4. The NutriServe files, as committed on the source branch.
    archive = subprocess.run(['git', 'archive', SOURCE_REF, *paths], cwd=SRC, check=True, capture_output=True).stdout
    subprocess.run(['tar', '-x', '-C', W], input=archive, check=True)

    # 5. Catalog source fixes (customers that required ids that don't exist), on main's own file.
    p = f'{W}/services/nutriserveCharacters.ts'
    s = open(p).read()
    s = s.replace("required_items: ['brown_rice']", "required_items: ['rice_brown']").replace("required_items: ['red_rice']", "required_items: ['rice_red']")
    open(p, 'w').write(s)

    # 6. package.json scripts.
    p = f'{W}/package.json'
    pkg = json.load(open(p))
    pkg['scripts'].update({
        'test:nutriserve': 'node --experimental-strip-types --test tests/nutriserve-*.test.mjs',
        'catalog:nutriserve-sim': 'node scripts/generate-nutriserve-catalog.mjs',
        'typecheck:nutriserve-sim': 'tsc -p tsconfig.nutriserve-sim.json --noEmit',
        'e2e:nutriserve': 'node scripts/e2e/nutriserve-release-gate.cjs',
    })
    open(p, 'w').write(json.dumps(pkg, indent=2) + '\n')

    # 7. App shell (main's own files; small, explicit edits).
    patch('types.ts', [(
        "export type GameMode = 'diabetic_friendly' | 'high_protein' | 'high_fiber' | 'low_carb' | 'nutriserve' | 'unified_nutrient';",
        "export type GameMode = 'diabetic_friendly' | 'high_protein' | 'high_fiber' | 'low_carb' | 'nutriserve' | 'unified_nutrient' | 'nutriserve_remaster';",
    )])
    patch('components/GameScreen.tsx', [(
        "    nutriserve: 'NutriServe Chef',",
        "    nutriserve: 'NutriServe Chef',\n    nutriserve_remaster: 'NutriServe Kitchen',",
    )])
    SAVE_OLD = "      scoresCtx.saveScore('nutriserve_remaster', averageScore);\n"
    SAVE_NEW = (
        "      // A failed score save (offline, storage full) must not break the day summary.\n"
        "      Promise.resolve(scoresCtx.saveScore('nutriserve_remaster', averageScore)).catch(() => {});\n"
    )
    patch('App.tsx', [
        ("import React, { useState, useMemo } from 'react';", "import React, { useState, useMemo, useCallback, Suspense, lazy } from 'react';"),
        ("import { useGameScores } from './contexts/GameScoresContext';", "import { useGameScores } from './contexts/GameScoresContext';\nimport { useGamification } from './contexts/GamificationContext';"),
        ("import UnifiedNutrientGame from './components/UnifiedNutrientGame';",
         "import UnifiedNutrientGame from './components/UnifiedNutrientGame';\n"
         "// Loaded on demand so the remaster's code isn't in the main bundle.\n"
         "const NutriServeRemaster = lazy(() => import('./src/features/nutriserve/ui/NutriServeRemaster.tsx'));\n"
         "/** The remaster keeps its saves per browser (this app has no signed-in user id). */\n"
         "const REMASTER_PLAYER = 'local';"),
        ("  const scoresCtx = useGameScores();\n",
         "  const scoresCtx = useGameScores();\n  const { addXp } = useGamification();\n"),
        ("  const handleExitGame = () => {\n    setActiveGame(null);\n  };\n",
         "  const handleExitGame = () => {\n    setActiveGame(null);\n  };\n\n"
         "  // The remaster reports each finished day once (guarded by a ledger outside its save). XP scales\n"
         "  // with the day's average score; a day of empty katoris earns none.\n"
         "  const handleRemasterDay = useCallback(\n"
         "    ({ averageScore, xpTier }: { day: number; averageScore: number; xpTier: 'Low' | 'Medium' | 'High' | null }) => {\n"
         + SAVE_NEW +
         "      if (xpTier) addXp(xpTier, 'add');\n"
         "    },\n"
         "    [scoresCtx, addXp]\n"
         "  );\n"),
        ("    if (activeGame === 'unified_nutrient') {",
         "    if (activeGame === 'nutriserve_remaster') {\n"
         "      return (\n"
         "        <Suspense fallback={<LoadingScreen />}>\n"
         "          <NutriServeRemaster userId={REMASTER_PLAYER} onExit={handleExitGame} onDayComplete={handleRemasterDay} />\n"
         "        </Suspense>\n"
         "      );\n"
         "    }\n"
         "    if (activeGame === 'unified_nutrient') {"),
    ], upgrades=[(SAVE_OLD, SAVE_NEW)])
    patch('components/GamesView.tsx', [
        ("            nutriserve: getHighScoresByMode('nutriserve')[0]?.score || 0,",
         "            nutriserve: getHighScoresByMode('nutriserve')[0]?.score || 0,\n            nutriserve_remaster: getHighScoresByMode('nutriserve_remaster')[0]?.score || 0,"),
        ("""                <a href="/nutriserve-art-lab.html\"""",
         """                <div className="mt-4">
                    <GameCard
                        gameMode="nutriserve_remaster"
                        title="NutriServe Kitchen (preview)"
                        description="Run a four-station kitchen: take orders, build each katori, simmer it in a handi, finish it with a drizzle and garnish, and serve the right ticket."
                        icon={<ZapIcon className="h-8 w-8 text-orange-700" />}
                        highScore={highScores.nutriserve_remaster}
                        onPlay={onPlay}
                    />
                </div>
                <a href="/nutriserve-art-lab.html\""""),
    ])

    # 8. Regenerate the simulation catalog from main's catalog sources.
    print(sh('node', 'scripts/generate-nutriserve-catalog.mjs').strip())

    # 9. The status doc's head, for main (fixed wording: it reads the same on every re-port).
    p = f'{W}/docs/nutriserve/CLAUDE_STATUS.md'
    s = open(p).read()
    head_end = s.index('## Task status')
    s = (
        '# Claude engineering track: status\n\n'
        'This is the NutriServe Kitchen remaster on `main`. It was developed on `claude/continue-building-j1mrs7` and ported here without that '
        "branch's unrelated `old` history, as the build track asks; `docs/nutriserve/PORT_SOURCE` names the branch commit it came from. "
        'Ported as is: `src/features/nutriserve/`, `tests/nutriserve-*`, the catalog generator and release gate in `scripts/`, '
        '`tsconfig.nutriserve-sim.json` and this folder\'s status, README and build track. Adapted for `main`: a small entry in the app shell '
        '(`App.tsx`, `types.ts`, `components/GameScreen.tsx`, `components/GamesView.tsx`), four scripts in `package.json`, and '
        '`services/nutriserveCharacters.ts`, where customers that required foods that do not exist (`brown_rice`, `red_rice`) now require '
        '`rice_brown` and `rice_red`. The simulation catalog is regenerated from `main`\'s own catalog sources. On `main` the remaster keeps '
        'saves per browser, because this app has no signed-in user id.\n\n'
    ) + s[head_end:]
    # The branch's count of corrected customers is the branch's own; main's differs.
    s = re.sub(r'Catalog validation \(found and fixed \w+ customers requiring nonexistent ids\)',
               'Catalog validation (customers requiring nonexistent ids are corrected; see the note at the top)', s)
    open(p, 'w').write(s)
    open(f'{W}/{PORT_SOURCE}', 'w').write(f'{source}\n')

    counts = sh('node', '--experimental-strip-types', '-e',
                "import('./src/features/nutriserve/data/catalog.generated.ts').then(m=>console.log(m.CATALOG_FOODS.length+' foods, '+m.CATALOG_CUSTOMERS.length+' customers'))").strip()
    print(f'ported {SOURCE_REF} {source[:8]}; catalog {counts}; removed {len(removed)} file(s){": " + ", ".join(removed) if removed else ""}')
except BaseException:
    # Leave main as it was.
    subprocess.run(['git', 'reset', '--quiet', '--hard', 'origin/main'], cwd=W)
    subprocess.run(['git', 'clean', '-fdq', '-e', 'node_modules'], cwd=W)
    print('rolled back to origin/main', file=sys.stderr)
    raise
