#!/usr/bin/env python3
"""Port the NutriServe Kitchen remaster from claude/continue-building-j1mrs7 onto main.

Only the NutriServe work moves: the unrelated `old`-branch history (Cookventure, Upgradeplan, other
services) stays out of main, as docs/nutriserve/CLAUDE_BUILD_TRACK.md asks.

Safety:
- the main worktree must be clean (nothing of yours is reset away), and a branch checked out there
  must not have commits that origin/main lacks (they would be left behind);
- the source is the named branch, and it must match its pushed copy (main never gets unpushed work);
  the commit checked is the commit ported;
- main records the source commit it was ported from (docs/nutriserve/PORT_SOURCE). Before porting,
  every ported file on main is compared with that commit: an edit, an added file or a deleted file
  on main (and an edit to the body of the status doc) stops the port so it can be carried back to
  the branch first;
- the app-shell patches stop when main has changed the NutriServe entry they would insert, rather
  than inserting a second copy;
- files deleted on the branch are deleted on main;
- any failure, Ctrl-C or SIGTERM/SIGHUP (a closed terminal, a killed job) puts the worktree back as
  it was (the same branch or commit checked out, clean). A signal never kills a git command half way
  (that would leave .git/index.lock behind and the worktree half changed): the command that is
  running finishes, then the port stops and rolls back. The rollback checks every step and says
  plainly when it could not finish, with what to run.

It does not commit: run the tests and the release gate on the result, then commit and push.

Usage: scripts/nutriserve-port-to-main.py <source repo> <main worktree> [--assume-source <commit>]
       scripts/nutriserve-port-to-main.py --self-test   (checks the union editing on sample text)
  (a main worktree: git worktree add <dir> origin/main, with node_modules linked in)
  --assume-source: the commit main was last ported from, for a main that has no PORT_SOURCE yet.
"""
import json
import os
import re
import signal
import subprocess
import sys

SOURCE_REF = 'claude/continue-building-j1mrs7'
PORT_SOURCE = 'docs/nutriserve/PORT_SOURCE'
# Ported files that the port itself rewrites on main (their main copy never equals the source's).
REWRITTEN = {'docs/nutriserve/CLAUDE_STATUS.md', 'src/features/nutriserve/data/catalog.generated.ts', PORT_SOURCE}

args = sys.argv[1:]
SELF_TEST = args == ['--self-test']
if SELF_TEST:
    args = ['.', '.']
assume = None
if '--assume-source' in args:
    i = args.index('--assume-source')
    assume = args[i + 1]
    del args[i:i + 2]
SRC, W = args


# Signals received while the port runs (see _interrupted).
STOP = []


class Interrupted(Exception):
    pass


def checkpoint():
    """Stop here if a signal arrived (between commands, never during one)."""
    if STOP:
        raise Interrupted(f'signal {STOP[0]}')


def run(cmd, check=False, **kw):
    """subprocess.run, then stop if a signal arrived while it ran (before judging its exit code:
    a terminal's Ctrl-C reaches the running command too, which then fails)."""
    r = subprocess.run(cmd, **kw)
    checkpoint()
    if check and r.returncode:
        err = r.stderr if isinstance(r.stderr, str) else (r.stderr or b'').decode(errors='replace')
        raise SystemExit(f'port stopped: {" ".join(map(str, cmd))[:120]} failed (exit {r.returncode}): {err.strip()[:300]}')
    return r


def sh(*cmd, cwd=W, check=True):
    r = run(cmd, cwd=cwd, text=True, capture_output=True)
    if check and r.returncode:
        raise SystemExit(f'port stopped: {" ".join(cmd)[:120]} failed: {r.stderr.strip()[:300]}')
    return r.stdout


def fail(msg):
    raise SystemExit(f'port stopped: {msg}')


