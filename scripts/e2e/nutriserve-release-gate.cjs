// NutriServe Kitchen release gate (C08), driven through the real UI with Playwright.
//
//   npm run dev                                   # in one terminal
//   node scripts/e2e/nutriserve-release-gate.cjs [baseUrl] [outDir]
//
// For desktop (1280px), a wide desktop (1920px) and a phone (iPhone 13, played with real touch
// events) it plays one whole day: two concurrent orders, Save &
// exit mid-prep then Continue (progress must survive), one dish served to the wrong ticket, the rest
// served normally, then the day summary. It also records sprite download/decoded-memory costs, and
// first runs regression checks for the second and third audits (held controls across a layout
// switch, click-only and quick-tap input on hold controls, phone swipes scrolling instead of
// pouring, dialog focus and shortcuts, and keeping progress from a rejected save).
// Requires the `playwright` package and a Chromium it can launch. Exit code 1 on any failed check.
const { chromium, devices } = require('playwright');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const BASE = process.argv[2] || 'http://localhost:5173';
const OUT = process.argv[3] || fs.mkdtempSync(path.join(os.tmpdir(), 'nutriserve-gate-'));
fs.mkdirSync(OUT, { recursive: true });
const RATES = { base: 80, main: 90, side: 50 }; // grams per second while held (BUILD_V1)
const IGNORE = /TUNNEL|Failed to fetch|Failed to load resource|supabase|priceService|marketService|resourcesService|gameProgressService|GameScoresContext/i;

const checks = [];
const check = (ok, what) => {
  checks.push({ ok: !!ok, what });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${what}`);
};

const HOLD_DELAY_MS = 120; // touch: a press becomes a hold after this long without moving

async function runDevice(browser, name, contextOptions, { touch = false } = {}) {
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  const cdp = touch ? await context.newCDPSession(page) : null;
  const touchAt = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && !IGNORE.test(m.text()) && errors.push(m.text()));
  const sprites = new Map();
  page.on('response', async (r) => {
    if (r.url().includes('/assets/nutriserve/characters/')) {
      const body = await r.body().catch(() => null);
      if (body) sprites.set(r.url(), body.length);
    }
  });

  const user = `gate-${name}-${Date.now()}`;
  await page.goto(`${BASE}/?user=${user}`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Games' }).first().click();
  await page.getByRole('button', { name: 'Play NutriServe Kitchen (preview)' }).click();
  await page.getByRole('button', { name: 'New game' }).click();

  const station = (label) => page.getByRole('button', { name: new RegExp(`^${label} station`) }).click();
  // A held press: real touch on the phone (the hold starts HOLD_DELAY_MS after contact), mouse elsewhere.
  const hold = async (locator, ms) => {
    await locator.scrollIntoViewIfNeeded();
    const b = await locator.boundingBox();
    const [x, y] = [b.x + b.width / 2, b.y + b.height / 2];
    if (touch) {
      await touchAt('touchStart', x, y);
      await page.waitForTimeout(ms + HOLD_DELAY_MS);
      await touchAt('touchEnd', x, y);
    } else {
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.waitForTimeout(ms);
      await page.mouse.up();
    }
    await page.waitForTimeout(120);
  };
  const ticketParts = async () =>
    page.locator('.ns-ticket').evaluate((el) => ({
      number: el.querySelector('.ns-ticket-number').textContent.trim(),
      foods: [...el.querySelectorAll('.ns-ticket-foods li')].map((li) => li.textContent.trim()),
      steps: [...el.querySelectorAll('.ns-ticket-finish li')].map((li) => li.textContent.trim()),
      prep: [...el.querySelectorAll('span')].map((s) => s.textContent.trim()).find((t) => /SIMMER|SLOW|QUICK/.test(t)),
    }));
  const selectTicket = (number) => page.locator('.ns-rail-ticket', { hasText: number }).first().click();

  async function takeOrder() {
    await station('Order');
    const btn = page.getByRole('button', { name: /^Take .* order$/ });
    await btn.waitFor({ timeout: 90_000 });
    await btn.click();
  }

  async function build(ticket) {
    await selectTicket(ticket.number);
    await station('Build');
    await page.locator('.ns-btn-suggested').click();
    for (const [i, comp] of ['base', 'main', 'side'].entries()) {
      const food = ticket.foods[i];
      const button = page.getByRole('button', { name: `Hold to add ${food} as ${comp}` });
      const label = comp[0].toUpperCase() + comp.slice(1);
      for (let tries = 0; tries < 6; tries++) {
        const text = await page.locator('.ns-gauges').innerText();
        const m = text.match(new RegExp(`${label} (\\d+) g / (\\d+) g`));
        const [have, want] = m ? [Number(m[1]), Number(m[2])] : [0, 0];
        if (m && have >= want - 3) break;
        await hold(button, Math.max(60, Math.round(((want - have) / RATES[comp]) * 1000) - 50));
      }
    }
    await page.getByRole('button', { name: 'Send to prep →' }).click();
  }

  async function startPrep() {
    await station('Prep');
    await page.locator('.ns-tray button').first().click();
  }

  // Doneness units (prep-v4 on: ms on the flame), from the slot's progress meter.
  const slotUnits = async (n) => {
    const meter = page.getByRole('meter', { name: `Slot ${n} progress` });
    if (!(await meter.count())) return null;
    const v = await meter.getAttribute('aria-valuenow');
    return v === null ? null : Number(v);
  };

  async function finishPrep(n, target) {
    await station('Prep');
    for (let i = 0; i < 500; i++) {
      const u = await slotUnits(n);
      if (u === null || u >= target - 150) break;
      await page.waitForTimeout(60);
    }
    await page.getByRole('region', { name: `Prep slot ${n}` }).getByRole('button', { name: 'Done' }).click();
  }

  async function finishDish(ticket) {
    await station('Finish');
    const vessel = page.locator('.ns-vessel-top');
    for (const step of ticket.steps) {
      const m = step.match(/^(.*) ×(\d+)$/);
      await page.getByRole('button', { name: m ? m[1] : step, exact: true }).click();
      await vessel.scrollIntoViewIfNeeded();
      const v = await vessel.boundingBox();
      const cx = v.x + v.width / 2;
      const cy = v.y + v.height / 2;
      const r = (v.width / 2) * 0.62;
      const point = (a, rr) => [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
      if (!m) {
        // Drizzle: press, (on touch) keep still until the hold starts, then swirl.
        if (touch) {
          await touchAt('touchStart', cx, cy);
          await page.waitForTimeout(HOLD_DELAY_MS + 60);
        } else {
          await page.mouse.move(cx, cy);
          await page.mouse.down();
        }
        for (let a = 0; a < 36; a++) {
          const [x, y] = point(a * 0.7, r * (0.25 + 0.75 * ((a % 9) / 9)));
          if (touch) await touchAt('touchMove', x, y);
          else await page.mouse.move(x, y);
          await page.waitForTimeout(30);
        }
        if (touch) await touchAt('touchEnd', cx, cy);
        else await page.mouse.up();
      } else {
        for (let i = 0; i < Number(m[2]); i++) {
          const [x, y] = point((i / Number(m[2])) * 2 * Math.PI, r * 0.8);
          if (touch) {
            await touchAt('touchStart', x, y);
            await touchAt('touchEnd', x, y);
          } else await page.mouse.click(x, y);
          await page.waitForTimeout(40);
        }
      }
    }
    await page.getByRole('button', { name: 'Done', exact: true }).click();
  }

  async function serveTo(number) {
    await station('Finish');
    await page.locator('.ns-serve button', { hasText: number }).first().click();
    await page.waitForTimeout(300);
    return page.locator('.ns-lastserve').first().innerText();
  }

  const targetFor = (prep) => (/QUICK/.test(prep) ? 8500 : /SLOW/.test(prep) ? 21200 : 12600); // prep-v9 marks (ms on the flame)

  // 1. Two concurrent orders cooking in two slots.
  await takeOrder();
  const t1 = await ticketParts();
  await build(t1);
  await startPrep();
  await takeOrder();
  await selectTicket('#2');
  const t2 = await ticketParts();
  await build(t2);
  await startPrep();
  const open = await page.locator('.ns-rail-ticket').count();
  check(open === 2, `${name}: two concurrent open tickets (${open})`);
  await station('Prep');
  const busy = await page.getByRole('button', { name: /^Hold to boost slot/ }).count();
  check(busy === 2, `${name}: two prep slots cooking (${busy})`);
  // Each slot is guided by its own dish's ticket, whichever ticket the rail has selected.
  const want = (prep) => (/QUICK/.test(prep) ? 'Quick' : /SLOW/.test(prep) ? 'Slow' : 'Simmer');
  const slotText = async (n) => (await page.getByRole('region', { name: `Prep slot ${n}` }).innerText()).replace(/\s+/g, ' ');
  const [s1, s2] = [await slotText(1), await slotText(2)];
  check(s1.includes(`#1 wants ${want(t1.prep)}`) && s2.includes(`#2 wants ${want(t2.prep)}`), `${name}: each prep slot shows its own dish's target`);
  await page.screenshot({ path: path.join(OUT, `${name}-concurrent.png`), fullPage: true });

  // 2. Save & exit mid-prep, then continue.
  const before = await slotUnits(2);
  await page.getByRole('button', { name: 'Save & exit' }).click();
  await page.getByRole('button', { name: 'Play NutriServe Kitchen (preview)' }).click();
  await page.getByRole('button', { name: /^Continue day 1$/ }).click();
  await station('Prep');
  const after = await slotUnits(2);
  check(after !== null && before !== null && after >= before, `${name}: prep survives Save & exit (${before} -> ${after})`);

  // 3. Finish both; serve dish 2 to ticket #1 (wrong), then remake for #2.
  await finishPrep(1, targetFor(t1.prep));
  await finishPrep(2, targetFor(t2.prep));
  await selectTicket('#1');
  await finishDish(t1);
  await selectTicket('#2');
  await finishDish(t2);
  await station('Finish');
  await page.locator('.ns-tray button', { hasText: /·/ }).last().click(); // select the second ready dish
  const sameOrder = t1.foods.join() === t2.foods.join();
  const toast = await serveTo('#1');
  check(sameOrder || /not what this ticket ordered/.test(toast), `${name}: wrong-ticket serve is flagged`);
  await page.screenshot({ path: path.join(OUT, `${name}-wrong-ticket.png`), fullPage: true });
  await serveTo('#2'); // the remaining ready dish (built for #1) goes to #2

  // 4. Everyone else, until the day summary.
  for (let guard = 0; guard < 8; guard++) {
    if (await page.getByRole('dialog', { name: /Day 1 summary/ }).count()) break;
    const counter = page.getByRole('button', { name: /^Take .* order$/ });
    await station('Order');
    try {
      await counter.waitFor({ timeout: 60_000 });
    } catch {
      break;
    }
    await counter.click();
    const t = await ticketParts();
    await build(t);
    await startPrep();
    const slot = Number(await page.locator('.ns-prep-unit:has(.ns-btn-boost) h3').first().innerText());
    await finishPrep(slot, targetFor(t.prep));
    await finishDish(t);
    await serveTo(t.number);
  }
  const summary = page.getByRole('dialog', { name: /Day 1 summary/ });
  await summary.waitFor({ timeout: 30_000 }).catch(() => {});
  check((await summary.count()) === 1, `${name}: day summary reached`);
  await page.screenshot({ path: path.join(OUT, `${name}-summary.png`), fullPage: true });

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  // Stage text must follow the stage, not the window (a 1920 px window once made it 36 px).
  const stageFont = await page.evaluate(() => {
    const st = document.querySelector('.ns-stage');
    return parseFloat(getComputedStyle(st).fontSize) / st.getBoundingClientRect().width;
  });
  check(Math.abs(stageFont - 0.019) < 0.001, `${name}: stage text is 1.9% of the stage width (${(stageFont * 100).toFixed(2)}%)`);
  check(overflow <= 0, `${name}: no horizontal scroll (${overflow}px)`);
  check(errors.length === 0, `${name}: no app errors${errors.length ? `: ${errors.slice(0, 3).join(' | ')}` : ''}`);

  const bytes = [...sprites.values()].reduce((a, b) => a + b, 0);
  const decodedMB = (sprites.size * 1024 * 1536 * 4) / 1e6;
  console.log(`${name}: ${sprites.size} sprite files, ${(bytes / 1e6).toFixed(2)} MB downloaded, ~${decodedMB.toFixed(1)} MB decoded RGBA`);
  await context.close();
  return { sprites: sprites.size, bytes, decodedMB };
}

