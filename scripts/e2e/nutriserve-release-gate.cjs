// NutriServe Kitchen release gate (C08), driven through the real UI with Playwright.
//
//   npm run dev                                   # in one terminal
//   node scripts/e2e/nutriserve-release-gate.cjs [baseUrl] [outDir]
//
// For desktop (1280px) and phone (iPhone 13) it plays one whole day: two concurrent orders, Save &
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
const RATES = { base: 80, main: 90, side: 50 }; // grams per second while held (BUILD_V1)
const IGNORE = /TUNNEL|Failed to fetch|Failed to load resource|supabase|priceService|marketService|resourcesService|gameProgressService|GameScoresContext/i;

const checks = [];
const check = (ok, what) => {
  checks.push({ ok: !!ok, what });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${what}`);
};

async function runDevice(browser, name, contextOptions) {
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
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
  const hold = async (locator, ms) => {
    await locator.scrollIntoViewIfNeeded();
    const b = await locator.boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(ms);
    await page.mouse.up();
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

  const slotUnits = async (n) => {
    const t = await page.getByRole('region', { name: `Prep slot ${n}` }).innerText();
    const m = t.match(/(\d+) (?:\/|units)/);
    return m ? Number(m[1]) : null;
  };

  async function finishPrep(n, target) {
    await station('Prep');
    for (let i = 0; i < 500; i++) {
      const u = await slotUnits(n);
      if (u === null || u >= target - 25) break;
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
      if (!m) {
        await page.mouse.move(cx, cy);
        await page.mouse.down();
        for (let a = 0; a < 36; a++) {
          const rr = r * (0.25 + 0.75 * ((a % 9) / 9));
          await page.mouse.move(cx + rr * Math.cos(a * 0.7), cy + rr * Math.sin(a * 0.7));
          await page.waitForTimeout(30);
        }
        await page.mouse.up();
      } else {
        for (let i = 0; i < Number(m[2]); i++) {
          const a = (i / Number(m[2])) * 2 * Math.PI;
          await page.mouse.click(cx + r * 0.8 * Math.cos(a), cy + r * 0.8 * Math.sin(a));
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
    return page.locator('.ns-toast').innerText();
  }

  const targetFor = (prep) => (/QUICK/.test(prep) ? 900 : /SLOW/.test(prep) ? 2700 : 1800);

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
  await target.scrollIntoViewIfNeeded();
  await p.evaluate(() => window.scrollBy(0, -120));
  await p.waitForTimeout(200);
  const tb = await target.boundingBox();
  const grams = async () => Number(((await p.locator('.ns-gauges').innerText()).match(/Main (\d+) g/) || [])[1]);
  const y0 = await p.evaluate(() => scrollY);
  const [x, y] = [tb.x + tb.width / 2, tb.y + tb.height / 2];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let i = 1; i <= 10; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + 12 * i }] });
    await p.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await p.waitForTimeout(400);
  const y1 = await p.evaluate(() => scrollY);
  const swiped = await grams();
  check(y1 < y0 && swiped === 0, `regressions: phone swipe on a dispenser scrolls (${y0} -> ${y1}) and pours nothing (${swiped} g)`);
  await target.scrollIntoViewIfNeeded();
  const tb2 = await target.boundingBox();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: tb2.x + tb2.width / 2, y: tb2.y + tb2.height / 2 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await p.waitForTimeout(400);
  check((await grams()) === 9, `regressions: a quick phone tap pours the 9 g minimum (${await grams()} g)`);
  await phone.close();
}

(async () => {
  const browser = await chromium.launch();
  const results = {};
  await runRegressions(browser);
  results.desktop = await runDevice(browser, 'desktop', { viewport: { width: 1280, height: 1000 } });
  results.phone = await runDevice(browser, 'phone', { ...devices['iPhone 13'] });
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'gate.json'), JSON.stringify({ checks, results }, null, 2));
  const failed = checks.filter((c) => !c.ok);
  console.log(`\n${checks.length - failed.length}/${checks.length} checks passed. Output: ${OUT}`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