def union_with(text, type_name, value, members_only=False):
    """`text` with the string literal `value` added to the union type alias `type_name` (None when
    the alias isn't there; `text` unchanged when the member is already in it). Reads the file as
    code: a declaration or member inside a comment, string, template or regex doesn't count; the
    union may span lines in either pipe style (`| 'a'` at line starts or `'a' |` at line ends) or
    end without a ';'; a ';' or line break inside brackets (an object type, a generic spread over
    lines) doesn't end it; only the union's own members count (a literal inside `Exclude<..>` or
    `{ kind: .. }` is not one; one inside plain parentheses is). The new member uses the union's
    own quotes, layout and line endings. `members_only`: the union's members instead (a list)."""
    n = len(text)
    WORD = re.compile(r'[A-Za-z_$\d][\w$]*')
    REGEX_AFTER = set('(,=:[!&|?{};+-*%<>~^') | {'=>'}
    REGEX_WORDS = {'return', 'typeof', 'case', 'do', 'else', 'in', 'of', 'new', 'delete', 'void', 'throw', 'yield', 'await', 'instanceof'}

    def skip_string(i):
        q, j = text[i], i + 1
        while j < n and text[j] != q and text[j] != '\n':
            j += 2 if text[j] == '\\' else 1
        return min(j + 1, n)

    def skip_code_until_brace(i):
        """Index just past the '}' that closes a template's `${`, starting inside it."""
        depth = 0
        while i < n:
            c = text[i]
            if text.startswith('//', i):
                j = text.find('\n', i)
                i = n if j < 0 else j
            elif text.startswith('/*', i):
                j = text.find('*/', i + 2)
                i = n if j < 0 else j + 2
            elif c in '\'"':
                i = skip_string(i)
            elif c == '`':
                i = skip_template(i)
            elif c == '{':
                depth += 1
                i += 1
            elif c == '}':
                if depth == 0:
                    return i + 1
                depth -= 1
                i += 1
            else:
                i += 1
        return n

    def skip_template(i):
        j = i + 1
        while j < n and text[j] != '`':
            if text[j] == '\\':
                j += 2
            elif text.startswith('${', j):
                j = skip_code_until_brace(j + 2)
            else:
                j += 1
        return min(j + 1, n)

    def tokens(i, prev=None):
        """(kind, start, end) from i: kinds ws, nl (a line break, or a comment holding one),
        comment, str, tpl, regex, word, punct. `prev` is the last significant token's text."""
        while i < n:
            c = text[i]
            if c == '\n':
                yield 'nl', i, i + 1
                i += 1
            elif c in ' \t\r\f\v﻿ ':
                yield 'ws', i, i + 1
                i += 1
            elif text.startswith('//', i):
                j = text.find('\n', i)
                j = n if j < 0 else j
                yield 'comment', i, j
                i = j
            elif text.startswith('/*', i):
                j = text.find('*/', i + 2)
                j = n if j < 0 else j + 2
                yield ('nl' if '\n' in text[i:j] else 'comment'), i, j
                i = j
            elif c in '\'"':
                j = skip_string(i)
                yield 'str', i, j
                prev, i = 'str', j
            elif c == '`':
                j = skip_template(i)
                yield 'tpl', i, j
                prev, i = 'tpl', j
            elif c == '/' and (prev is None or prev in REGEX_AFTER or prev in REGEX_WORDS):
                j, in_class = i + 1, False
                while j < n and text[j] != '\n':
                    if text[j] == '\\':
                        j += 2
                        continue
                    if text[j] == '[':
                        in_class = True
                    elif text[j] == ']':
                        in_class = False
                    elif text[j] == '/' and not in_class:
                        break
                    j += 1
                if j < n and text[j] == '/':
                    j += 1
                    while j < n and (text[j].isalnum() or text[j] == '_'):
                        j += 1
                    yield 'regex', i, j
                    prev, i = 'regex', j
                else:
                    yield 'punct', i, i + 1
                    prev, i = '/', i + 1
            else:
                m = WORD.match(text, i)
                if m:
                    yield 'word', i, m.end()
                    prev, i = m.group(), m.end()
                else:
                    j = i + 2 if text.startswith('=>', i) else i + 1
                    yield 'punct', i, j
                    prev, i = text[i:j], j

    # The declaration: `export type <name> =` in code.
    code = [t for t in tokens(0) if t[0] not in ('ws', 'nl', 'comment')]
    after = None
    for k in range(len(code) - 3):
        words = [text[s:e] for _, s, e in code[k:k + 4]]
        if words == ['export', 'type', type_name, '='] and code[k + 2][0] == 'word':
            after = code[k + 3][2]
            break
    if after is None:
        return None

    # The union's tokens, each with the brackets around it, up to where the alias ends.
    expr, stack, line_break = [], [], False
    for kind, s, e in tokens(after, '='):
        if kind in ('ws', 'comment'):
            continue
        if kind == 'nl':
            line_break = line_break or (not stack and bool(expr))
            continue
        t = text[s:e]
        if line_break:
            line_break = False
            # Without a ';' the alias ends at a line break, unless a '|' or '&' on either side continues it.
            if expr[-1][3] not in ('|', '&') and t not in ('|', '&'):
                break
        if kind == 'punct' and t == ';' and not stack:
            break
        if kind == 'punct' and t in ')]}>':
            if not stack:
                break
            stack.pop()
        expr.append((kind, s, e, t, tuple(stack)))
        if kind == 'punct' and t in '([{<':
            stack.append(t)
    if not expr:
        return None

    # A union wrapped in one pair of parentheses: its members are inside them.
    level, inner = 0, expr
    if expr[0][3] == '(':
        close = next((k for k in range(1, len(expr)) if expr[k][3] == ')' and expr[k][4] == ()), None)
        if close == len(expr) - 1 and close > 1:
            level, inner = 1, expr[1:-1]

    def literal(tok):
        kind, s, e, t, around = tok
        if any(b != '(' for b in around[level:]):
            return None  # inside a generic, object or tuple: not a member of this union
        if kind == 'str' or (kind == 'tpl' and '${' not in t):
            return t[1:-1]
        return None

    members = [v for v in map(literal, inner) if v is not None]
    if members_only:
        return members
    if value in members:
        return text
    quotes = [tok[3][0] for tok in inner if tok[0] == 'str' and literal(tok) is not None]
    q = quotes[0] if quotes else "'"

    # Layout: pipes at the union's own level that start a line (leading style) or end one (trailing).
    def line_start(i):
        return text.rfind('\n', 0, i) + 1

    def indent_at(i):
        ls = line_start(i)
        return text[ls:ls + len(text[ls:]) - len(text[ls:].lstrip(' \t'))]

    leading, trailing, last_pipe = [], [], None
    for k, tok in enumerate(inner):
        if tok[0] == 'punct' and tok[3] == '|' and len(tok[4]) == level:
            last_pipe = k
            before = inner[k - 1][2] if k else (expr[0][2] if level else after)
            nxt = inner[k + 1][1] if k + 1 < len(inner) else n
            if '\n' in text[before:tok[1]]:
                leading.append(tok)
            elif '\n' in text[tok[2]:nxt]:
                trailing.append(tok)
    region = text[after:expr[-1][2]]
    nl = '\r\n' if '\r\n' in region else '\n'
    pos = inner[-1][2]
    if leading or trailing:
        # After any comment that ends the last member's line (but before a ';' or ')' on it).
        following = next((s for kind, s, e in tokens(pos) if kind not in ('ws', 'comment')), n)
        line_end = text.find('\n', pos)
        if line_end >= 0 and following >= line_end:
            pos = line_end - 1 if text[line_end - 1] == '\r' else line_end
            while pos > inner[-1][2] and text[pos - 1] in ' \t':
                pos -= 1
    if leading:
        insert = f'{nl}{indent_at(leading[-1][1])}| {q}{value}{q}'
    elif trailing:
        first_of_last = inner[last_pipe + 1][1] if last_pipe is not None and last_pipe + 1 < len(inner) else inner[-1][1]
        insert = f' |{nl}{indent_at(first_of_last)}{q}{value}{q}'
    else:
        insert = f' | {q}{value}{q}'
    return text[:pos] + insert + text[pos:]