// Regression checks for the second audit's renderer findings. Game states are built in the page
// with the real simulation module (served by the dev server) and stored as the player's save.
async function runRegressions(browser) {
  const context = await browser.newContext({ viewport: { width: 1000, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && !IGNORE.test(m.text()) && errors.push(m.text()));
  await page.goto(`${BASE}/?user=gate-regress-${Date.now()}`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Games' }).first().click();
  const open = () => page.getByRole('button', { name: 'Play NutriServe Kitchen (preview)' }).click();
  await open();
  await page.getByRole('button', { name: 'New game' }).click();
  await page.getByRole('button', { name: 'Save & exit' }).click();
  const key = await page.evaluate(() => Object.keys(localStorage).find((k) => k.startsWith('nutriserve.remaster.save.v1:')));
  check(!!key, `regressions: save key found (${key})`);

  /** Store a save built in the page: a dish prepped and waiting at the finish station. */
  const storeFinishSave = (tweak) =>
    page.evaluate(
      async ({ key, tweak }) => {
        const sim = await import('/src/features/nutriserve/simulation/index.ts');
        const run = (s, c) => {
          const r = sim.applyCommand(s, c);
          if (!r.result.ok) throw new Error(`${c.type}: ${r.result.error}`);
          return r.state;
        };
        let s = sim.createGame({ seed: 42, runId: 'run-gate-regress' });
        while (!s.day.customers.some((c) => c.phase === 'at_counter')) s = sim.advanceGame(s, 100);
        s = run(s, { type: 'takeOrder' });
        const o = s.tickets[0].order;
        s = run(s, { type: 'startDish', size: o.size });
        const dishId = s.dishes[0].id;
        const rate = { base: 80, main: 90, side: 50 };
        for (const [component, foodId] of [['base', o.baseId], ['main', o.mainId], ['side', o.sideId]]) {
          s = run(s, { type: 'beginPour', dishId, component, foodId });
          s = sim.advanceGame(s, Math.round((o.idealG[component] * 1000) / rate[component]));
          s = run(s, { type: 'endPour' });
        }
        s = run(s, { type: 'finishBuild', dishId });
        s = run(s, { type: 'startPrep', dishId, slot: 0 });
        s = sim.advanceGame(s, 12000);
        s = run(s, { type: 'finishPrep', slot: 0 });
        s = run(s, { type: 'selectStation', station: 'finish' });
        const file = JSON.parse(sim.serializeGame(s));
        if (tweak === 'rules-changed') {
          file.state.paramVersions.finish = 'finish-v0';
          Object.assign(file.state.profile, { rank: 3, coins: 41, points: 120, creditedDays: [1, 2], reportedDays: [1, 2] });
        }
        localStorage.setItem(key, JSON.stringify(file));
      },
      { key, tweak }
    );

  // 1. A drizzle held while the layout switches (wide -> compact) is released.
  await storeFinishSave();
  await open();
  await page.getByRole('button', { name: /^Continue day/ }).click();
  await page.getByRole('button', { name: 'Curd swirl', exact: true }).click(); // no tool is picked by default
  const vessel = page.locator('.ns-vessel-top');
  const v = await vessel.boundingBox();
  await page.mouse.move(v.x + v.width / 2, v.y + v.height / 2);
  await page.mouse.down();
  await page.mouse.move(v.x + v.width / 2 + 10, v.y + v.height / 2);
  const drizzling = await page.getByRole('button', { name: 'Done', exact: true }).isDisabled();
  await page.setViewportSize({ width: 500, height: 900 });
  await page.waitForTimeout(300);
  await page.mouse.up();
  await page.waitForTimeout(300);
  const released = await page.getByRole('button', { name: 'Done', exact: true }).isEnabled();
  check(drizzling && released, `regressions: drizzle released across a layout switch (held ${drizzling}, released ${released})`);
  await page.setViewportSize({ width: 1000, height: 900 });

  // 1b. A garnish press held across the same switch is forgotten: each later click places one piece.
  await page.getByRole('button', { name: 'Save & exit' }).click();
  await storeFinishSave();
  await open();
  await page.getByRole('button', { name: /^Continue day/ }).click();
  await page.getByRole('button', { name: 'Coriander', exact: true }).click();
  const gv = await page.locator('.ns-vessel-top').boundingBox();
  await page.mouse.move(gv.x + gv.width * 0.8, gv.y + gv.height * 0.5);
  await page.mouse.down();
  await page.setViewportSize({ width: 500, height: 900 });
  await page.waitForTimeout(400);
  await page.mouse.up();
  await page.waitForTimeout(200);
  const pieces = async () => {
    await page.getByRole('button', { name: 'Save & exit' }).click();
    const n = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).state.dishes.find((d) => d.stage === 'prepped' || d.stage === 'finishing').finish.garnishes.length, key);
    await open();
    await page.getByRole('button', { name: /^Continue day/ }).click();
    return n;
  };
  const piecesBefore = await pieces();
  await page.getByRole('button', { name: 'Coriander', exact: true }).click();
  const gvc = page.locator('.ns-vessel-top');
  await gvc.scrollIntoViewIfNeeded();
  const gb = await gvc.boundingBox();
  for (const [fx, fy] of [[0.5, 0.3], [0.3, 0.5], [0.5, 0.7]]) {
    await page.mouse.click(gb.x + gb.width * fx, gb.y + gb.height * fy);
    await page.waitForTimeout(150);
  }
  const piecesAfter = await pieces();
  check(piecesAfter - piecesBefore === 3, `regressions: after a garnish press cut off by a layout switch, every click places a piece (${piecesBefore} -> ${piecesAfter})`);
  await page.setViewportSize({ width: 1000, height: 900 });

  // 2. Click-only input (switch access, screen readers): one click starts the pour, the next stops
  //    it. A quick real mouse click pours the minimum (9 g of a main), not nothing.
  await page.getByRole('button', { name: /^Build station/ }).click();
  await page.getByRole('button', { name: 'Medium', exact: true }).click();
  const dispenser = page.getByRole('button', { name: /^Hold to add .* as main$/ }).first();
  const mainGrams = async () => Number(((await page.locator('.ns-gauges').innerText()).match(/Main (\d+) g/) || [])[1]);
  await dispenser.evaluate((el) => el.click());
  const latched = await dispenser.getAttribute('aria-pressed');
  await page.waitForTimeout(400);
  await dispenser.evaluate((el) => el.click());
  const afterLatch = await mainGrams();
  await page.waitForTimeout(300);
  const stopped = (await mainGrams()) === afterLatch;
  check(latched === 'true' && afterLatch >= 20 && stopped, `regressions: click starts and a second click stops a pour (${afterLatch} g, stopped ${stopped})`);
  await dispenser.click();
  await page.waitForTimeout(150);
  const afterTap = await mainGrams();
  check(afterTap - afterLatch === 9, `regressions: a quick mouse click pours the 9 g minimum (+${afterTap - afterLatch} g)`);

  // 3. The pause dialog keeps focus, resumes on Escape, and gives focus back.
  const tab = page.getByRole('button', { name: /^Prep station/ });
  await tab.focus();
  await page.keyboard.press('p');
  const dialog = page.getByRole('dialog', { name: 'Paused' });
  await dialog.waitFor();
  let inside = true;
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press(i % 2 ? 'Shift+Tab' : 'Tab');
    await page.keyboard.press('Tab');
    inside = inside && (await page.evaluate(() => !!document.activeElement?.closest('.ns-overlay')));
  }
  await page.keyboard.press('1'); // must not switch station behind the dialog
  const stationBehind = await page.locator('.ns-stage').getAttribute('aria-label');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);
  const closed = (await dialog.count()) === 0;
  const refocused = await page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? '');
  check(inside, 'regressions: Tab stays inside the pause dialog');
  check(stationBehind === 'build station', `regressions: station keys do nothing behind a dialog (${stationBehind})`);
  check(closed && /^Prep station/.test(refocused), `regressions: Escape resumes and focus returns (${refocused})`);

  // 4. A save that can't be restored says why and keeps the progress.
  await page.getByRole('button', { name: 'Save & exit' }).click();
  await storeFinishSave('rules-changed');
  await open();
  const alert = await page.getByRole('alert').innerText();
  check(/rules were updated/.test(alert) && /rank 3, 41 coins/.test(alert), 'regressions: rejected save explains itself and offers progress');
  await page.getByRole('button', { name: 'Start a new day with your progress' }).click();
  const hud = await page.locator('.ns-hud').innerText();
  check(/Day 3/.test(hud) && /Rank 3/.test(hud) && /41 coins/.test(hud), `regressions: progress carried into a new day (${hud.replace(/\s+/g, ' ').slice(0, 50)})`);

  // 5. Click-only input can finish a whole order: a bare click places a garnish at the next spot
  //    and runs an automatic swirl for the ordered amount of drizzle. "Why?" lists every reason.
  await page.getByRole('button', { name: 'Save & exit' }).click();
  await storeFinishSave();
  await open();
  await page.getByRole('button', { name: /^Continue day/ }).click();
  const steps = await page.locator('.ns-ticket-finish li').allInnerTexts();
  const clickVessel = () => page.locator('.ns-vessel-top').evaluate((el) => el.click());
  for (const step of steps) {
    const m = step.trim().match(/^(.*) ×(\d+)$/);
    if (/^No finish$/.test(step.trim())) continue;
    await page.getByRole('button', { name: m ? m[1] : step.trim(), exact: true }).click();
    if (m) for (let i = 0; i < Number(m[2]); i++) await clickVessel();
    else {
      await clickVessel();
      await page.waitForTimeout(2600); // the automatic swirl pours the ordered amount (about 1.7 s)
      await clickVessel(); // a second click must not pour it all again (it is already at the target)
      await page.waitForTimeout(600);
    }
  }
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await page.locator('.ns-serve button').first().click();
  await page.waitForTimeout(300);
  const bar = await page.locator('.ns-lastserve').first().innerText();
  check(!/No (Curd|Ghee)|Missing|Too much/.test(bar), `regressions: click-only input finishes the order, once (${bar.replace(/\s+/g, ' ').slice(0, 90)})`);
  const why = page.getByRole('button', { name: 'Why?' });
  if (await why.count()) {
    await why.click();
    const items = await page.locator('.ns-why-panel li').count();
    await page.keyboard.press('Escape');
    const closed = (await page.locator('.ns-why-panel').count()) === 0;
    check(items > 0 && closed, `regressions: Why? lists every reason (${items}) and Escape closes it`);
  }

  // The Why? panel never sits over a dialog.
  if (await why.count()) {
    await why.click();
    await page.keyboard.press('p');
    await page.getByRole('dialog', { name: 'Paused' }).waitFor();
    const panelUnderDialog = (await page.locator('.ns-why-panel').count()) === 0;
    await page.keyboard.press('Escape');
    check(panelUnderDialog, 'regressions: pausing closes the Why? panel');
  }

  // A long mouse drizzle (any length) is the player's own: never topped up by the click-only swirl.
  await page.getByRole('button', { name: 'Save & exit' }).click();
  await storeFinishSave();
  await open();
  await page.getByRole('button', { name: /^Continue day/ }).click();
  await page.getByRole('button', { name: 'Curd swirl', exact: true }).click();
  const vb = await page.locator('.ns-vessel-top').boundingBox();
  const [vx, vy] = [vb.x + vb.width / 2, vb.y + vb.height / 2];
  await page.mouse.move(vx, vy);
  await page.mouse.down();
  for (let i = 0; i < 8; i++) {
    await page.mouse.move(vx + 30 * Math.cos(i), vy + 30 * Math.sin(i));
    await page.waitForTimeout(100);
  }
  await page.mouse.up();
  await page.waitForTimeout(2500);
  const said = (await page.locator('[role=status]').allInnerTexts()).join(' | ');
  check(!/Drizzling|done:|already at its/.test(said), `regressions: a long mouse drizzle is not mistaken for a click-only one (${said.slice(0, 60)})`);

  // 6. A short laptop window keeps the station tabs on screen; a shorter one puts the controls
  //    beside the scene.
  await page.setViewportSize({ width: 1366, height: 657 });
  await page.waitForTimeout(300);
  const tabsBottom = await page.evaluate(() => document.querySelector('.ns-tabs').getBoundingClientRect().bottom + scrollY);
  check(tabsBottom <= 657, `regressions: station tabs fit a 1366x657 window (bottom ${Math.round(tabsBottom)} px)`);
  await page.setViewportSize({ width: 1280, height: 600 });
  await page.waitForTimeout(300);
  const side = await page.evaluate(() => {
    const root = document.querySelector('.ns-root');
    return { side: root.classList.contains('ns-side-dock'), tabs: document.querySelector('.ns-tabs').getBoundingClientRect().bottom + scrollY };
  });
  check(side.side && side.tabs <= 600, `regressions: a 1280x600 window puts the controls beside the scene (tabs end at ${Math.round(side.tabs)} px)`);
  // The narrowest side-by-side window: every tab label fits inside its tab.
  await page.setViewportSize({ width: 560, height: 400 });
  await page.waitForTimeout(300);
  const narrow = await page.evaluate(() => ({
    side: document.querySelector('.ns-root').classList.contains('ns-side-dock'),
    fit: [...document.querySelectorAll('.ns-tab')].map((t) => {
      const cs = getComputedStyle(t);
      const inner = t.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      return [Math.ceil(Math.max(...[...t.querySelectorAll('span, small')].map((c) => c.getBoundingClientRect().width))), Math.floor(inner)];
    }),
  }));
  check(narrow.side && narrow.fit.every(([w, room]) => w <= room), `regressions: side by side at 560 px every tab label fits (${narrow.fit.map(([w, r]) => `${w}/${r}`).join(' ')})`);

  check(errors.length === 0, `regressions: no app errors${errors.length ? `: ${errors.slice(0, 3).join(' | ')}` : ''}`);
  await context.close();

  // 5. Phone touch: a swipe that starts on a dispenser scrolls the page and pours nothing; a quick
  //    tap pours the minimum.
  const phone = await browser.newContext({ ...devices['iPhone 13'] });
  const p = await phone.newPage();
  await p.goto(`${BASE}/?user=gate-touch-${Date.now()}`, { waitUntil: 'networkidle' });
  await p.getByRole('button', { name: 'Games' }).first().click();
  await p.getByRole('button', { name: 'Play NutriServe Kitchen (preview)' }).click();
  await p.getByRole('button', { name: 'New game' }).click();
  await p.getByRole('button', { name: /^Build station/ }).click();
  await p.getByRole('button', { name: 'Medium', exact: true }).click();
  const cdp = await phone.newCDPSession(p);
  const target = p.getByRole('button', { name: /^Hold to add .* as main$/ }).first();
  // The dispensers now start on the first screen, so the swipe goes up (the page scrolls down).
  await target.scrollIntoViewIfNeeded();
  await p.waitForTimeout(200);
  const tb = await target.boundingBox();
  const grams = async () => Number(((await p.locator('.ns-gauges').innerText()).match(/Main (\d+) g/) || [])[1]);
  const y0 = await p.evaluate(() => scrollY);
  const [x, y] = [tb.x + tb.width / 2, tb.y + tb.height / 2];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let i = 1; i <= 10; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - 12 * i }] });
    await p.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await p.waitForTimeout(400);
  const y1 = await p.evaluate(() => scrollY);
  const swiped = await grams();
  check(y1 > y0 && swiped === 0, `regressions: phone swipe on a dispenser scrolls (${y0} -> ${y1}) and pours nothing (${swiped} g)`);
  await target.scrollIntoViewIfNeeded();
  const tb2 = await target.boundingBox();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: tb2.x + tb2.width / 2, y: tb2.y + tb2.height / 2 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await p.waitForTimeout(400);
  check((await grams()) === 9, `regressions: a quick phone tap pours the 9 g minimum (${await grams()} g)`);
  // A long touch pour whose finger drifts keeps what it poured (only a young, vertical drag is a scroll).
  await target.scrollIntoViewIfNeeded();
  const tb3 = await target.boundingBox();
  const [hx, hy] = [tb3.x + tb3.width / 2, tb3.y + tb3.height / 2];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: hx, y: hy }] });
  await p.waitForTimeout(900);
  for (let i = 1; i <= 8; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: hx + i, y: hy + 5 * i }] });
    await p.waitForTimeout(40);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await p.waitForTimeout(300);
  const kept = (await grams()) - 9;
  check(kept >= 60, `regressions: a long phone pour that drifts 40 px keeps its pour (+${kept} g)`);
  // A touch that wiggles past the slop is a scroll: the browser's trailing click must not start a
  // click-only pour to the line.
  const beforeWiggle = await grams();
  await target.scrollIntoViewIfNeeded();
  const tb4 = await target.boundingBox();
  const [wx, wy] = [tb4.x + tb4.width / 2, tb4.y + tb4.height / 2];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: wx, y: wy }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: wx + 12, y: wy }] });
  await p.waitForTimeout(60);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await p.waitForTimeout(1500);
  const afterWiggle = await grams();
  check(afterWiggle === beforeWiggle, `regressions: a wiggled touch on a dispenser pours nothing (${beforeWiggle} -> ${afterWiggle} g)`);
  // A tap on a locked dispenser says why, on one line that starts with what matters.
  const other = p.getByRole('button', { name: /^Hold to add .* as main$/ }).nth(1);
  await other.scrollIntoViewIfNeeded();
  const ob = await other.boundingBox();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: ob.x + ob.width / 2, y: ob.y + ob.height / 2 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await p.waitForTimeout(150);
  const notice = await p.evaluate(() => {
    const el = document.querySelector('.ns-blocked-msg');
    return el ? { text: el.textContent, lines: Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight)) } : null;
  });
  check(!!notice && notice.lines === 1 && /^Locked to /.test(notice.text), `regressions: a locked dispenser's reason is one line, key words first (${notice && `${notice.lines} line: ${notice.text}`})`);
  // Station tabs: one fixed height whether or not a badge shows; pinned at the top while the
  // controls scroll under them.
  const tabs = await p.evaluate(() => [...document.querySelectorAll('.ns-tab')].map((t) => ({ h: Math.round(t.getBoundingClientRect().height), badge: !!t.querySelector('em'), clipped: t.scrollHeight > t.clientHeight + 1 })));
  check(tabs.some((t) => t.badge) && tabs.some((t) => !t.badge) && new Set(tabs.map((t) => t.h)).size === 1 && !tabs.some((t) => t.clipped), `regressions: phone station tabs keep one height with and without badges (${tabs.map((t) => `${t.h}${t.badge ? '*' : ''}${t.clipped ? '!' : ''}`).join(' ')})`);
  await p.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
  await p.waitForTimeout(300);
  const pinned = await p.evaluate(() => ({ y: scrollY, top: document.querySelector('.ns-tabs').getBoundingClientRect().top }));
  check(pinned.y > 100 && Math.abs(pinned.top) <= 1, `regressions: phone station tabs stay pinned while the controls scroll (scrolled ${pinned.y}, tabs at ${Math.round(pinned.top)} px)`);
  // A dish keeps its dispenser rows when a ticket arrives: the new ticket's foods join at the end.
  const rows = () => p.evaluate(() => [...document.querySelectorAll('.ns-dispenser-row')].map((r) => [...r.querySelectorAll('.ns-dispenser-name')].map((n) => n.textContent)));
  const rowsBefore = await rows();
  await p.getByRole('button', { name: /^Order station/ }).click();
  await p.getByRole('button', { name: /^Take .* order$/ }).click({ timeout: 90_000 });
  await p.getByRole('button', { name: /^Build station/ }).click();
  await p.waitForTimeout(200);
  const rowsAfter = await rows();
  const wanted = await p.locator('.ns-ticket-foods li').allTextContents();
  const kept_ = rowsBefore.every((row, i) => row.every((food, j) => rowsAfter[i][j] === food));
  const offered = wanted.length === 3 && wanted.every((food, i) => rowsAfter[i].includes(food.trim()));
  check(kept_ && offered, `regressions: dispenser rows keep their order when a ticket arrives, and offer its foods (${rowsBefore.map((r) => r.length).join('/')} -> ${rowsAfter.map((r) => r.length).join('/')}; wants ${wanted.join(', ')})`);
  await phone.close();
}

