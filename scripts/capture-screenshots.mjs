/**
 * Screenshot gallery capture for Self-Improving Research Team
 * Run: ~/.nvm/versions/node/v22.19.0/bin/node scripts/capture-screenshots.mjs
 * Requires the dev server running on http://localhost:3000 with API keys in .env
 */
import puppeteer from 'puppeteer';
import { mkdirSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'http://localhost:3000';
const OUT_BASE = join(import.meta.dirname, '..', 'docs', 'screenshots');
const W = 1440, H = 900;

const dirs = [
  '01-dashboard', '02-research', '03-mem0-memory',
  '04-autoskill', '05-token-telemetry', '06-cli-console',
];
for (const d of dirs) mkdirSync(join(OUT_BASE, d), { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  defaultViewport: { width: W, height: H },
});
const page = await browser.newPage();

async function wait(ms = 1200) { await new Promise(r => setTimeout(r, ms)); }

async function hideModeSwitcher() {
  await page.evaluate(() => {
    // Hide the UI mode-switcher pill (Studio/Minimal Form/Terminal/Preview All)
    document.querySelectorAll('div').forEach(el => {
      if (el.className && typeof el.className === 'string' &&
          el.className.includes('bg-slate-100') && el.className.includes('p-1') &&
          el.className.includes('rounded-lg')) {
        el.style.visibility = 'hidden';
      }
    });
  });
}

async function shot(filename, desc) {
  await hideModeSwitcher();
  await wait(600);
  await page.screenshot({ path: join(OUT_BASE, filename) });
  console.log(`✓ ${desc} → ${filename}`);
}

async function clickBtn(textFragment) {
  await page.evaluate((txt) => {
    const el = [...document.querySelectorAll('button')].find(b => b.textContent.includes(txt));
    if (el) el.click();
  }, textFragment);
  await wait(800);
}

async function clickTab(label) {
  await page.evaluate((txt) => {
    const el = [...document.querySelectorAll('button, [role="tab"]')]
      .find(b => b.textContent.trim().startsWith(txt));
    if (el) el.click();
  }, label);
  await wait(800);
}

// ── 1. Dashboard UI variants ─────────────────────────────────────
await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
await shot('01-dashboard/01-studio-ready.png', 'Studio — ready state');

await clickBtn('Minimal Form');
await shot('01-dashboard/02-minimal-form.png', 'Minimal Form view');

await clickBtn('Preview All');
await shot('01-dashboard/03-preview-all.png', 'Preview All panels');

await clickBtn('Studio');

// ── 2. Research Workflow ─────────────────────────────────────────
await clickTab('Research Workflow');
await shot('02-research/01-prompt-input.png', 'Research Workflow — prompt input ready');

console.log('Launching research team (real API keys active)...');
await clickBtn('Launch Research Team');
await wait(5000);
await shot('02-research/02-research-running.png', 'Research Workflow — agents running');
await wait(12000);
await shot('02-research/03-research-progress.png', 'Research Workflow — mid-run progress');

// ── 3. Mem0 Memory (capture mid-run) ─────────────────────────────
await clickTab('Mem0 Memory');
await shot('03-mem0-memory/01-mem0-mid-run.png', 'Mem0 Memory — mid-run state');

// ── 4. AutoSkill Evolution ───────────────────────────────────────
await clickTab('AutoSkill Evolution');
await shot('04-autoskill/01-autoskill-mid-run.png', 'AutoSkill Evolution — mid-run');

// ── 5. Token Telemetry ───────────────────────────────────────────
await clickTab('Token Telemetry');
await shot('05-token-telemetry/01-token-telemetry.png', 'Token Telemetry — live counters');

// ── 6. CLI Console ───────────────────────────────────────────────
await clickTab('CLI Console');
await shot('06-cli-console/01-cli-console.png', 'CLI Console');

await clickBtn('Terminal');
await shot('06-cli-console/02-terminal-view.png', 'Terminal view');

// ── Wait for agents to finish, then capture final states ─────────
await clickBtn('Studio');
await clickTab('Research Workflow');
await wait(20000);
await shot('02-research/04-research-complete.png', 'Research Workflow — completed synthesis');

await clickTab('Mem0 Memory');
await shot('03-mem0-memory/02-mem0-populated.png', 'Mem0 Memory — after research run');

await clickTab('AutoSkill Evolution');
await shot('04-autoskill/02-autoskill-populated.png', 'AutoSkill Evolution — after research run');

await browser.close();
console.log('\nAll screenshots captured to docs/screenshots/');