def add_to_union(path, type_name, value):
    """Add the string literal `value` to a TypeScript union type alias, wherever main has put the
    other members (an unrelated new mode on main must not stop the port). The edit is read back:
    the union must now have `value` and still parse the same everywhere else."""
    p = f'{W}/{path}'
    s = open(p, newline='').read()
    out = union_with(s, type_name, value)
    if out is None:
        fail(f'{path}: type {type_name} not found')
    if out == s:
        return
    if union_with(out, type_name, value, members_only=True) != union_with(s, type_name, value, members_only=True) + [value]:
        fail(f'{path}: could not add {value!r} to {type_name} cleanly; add it by hand')
    open(p, 'w', newline='').write(out)


def _interrupted(signum, _frame):
    # Remember the signal and let the command that is running finish: killing git half way leaves
    # .git/index.lock and a half-changed worktree that the rollback can't repair. The port stops at
    # the next checkpoint (after every command) and rolls back.
    STOP.append(signum)


for _sig in (signal.SIGINT, signal.SIGTERM, signal.SIGHUP):
    signal.signal(_sig, _interrupted)


def _uncaught(kind, value, tb):
    # A signal during the checks before step 1 stops the port before it has changed anything.
    if issubclass(kind, Interrupted):
        print(f'port stopped before changing anything ({value})', file=sys.stderr)
        sys.stderr.flush()
        os._exit(130)
    sys.__excepthook__(kind, value, tb)