/** Eleventh-audit regressions: two tabs, the prep cue and reveal on a phone, layering, forced colours, zoom. */
async function runAudit11(browser) {
  const tag = Date.now();
  const enter = async (pg, user, button) => {
    await pg.goto(`${BASE}/?user=${user}`, { waitUntil: 'networkidle' });
    await pg.getByRole('button', { name: 'Games' }).first().click();
    await pg.getByRole('button', { name: 'Play NutriServe Kitchen (preview)' }).click();
    await pg.getByRole('button', { name: button }).click();
  };
  const saveKeyOf = (pg) => pg.evaluate(() => Object.keys(localStorage).find((k) => k.startsWith('nutriserve.remaster.save.v1:')));
  const clock = (ms) => `${Math.floor(ms / 60_000)}:${String(Math.floor((ms % 60_000) / 1000)).padStart(2, '0')}`;

  // 1. Two tabs: the kitchen opened last holds the save; the other stops writing, says so, and can
  //    pick up from the latest save.
  const tabs = await browser.newContext({ viewport: { width: 1000, height: 800 } });
  const a = await tabs.newPage();
  const b = await tabs.newPage();
  const user = `gate-tabs-${tag}`;
  await enter(a, user, 'New game');
  await a.waitForTimeout(600);
  await enter(b, user, /^Continue day/);
  await a.waitForTimeout(600);
  const told = await a.getByRole('alertdialog', { name: 'Open in another tab' }).count();
  // The handed-over game arrives paused; play on in B for a moment.
  await b.getByRole('dialog', { name: 'Paused' }).getByRole('button', { name: 'Resume' }).click();
  await b.waitForTimeout(1500);
  await b.locator('.ns-hud').getByRole('button', { name: 'Save & exit' }).click();
  const key = await saveKeyOf(b);
  const byB = await b.evaluate((k) => localStorage.getItem(k), key);
  await a.waitForTimeout(4600); // longer than an autosave
  const later = await a.evaluate((k) => localStorage.getItem(k), key);
  check(told === 1 && later === byB, `regressions: a second tab takes over the save; the first says so and stops writing (dialog ${told}, overwritten ${later !== byB})`);
  await a.getByRole('button', { name: 'Continue here' }).click();
  await a.waitForTimeout(1200); // B has left the kitchen; at most one handover wait
  const hudA = (await a.locator('.ns-hud').innerText()).replace(/\s+/g, ' ');
  const wantClock = clock(JSON.parse(byB).state.nowMs);
  const pausedA = await a.getByRole('dialog', { name: 'Paused' }).count();
  check(hudA.includes(wantClock) && pausedA === 1, `regressions: Continue here picks up the latest save, paused (${hudA.slice(0, 16)} vs ${wantClock}, paused ${pausedA})`);
  await tabs.close();

  // 2. Phone: a handi reaching its mark is announced in its own region, and opening Prep brings
  //    its Done button into view below the pinned tabs. The Why? panel scrolls under the tabs.
  const phone = await browser.newContext({ ...devices['iPhone 13'] });
  const p = await phone.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('console', (m) => m.type() === 'error' && !IGNORE.test(m.text()) && errors.push(m.text()));
  await enter(p, `gate-a11-${tag}`, 'New game');
  await p.getByRole('button', { name: 'Save & exit' }).click();
  const pkey = await saveKeyOf(p);
  await p.evaluate(async (k) => {
    const sim = await import('/src/features/nutriserve/simulation/index.ts');
    const run = (s, c) => {
      const r = sim.applyCommand(s, c);
      if (!r.result.ok) throw new Error(`${c.type}: ${r.result.error}`);
      return r.state;
    };
    let s = sim.createGame({ seed: 7, runId: 'run-gate-a11' });
    const toCounter = () => {
      while (!s.day.customers.some((c) => c.phase === 'at_counter')) s = sim.advanceGame(s, 100);
    };
    const rate = { base: 80, main: 90, side: 50 };
    const build = (o) => {
      s = run(s, { type: 'startDish', size: o.size });
      const dishId = s.dishes.at(-1).id;
      for (const [component, foodId] of [['base', o.baseId], ['main', o.mainId], ['side', o.sideId]]) {
        s = run(s, { type: 'beginPour', dishId, component, foodId });
        s = sim.advanceGame(s, Math.round((o.idealG[component] * 1000) / rate[component]));
        s = run(s, { type: 'endPour' });
      }
      return dishId;
    };
    // One customer served (so there is a result with a Why? button) ...
    toCounter();
    s = run(s, { type: 'takeOrder' });
    const first = s.tickets[0];
    let d = build(first.order);
    s = run(s, { type: 'finishBuild', dishId: d });
    s = run(s, { type: 'startPrep', dishId: d, slot: 0 });
    s = sim.advanceGame(s, 7_000);
    s = run(s, { type: 'finishPrep', slot: 0 });
    s = run(s, { type: 'finishDish', dishId: d });
    s = run(s, { type: 'serve', dishId: d, ticketId: first.id });
    // ... and the next one's dish in handi 3, a second short of its perfect window.
    toCounter();
    s = run(s, { type: 'takeOrder' });
    const next = s.tickets.find((t) => t.servedAtMs === undefined);
    d = build(next.order);
    s = run(s, { type: 'finishBuild', dishId: d });
    s = run(s, { type: 'startPrep', dishId: d, slot: 2 });
    const start = sim.prepTargetUnits(next.order.prepLevel) - sim.prepBandUnits(sim.upgradeEffects(s.profile.upgrades));
    const perSecond = sim.PREP_V1.unitsPerSecond; // a second short of the window
    s = sim.advanceGame(s, Math.round(((start - perSecond) / perSecond) * 1000));
    s = run(s, { type: 'selectStation', station: 'order' });
    localStorage.setItem(k, sim.serializeGame(s));
  }, pkey);
  await p.getByRole('button', { name: 'Play NutriServe Kitchen (preview)' }).click();
  await p.getByRole('button', { name: /^Continue day/ }).click();
  await p.waitForTimeout(1600);
  const cue = await p.locator('[data-ns-cue]').innerText();
  check(/Prep slot 3 is at its mark/.test(cue), `regressions: a handi at its mark is announced in its own region (${cue.trim().slice(0, 50)})`);
  await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await p.getByRole('button', { name: /^Prep station/ }).click();
  await p.waitForTimeout(400);
  const reveal = await p.evaluate(() => {
    const done = document.querySelector('[data-prep-done="2"]').getBoundingClientRect();
    const tabs = document.querySelector('.ns-tabs').getBoundingClientRect();
    return { y: Math.round(scrollY), top: Math.round(done.top), bottom: Math.round(done.bottom), tabs: Math.round(tabs.bottom), h: innerHeight };
  });
  check(reveal.top >= reveal.tabs && reveal.bottom <= reveal.h, `regressions: opening Prep on a phone brings the at-mark handi's Done into view (scrolled ${reveal.y}, Done ${reveal.top}-${reveal.bottom}, tabs end ${reveal.tabs}, view ${reveal.h})`);
  // Forced colours: the selected tab, the meter fill and the at-mark handi stay distinguishable.
  await p.emulateMedia({ forcedColors: 'active' });
  const forced = await p.evaluate(() => {
    const bg = (el) => getComputedStyle(el).backgroundColor;
    const pressed = document.querySelector('.ns-tab[aria-pressed="true"]');
    const other = document.querySelector('.ns-tab[aria-pressed="false"]');
    const unit = document.querySelector('.ns-prep-unit.ns-at-mark');
    const fill = unit?.querySelector('.ns-prep-fill');
    const bar = unit?.querySelector('.ns-prep-bar');
    return {
      tabs: bg(pressed) !== bg(other),
      fill: !!fill && bg(fill) !== bg(bar),
      mark: !!unit && getComputedStyle(unit).outlineStyle !== 'none',
    };
  });
  await p.emulateMedia({ forcedColors: 'none' });
  check(forced.tabs && forced.fill && forced.mark, `regressions: forced colours keep the selected tab, prep fill and at-mark handi visible (${JSON.stringify(forced)})`);
  await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await p.getByRole('button', { name: 'Why?' }).click();
  await p.evaluate(() => window.scrollBy({ top: 260, behavior: 'instant' }));
  await p.waitForTimeout(200);
  const layered = await p.evaluate(() => {
    const t = document.querySelector('.ns-tabs').getBoundingClientRect();
    const hit = document.elementFromPoint(t.left + t.width / 2, t.top + t.height / 2);
    return { panel: !!document.querySelector('.ns-why-panel'), onTabs: !!hit?.closest('.ns-tabs') };
  });
  check(layered.panel && layered.onTabs, `regressions: the Why? panel scrolls under the pinned tabs (${JSON.stringify(layered)})`);
  check(errors.length === 0, `regressions: no app errors on the phone checks${errors.length ? `: ${errors.slice(0, 3).join(' | ')}` : ''}`);
  await phone.close();

  // 3. 400% zoom (a 320x256 viewport): the tabs scroll with the page instead of covering a third of it.
  const zoom = await browser.newContext({ viewport: { width: 320, height: 256 } });
  const z = await zoom.newPage();
  await enter(z, `gate-zoom-${tag}`, 'New game');
  const position = await z.evaluate(() => getComputedStyle(document.querySelector('.ns-dock-tabs')).position);
  check(position === 'static', `regressions: at 400% zoom the station tabs are not pinned (${position})`);
  await zoom.close();
}

