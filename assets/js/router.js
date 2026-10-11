// router.js — which file is open lives in the URL hash (#projects, #contact…).
// Same idea as a NavHost route in Compose: the URL is the single source of truth,
// so links can be shared, and the browser's back button just works.

const panels = () => document.querySelectorAll('[data-panel]');

export function initRouter(files, { onOpen } = {}) {
  const ids = files.map((f) => f.id);
  const byId = Object.fromEntries(files.map((f) => [f.id, f]));
  const baseTitle = document.title;
  let keepFocus = false;                             // true when the terminal opened the file

  const fromHash = () => {
    const h = decodeURIComponent(location.hash.slice(1)).toLowerCase();
    return ids.includes(h) ? h : 'readme';
  };

  function show(id, userNav) {
    const file = byId[id];
    panels().forEach((el) => {
      const on = el.dataset.panel === id;
      el.hidden = !on;
      if (on && userNav) {
        el.classList.remove('is-entering');
        void el.offsetWidth;                         // restart the CSS animation
        el.classList.add('is-entering');
      }
    });
    document.querySelectorAll('[data-file]').forEach((a) => {
      if (a.dataset.file === id) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    document.querySelectorAll('[data-slot="file-name"]').forEach((el) => { el.textContent = file.name; });
    document.title = id === 'readme' ? baseTitle : `${file.name} — ${baseTitle}`;

    // keep the active tab visible on small screens
    document.querySelector(`.tab[data-file="${id}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });

    if (userNav) {
      const box = document.querySelector('.panels');
      if (box) box.scrollTop = 0;
      if (!keepFocus) {
        const editor = document.getElementById('editor');
        if (editor && editor.getBoundingClientRect().top < 0) editor.scrollIntoView({ block: 'start' });
        document.getElementById(`panel-${id}`)?.focus({ preventScroll: true });
      }
      onOpen?.(file, { fromTerminal: keepFocus });
      keepFocus = false;
    }
  }

  window.addEventListener('hashchange', () => show(fromHash(), true));
  show(fromHash(), false);

  return {
    files,
    current: fromHash,
    /** Find a file by id or name: "projects", "projects.kt", "PROJECTS" all work. */
    find(query) {
      const q = String(query || '').toLowerCase().trim();
      return files.find((f) => f.id === q || f.name.toLowerCase() === q || f.name.toLowerCase().split('.')[0] === q);
    },
    open(id, { fromTerminal = false } = {}) {
      keepFocus = fromTerminal;
      if (location.hash.slice(1) === id) show(id, true);
      else location.hash = id;                       // triggers hashchange → show()
    }
  };
}