sys.excepthook = _uncaught


def patch(path, pairs, upgrades=()):
    """Apply (anchor, replacement, marker) triples once each. `upgrades` first turn an earlier
    port's text into the current replacement, so a re-run never inserts a second copy. `marker` is
    text only the NutriServe insert contains: when the replacement isn't there but the marker is,
    main has edited the insert, and inserting again would add a second copy, so the port stops."""
    p = f'{W}/{path}'
    s = open(p).read()
    for old, new in upgrades:
        if old in s and new not in s:
            s = s.replace(old, new, 1)
    for a, b, marker in pairs:
        if b in s:
            continue  # already applied by an earlier port
        if marker in s:
            fail(f'{path}: main has changed the NutriServe entry ({marker!r}); carry that change into this script first')
        if a not in s:
            fail(f'{path}: anchor not found: {a[:70]!r}')
        s = s.replace(a, b, 1)
    open(p, 'w').write(s)


STATUS_DOC = 'docs/nutriserve/CLAUDE_STATUS.md'
C06_COUNT = re.compile(r'Catalog validation \(found and fixed \w+ customers requiring nonexistent ids\)')
C06_MAIN = 'Catalog validation (customers requiring nonexistent ids are corrected; see the note at the top)'


def status_body(text):
    """The status doc as main shows it, below the head the port writes."""
    return C06_COUNT.sub(C06_MAIN, text[text.index('## Task status'):])


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
        'docs/nutriserve/CLAUDE_BUILD_TRACK.md',
        'docs/nutriserve/ASSET_WORKFLOW.md',
        'docs/nutriserve/REA_FINDINGS.md',
        'docs/nutriserve/asset-prompts.json',
        'docs/nutriserve/evidence-index.json',
        'public/assets/nutriserve/manifest.json',
    ]


def ported_files(ref, cwd):
    """Every file at `ref` that the port owns (whatever tests exist there, not only the source's)."""
    fixed = set(ported_paths(SOURCE_REF)[1:]) - {t for t in ported_paths(SOURCE_REF) if t.startswith('tests/')}
    return {
        f for f in sh('git', 'ls-tree', '-r', '--name-only', ref, cwd=cwd).split()
        if f.startswith('src/features/nutriserve/') or re.match(r'tests/nutriserve-.*\.mjs$', f) or f in fixed or f == PORT_SOURCE
    }


_trees = {}


def blob(ref, path, cwd):
    """A file's mode and content id at `ref` (None when absent), so a mode change counts as an edit."""
    key = (ref, cwd)
    if key not in _trees:
        tree = {}
        for line in sh('git', 'ls-tree', '-r', '--full-tree', ref, cwd=cwd).splitlines():
            meta, name = line.split('\t', 1)
            mode, _kind, sha = meta.split()
            tree[name] = f'{mode} {sha}'
        _trees[key] = tree
    return _trees[key].get(path)