/**
 * Twelfth-audit regressions: handing the save between open windows, a failing save, the prep cue
 * for a restored game, the phone layout (controls before the result bar, Build's scene collapsed,
 * Finish tools above the vessel, no re-scroll on Prep), and the ticket's lines in a wrong-size vessel.
 */
async function runAudit12(browser) {
  const tag = Date.now();
  const enter = async (pg, user, button) => {
    await pg.goto(`${BASE}/?user=${user}`, { waitUntil: 'networkidle' });
    await pg.getByRole('button', { name: 'Games' }).first().click();
    await pg.getByRole('button', { name: 'Play NutriServe Kitchen (preview)' }).click();
    await pg.getByRole('button', { name: button }).click();
  };
  const saveKeyOf = (pg) => pg.evaluate(() => Object.keys(localStorage).find((k) => k.startsWith('nutriserve.remaster.save.v1:')));
  const seconds = (hud) => {
    const m = hud.match(/(\d+):(\d\d)/);
    return m ? Number(m[1]) * 60 + Number(m[2]) : -1;
  };
  /** Write a crafted save (body runs in the page with sim and run) and open it with Continue. */
  const craft = async (pg, body) => {
    await pg.getByRole('button', { name: 'Save & exit' }).click();
    const key = await saveKeyOf(pg);
    await pg.evaluate(
      async ({ key, body }) => {
        const sim = await import('/src/features/nutriserve/simulation/index.ts');
        const run = (s, c) => {
          const r = sim.applyCommand(s, c);
          if (!r.result.ok) throw new Error(`${c.type}: ${r.result.error}`);
          return r.state;
        };
        const rate = { base: 80, main: 90, side: 50 };
        const helpers = {
          toCounter: (s) => {
            for (let i = 0; !s.day.customers.some((c) => c.phase === 'at_counter'); i++) {
              if (i > 6_000) throw new Error('no customer came to the counter in 10 minutes');
              s = sim.advanceGame(s, 100);
            }
            return s;
          },
          build: (s, o, size = o.size) => {
            s = run(s, { type: 'startDish', size });
            const dishId = s.dishes.at(-1).id;
            for (const [component, foodId] of [['base', o.baseId], ['main', o.mainId], ['side', o.sideId]]) {
              s = run(s, { type: 'beginPour', dishId, component, foodId });
              s = sim.advanceGame(s, Math.round((o.idealG[component] * 1000) / rate[component]));
              s = run(s, { type: 'endPour' });
            }
            return { s, dishId };
          },
        };
        const s = new Function('sim', 'run', 'h', body)(sim, run, helpers);
        localStorage.setItem(key, sim.serializeGame(s));
      },
      { key, body }
    );
    await pg.getByRole('button', { name: 'Play NutriServe Kitchen (preview)' }).click();
    await pg.getByRole('button', { name: /^Continue day/ }).click();
  };
  // Two handis (1 and 2) inside their perfect windows, paused, at the Order station.
  const AT_MARK = `
    let s = sim.createGame({ seed: 9, runId: 'run-gate-a12' });
    const made = [];
    for (let i = 0; i < 2; i++) {
      s = h.toCounter(s);
      s = run(s, { type: 'takeOrder' });
      const t = s.tickets.at(-1);
      const b = h.build(s, t.order);
      s = run(b.s, { type: 'finishBuild', dishId: b.dishId });
      made.push({ id: b.dishId, mark: sim.prepTargetUnits(t.order.prepLevel) });
    }
    // The longer one goes on first, the other when the first has that much left (a unit is a ms
    // on the flame), and both are taken to half a window short of their marks.
    const band = sim.prepBandUnits(sim.upgradeEffects(s.profile.upgrades));
    made.sort((x, y) => y.mark - x.mark);
    s = run(s, { type: 'startPrep', dishId: made[0].id, slot: 0 });
    s = sim.advanceGame(s, made[0].mark - made[1].mark);
    s = run(s, { type: 'startPrep', dishId: made[1].id, slot: 1 });
    s = sim.advanceGame(s, made[1].mark - band / 2);
    s = run(s, { type: 'selectStation', station: 'order' });
    s = run(s, { type: 'pause' });
    return s;
  `;

  // 1. Two windows side by side (both visible): the second gets everything the first had done,
  //    not its last autosave.
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 800 } });
  const a = await ctx.newPage();
  const b = await ctx.newPage();
  const user = `gate-hand-${tag}`;
  await enter(a, user, 'New game');
  await a.waitForTimeout(2600); // past the opening save, well before the next autosave
  const aHidden = await a.evaluate(() => document.hidden);
  await enter(b, user, /^Continue day/);
  await b.waitForTimeout(500);
  const hudB = (await b.locator('.ns-hud').innerText()).replace(/\s+/g, ' ');
  const toldA = await a.getByRole('alertdialog', { name: 'Open in another tab' }).count();
  check(seconds(hudB) >= 2 && toldA === 1 && !aHidden, `regressions: a second window gets the first one's latest state, not its last autosave (B at ${hudB.slice(0, 14)}, A told ${toldA}, A hidden ${aHidden})`);
  await ctx.close();

  // 2. A save that fails (storage full) is shown while playing, and Save & exit asks first.
  const full = await browser.newContext({ viewport: { width: 1000, height: 800 } });
  await full.addInitScript(() => {
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (window.__nsFull && String(k).startsWith('nutriserve.remaster.save')) throw new DOMException('full', 'QuotaExceededError');
      return orig.call(this, k, v);
    };
  });
  const f = await full.newPage();
  await enter(f, `gate-full-${tag}`, 'New game');
  await f.evaluate(() => (window.__nsFull = true));
  await f.waitForTimeout(4600); // one autosave
  const warned = await f.locator('.ns-save-warning').count();
  let asked = false;
  f.once('dialog', (d) => {
    asked = true;
    d.dismiss();
  });
  await f.getByRole('button', { name: 'Save & exit' }).click();
  await f.waitForTimeout(300);
  const stayed = await f.locator('.ns-hud').count();
  check(warned === 1 && asked && stayed === 1, `regressions: a failing save is shown, and Save & exit asks before leaving unsaved (warning ${warned}, asked ${asked}, stayed ${stayed})`);
  await full.close();

  // 3. A restored game's handis already at their mark are announced; the cue follows the set.
  const cueCtx = await browser.newContext({ viewport: { width: 1000, height: 800 } });
  const c = await cueCtx.newPage();
  await enter(c, `gate-cue-${tag}`, 'New game');
  await craft(c, AT_MARK);
  await c.waitForTimeout(900); // the cue first speaks 600 ms after the kitchen opens
  const cueAtLoad = (await c.locator('[data-ns-cue]').innerText()).trim();
  await c.getByRole('dialog', { name: 'Paused' }).getByRole('button', { name: 'Resume' }).click();
  await c.getByRole('button', { name: /^Prep station/ }).click();
  await c.getByRole('region', { name: 'Prep slot 1' }).getByRole('button', { name: 'Done' }).click();
  await c.waitForTimeout(200);
  const cueAfter = (await c.locator('[data-ns-cue]').innerText()).trim();
  check(
    /Prep slots [12] and [12] are at their mark/.test(cueAtLoad) && /^Prep slot 2 is at its mark/.test(cueAfter),
    `regressions: restored handis at their mark are announced, and the cue drops a handi taken out ("${cueAtLoad.slice(0, 40)}" then "${cueAfter.slice(0, 40)}")`
  );
  await cueCtx.close();

  // 4. Phone: the station's controls come before the result bar, Build's scene gives way to its
  //    gauges, Finish's tools sit above the vessel, Prep doesn't re-scroll when tapped again, and a
  //    wrong-size vessel still shows the ticket's lines.
  const phone = await browser.newContext({ ...devices['iPhone 13'] });
  const p = await phone.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('console', (m) => m.type() === 'error' && !IGNORE.test(m.text()) && errors.push(m.text()));
  await enter(p, `gate-a12-${tag}`, 'New game');
  await craft(
    p,
    AT_MARK.replace(
      "s = run(s, { type: 'selectStation', station: 'order' });",
      `// The first handi's dish goes on to Finish, and the third ticket's dish is on the build
      // counter in the wrong size (day 1 has three customers).
      s = run(s, { type: 'finishPrep', slot: 0 });
      s = h.toCounter(s);
      s = run(s, { type: 'takeOrder' });
      const t3 = s.tickets.at(-1);
      s = run(s, { type: 'selectTicket', ticketId: t3.id });
      s = run(s, { type: 'startDish', size: t3.order.size === 'small' ? 'large' : 'small' });
      s = run(s, { type: 'selectStation', station: 'order' });`
    )
  );
  await p.getByRole('dialog', { name: 'Paused' }).getByRole('button', { name: 'Resume' }).click();
  await p.getByRole('button', { name: /^Prep station/ }).click();
  await p.waitForTimeout(400);
  await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await p.getByRole('button', { name: /^Prep station/ }).click();
  await p.waitForTimeout(400);
  const rescrolled = await p.evaluate(() => Math.round(scrollY));
  await p.getByRole('button', { name: /^Build station/ }).click();
  await p.waitForTimeout(300);
  const build = await p.evaluate(() => {
    const top = (el) => (el ? Math.round(el.getBoundingClientRect().top + scrollY) : -1);
    const main = document.querySelector('.ns-dock-main');
    const bar = document.querySelector('.ns-dock .ns-lastserve-wrap');
    return {
      stage: Math.round(document.querySelector('.ns-stage').getBoundingClientRect().height),
      order: !!main && !!bar && !!(main.compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING),
      dispenser: top(document.querySelector('.ns-dispenser')),
      lines: [...document.querySelectorAll('.ns-gauge-label')].filter((l) => / \/ \d+ g/.test(l.textContent)).length,
      warning: document.querySelector('.ns-size-warning')?.textContent ?? '',
      h: innerHeight,
    };
  });
  await p.getByRole('button', { name: /^Finish station/ }).click();
  await p.waitForTimeout(300);
  const finish = await p.evaluate(() => {
    const top = (sel) => Math.round(document.querySelector(sel)?.getBoundingClientRect().top ?? -1);
    return { tools: top('.ns-tools'), vessel: top('.ns-vessel-top') };
  });
  check(rescrolled === 0, `regressions: tapping Prep while on Prep leaves the page where the player put it (scrolled to ${rescrolled})`);
  check(
    build.stage === 0 && build.order && build.dispenser > 0 && build.dispenser < build.h,
    `regressions: on a phone, Build's controls start on the first screen, before the result bar (scene ${build.stage} px, controls first ${build.order}, first dispenser at ${build.dispenser} of ${build.h})`
  );
  check(build.lines === 3 && /ticket wants/.test(build.warning), `regressions: a wrong-size vessel still shows the ticket's lines, and says so (${build.lines} lines, "${build.warning.trim()}")`);
  check(finish.tools >= 0 && finish.tools < finish.vessel, `regressions: on a phone the finish tools sit above the vessel (tools ${finish.tools}, vessel ${finish.vessel})`);
  check(errors.length === 0, `regressions: no app errors on the twelfth-audit phone checks${errors.length ? `: ${errors.slice(0, 3).join(' | ')}` : ''}`);
  await phone.close();
}

