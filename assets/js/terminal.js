// terminal.js — the little shell at the bottom of the editor.
// Commands are a map of name → function (like a `when (command)` in Kotlin).
// Every command returns an array of HTML lines; anything the visitor typed is escaped first.

import { esc, safeUrl, linkAttrs, prettyUrl, unbracket, timeAt, utcLabel, KIND } from './utils.js';
import { setTheme, toggleTheme, currentTheme } from './theme.js';

const MAX_LINES = 80;

export function initTerminal(data, router) {
  const body = document.querySelector('[data-terminal]');
  const log = document.querySelector('[data-terminal-log]');
  const form = document.querySelector('[data-terminal-form]');
  const input = document.getElementById('term-input');
  if (!body || !log || !form || !input) return { note() {} };

  const p = data.person || {};
  const history = [];
  let hIndex = 0;

  const prompt = (cmd) => `<span class="t-ok">➜</span> <span class="t-path">~/portfolio</span> ${esc(cmd)}`;
  const a = (url, label) => {
    const u = safeUrl(url);
    return u ? `<a href="${esc(u)}"${linkAttrs(u)}>${esc(label)}</a>` : esc(label);
  };

  function print(lines) {
    for (const html of lines) {
      const div = document.createElement('div');
      div.className = 'is-new';
      div.innerHTML = html;
      log.appendChild(div);
    }
    while (log.children.length > MAX_LINES) log.firstElementChild.remove();
    body.scrollTop = body.scrollHeight;
  }

  const socialsLines = () => (data.socials || []).filter((s) => safeUrl(s.url))
    .map((s) => `  ${esc(s.label.padEnd(10))} ${a(s.url, prettyUrl(s.url))}`);

  const COMMANDS = {
    help: () => [
      '<span class="tk-com">Available commands:</span>',
      '  <span class="tk-prop">whoami</span>          who is this?',
      '  <span class="tk-prop">ls</span>              list files',
      '  <span class="tk-prop">open</span> &lt;file&gt;     open a file (e.g. open projects)',
      '  <span class="tk-prop">projects</span>        list my work',
      '  <span class="tk-prop">contact</span>         how to reach me',
      '  <span class="tk-prop">time</span>            my local time',
      '  <span class="tk-prop">theme</span> [dark|light]',
      '  <span class="tk-prop">clear</span>           clear the terminal'
    ],
    whoami: () => {
      const c = p.company || {};
      return [`${esc(p.name)} — ${esc(p.role)}${c.name ? `, ${esc(c.role || 'member')} at ${esc(c.name)}` : ''}`];
    },
    ls: () => [router.files.map((f) => `<span class="tk-prop">${esc(f.name)}</span>`).join('   ')],
    open: (arg) => {
      if (!arg) return ['usage: open &lt;file&gt;   — try <span class="tk-prop">ls</span>'];
      const f = router.find(arg);
      if (!f) return [`<span class="t-err">open: no such file:</span> ${esc(arg)}`];
      router.open(f.id, { fromTerminal: true });
      return [`<span class="tk-com">opened ${esc(f.name)}</span>`];
    },
    projects: () => {
      const list = data.projects || [];
      if (!list.length) return ['<span class="tk-com">no projects yet</span>'];
      return list.map((pr) => {
        const l = (pr.links || []).find((x) => safeUrl(x.url));
        return `  • <span class="tk-str">${esc(pr.name)}</span> <span class="tk-com">(${esc(KIND[pr.kind] || pr.kind)})</span>${l ? ` — ${a(l.url, l.label)}` : ''}`;
      });
    },
    contact: () => {
      const email = String(p.email || '').trim();
      return [
        email ? `  ${'email'.padEnd(10)} ${a(`mailto:${email}`, email)}` : '',
        ...socialsLines(),
        '<span class="tk-com">  or run: open contact</span>'
      ].filter(Boolean);
    },
    time: () => [`${esc(timeAt(p.utcOffset))} in ${esc(unbracket(p.location || 'my city'))} (${esc(utcLabel(p.utcOffset))})`],
    theme: (arg) => {
      if (arg === 'dark' || arg === 'light') setTheme(arg, true);
      else if (!arg) toggleTheme();
      else return ['usage: theme [dark|light]'];
      return [`<span class="tk-com">theme: ${currentTheme()}</span>`];
    },
    echo: (arg) => [esc(arg)],
    hire: () => { router.open('contact', { fromTerminal: true }); return ['<span class="tk-str">Great choice.</span> Opening contact.sh…']; },
    clear: () => { log.innerHTML = ''; return []; }
  };
  // aliases
  Object.assign(COMMANDS, {
    cat: COMMANDS.open, cd: COMMANDS.open, code: COMMANDS.open, vim: COMMANDS.open,
    date: COMMANDS.time, email: COMMANDS.contact, socials: COMMANDS.contact, cls: COMMANDS.clear,
    'sudo': (arg) => (arg === 'hire-me' || arg === 'hire' ? COMMANDS.hire() : ['<span class="t-err">nice try.</span>'])
  });

  function run(raw) {
    const line = raw.trim();
    print([prompt(line)]);
    if (!line) return;
    history.push(line);
    hIndex = history.length;
    const [cmd, ...rest] = line.split(/\s+/);
    const fn = COMMANDS[cmd.toLowerCase()];
    print(fn ? fn(rest.join(' ')) : [`<span class="t-err">command not found:</span> ${esc(cmd)} — try <span class="tk-prop">help</span>`]);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    run(input.value);
    input.value = '';
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' && history.length) {
      e.preventDefault();
      hIndex = Math.max(0, hIndex - 1);
      input.value = history[hIndex];
    } else if (e.key === 'ArrowDown' && history.length) {
      e.preventDefault();
      hIndex = Math.min(history.length, hIndex + 1);
      input.value = history[hIndex] || '';
    }
  });

  // clicking anywhere in the terminal focuses the input (unless you're selecting text or clicking a link)
  body.addEventListener('click', (e) => {
    if (e.target.closest('a') || String(window.getSelection?.() || '')) return;
    input.focus();
  });

  // greeting
  print([prompt('whoami'), ...COMMANDS.whoami(), '<span class="tk-com">Type help to see what this terminal can do.</span>']);

  return {
    /** Echo navigation from the explorer/tabs, so the terminal feels connected to the editor. */
    note(file, { fromTerminal } = {}) {
      if (!fromTerminal) print([prompt(`open ${file.name}`)]);
    }
  };
}
