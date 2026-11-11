// NutriServe Kitchen release gate (C08), driven through the real UI with Playwright.
//
//   npm run dev                                   # in one terminal
//   node scripts/e2e/nutriserve-release-gate.cjs [baseUrl] [outDir]
//
// For desktop (1280px) and phone (iPhone 13) it plays one whole day: two concurrent orders, Save &
// exit mid-prep then Continue (progress must survive), one dish served to the wrong ticket, the rest
// served normally, then the day summary. It also records sprite download/decoded-memory costs.
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

(async () => {
  const browser = await chromium.launch();
  const results = {};
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