if SELF_TEST:
    cases = [
        ("export type M = 'a' | 'b';", "export type M = 'a' | 'b' | 'x';"),
        ("export type M = 'a' | 'x' | 'b';", None),
        ('export type M = "a" | "b";', 'export type M = "a" | "b" | "x";'),
        ('export type M = "a" | "x";', None),
        ("export type M =\n  | 'a'\n  | 'b';\n", "export type M =\n  | 'a'\n  | 'b'\n  | 'x';\n"),
        ("export type M =\n  | 'a'\n  // | 'x' (paused)\n  | 'b';", "export type M =\n  | 'a'\n  // | 'x' (paused)\n  | 'b'\n  | 'x';"),
        ("export type M =\n  | 'a' // keep; used\n  | 'b';", "export type M =\n  | 'a' // keep; used\n  | 'b'\n  | 'x';"),
        ("export type M = 'a' /* p; q */ | 'b';", "export type M = 'a' /* p; q */ | 'b' | 'x';"),
        ("export type M = 'a' /* | 'x' */ | 'b';", "export type M = 'a' /* | 'x' */ | 'b' | 'x';"),
        ("export type M = 'a' | 'b' /* last */;", "export type M = 'a' | 'b' | 'x' /* last */;"),
        ("export type M =\n  | 'a'\n  | 'b'\n\nexport const y = 1;", "export type M =\n  | 'a'\n  | 'b'\n  | 'x'\n\nexport const y = 1;"),
        ("export type M = 'a' | 'b' // note\nexport const y = 1;", "export type M = 'a' | 'b' | 'x' // note\nexport const y = 1;"),
        ("export type M =\n  | 'a'\n  /* gap */\n  | 'b'\nconst z = 2;", "export type M =\n  | 'a'\n  /* gap */\n  | 'b'\n  | 'x'\nconst z = 2;"),
        # Audit 14: trailing pipes, declarations in comments/strings/templates/regexes, generics,
        # template literal types, parentheses, CRLF, object members, nested functions.
        ("export type M = 'a' |\n  'b' |\n  'c';\nexport const y = 1;\n", "export type M = 'a' |\n  'b' |\n  'c' |\n  'x';\nexport const y = 1;\n"),
        ("export type M = 'a' |\n  'b'\nexport const y = 1;\n", "export type M = 'a' |\n  'b' |\n  'x'\nexport const y = 1;\n"),
        ("// export type M = 'old';\nexport type M = 'a' | 'b';\n", "// export type M = 'old';\nexport type M = 'a' | 'b' | 'x';\n"),
        ("/** Was: export type M = 'x' | 'y'; */\nexport type M = 'a' | 'b';\n", "/** Was: export type M = 'x' | 'y'; */\nexport type M = 'a' | 'b' | 'x';\n"),
        ("const DOC = \"export type M = 'a';\";\nexport type M = 'a' | 'b';\n", "const DOC = \"export type M = 'a';\";\nexport type M = 'a' | 'b' | 'x';\n"),
        ("const T = `export type M = ${'a'}`;\nexport type M = 'a';\n", "const T = `export type M = ${'a'}`;\nexport type M = 'a' | 'x';\n"),
        ("const R = /'export type M = 'a'/;\nexport type M = 'a';\n", "const R = /'export type M = 'a'/;\nexport type M = 'a' | 'x';\n"),
        ("export type M = Exclude<All, 'x'> | 'a';\n", "export type M = Exclude<All, 'x'> | 'a' | 'x';\n"),
        ("export type M =\n  | 'a'\n  | Exclude<\n      All,\n      'legacy'\n    >;\n", "export type M =\n  | 'a'\n  | Exclude<\n      All,\n      'legacy'\n    >\n  | 'x';\n"),
        ("export type M = `m_${string}` | 'a';\n", "export type M = `m_${string}` | 'a' | 'x';\n"),
        ("export type M = `x` | 'a';\n", None),
        ("export type M = (\n  | 'a'\n  | ('b' | 'c')\n);\n", "export type M = (\n  | 'a'\n  | ('b' | 'c')\n  | 'x'\n);\n"),
        ("export type M = 'a' | ('b' | 'x');\n", None),
        ("export type M =\r\n  | 'a'\r\n  | 'b';\r\nexport const y = 1;\r\n", "export type M =\r\n  | 'a'\r\n  | 'b'\r\n  | 'x';\r\nexport const y = 1;\r\n"),
        ("export type M = 'a' | 'b'\r\nexport const y = 1;\r\n", "export type M = 'a' | 'b' | 'x'\r\nexport const y = 1;\r\n"),
        ("export type M = 'a' | { kind: 'b; c' };\n", "export type M = 'a' | { kind: 'b; c' } | 'x';\n"),
        ("export type M = 'a' | { kind: 'x' };\n", "export type M = 'a' | { kind: 'x' } | 'x';\n"),
        ("export type M = 'it\\'s' | 'a';\n", "export type M = 'it\\'s' | 'a' | 'x';\n"),
        ("export type M =\n  | 'a'\n  | 'b' // last one\nexport const y = 1;\n", "export type M =\n  | 'a'\n  | 'b' // last one\n  | 'x'\nexport const y = 1;\n"),
        ("export type M = 'a'\n  | 'b';\n", "export type M = 'a'\n  | 'b'\n  | 'x';\n"),
        ("export type M = 'a' | (() => 'b');\n", "export type M = 'a' | (() => 'b') | 'x';\n"),
    ]
    bad = 0
    for text, want in cases:
        got = union_with(text, 'M', 'x')
        if got != (text if want is None else want):
            bad += 1
            print(f'FAIL {text!r}\n  got  {got!r}\n  want {(text if want is None else want)!r}')
        elif want is not None and union_with(got, 'M', 'x', members_only=True) != union_with(text, 'M', 'x', members_only=True) + ['x']:
            bad += 1
            print(f'FAIL (members) {text!r}')
    missing = ["export type N = 'a';", "// export type M = 'a';\n", "const s = \"export type M = 'a'\";"]
    for text in missing:
        if union_with(text, 'M', 'x') is not None:
            bad += 1
            print(f'FAIL: a missing type should give None: {text!r}')
    total = len(cases) + len(missing)
    print(f'union self-test: {total - bad}/{total} pass')
    sys.exit(1 if bad else 0)