// --- Thirteenth audit ----------------------------------------------------------------------------
/** Helpers for the scenarios with several tabs (audits 13 and 14). */
function tabKit() {
  const saveKeyOf = (pg) => pg.evaluate(() => Object.keys(localStorage).find((k) => k.startsWith('nutriserve.remaster.save.v1:')));
  const toStart = async (pg) => {
    const play = pg.getByRole('button', { name: 'Play NutriServe Kitchen (preview)' });
    for (let i = 0; i < 20 && !(await play.count()); i++) {
      await pg.getByRole('button', { name: 'Games' }).first().click().catch(() => {});
      await pg.waitForTimeout(300);
    }
    await play.click();
    await pg.waitForSelector('.ns-start');
  };
  const open = async (context, user) => {
    const pg = await context.newPage();
    pg.on('dialog', (d) => d.accept().catch(() => {}));
    await pg.goto(`${BASE}/?user=${user}`, { waitUntil: 'networkidle' });
    await toStart(pg);
    return pg;
  };
  const cont = async (pg) => {
    await pg.getByRole('button', { name: /^Continue day/ }).click();
    await pg.waitForSelector('.ns-hud');
  };
  /** The save as stored: day, coins, upgrades, tickets. */
  const stored = (pg) =>
    pg.evaluate(() => {
      const k = Object.keys(localStorage).find((x) => x.startsWith('nutriserve.remaster.save.v1:'));
      if (!k) return null;
      const s = JSON.parse(localStorage.getItem(k)).state;
      return { day: s.day.number, done: s.day.completed, coins: s.profile.coins, ups: s.profile.upgrades.join('+') || '-', tickets: s.tickets.length };
    });
  /** Seed a save in a context from a body run in the page with sim and run (as craft() above). */
  const seed = async (context, user, body) => {
    const pg = await open(context, user);
    await pg.getByRole('button', { name: 'New game' }).click();
    await pg.waitForSelector('.ns-hud');
    await pg.getByRole('button', { name: 'Save & exit' }).click();
    const key = await saveKeyOf(pg);
    await pg.evaluate(
      async ({ key, body }) => {
        const sim = await import('/src/features/nutriserve/simulation/index.ts');
        const run = (s, c) => {
          const r = sim.applyCommand(s, c);
          if (!r.result.ok) throw new Error(`${c.type}: ${r.result.error}`);
          return r.state;
        };
        localStorage.setItem(key, sim.serializeGame(new Function('sim', 'run', body)(sim, run)));
      },
      { key, body }
    );
    await pg.close();
  };
  // Day 5 with every customer served; the last one walks out, so the day ends about 2.5 s after Resume.
  const NEAR_END = `
    const days = [1, 2, 3, 4];
    const profile = { ...sim.newProfile(), points: 450, rank: sim.rankForPoints(450), coins: 200, creditedDays: days, reportedDays: days };
    let s = sim.createGame({ seed: 777, runId: 'run-gate-a13-near', profile });
    const rate = { base: 80, main: 90, side: 50 };
    for (let guard = 0; s.day.results.length < s.day.customers.length && guard < 5000; guard++) {
      if (!s.day.customers.some((c) => c.phase === 'at_counter')) { s = sim.advanceGame(s, 250); continue; }
      s = run(s, { type: 'takeOrder' });
      const t = s.tickets.at(-1), o = t.order;
      s = run(s, { type: 'selectTicket', ticketId: t.id });
      s = run(s, { type: 'startDish', size: o.size });
      const id = s.dishes.at(-1).id;
      for (const [component, foodId] of [['base', o.baseId], ['main', o.mainId], ['side', o.sideId]]) {
        s = run(s, { type: 'beginPour', dishId: id, component, foodId });
        s = sim.advanceGame(s, Math.round((o.idealG[component] * 1000) / rate[component]));
        s = run(s, { type: 'endPour' });
      }
      s = run(s, { type: 'finishBuild', dishId: id });
      s = run(s, { type: 'startPrep', dishId: id, slot: 0 });
      s = sim.advanceGame(s, Math.round((sim.prepTargetUnits(o.prepLevel) / sim.PREP_V1.unitsPerSecond) * 1000));
      s = run(s, { type: 'finishPrep', slot: 0 });
      s = run(s, { type: 'selectDish', dishId: id });
      for (const f of o.finish) if (f.kind === 'garnish') for (let k = 0; k < f.count; k++) { const a = (k / f.count) * 2 * Math.PI; s = run(s, { type: 'placeGarnish', dishId: id, garnishId: f.id, x: 0.5 * Math.cos(a), y: 0.5 * Math.sin(a) }); }
      s = run(s, { type: 'finishDish', dishId: id });
      s = run(s, { type: 'serve', dishId: id, ticketId: t.id });
    }
    return run(s, { type: 'selectStation', station: 'order' });`;
  const MID_DAY = `
    const days = [1, 2, 3];
    let s = sim.createGame({ seed: 4321, runId: 'run-gate-a13-mid', profile: { ...sim.newProfile(), points: 200, rank: sim.rankForPoints(200), coins: 300, creditedDays: days, reportedDays: days } });
    while (!s.day.customers.some((c) => c.phase === 'at_counter')) s = sim.advanceGame(s, 200);
    return s;`;
  /** B resumes, the day ends, B buys the rice scoop and leaves with Save & exit. */
  const finishBuyLeave = async (B) => {
    // The Pause dialog's button (the HUD's is inert behind it, but this Playwright still finds it by role).
    await B.getByRole('dialog', { name: 'Paused' }).getByRole('button', { name: 'Resume' }).click({ timeout: 2000 }).catch(() => {});
    await B.waitForSelector('.ns-summary', { timeout: 20000 });
    await B.locator('.ns-upgrades li', { hasText: 'Brass rice scoop' }).getByRole('button').click();
    await B.waitForTimeout(300);
    await B.locator('.ns-summary').getByRole('button', { name: 'Save & exit' }).click();
    await B.waitForTimeout(400);
  };
  const told = async (pg) => /Open in another tab/.test((await pg.locator('.ns-overlay h2').allInnerTexts().catch(() => [])).join('|'));
  return { saveKeyOf, toStart, open, cont, stored, seed, NEAR_END, MID_DAY, finishBuyLeave, told };
}

