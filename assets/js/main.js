// main.js — entry point.
// 1. load data/portfolio.json   2. apply accent + theme   3. render the files
// 4. start the router (URL hash → open file), the terminal and the status-bar clock.

import { applyAccent, timeAt, utcLabel, text, esc } from './utils.js';
import { initTheme, applyDefaultMode } from './theme.js';
import { renderAll } from './render.js';
import { initRouter } from './router.js';
import { initTerminal } from './terminal.js';

const DATA_URL = 'data/portfolio.json';

async function loadData() {
  // no-cache = always ask the server for the newest JSON after you edit it
  const res = await fetch(DATA_URL, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Could not load ${DATA_URL} (HTTP ${res.status})`);
  return res.json();
}

function startClock(person = {}) {
  const tick = () => text('status-time', `${timeAt(person.utcOffset)} ${utcLabel(person.utcOffset)}`);
  tick();
  setInterval(tick, 30_000);
}

/** "Copy email" buttons: modern clipboard API, with an old-school fallback for http:// pages. */
function initCopyButtons() {
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-copy]');
    if (!btn) return;
    const value = btn.dataset.copy;
    try {
      await navigator.clipboard.writeText(value);
    } catch (_) {
      const ta = Object.assign(document.createElement('textarea'), { value });
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (__) { /* nothing else to try */ }
      ta.remove();
    }
    const label = btn.textContent;
    btn.textContent = 'Copied ✓';
    btn.classList.add('is-done');
    setTimeout(() => { btn.textContent = label; btn.classList.remove('is-done'); }, 1800);
  });
}

function showLoadError(err) {
  console.error('[portfolio] Content failed to load:', err);
  const local = location.protocol === 'file:';
  const box = document.querySelector('[data-slot="panel-readme"]');
  if (box) {
    box.innerHTML = `<p class="comment"># error</p>
      <p style="margin-top:12px;color:var(--muted)">Couldn't load <span class="mono">data/portfolio.json</span>: ${esc(err.message)}.</p>
      ${local ? '<p style="margin-top:8px;color:var(--muted)">You opened the file directly. Browsers block <span class="mono">fetch()</span> on file:// — run a local server (see README → "Run it locally").</p>' : ''}`;
  }
}

async function main() {
  initTheme();          // the theme button works even if the JSON fails
  initCopyButtons();
  try {
    const data = await loadData();
    applyAccent(data.theme?.accent);
    applyDefaultMode(data.theme?.mode);
    const files = renderAll(data);
    let terminal = null;
    const router = initRouter(files, { onOpen: (file, info) => terminal?.note(file, info) });
    terminal = initTerminal(data, router);
    startClock(data.person);
  } catch (err) {
    showLoadError(err);
  }
}

main();
