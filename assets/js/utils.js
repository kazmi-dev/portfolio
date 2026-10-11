// utils.js — small, pure helpers shared by every renderer.
// Rule of the house: nothing from portfolio.json reaches innerHTML without going through
// esc() (text) or safeUrl() / safeAsset() / safePdf() (links and files).

/** Escape text so "<", "&" and quotes in the JSON show up as characters, never as HTML. */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

/** Allow only web links, email/phone links, in-page anchors and local pages. Everything else → ''. */
export function safeUrl(url) {
  const u = String(url ?? '').trim();
  if (!u) return '';
  return /^(https?:\/\/|mailto:|tel:|#|\.\/|\/|[\w-]+\.html)/i.test(u) ? u : '';
}

/** Allow only local image files like assets/img/projects/app.png. */
export function safeAsset(path) {
  const p = String(path ?? '').trim();
  return /^[\w./-]+\.(png|jpe?g|webp|svg|avif)$/i.test(p) && !p.includes('..') ? p : '';
}

/** Allow only a local PDF like assets/cv/resume.pdf. */
export function safePdf(path) {
  const p = String(path ?? '').trim();
  return /^[\w./-]+\.pdf$/i.test(p) && !p.includes('..') ? p : '';
}

export const isExternal = (u) => /^https?:\/\//i.test(u);
/** target/rel for external links: new tab, and the new page can't control this one. */
export const linkAttrs = (u) => (isExternal(u) ? ' target="_blank" rel="noopener"' : '');

/** "I build apps *people keep.*" → escaped text with the starred part wrapped in <em class="hl">. */
export function highlight(text) {
  return esc(text).replace(/\*(.+?)\*/g, '<em class="hl">$1</em>');
}

/** Removes the [placeholder] brackets, handy for initials and clean labels. */
export const unbracket = (s) => String(s ?? '').replace(/[[\]]/g, '');

/** "[Full Name]" → "FN", "Kazmi Dev" → "KD". */
export function initials(name) {
  const parts = unbracket(name).trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?';
}

/** "https://github.com/kazmi-dev/" → "github.com/kazmi-dev" */
export const prettyUrl = (u) => String(u ?? '').replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');

/** A stable fake commit hash for a string (same input → same 7 hex chars). */
export function hash7(str) {
  let h = 2166136261;
  for (const ch of String(str)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16).padStart(8, '0').slice(0, 7);
}

/** Current time in the person's time zone, e.g. "14:05". */
export function timeAt(utcOffset = 0) {
  const now = new Date();
  const t = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + Number(utcOffset || 0) * 3600000);
  return `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
}

export const utcLabel = (o) => `UTC${Number(o) >= 0 ? '+' : ''}${Number(o) || 0}`;

/* ---------------- accent colour ---------------- */

const hexOk = (h) => /^#[0-9a-f]{6}$/i.test(String(h || ''));
const toRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = (rgb) => {
  const [r, g, b] = rgb.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const mix = (rgb, to, t) => rgb.map((v, i) => Math.round(v + (to[i] - v) * t));

/** "#2F5BEA" → "47, 91, 234" for CSS like rgba(var(--x), .2). Invalid input → fallback. */
export const rgbOf = (hex, fallback = '47, 91, 234') => (hexOk(hex) ? toRgb(hex).join(', ') : fallback);

/**
 * Applies theme.accent as CSS variables:
 *   --accent        the colour itself (buttons, active tabs)
 *   --accent-rgb    "47, 91, 234" so CSS can do rgba(var(--accent-rgb), .15)
 *   --on-accent     white or navy, whichever is readable ON the accent (WCAG contrast)
 *   --accent-hi     a lighter version that stays readable as text on dark backgrounds
 */
export function applyAccent(hex) {
  if (!hexOk(hex)) return;
  const rgb = toRgb(hex);
  const s = document.documentElement.style;
  s.setProperty('--accent', hex);
  s.setProperty('--accent-rgb', rgb.join(', '));
  s.setProperty('--on-accent', contrast(rgb, [255, 255, 255]) >= 4.5 ? '#FFFFFF' : '#0F1B2D');
  let hi = rgb;
  for (let t = 0; t <= 1 && contrast(hi, [13, 18, 32]) < 4.5; t += 0.05) hi = mix(rgb, [255, 255, 255], t);
  s.setProperty('--accent-hi', `rgb(${hi.join(', ')})`);
}

/* ---------------- icons ---------------- */

export const ICONS = {
  github: '<svg viewBox="0 0 24 24" aria-hidden="true" class="ico ico--fill"><path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 2.9.8.1-.7.4-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.9V21c0 .3.2.6.7.5A10 10 0 0 0 12 2z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true" class="ico ico--fill"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3zM9.5 9.5h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.1c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V21h-4z"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true" class="ico ico--fill"><path d="M17.8 3h3.1l-6.8 7.8L22 21h-6.3l-4.9-6.4L5.2 21H2.1l7.3-8.3L1.8 3h6.4l4.4 5.9zm-1.1 16.2h1.7L7.4 4.7H5.6z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" aria-hidden="true" class="ico"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/></svg>',
  link: '<svg viewBox="0 0 24 24" aria-hidden="true" class="ico"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true" class="ico"><path d="M6 3.5v17l14-8.5z"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true" class="ico"><path d="M7 17L17 7M9 7h8v8"/></svg>',
  sun: '<svg viewBox="0 0 24 24" aria-hidden="true" class="ico"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon: '<svg viewBox="0 0 24 24" aria-hidden="true" class="ico"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>'
};

/** Picks an icon from a social link's label or URL. */
export function socialIcon(link = {}) {
  const s = `${link.label} ${link.url}`.toLowerCase();
  if (s.includes('github')) return ICONS.github;
  if (s.includes('linkedin')) return ICONS.linkedin;
  if (/\bx\b|twitter|x\.com/.test(s)) return ICONS.x;
  if (s.includes('mailto:') || s.includes('email')) return ICONS.mail;
  return ICONS.link;
}

export const PLATFORM = { android: 'Android', ios: 'iOS', desktop: 'Desktop', web: 'Web' };
export const KIND = { app: 'App', library: 'Library', 'case-study': 'Case study' };

/** Fills every [data-slot="name"] element with HTML. */
export const fill = (name, html) => document.querySelectorAll(`[data-slot="${name}"]`).forEach((el) => { el.innerHTML = html; });
/** Sets plain text (no HTML parsing at all — the safest option). */
export const text = (name, value) => document.querySelectorAll(`[data-slot="${name}"]`).forEach((el) => { el.textContent = value ?? ''; });
/** Hides an element when there's nothing to show. */
export const showIf = (selector, condition) => document.querySelectorAll(selector).forEach((el) => { el.hidden = !condition; });