async function runAudit13(browser) {
  const tag = Date.now();
  const { saveKeyOf, toStart, open, cont, stored, seed, NEAR_END, MID_DAY, finishBuyLeave, told } = tabKit();

  // H1: a tab restored from the back/forward cache never overwrites newer progress (Playwright turns
  // the cache off, so this browser keeps it on).
  {
    // The full Chromium build (the headless shell has no back/forward cache).
    const bf = await chromium.launch({ channel: 'chromium', ignoreDefaultArgs: ['--disable-back-forward-cache'] });
    const context = await bf.newContext({ viewport: { width: 1280, height: 900 } });
    const user = `gate13bf${tag}`;
    await seed(context, user, NEAR_END);
    const A = await open(context, user);
    await cont(A);
    await A.getByRole('button', { name: 'Resume' }).click().catch(() => {});
    await A.waitForTimeout(300);
    await A.evaluate(() => (window.__gateMarker = 'kept'));
    await A.goto(`${BASE}/nutriserve-art-lab.html`, { waitUntil: 'load' });
    const B = await open(context, user);
    await cont(B);
    await finishBuyLeave(B);
    const afterB = await stored(B);
    await A.goBack({ waitUntil: 'commit' });
    await A.waitForTimeout(600);
    const restored = (await A.evaluate(() => window.__gateMarker ?? null).catch(() => null)) === 'kept';
    const aTold = await told(A).catch(() => false);
    await A.waitForTimeout(5000);
    const later = await stored(B);
    const kept = afterB && later && afterB.ups === later.ups && afterB.coins === later.coins && afterB.done === later.done;
    check(restored && aTold && kept, `regressions: a tab back from the back/forward cache keeps newer progress made in another tab, and says so (restored ${restored}, told ${aTold}, ${JSON.stringify(afterB)} -> ${JSON.stringify(later)})`);
    await bf.close();
  }

  // (A frozen phone tab takes the same path when it wakes: it checks on resume and on being shown.
  // Not emulated here: a long task standing in for the freeze stalls every same-site tab.)

  // M1: with storage nearly full, a handover still carries the holder's newest state, and the
  // can't-save warning moves with it.
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const user = `gate13q${tag}`;
    await seed(context, user, MID_DAY);
    const A = await open(context, user);
    await cont(A);
    await A.getByRole('button', { name: 'Resume' }).click().catch(() => {});
    await A.evaluate(() => {
      const big = 'x'.repeat(512 * 1024);
      try { for (let n = 0; n < 40; n++) localStorage.setItem('gateFillA' + n, big); } catch {}
      let size = 256 * 1024;
      for (let k = 0; size >= 1024; ) { try { localStorage.setItem('gateFillB' + k++, 'x'.repeat(size)); } catch { size /= 2; } }
    });
    for (let i = 0; i < 3; i++) {
      await A.getByRole('button', { name: /^Order station/ }).click();
      await A.getByRole('button', { name: /^Take .* order$/ }).click().catch(() => {});
      await A.waitForTimeout(800);
    }
    await A.waitForTimeout(4500);
    const aTickets = await A.evaluate(() => Number(document.querySelector('.ns-hud')?.textContent.match(/(\d+) open ticket/)?.[1] ?? -1));
    const aWarned = await A.locator('.ns-save-warning').count();
    const storedTickets = (await stored(A))?.tickets;
    const B = await open(context, user);
    await cont(B);
    await B.waitForTimeout(600);
    const bTickets = await B.evaluate(() => Number(document.querySelector('.ns-hud')?.textContent.match(/(\d+) open ticket/)?.[1] ?? -1));
    const bWarned = await B.locator('.ns-save-warning').count();
    check(aWarned === 1 && storedTickets < aTickets && bTickets === aTickets && bWarned === 1 && (await told(A)),
      `regressions: with storage full, a handover still brings the newest state and the can't-save warning (A ${aTickets} tickets, stored ${storedTickets}, B ${bTickets}, B warned ${bWarned})`);
    await context.close();
  }

  // A holder busy past the wait hands over late: the asking tab (opened paused, untouched) adopts it.
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const user = `gate13late${tag}`;
    await seed(context, user, MID_DAY);
    const A = await open(context, user);
    await cont(A);
    await A.getByRole('button', { name: 'Resume' }).click().catch(() => {});
    await A.getByRole('button', { name: /^Take .* order$/ }).click().catch(() => {});
    await A.waitForTimeout(4300); // just past an autosave
    await A.getByRole('button', { name: /^Order station/ }).click();
    await A.getByRole('button', { name: /^Take .* order$/ }).click().catch(() => {});
    const B = await open(context, user);
    const button = await B.getByRole('button', { name: /^Continue day/ }).elementHandle();
    const busy = A.evaluate(() => new Promise((r) => setTimeout(() => { const t = performance.now(); while (performance.now() - t < 1200); r(); }, 0)));
    await A.waitForTimeout(20);
    await button.evaluate((b) => b.click());
    await busy;
    await B.waitForSelector('.ns-hud');
    await B.waitForTimeout(1500);
    const gameOf = (pg) =>
      pg.evaluate(() => {
        const el = document.querySelector('.ns-root');
        let f = el[Object.keys(el).find((k) => k.startsWith('__reactFiber$'))];
        while (f && !(f.type && f.type.name === 'Kitchen')) f = f.return;
        const s = f?.memoizedState.memoizedState.current;
        return s ? { tickets: s.tickets.length, now: s.nowMs } : null;
      });
    const a = await gameOf(A), b = await gameOf(B), st = await stored(B);
    check(a && b && b.now === a.now && b.tickets === a.tickets && st?.tickets === a.tickets && (await told(A)),
      `regressions: a holder busy past the wait hands over late, and the asking tab takes its newer state (A ${JSON.stringify(a)}, B ${JSON.stringify(b)}, stored ${st?.tickets} tickets)`);
    await context.close();
  }

  // L1: "Start a new day with your progress" uses the progress as it is after the handover. B stands
  // in for a newer version (it reads the save as made under older rules) without a tab channel.
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const user = `gate13s${tag}`;
    await seed(context, user, NEAR_END);
    const A = await open(context, user);
    await cont(A);
    const B = await context.newPage();
    B.on('dialog', (d) => d.accept().catch(() => {}));
    await B.addInitScript(() => {
      window.BroadcastChannel = undefined;
      const get = Storage.prototype.getItem;
      Storage.prototype.getItem = function (k) {
        const v = get.call(this, k);
        return v && String(k).startsWith('nutriserve.remaster.save') ? v.replace(/"build":"build-v\d+"/, '"build":"build-v1"') : v;
      };
    });
    await B.goto(`${BASE}/?user=${user}`, { waitUntil: 'networkidle' });
    await toStart(B);
    await B.getByRole('button', { name: 'Start a new day with your progress' }).waitFor();
    const changes = await B.locator('.ns-rule-changes li').count();
    await A.getByRole('button', { name: 'Resume' }).click().catch(() => {});
    await A.waitForSelector('.ns-summary', { timeout: 20000 });
    await A.locator('.ns-upgrades li', { hasText: 'Brass rice scoop' }).getByRole('button').click();
    await A.waitForTimeout(200);
    await B.getByRole('button', { name: 'Start a new day with your progress' }).click();
    await B.waitForSelector('.ns-hud');
    const profile = await B.evaluate(() => {
      const el = document.querySelector('.ns-root');
      let f = el[Object.keys(el).find((k) => k.startsWith('__reactFiber$'))];
      while (f && !(f.type && f.type.name === 'Kitchen')) f = f.return;
      return f ? f.memoizedState.memoizedState.current.profile : null;
    });
    check(profile?.upgrades.includes('rice_scoop') && changes >= 4,
      `regressions: a new day after a handover keeps what the other tab bought a moment before, and the rule changes are listed (upgrades ${profile?.upgrades.join('+')}, ${changes} changes)`);
    await context.close();
  }

  // M5: on a phone held sideways a whole build, all four handis and the finish tools, vessel and
  // Done fit on one screen; on a desktop the finish tools come before the vessel on screen too.
  {
    const phone = await browser.newContext({ ...devices['iPhone 13 landscape'] });
    const pg = await open(phone, `gate13l${tag}`);
    await pg.getByRole('button', { name: 'New game' }).click();
    await pg.waitForSelector('.ns-hud');
    await pg.getByRole('button', { name: 'Save & exit' }).click();
    const key = await saveKeyOf(pg);
    await pg.evaluate(async (key) => {
      const sim = await import('/src/features/nutriserve/simulation/index.ts');
      const run = (s, c) => {
        const r = sim.applyCommand(s, c);
        if (!r.result.ok) throw new Error(`${c.type}: ${r.result.error}`);
        return r.state;
      };
      const days = Array.from({ length: 10 }, (_, i) => i + 1);
      let s = sim.createGame({ seed: 4242, runId: 'run-gate-a13-land', profile: { ...sim.newProfile(), points: 560, rank: sim.rankForPoints(560), coins: 40, creditedDays: days, reportedDays: days } });
      const rate = { base: 80, main: 90, side: 50 };
      for (let k = 0; k < 4; k++) {
        while (!s.day.customers.some((c) => c.phase === 'at_counter')) s = sim.advanceGame(s, 100);
        s = run(s, { type: 'takeOrder' });
        const t = s.tickets.at(-1);
        s = run(s, { type: 'selectTicket', ticketId: t.id });
        s = run(s, { type: 'startDish', size: t.order.size });
        const d = s.dishes.at(-1).id;
        for (const [c, f] of [['base', t.order.baseId], ['main', t.order.mainId], ['side', t.order.sideId]]) {
          s = run(s, { type: 'beginPour', dishId: d, component: c, foodId: f });
          s = sim.advanceGame(s, Math.round((t.order.idealG[c] * 1000) / rate[c]));
          s = run(s, { type: 'endPour' });
        }
        s = run(s, { type: 'finishBuild', dishId: d });
        s = run(s, { type: 'startPrep', dishId: d, slot: k });
      }
      s = sim.advanceGame(s, 1500);
      s = run(s, { type: 'finishPrep', slot: 0 });
      while (!s.day.customers.some((c) => c.phase === 'at_counter')) s = sim.advanceGame(s, 100);
      s = run(s, { type: 'takeOrder' });
      s = run(s, { type: 'selectTicket', ticketId: s.tickets.at(-1).id });
      s = run(s, { type: 'startDish', size: s.tickets.at(-1).order.size });
      localStorage.setItem(key, sim.serializeGame(s));
    }, key);
    await pg.getByRole('button', { name: 'Play NutriServe Kitchen (preview)' }).click();
    await pg.getByRole('button', { name: /^Continue day/ }).click();
    await pg.waitForSelector('.ns-hud');
    const fits = {};
    for (const [st, sel] of [['Build', '.ns-dock .ns-dispenser, .ns-dock .ns-actions .ns-btn'], ['Prep', '.ns-dock [data-prep-done]'], ['Finish', '.ns-dock .ns-tool, .ns-dock .ns-vessel-top, .ns-dock .ns-actions .ns-btn']]) {
      await pg.getByRole('button', { name: new RegExp(`^${st} station`) }).click();
      await pg.waitForTimeout(500);
      await pg.evaluate(() => scrollTo(0, 0));
      await pg.waitForTimeout(200);
      fits[st] = await pg.evaluate((sel) => {
        const els = [...document.querySelectorAll(sel)];
        const out = els.filter((e) => { const r = e.getBoundingClientRect(); return r.top < 0 || r.bottom > innerHeight || r.left < 0 || r.right > innerWidth; }).length;
        return `${els.length - out}/${els.length}`;
      }, sel);
    }
    const ok = Object.values(fits).every((f) => { const [a, b] = f.split('/'); return a === b && Number(b) > 0; });
    check(ok, `regressions: on a phone held sideways each station's controls fit on one screen (${Object.entries(fits).map(([k, v]) => `${k} ${v}`).join(', ')})`);
    const landSave = await pg.evaluate((k) => localStorage.getItem(k), key);
    await phone.close();

    // Upright: switching station brings that station's controls into view under the pinned tabs.
    const up = await browser.newContext({ ...devices['iPhone 13'] });
    const upg = await open(up, `gate13u${tag}`);
    await upg.getByRole('button', { name: 'New game' }).click();
    await upg.waitForSelector('.ns-hud');
    await upg.getByRole('button', { name: 'Save & exit' }).click();
    await upg.evaluate(({ k, v }) => localStorage.setItem(k, v), { k: await saveKeyOf(upg), v: landSave });
    await upg.getByRole('button', { name: 'Play NutriServe Kitchen (preview)' }).click();
    await upg.getByRole('button', { name: /^Continue day/ }).click();
    await upg.waitForSelector('.ns-hud');
    await upg.getByRole('dialog', { name: 'Paused' }).getByRole('button', { name: 'Resume' }).click().catch(() => {});
    const inView = {};
    for (const st of ['Build', 'Finish', 'Order', 'Prep', 'Build']) {
      await upg.getByRole('button', { name: new RegExp(`^${st} station`) }).click();
      await upg.waitForTimeout(400);
      inView[st] = await upg.evaluate(() => {
        const tabs = document.querySelector('.ns-dock-tabs').getBoundingClientRect().bottom;
        const els = [...document.querySelectorAll('.ns-dock-main .ns-dispenser, .ns-dock-main .ns-actions .ns-btn, .ns-dock-main .ns-tool, .ns-dock-main .ns-vessel-top, .ns-dock-main [data-prep-done]')];
        return `${els.filter((e) => { const r = e.getBoundingClientRect(); return r.top >= tabs - 1 && r.bottom <= innerHeight; }).length}/${els.length}`;
      });
    }
    const upOk = ['Build', 'Finish', 'Prep'].every((k) => { const [a, b] = inView[k].split('/'); return a === b && Number(b) > 0; });
    check(upOk, `regressions: on an upright phone switching station brings its controls into view under the pinned tabs (${Object.entries(inView).map(([k, v]) => `${k} ${v}`).join(', ')})`);
    await up.close();

    const desk = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const dp = await open(desk, `gate13d${tag}`);
    await dp.getByRole('button', { name: 'New game' }).click();
    await dp.waitForSelector('.ns-hud');
    await dp.getByRole('button', { name: 'Save & exit' }).click();
    const dkey = await saveKeyOf(dp);
    await dp.evaluate(async (key) => {
      const sim = await import('/src/features/nutriserve/simulation/index.ts');
      const run = (s, c) => {
        const r = sim.applyCommand(s, c);
        if (!r.result.ok) throw new Error(`${c.type}: ${r.result.error}`);
        return r.state;
      };
      const rate = { base: 80, main: 90, side: 50 };
      let s = sim.createGame({ seed: 4242, runId: 'run-gate-a13-desk' });
      while (!s.day.customers.some((c) => c.phase === 'at_counter')) s = sim.advanceGame(s, 100);
      s = run(s, { type: 'takeOrder' });
      const t = s.tickets.at(-1);
      s = run(s, { type: 'startDish', size: t.order.size });
      const d = s.dishes.at(-1).id;
      for (const [c, f] of [['base', t.order.baseId], ['main', t.order.mainId], ['side', t.order.sideId]]) {
        s = run(s, { type: 'beginPour', dishId: d, component: c, foodId: f });
        s = sim.advanceGame(s, Math.round((t.order.idealG[c] * 1000) / rate[c]));
        s = run(s, { type: 'endPour' });
      }
      s = run(s, { type: 'finishBuild', dishId: d });
      s = run(s, { type: 'startPrep', dishId: d, slot: 0 });
      s = run(s, { type: 'finishPrep', slot: 0 });
      // A second ticket with no dish yet, so Build suggests its vessel size.
      while (!s.day.customers.some((c) => c.phase === 'at_counter')) s = sim.advanceGame(s, 100);
      s = run(s, { type: 'takeOrder' });
      s = run(s, { type: 'selectStation', station: 'finish' });
      s = run(s, { type: 'selectDish', dishId: d });
      localStorage.setItem(key, sim.serializeGame(s));
    }, dkey);
    await dp.getByRole('button', { name: 'Play NutriServe Kitchen (preview)' }).click();
    await dp.getByRole('button', { name: /^Continue day/ }).click();
    await dp.waitForSelector('.ns-vessel-top');
    const order = await dp.evaluate(() => {
      const tool = document.querySelector('.ns-tool').getBoundingClientRect();
      const vessel = document.querySelector('.ns-vessel-top').getBoundingClientRect();
      const before = !!(document.querySelector('.ns-tool').compareDocumentPosition(document.querySelector('.ns-vessel-top')) & Node.DOCUMENT_POSITION_FOLLOWING);
      return { tool: Math.round(tool.bottom), vessel: Math.round(vessel.top), before };
    });
    check(order.before && order.tool <= order.vessel, `regressions: on a desktop the finish tools sit above the vessel, as in Tab order (tools end ${order.tool}, vessel starts ${order.vessel})`);
    // Forced colours: the pressed dispenser's ring and the suggested size's ring use system colours.
    await dp.emulateMedia({ forcedColors: 'active' });
    await dp.getByRole('button', { name: /^Build station/ }).click();
    await dp.waitForTimeout(300);
    const suggested = await dp.evaluate(() => {
      const b = document.querySelector('.ns-btn-suggested');
      return b ? getComputedStyle(b).outlineStyle : 'none-found';
    });
    check(suggested === 'solid', `regressions: in forced colours the suggested vessel size keeps a ring (${suggested})`);
    await desk.close();
  }
}

async function runAudit14(browser) {
  const tag = Date.now();
  const { open, cont, stored, seed, NEAR_END, MID_DAY, finishBuyLeave, told } = tabKit();
  /** The kitchen's game in a page (tickets and clock), or null. */
  const gameOf = (pg) =>
    pg.evaluate(() => {
      const el = document.querySelector('.ns-root');
      if (!el) return null;
      let f = el[Object.keys(el).find((k) => k.startsWith('__reactFiber$'))];
      while (f && !(f.type && f.type.name === 'Kitchen')) f = f.return;
      const s = f?.memoizedState.memoizedState.current;
      return s ? { tickets: s.tickets.length, now: s.nowMs, coins: s.profile.coins, ups: s.profile.upgrades.join('+') || '-' } : null;
    });
  const fill = (pg) =>
    pg.evaluate(() => {
      const big = 'x'.repeat(512 * 1024);
      try { for (let n = 0; n < 40; n++) localStorage.setItem('gateFillA' + n, big); } catch {}
      let size = 256 * 1024;
      for (let k = 0; size >= 1024; ) { try { localStorage.setItem('gateFillB' + k++, 'x'.repeat(size)); } catch { size /= 2; } }
    });
  // The holder handles the ask `window.__delayAsk` ms late while it keeps running (a slow phone or a
  // throttled tab; a busy loop would stall the asking tab's timer too, in this browser).
  const DELAY_ASK = `(() => {
    const d = Object.getOwnPropertyDescriptor(BroadcastChannel.prototype, 'onmessage');
    Object.defineProperty(BroadcastChannel.prototype, 'onmessage', { configurable: true, get() { return d.get.call(this); }, set(fn) { d.set.call(this, fn && ((e) => { if (window.__delayAsk && e.data && e.data.kind === 'ask') setTimeout(() => fn.call(this, e), window.__delayAsk); else fn.call(this, e); })); } });
    const add = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function (type, fn, o) { if (this === window && type === 'storage' && typeof fn === 'function') { const w = (e) => { if (window.__delayAsk && String(e.key).startsWith('nutriserve.remaster.handoff')) setTimeout(() => fn(e), window.__delayAsk); else fn(e); }; return add.call(this, type, w, o); } return add.call(this, type, fn, o); };
  })()`;
  /** A holder (in its own context) with a second ticket taken after its last autosave; storage full when `full`. */
  const delayedHolder = async (user, full) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await seed(context, user, MID_DAY);
    await context.addInitScript(DELAY_ASK);
    const A = await open(context, user);
    await cont(A);
    await A.getByRole('button', { name: 'Resume' }).click().catch(() => {});
    if (full) await fill(A);
    await A.getByRole('button', { name: /^Take .* order$/ }).click().catch(() => {});
    await A.waitForTimeout(4300); // just past an autosave
    await A.getByRole('button', { name: /^Order station/ }).click();
    await A.getByRole('button', { name: /^Take .* order$/ }).click().catch(() => {});
    await A.waitForTimeout(200);
    return { context, A };
  };

  // M1: a holder that answers after the asking tab stopped waiting (and while its kitchen opens, or
  // after) still gets its newest state to it, with storage working or full.
  for (const [delay, full] of [[900, false], [1000, true], [1500, false], [1500, true]]) {
    const user = `gate14late${delay}${full ? 'f' : ''}${tag}`;
    const { context, A } = await delayedHolder(user, full);
    const B = await open(context, user);
    await A.evaluate((d) => (window.__delayAsk = d), delay);
    await cont(B);
    await B.waitForTimeout(delay + 1200);
    const a = await gameOf(A), b = await gameOf(B), st = await stored(B);
    const ok = a && b && b.now === a.now && b.tickets === a.tickets && (full || st?.tickets === a.tickets) && (await told(A));
    check(ok, `regressions: a holder answering ${delay} ms late${full ? ' with storage full' : ''} still hands over its newest state (A ${JSON.stringify(a)}, B ${JSON.stringify(b)}, stored ${st?.tickets} tickets)`);
    await context.close();
  }

  // M2: storage full, the asking tab leaves before the (late) handover arrives: Continue here in the
  // holder brings back its own newest state, which only it had.
  {
    const user = `gate14exit${tag}`;
    const { context, A } = await delayedHolder(user, true);
    const before = await gameOf(A);
    const B = await open(context, user);
    await A.evaluate(() => (window.__delayAsk = 400));
    await B.getByRole('button', { name: /^Continue day/ }).click();
    await B.getByRole('button', { name: 'Back to games' }).click();
    await A.waitForTimeout(1500);
    const aTold = await told(A);
    await A.evaluate(() => (window.__delayAsk = 0));
    await A.getByRole('button', { name: 'Continue here' }).click();
    await A.waitForTimeout(1500);
    const after = await gameOf(A);
    check(aTold && before && after && after.tickets === before.tickets && after.now >= before.now,
      `regressions: with storage full, a handover the asking tab never opened comes back on Continue here (before ${JSON.stringify(before)}, after ${JSON.stringify(after)})`);
    await context.close();
  }

  // M3: after a kitchen stops (an error), another tab takes the save and plays on; "Start a new day
  // with your progress" in the stopped tab shows the save as it now is instead of overwriting it.
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const user = `gate14fatal${tag}`;
    await seed(context, user, NEAR_END);
    const A = await open(context, user);
    await cont(A);
    await A.evaluate(() => {
      const el = document.querySelector('.ns-root');
      let f = el[Object.keys(el).find((k) => k.startsWith('__reactFiber$'))];
      while (f && !(f.type && f.type.name === 'Kitchen')) f = f.return;
      const ref = f.memoizedState.memoizedState;
      ref.current = { ...ref.current, prepSlots: null, paused: false };
    });
    await A.getByRole('heading', { name: 'The kitchen stopped' }).waitFor({ timeout: 5000 });
    const B = await open(context, user);
    await cont(B);
    await finishBuyLeave(B);
    const afterB = await stored(A);
    await A.getByRole('button', { name: 'Start a new day with your progress' }).click();
    await A.waitForSelector('.ns-start');
    await A.waitForTimeout(300);
    const notice = await A.locator('.ns-save-notice').innerText().catch(() => '');
    const offers = await A.getByRole('button', { name: /^Continue day/ }).count();
    const later = await stored(A);
    check(afterB?.ups === 'rice_scoop' && later?.ups === afterB.ups && later.coins === afterB.coins && later.done === afterB.done && /may have changed/.test(notice) && offers === 1,
      `regressions: a stopped kitchen's "Start a new day" doesn't overwrite another tab's newer progress (${JSON.stringify(afterB)} -> ${JSON.stringify(later)}; notice "${notice.slice(0, 60)}")`);
    await context.close();
  }

  // L: the port's union edit reads code (comments, strings, trailing pipes, generics, CRLF). The port
  // script is branch tooling and isn't carried to main, so main's gate has no such check.
  const portScript = path.join(__dirname, '..', 'nutriserve-port-to-main.py');
  if (fs.existsSync(portScript)) {
    const r = require('node:child_process').spawnSync('python3', [portScript, '--self-test'], { encoding: 'utf8' });
    check(r.status === 0, `regressions: the port's union self-test passes (${(r.stdout || r.stderr || '').trim().split('\n').pop()})`);
  }
}