# 0. Preconditions (nothing here changes the worktree).
_lock = os.path.join(W, sh('git', 'rev-parse', '--git-path', 'index.lock').strip())
if os.path.exists(_lock):
    fail(f'{_lock} exists: another git command is running in {W}, or one was stopped half way. '
         'Remove it once nothing runs there, then port again')
if sh('git', 'status', '--porcelain'):
    fail(f'{W} has uncommitted changes; commit or discard them first')
sh('git', 'fetch', '--quiet', 'origin', 'main', SOURCE_REF, cwd=SRC)
source = sh('git', 'rev-parse', SOURCE_REF, cwd=SRC).strip()
pushed = sh('git', 'rev-parse', f'origin/{SOURCE_REF}', cwd=SRC).strip()
if source != pushed:
    behind = run(['git', 'merge-base', '--is-ancestor', source, pushed], cwd=SRC).returncode == 0
    fail(f'{SOURCE_REF} ({source[:8]}) differs from origin/{SOURCE_REF} ({pushed[:8]}); '
         + ('it is behind: pull it first' if behind else 'push it first'))
sh('git', 'fetch', '--quiet', 'origin', 'main')
orig_commit = sh('git', 'rev-parse', 'HEAD').strip()
orig_branch = sh('git', 'symbolic-ref', '--quiet', '--short', 'HEAD', check=False).strip() or None
if orig_branch:
    ahead = sh('git', 'rev-list', '--count', 'origin/main..HEAD').strip()
    if ahead != '0':
        fail(f'{W} has {orig_branch} checked out with {ahead} commit(s) that origin/main lacks; push or move them first')

