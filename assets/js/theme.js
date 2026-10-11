// theme.js — light/dark switch.
// Who decides the theme, in order:
//   1. the visitor's own choice (saved in localStorage when they press the button)
//   2. theme.mode in portfolio.json ("dark", "light" or "auto" = follow the system)
//   3. the data-theme written on <html> in index.html (used until the JSON arrives)
// The tiny inline script in <head> applies (1) before the first paint, so returning
// visitors never see a flash.

import { ICONS } from './utils.js';

const KEY = 'pf-theme';
const root = document.documentElement;
const BAR = { dark: '#0B101C', light: '#FFFFFF' };
let fadeTimer;
let jsonMode = null;

const current = () => (root.dataset.theme === 'light' ? 'light' : 'dark');
const systemTheme = () => (window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark');

function saved() {
  try { return localStorage.getItem(KEY); } catch (_) { return null; }
}

function refreshUI() {
  const t = current();
  const label = t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.setAttribute('aria-label', label);
    btn.title = label;
    btn.innerHTML = t === 'dark' ? ICONS.sun : ICONS.moon;
  });
  document.querySelectorAll('[data-theme-name]').forEach((el) => { el.textContent = t; });
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BAR[t]);
}

export function setTheme(theme, persist = false) {
  if (theme !== 'dark' && theme !== 'light') return;
  root.classList.add('theme-anim');                 // short colour fade, see base.css
  root.dataset.theme = theme;
  if (persist) { try { localStorage.setItem(KEY, theme); } catch (_) { /* private mode */ } }
  refreshUI();
  clearTimeout(fadeTimer);
  fadeTimer = setTimeout(() => root.classList.remove('theme-anim'), 450);
}

export const toggleTheme = () => setTheme(current() === 'dark' ? 'light' : 'dark', true);
export const currentTheme = current;

/** Called once the JSON has loaded. Only applies when the visitor hasn't chosen yet. */
export function applyDefaultMode(mode) {
  jsonMode = mode;
  if (saved()) return;
  if (mode === 'dark' || mode === 'light') setTheme(mode);
  else if (mode === 'auto') setTheme(systemTheme());
}

export function initTheme() {
  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => btn.addEventListener('click', toggleTheme));
  window.matchMedia?.('(prefers-color-scheme: light)').addEventListener?.('change', () => {
    if (!saved() && jsonMode === 'auto') setTheme(systemTheme());
  });
  refreshUI();
}