async function runAudit15(browser) {
  const tag = Date.now();
  const { saveKeyOf, toStart, open, cont, stored, seed, NEAR_END, MID_DAY, finishBuyLeave, told } = tabKit();
  /** The kitchen's game in a page, or null. */
  const gameOf = (pg) =>
    pg.evaluate(() => {
      const el = document.querySelector('.ns-root');
      if (!el) return null;
      let f = el[Object.keys(el).find((k) => k.startsWith('__reactFiber$'))];
      while (f && !(f.type && f.type.name === 'Kitchen')) f = f.return;
      const s = f?.memoizedState.memoizedState.current;
      return s ? { run: s.runId, tickets: s.tickets.length, now: s.nowMs, coins: s.profile.coins, ups: s.profile.upgrades.join('+') || '-' } : null;
    });
  /** The stored save's run, clock and tickets. */
  const storedGame = (pg) =>
    pg.evaluate(() => {
      const k = Object.keys(localStorage).find((x) => x.startsWith('nutriserve.remaster.save.v1:'));
      const raw = k && localStorage.getItem(k);
      if (!raw) return null;
      const s = JSON.parse(raw).state;
      return { run: s.runId, tickets: s.tickets.length, now: s.nowMs, coins: s.profile.coins, ups: s.profile.upgrades.join('+') || '-' };
    });
  // A busy page (a long task): pages here run on their own threads, so the other tab keeps going.
  const block = (pg, ms) => pg.evaluate((ms) => new Promise((r) => setTimeout(() => { const t = performance.now(); while (performance.now() - t < ms); r(); }, 0)), ms);
  const resume = (pg) => pg.getByRole('dialog', { name: 'Paused' }).getByRole('button', { name: 'Resume' }).click({ timeout: 2000 }).catch(() => {});
  const fill = (pg) =>
    pg.evaluate(() => {
      const big = 'x'.repeat(512 * 1024);
      try { for (let n = 0; n < 40; n++) localStorage.setItem('gateFillA' + n, big); } catch {}
      let size = 256 * 1024;
      for (let k = 0; size >= 1; ) { try { localStorage.setItem('gateFillB' + k++, 'x'.repeat(size)); } catch { size = Math.floor(size / 2); } }
    });

  // H1: the holder's page is busy for 3 s while another tab takes the save over and plays; when it
  // wakes, it doesn't write its older copy over the save, and the tab being played goes on.
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const user = `gate15busy${tag}`;
    await seed(context, user, MID_DAY);
    const A = await open(context, user);
    await cont(A);
    await A.getByRole('button', { name: /^Take .* order$/ }).click().catch(() => {});
    await A.waitForTimeout(4900); // past an autosave, then unsaved play
    const B = await open(context, user);
    const busy = block(A, 3000);
    await B.waitForTimeout(50);
    await cont(B);
    await resume(B);
    await B.waitForTimeout(600);
    await busy;
    await B.waitForTimeout(2500);
    const b = await gameOf(B), st = await storedGame(B), bTold = await told(B), aTold = await told(A);
    check(b && st && !bTold && aTold && st.run === b.run && st.now <= b.now && b.now - st.now < 4500,
      `regressions: a tab busy for 3 s while another took the save over doesn't write over it when it wakes; the game being played goes on (B ${JSON.stringify(b)}, stored ${JSON.stringify(st)}, B told ${bTold}, A told ${aTold})`);
    await context.close();
  }

  // H1: New game while the holder is busy for 2.5 s: the new game stays.
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const user = `gate15new${tag}`;
    await seed(context, user, MID_DAY);
    const A = await open(context, user);
    await cont(A);
    await A.waitForTimeout(1000);
    const B = await open(context, user);
    const busy = block(A, 2500);
    await B.waitForTimeout(50);
    await B.getByRole('button', { name: 'New game' }).click();
    await B.waitForSelector('.ns-hud');
    await busy;
    await B.waitForTimeout(2000);
    const b = await gameOf(B), st = await storedGame(B);
    check(b && st && st.run === b.run && b.run !== 'run-gate-a13-mid' && !(await told(B)) && (await told(A)),
      `regressions: a new game started while the other tab was busy stays (B ${b?.run}, stored ${st?.run})`);
    await context.close();
  }

  // H1: a write by a tab that doesn't hold the save (an older copy) is put back by the tab that does.
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const user = `gate15restore${tag}`;
    await seed(context, user, MID_DAY);
    const A = await open(context, user);
    await cont(A);
    await A.getByRole('button', { name: /^Take .* order$/ }).click().catch(() => {});
    await A.waitForTimeout(4300);
    const key = await saveKeyOf(A);
    const older = await A.evaluate((k) => localStorage.getItem(k), key);
    await A.waitForTimeout(4300);
    const C = await context.newPage();
    await C.goto(`${BASE}/nutriserve-art-lab.html`, { waitUntil: 'load' });
    await C.evaluate(({ k, v }) => localStorage.setItem(k, v), { k: key, v: older });
    await A.waitForTimeout(800);
    const a = await gameOf(A), st = await storedGame(A), olderNow = JSON.parse(older).state.nowMs;
    check(a && st && !(await told(A)) && st.now > olderNow && st.run === a.run,
      `regressions: the tab holding the save puts its game back over an older copy written by a tab that doesn't hold it (older ${olderNow}, stored ${st?.now}, A ${a?.now})`);
    await context.close();
  }

  // M1: on the day summary (the clock stopped), a late copy from before a purchase isn't taken; one
  // with the purchase is.
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const user = `gate15summary${tag}`;
    await seed(context, user, NEAR_END);
    const A = await open(context, user);
    await cont(A);
    await resume(A);
    await A.waitForSelector('.ns-summary', { timeout: 20000 });
    const key = await saveKeyOf(A);
    await A.locator('.ns-summary').getByRole('button', { name: 'Save & exit' }).click();
    await A.waitForTimeout(300);
    const before = await A.evaluate((k) => localStorage.getItem(k), key);
    await toStart(A); // Save & exit goes back to the games list
    await cont(A);
    await A.locator('.ns-upgrades li', { hasText: 'Brass rice scoop' }).getByRole('button').click();
    await A.locator('.ns-summary').getByRole('button', { name: 'Save & exit' }).click();
    await A.waitForTimeout(300);
    const bought = await A.evaluate((k) => localStorage.getItem(k), key);
    // B opens the copy from before the purchase; the purchase then arrives late, and after it the older copy.
    await A.evaluate(({ k, v }) => localStorage.setItem(k, v), { k: key, v: before });
    await toStart(A);
    const B = await open(context, user);
    await cont(B);
    const userId = key.slice('nutriserve.remaster.save.v1:'.length);
    const post = (raw) => A.evaluate(({ id, raw }) => { const ch = new BroadcastChannel(`nutriserve.remaster.tabs.v1:${id}`); ch.postMessage({ kind: 'ceded', from: 'gate', to: 'gate', raw, anyHolder: true }); ch.close(); }, { id: userId, raw });
    await post(bought);
    await B.waitForTimeout(600);
    const took = await gameOf(B);
    await post(before);
    await B.waitForTimeout(600);
    const kept = await gameOf(B), st = await storedGame(B);
    check(took?.ups === 'rice_scoop' && kept?.ups === 'rice_scoop' && kept.coins === took.coins && st?.ups === 'rice_scoop',
      `regressions: on the day summary a late copy with a purchase is taken and an older one is not (took ${JSON.stringify(took)}, then ${JSON.stringify(kept)}, stored ${JSON.stringify(st)})`);
    await context.close();
  }

  // M1: the same through the back/forward cache: a tab left on the summary comes back after another
  // tab bought something and reopened the day; the purchase stays.
  {
    const bf = await chromium.launch({ channel: 'chromium', ignoreDefaultArgs: ['--disable-back-forward-cache'] });
    const context = await bf.newContext({ viewport: { width: 1280, height: 900 } });
    const user = `gate15bf${tag}`;
    await seed(context, user, NEAR_END);
    const A = await open(context, user);
    await cont(A);
    await resume(A);
    await A.waitForSelector('.ns-summary', { timeout: 20000 });
    await A.goto(`${BASE}/nutriserve-art-lab.html`, { waitUntil: 'load' });
    const B = await open(context, user);
    await cont(B);
    await finishBuyLeave(B);
    await toStart(B);
    await cont(B);
    await A.goBack({ waitUntil: 'commit' });
    await A.waitForTimeout(2500);
    const b = await gameOf(B), st = await stored(B);
    check(b?.ups === 'rice_scoop' && st?.ups === 'rice_scoop' && st.coins === b.coins,
      `regressions: a tab back from the back/forward cache on the day summary doesn't undo a purchase another tab made (B ${JSON.stringify(b)}, stored ${JSON.stringify(st)})`);
    await bf.close();
  }

  // L1: storage full before the first kitchen opens (no writer record): the next tab still gets the
  // open kitchen's newest state, and that kitchen stops.
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const user = `gate15full${tag}`;
    await seed(context, user, MID_DAY);
    const A = await open(context, user);
    await fill(A);
    await cont(A);
    await resume(A);
    await A.getByRole('button', { name: /^Take .* order$/ }).click().catch(() => {});
    await A.waitForTimeout(1500);
    const a = await gameOf(A);
    const B = await open(context, user);
    await cont(B);
    await B.waitForTimeout(800);
    const b = await gameOf(B);
    check(a && b && (await told(A)) && b.tickets === a.tickets && b.now >= a.now,
      `regressions: with storage full before any kitchen opened, the next tab still gets the open kitchen's newest state (A ${JSON.stringify(a)}, B ${JSON.stringify(b)})`);
    await context.close();
  }
}