try:
    # 1. Fresh main (detached first, so no local branch is ever moved).
    sh('git', 'checkout', '--quiet', '--detach', 'origin/main')
    sh('git', 'reset', '--quiet', '--hard', 'origin/main')
    sh('git', 'clean', '-fdq', '-e', 'node_modules')

    # 2. Main-only work in the ported files stops the port.
    try:
        words = open(f'{W}/{PORT_SOURCE}').read().split()
        if not words:
            fail(f'{PORT_SOURCE} on main is empty; restore it (or pass --assume-source)')
        recorded = words[0]
    except FileNotFoundError:
        recorded = assume
    paths = ported_paths(source)
    on_main = ported_files('HEAD', W)
    if recorded:
        if run(['git', 'cat-file', '-e', f'{recorded}^{{commit}}'], cwd=SRC, capture_output=True).returncode:
            fail(f'recorded source commit {recorded} is not in {SRC}')
        problems = []
        for f in sorted(on_main - REWRITTEN):
            then = blob(recorded, f, SRC)
            if then is None:
                problems.append(f'added on main: {f}')
            elif blob('HEAD', f, W) != then:
                problems.append(f'edited on main: {f}')
        for f in sorted(ported_files(recorded, SRC) - on_main - REWRITTEN):
            problems.append(f'deleted on main: {f}')
        # The status doc is rewritten (its head), but its body must match what was ported.
        if STATUS_DOC in on_main and blob(recorded, STATUS_DOC, SRC):
            then = sh('git', 'show', f'{recorded}:{STATUS_DOC}', cwd=SRC)
            now = open(f'{W}/{STATUS_DOC}').read()
            if status_body(now) != status_body(then):
                problems.append(f'edited on main (below its head): {STATUS_DOC}')
        if problems:
            fail('main has NutriServe changes the branch does not:\n  ' + '\n  '.join(problems))
    else:
        print('note: main has no PORT_SOURCE and no --assume-source was given; main-only edits are not checked this time')

    # 3. Files deleted on the branch are deleted on main.
    on_source = ported_files(source, SRC)
    removed = sorted(f for f in on_main - on_source - REWRITTEN)
    for f in removed:
        sh('git', 'rm', '--quiet', f)

    # 4. The NutriServe files, as committed on the source branch.
    present = [p for p in paths if p in on_source or any(f.startswith(p + '/') for f in on_source)]
    archive = run(['git', 'archive', source, *present], cwd=SRC, check=True, capture_output=True).stdout
    run(['tar', '-x', '-C', W], input=archive, check=True)

    # 5. Catalog source fixes (customers that required ids that don't exist), on main's own file.
    checkpoint()
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
    checkpoint()
    add_to_union('types.ts', 'GameMode', 'nutriserve_remaster')
    patch('components/GameScreen.tsx', [(
        "    nutriserve: 'NutriServe Chef',",
        "    nutriserve: 'NutriServe Chef',\n    nutriserve_remaster: 'NutriServe Kitchen',",
        "nutriserve_remaster:",
    )])
    SAVE_OLD = "      scoresCtx.saveScore('nutriserve_remaster', averageScore);\n"
    SAVE_NEW = (
        "      // A failed score save (offline, storage full) must not break the day summary.\n"
        "      Promise.resolve(scoresCtx.saveScore('nutriserve_remaster', averageScore)).catch(() => {});\n"
    )
    patch('App.tsx', [
        ("import React, { useState, useMemo } from 'react';", "import React, { useState, useMemo, useCallback, Suspense, lazy } from 'react';", "Suspense, lazy"),
        ("import { useGameScores } from './contexts/GameScoresContext';", "import { useGameScores } from './contexts/GameScoresContext';\nimport { useGamification } from './contexts/GamificationContext';",
         "useGamification }"),
        ("import UnifiedNutrientGame from './components/UnifiedNutrientGame';",
         "import UnifiedNutrientGame from './components/UnifiedNutrientGame';\n"
         "// Loaded on demand so the remaster's code isn't in the main bundle.\n"
         "const NutriServeRemaster = lazy(() => import('./src/features/nutriserve/ui/NutriServeRemaster.tsx'));\n"
         "/** The remaster keeps its saves per browser (this app has no signed-in user id). */\n"
         "const REMASTER_PLAYER = 'local';",
         "const NutriServeRemaster"),
        ("  const scoresCtx = useGameScores();\n",
         "  const scoresCtx = useGameScores();\n  const { addXp } = useGamification();\n",
         "useGamification()"),
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
         "  );\n",
         "handleRemasterDay"),
        ("    if (activeGame === 'unified_nutrient') {",
         "    if (activeGame === 'nutriserve_remaster') {\n"
         "      return (\n"
         "        <Suspense fallback={<LoadingScreen />}>\n"
         "          <NutriServeRemaster userId={REMASTER_PLAYER} onExit={handleExitGame} onDayComplete={handleRemasterDay} />\n"
         "        </Suspense>\n"
         "      );\n"
         "    }\n"
         "    if (activeGame === 'unified_nutrient') {",
         "activeGame === 'nutriserve_remaster'"),
    ], upgrades=[(SAVE_OLD, SAVE_NEW)])
    patch('components/GamesView.tsx', [
        ("            nutriserve: getHighScoresByMode('nutriserve')[0]?.score || 0,",
         "            nutriserve: getHighScoresByMode('nutriserve')[0]?.score || 0,\n            nutriserve_remaster: getHighScoresByMode('nutriserve_remaster')[0]?.score || 0,",
         "nutriserve_remaster: getHighScoresByMode"),
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
                <a href="/nutriserve-art-lab.html\"""",
         'gameMode="nutriserve_remaster"'),
    ])

    # 8. Regenerate the simulation catalog from main's catalog sources.
    print(sh('node', 'scripts/generate-nutriserve-catalog.mjs').strip())

    # 9. The status doc's head, for main (fixed wording: it reads the same on every re-port).
    checkpoint()
    p = f'{W}/{STATUS_DOC}'
    s = open(p).read()
    head_end = s.index('## Task status')
    s = (
        '# Claude engineering track: status\n\n'
        'This is the NutriServe Kitchen remaster on `main`. It was developed on `claude/continue-building-j1mrs7` and ported here without that '
        "branch's unrelated `old` history, as the build track asks; `docs/nutriserve/PORT_SOURCE` names the branch commit it came from. "
        'Ported as is: `src/features/nutriserve/`, `tests/nutriserve-*`, the catalog generator and release gate in `scripts/`, '
        '`tsconfig.nutriserve-sim.json` and this folder\'s status, README, build track (CSV and handoff), asset workflow, and the historical reference and prompt records, and the asset manifest of the pilot sprites (`public/assets/nutriserve/manifest.json`). Adapted for `main`: a small entry in the app shell '
        '(`App.tsx`, `types.ts`, `components/GameScreen.tsx`, `components/GamesView.tsx`), four scripts in `package.json`, and '
        '`services/nutriserveCharacters.ts`, where customers that required foods that do not exist (`brown_rice`, `red_rice`) now require '
        '`rice_brown` and `rice_red`. The simulation catalog is regenerated from `main`\'s own catalog sources. On `main` the remaster keeps '
        'saves per browser, because this app has no signed-in user id.\n\n'
    ) + status_body(s)  # the branch's count of corrected customers is the branch's own; main's differs
    open(p, 'w').write(s)
    open(f'{W}/{PORT_SOURCE}', 'w').write(f'{source}\n')

    counts = sh('node', '--experimental-strip-types', '-e',
                "import('./src/features/nutriserve/data/catalog.generated.ts').then(m=>console.log(m.CATALOG_FOODS.length+' foods, '+m.CATALOG_CUSTOMERS.length+' customers'))").strip()
    checkpoint()
    print(f'ported {SOURCE_REF} {source[:8]}; catalog {counts}; removed {len(removed)} file(s){": " + ", ".join(removed) if removed else ""}')
