/**
 * Screenshot gallery capture for Self-Improving Research Team
 * Run: node scripts/capture-screenshots.mjs
 * Requires the dev server to be running on http://localhost:3000
 */
import puppeteer from 'puppeteer';
import { mkdirSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'http://localhost:3000';
const OUT_BASE = join(import.meta.dirname, '..', 'docs', 'screenshots');
const W = 1440, H = 900;

const dirs = [
  '01-dashboard',
  '02-research',
  '03-mem0-memory',
  '04-autoskill',
  '05-token-telemetry',
  '06-cli-console',
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

async function shot(filename, desc) {
  await wait(1000);
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

// ── 1. Landing / Dashboard ───────────────────────────────────────
await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
await shot('01-dashboard/01-studio-ready.png', 'Studio — ready state');

await clickBtn('Minimal Form');
await shot('01-dashboard/02-minimal-form.png', 'Minimal Form view');

await clickBtn('Preview All');
await shot('01-dashboard/03-preview-all.png', 'Preview All panels');

// restore Studio
await clickBtn('Studio');

// ── 2. Research Workflow — before launch ─────────────────────────
await clickTab('Research Workflow');
await shot('02-research/01-prompt-input.png', 'Research Workflow — prompt input ready');

// Launch the research team and capture live activity
console.log('Launching research team...');
await clickBtn('Launch Research Team');
await wait(3000);
await shot('02-research/02-research-running.png', 'Research Workflow — agents running');
await wait(4000);
await shot('02-research/03-research-progress.png', 'Research Workflow — mid-run progress');

// ── 3. Mem0 Memory (may populate during/after run) ───────────────
await clickTab('Mem0 Memory');
await shot('03-mem0-memory/01-mem0-panel.png', 'Mem0 Memory panel');

// ── 4. AutoSkill Evolution ───────────────────────────────────────
await clickTab('AutoSkill Evolution');
await shot('04-autoskill/01-autoskill-panel.png', 'AutoSkill Evolution panel');

// ── 5. Token Telemetry ───────────────────────────────────────────
await clickTab('Token Telemetry');
await shot('05-token-telemetry/01-token-telemetry.png', 'Token Telemetry — live counters');

// ── 6. CLI Console ───────────────────────────────────────────────
await clickTab('CLI Console');
await shot('06-cli-console/01-cli-console.png', 'CLI Console');

// Terminal view
await clickBtn('Terminal');
await shot('06-cli-console/02-terminal-view.png', 'Terminal view');

// Back to Studio to capture final Research output
await clickBtn('Studio');
await clickTab('Research Workflow');
await wait(6000); // let agents complete
await shot('02-research/04-research-complete.png', 'Research Workflow — completed output');

// Mem0 after run — likely populated
await clickTab('Mem0 Memory');
await shot('03-mem0-memory/02-mem0-populated.png', 'Mem0 Memory — after research run');

// AutoSkill after run
await clickTab('AutoSkill Evolution');
await shot('04-autoskill/02-autoskill-populated.png', 'AutoSkill Evolution — after research run');

await browser.close();
console.log('\nAll screenshots captured to docs/screenshots/');