async function runAudit16(browser) {
  const tag = Date.now();
  const { open, toStart, cont, seed, MID_DAY, told } = tabKit();
  const gameOf = (pg) =>
    pg.evaluate(() => {
      const el = document.querySelector('.ns-root');
      if (!el) return null;
      let f = el[Object.keys(el).find((k) => k.startsWith('__reactFiber$'))];
      while (f && !(f.type && f.type.name === 'Kitchen')) f = f.return;
      const s = f?.memoizedState.memoizedState.current;
      return s ? { run: s.runId, tickets: s.tickets.length, now: s.nowMs, rev: s.rev ?? 0 } : null;
    });
  const storedGame = (pg) =>
    pg.evaluate(() => {
      const k = Object.keys(localStorage).find((x) => x.startsWith('nutriserve.remaster.save.v1:'));
      const raw = k && localStorage.getItem(k);
      if (!raw) return null;
      const s = JSON.parse(raw).state;
      return { run: s.runId, tickets: s.tickets.length, now: s.nowMs, rev: s.rev ?? 0 };
    });
  const writerOf = (pg) =>
    pg.evaluate(() => {
      const k = Object.keys(localStorage).find((x) => x.startsWith('nutriserve.remaster.writer.v1:'));
      try { return (k && JSON.parse(localStorage.getItem(k))?.tab) || null; } catch { return null; }
    });
  // A long task; `after` runs in the same task right after it (a page closed the moment it ends).
  const block = (pg, ms, after) =>
    pg.evaluate(({ ms, after }) => new Promise((r) => setTimeout(() => {
      const t = performance.now();
      while (performance.now() - t < ms);
      if (after === 'pagehide') window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false }));
      r();
    }, 0)), { ms, after });
  const resume = (pg) => pg.getByRole('dialog', { name: 'Paused' }).getByRole('button', { name: 'Resume' }).click({ timeout: 2000 }).catch(() => {});

  // M1: Save & exit clicked while the page is busy (the click runs the moment its long task ends),
  // after another tab took the save over and played: the busy tab writes nothing over it and leaves
  // the other tab's writer record, so a third tab asks the tab being played and opens its newest state.
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const user = `gate16exit${tag}`;
    await seed(context, user, MID_DAY);
    const A = await open(context, user);
    await cont(A);
    await resume(A);
    await A.waitForTimeout(4500);
    const B = await open(context, user);
    const C = await open(context, user);
    const box = await A.getByRole('button', { name: 'Save & exit' }).first().boundingBox();
    const cdp = await context.newCDPSession(A);
    const t0 = Date.now();
    const busy = block(A, 7000);
    await B.waitForTimeout(100);
    await cont(B);
    await resume(B);
    const bTab = await writerOf(B);
    while (Date.now() - t0 < 5800) await B.waitForTimeout(200);
    const bStored = await storedGame(B);
    for (const type of ['mousePressed', 'mouseReleased']) cdp.send('Input.dispatchMouseEvent', { type, x: box.x + box.width / 2, y: box.y + box.height / 2, button: 'left', clickCount: 1 }).catch(() => {});
    await busy;
    await B.waitForTimeout(1500);
    const w = await writerOf(B), st = await storedGame(B), aLeft = (await A.locator('.ns-hud').count()) === 0, bTold = await told(B);
    check(bTab && w === bTab && aLeft && !bTold && st && bStored && st.now >= bStored.now,
      `regressions: Save & exit clicked while the page was busy writes nothing over the other tab's save and leaves its writer record (record kept ${w === bTab}, A left ${aLeft}, stored ${st?.now} after ${bStored?.now}, B told ${bTold})`);
    const bLive = await gameOf(B);
    await cont(C);
    const c = await gameOf(C);
    check(c && bLive && c.now >= bLive.now && (await told(B)),
      `regressions: after that, a third tab asks the tab being played and opens its newest state (C ${c?.now}, B was at ${bLive?.now})`);
    await context.close();
  }

  // L1: a tab takes an order, leaves and opens the kitchen again; a busy tab's older copy of the day
  // (a fork without that order) then arrives late: the order stays.
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const user = `gate16fork${tag}`;
    await seed(context, user, MID_DAY);
    const A = await open(context, user);
    const B = await open(context, user);
    await cont(A);
    await resume(A);
    for (let i = 0; i < 120; i++) {
      const a = await gameOf(A), st = await storedGame(A);
      if (a && st && a.now - st.now >= 2500) break;
      await A.waitForTimeout(50);
    }
    const busy = block(A, 9000);
    await B.waitForTimeout(100);
    await cont(B);
    await resume(B);
    await B.waitForTimeout(300);
    await B.getByRole('button', { name: /^Take .* order$/ }).click({ timeout: 3000 }).catch(() => {});
    await B.waitForTimeout(300);
    await B.getByRole('button', { name: /^Pause/ }).first().click();
    await B.getByRole('dialog', { name: 'Paused' }).getByRole('button', { name: 'Save & exit' }).click();
    await toStart(B);
    await cont(B);
    const reopened = await gameOf(B);
    await busy;
    await B.waitForTimeout(3000);
    const b = await gameOf(B), st = await storedGame(B);
    check(reopened && reopened.tickets >= 1 && b && st && b.tickets === reopened.tickets && st.tickets === reopened.tickets && !(await told(B)) && (await told(A)),
      `regressions: a kitchen reopened in the tab that played keeps that play over a busy tab's late fork (reopened ${JSON.stringify(reopened)}, then ${JSON.stringify(b)}, stored ${JSON.stringify(st)})`);
    await context.close();
  }

  // M1 (pagehide): a busy page closed the moment its long task ends can't wait, so it may write its
  // older copy and let go of the save; the tab holding the save puts its game back and records
  // itself again, and stays live.
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const user = `gate16hide${tag}`;
    await seed(context, user, MID_DAY);
    const A = await open(context, user);
    await cont(A);
    await resume(A);
    await A.waitForTimeout(4500);
    const B = await open(context, user);
    const t0 = Date.now();
    const busy = block(A, 7000, 'pagehide');
    await B.waitForTimeout(100);
    await cont(B);
    await resume(B);
    const bTab = await writerOf(B);
    while (Date.now() - t0 < 5800) await B.waitForTimeout(200);
    const bStored = await storedGame(B);
    await busy;
    await B.waitForTimeout(1500);
    const w = await writerOf(B), st = await storedGame(B), b = await gameOf(B), bTold = await told(B);
    check(bTab && w === bTab && !bTold && b && st && st.run === b.run && st.now >= bStored.now,
      `regressions: a busy page's write and let-go on its way out are undone by the tab holding the save (record kept ${w === bTab}, stored ${st?.now} after ${bStored?.now}, B told ${bTold})`);
    await context.close();
  }
}

async function runAudit17(browser) {
  const tag = Date.now();
  const { open, toStart, cont, seed, MID_DAY, told } = tabKit();
  const TWO_WAITING = MID_DAY.replace("run-gate-a13-mid", "run-gate-a17-two").replace(
    "while (!s.day.customers.some((c) => c.phase === 'at_counter'))",
    "while (s.day.customers.filter((c) => c.phase === 'at_counter').length < 2)"
  );
  const gameOf = (pg) =>
    pg.evaluate(() => {
      const el = document.querySelector('.ns-root');
      if (!el) return null;
      let f = el[Object.keys(el).find((k) => k.startsWith('__reactFiber$'))];
      while (f && !(f.type && f.type.name === 'Kitchen')) f = f.return;
      const s = f?.memoizedState.memoizedState.current;
      return s ? { run: s.runId, tickets: s.tickets.length, now: s.nowMs, rev: s.rev ?? 0 } : null;
    });
  const storedGame = (pg) =>
    pg.evaluate(() => {
      const k = Object.keys(localStorage).find((x) => x.startsWith('nutriserve.remaster.save.v1:'));
      const raw = k && localStorage.getItem(k);
      if (!raw) return null;
      const s = JSON.parse(raw).state;
      return { run: s.runId, tickets: s.tickets.length, now: s.nowMs, rev: s.rev ?? 0 };
    });
  const block = (pg, ms) => pg.evaluate((ms) => new Promise((r) => setTimeout(() => { const t = performance.now(); while (performance.now() - t < ms); r(); }, 0)), ms);
  const resume = (pg) => pg.getByRole('dialog', { name: 'Paused' }).getByRole('button', { name: 'Resume' }).click({ timeout: 2000 }).catch(() => {});
  const takeOrder = (pg) => pg.getByRole('button', { name: /^Take .* order$/ }).first().click({ timeout: 3000 }).catch(() => {});
  const fill = (pg) =>
    pg.evaluate(() => {
      const big = 'x'.repeat(512 * 1024);
      try { for (let n = 0; n < 40; n++) localStorage.setItem('gateFillA' + n, big); } catch {}
      let size = 256 * 1024;
      for (let k = 0; size >= 1; ) { try { localStorage.setItem('gateFillB' + k++, 'x'.repeat(size)); } catch { size = Math.floor(size / 2); } }
    });

  // L1: storage full from the start (no writer record, and the request goes only over the channel).
  // The holder takes an order, then its page is busy for 3 s while another tab continues: that tab
  // says over the channel that it took the save, so the holder stops when its task ends and sends
  // its newer copy; only one tab plays, with the order.
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const user = `gate17full${tag}`;
    await seed(context, user, MID_DAY);
    const A = await open(context, user);
    await fill(A);
    await cont(A);
    await resume(A);
    await A.waitForTimeout(500);
    await takeOrder(A);
    await A.waitForTimeout(800);
    const before = await gameOf(A);
    const B = await open(context, user);
    const busy = block(A, 3000);
    await B.waitForTimeout(100);
    await cont(B);
    await busy;
    await B.waitForTimeout(2500);
    const b = await gameOf(B), aTold = await told(A), bTold = await told(B);
    check(before && before.tickets === 1 && aTold && !bTold && b && b.tickets === before.tickets,
      `regressions: with storage full, a holder busy for 3 s stops when another tab took the save meanwhile, and that tab gets its order (A stopped ${aTold}, B stopped ${bTold}, B ${JSON.stringify(b)}, A had ${JSON.stringify(before)})`);
    await context.close();
  }

  // L2: a tab takes an order and leaves (Save & exit); storage fills up; another tab continues that
  // copy and takes a second order (it can't save it), then is busy for 1.5 s while the first tab
  // continues: the first tab takes the second tab's later copy, which follows from the one it saved.
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const user = `gate17played${tag}`;
    await seed(context, user, TWO_WAITING);
    const A = await open(context, user);
    await cont(A);
    await resume(A);
    await A.waitForTimeout(300);
    await takeOrder(A);
    await A.waitForTimeout(300);
    await A.getByRole('button', { name: 'Save & exit' }).first().click();
    await toStart(A);
    const saved = await storedGame(A);
    await fill(A);
    const C = await open(context, user);
    await cont(C);
    await resume(C);
    await takeOrder(C);
    await C.waitForTimeout(200);
    const c = await gameOf(C);
    const busy = block(C, 1500);
    await A.waitForTimeout(100);
    await cont(A);
    await busy;
    await A.waitForTimeout(2500);
    const a = await gameOf(A), aTold = await told(A), cTold = await told(C);
    check(saved && saved.tickets === 1 && c && c.tickets === 2 && a && a.tickets === 2 && !aTold && cTold,
      `regressions: with storage full, a reopened kitchen takes another tab's later play on the copy it saved (A ${JSON.stringify(a)}, C had ${JSON.stringify(c)}, A stopped ${aTold}, C stopped ${cTold})`);
    await context.close();
  }

  // And a fork is still refused with storage full: as audit 16's L1, but storage fills up after the
  // tab that played leaves, so it can't tell from a writer record that the busy tab held the save.
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const user = `gate17fork${tag}`;
    await seed(context, user, MID_DAY);
    const A = await open(context, user);
    const B = await open(context, user);
    await cont(A);
    await resume(A);
    for (let i = 0; i < 120; i++) {
      const a = await gameOf(A), st = await storedGame(A);
      if (a && st && a.now - st.now >= 2500) break;
      await A.waitForTimeout(50);
    }
    const busy = block(A, 9000);
    await B.waitForTimeout(100);
    await cont(B);
    await resume(B);
    await B.waitForTimeout(300);
    await takeOrder(B);
    await B.waitForTimeout(300);
    await B.getByRole('button', { name: /^Pause/ }).first().click();
    await B.getByRole('dialog', { name: 'Paused' }).getByRole('button', { name: 'Save & exit' }).click();
    await toStart(B);
    await fill(B);
    await cont(B);
    const reopened = await gameOf(B);
    await busy;
    await B.waitForTimeout(3000);
    const b = await gameOf(B);
    check(reopened && reopened.tickets >= 1 && b && b.tickets === reopened.tickets && !(await told(B)) && (await told(A)),
      `regressions: with storage full too, a kitchen reopened in the tab that played keeps that play over a busy tab's late fork (reopened ${JSON.stringify(reopened)}, then ${JSON.stringify(b)})`);
    await context.close();
  }
}

(async () => {
  const browser = await chromium.launch();
  const results = {};
  // GATE_ONLY=regressions|audit11|audit12|audit13|audit14|audit15|audit16|audit17|devices runs one part (for working on it); the gate is all of them.
  const only = process.env.GATE_ONLY;
  const part = (name) => !only || only === name;
  if (part('regressions')) await runRegressions(browser);
  if (part('audit11')) await runAudit11(browser);
  if (part('audit12')) await runAudit12(browser);
  if (part('audit13')) await runAudit13(browser);
  if (part('audit14')) await runAudit14(browser);
  if (part('audit15')) await runAudit15(browser);
  if (part('audit16')) await runAudit16(browser);
  if (part('audit17')) await runAudit17(browser);
  if (part('devices')) {
    results.desktop = await runDevice(browser, 'desktop', { viewport: { width: 1280, height: 1000 } });
    results.wide = await runDevice(browser, 'wide', { viewport: { width: 1920, height: 1080 } });
    results.phone = await runDevice(browser, 'phone', { ...devices['iPhone 13'] }, { touch: true });
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'gate.json'), JSON.stringify({ checks, results }, null, 2));
  const failed = checks.filter((c) => !c.ok);
  console.log(`\n${checks.length - failed.length}/${checks.length} checks passed. Output: ${OUT}`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