except BaseException as error:
    # Put the worktree back as it was: the same branch (never moved) or commit, clean. Signals are
    # ignored from here on (git commands started now inherit that), so nothing interrupts it.
    for _sig in (signal.SIGINT, signal.SIGTERM, signal.SIGHUP):
        signal.signal(_sig, signal.SIG_IGN)
    target = orig_branch or orig_commit[:8]
    steps = [
        ['git', 'checkout', '--quiet', '--force', orig_branch or '--detach', *([] if orig_branch else [orig_commit])],
        ['git', 'reset', '--quiet', '--hard', 'HEAD'],
        ['git', 'clean', '-fdq', '-e', 'node_modules'],
    ]
    problems = []
    for cmd in steps:
        r = subprocess.run(cmd, cwd=W, text=True, capture_output=True)
        if r.returncode:
            problems.append(f'{" ".join(cmd)}: {r.stderr.strip()[:200]}')
    head = subprocess.run(['git', 'rev-parse', 'HEAD'], cwd=W, text=True, capture_output=True).stdout.strip()
    branch = subprocess.run(['git', 'symbolic-ref', '--quiet', '--short', 'HEAD'], cwd=W, text=True, capture_output=True).stdout.strip() or None
    dirty = subprocess.run(['git', 'status', '--porcelain'], cwd=W, text=True, capture_output=True).stdout.strip()
    if head != orig_commit or branch != orig_branch:
        problems.append(f'HEAD is {head[:8] or "?"} ({branch or "detached"}), not {target}')
    if dirty:
        problems.append(f'{len(dirty.splitlines())} file(s) still changed')
    if problems:
        why = error if isinstance(error, Interrupted) else (error.code if isinstance(error, SystemExit) else repr(error))
        print(f'{why}', file=sys.stderr)
        print(f'ROLLBACK INCOMPLETE in {W}:\n  ' + '\n  '.join(problems)
              + f'\nCheck that no other git command is running there, then: git -C {W} checkout --force {target}'
              + f' && git -C {W} reset --hard && git -C {W} clean -fd -e node_modules', file=sys.stderr)
        sys.exit(2)
    print(f'rolled back to {target}', file=sys.stderr)
    if isinstance(error, Interrupted):
        sys.exit(130)
    raise
