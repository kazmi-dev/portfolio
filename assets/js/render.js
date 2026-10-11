// render.js — turns portfolio.json into the IDE.
// Each "file" in the explorer is one panel. A panel is just a function: data in, HTML string out
// (think of it as a @Composable that returns markup). Every JSON value goes through esc(),
// highlight(), safeUrl(), safeAsset() or safePdf() before it touches the page.

import {
  esc, safeUrl, safeAsset, safePdf, linkAttrs, highlight, unbracket, initials, prettyUrl,
  hash7, utcLabel, ICONS, PLATFORM, KIND, fill, text
} from './utils.js';

/** The files shown in the explorer. `when` decides if the file exists for this person. */
const FILE_DEFS = [
  { id: 'readme', name: 'README.md', icon: 'ⓘ', color: '#8FA9FF' },
  { id: 'projects', name: 'projects.kt', icon: 'K', color: '#C792EA' },
  { id: 'experience', name: 'experience.log', icon: '≡', color: '#E0A93B' },
  { id: 'skills', name: 'skills.gradle.kts', icon: '⚙', color: '#3FA34D' },
  { id: 'services', name: 'services.md', icon: '#', color: '#4CB7E6', when: (d) => (d.services || []).length > 0 },
  { id: 'contact', name: 'contact.sh', icon: '$', color: '#28A745' }
];

const slug = (s) => unbracket(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item';
const isNow = (to) => /^(now|present|current)$/i.test(String(to || '').trim());
const str = (s) => `<span class="tk-str">"${esc(s)}"</span>`;

function avatarHtml(person, cls) {
  const src = safeAsset(person.avatar);
  return src
    ? `<span class="${cls}"><img src="${esc(src)}" alt="${esc(unbracket(person.name))}" width="300" height="300" loading="lazy"></span>`
    : `<span class="${cls}" aria-hidden="true">${esc(initials(person.name))}</span>`;
}

function mainSocial(socials = [], match) {
  return socials.find((s) => `${s.label} ${s.url}`.toLowerCase().includes(match) && safeUrl(s.url));
}

/* ---------------- README.md ---------------- */
function readme(d) {
  const p = d.person || {};
  const c = p.company || {};
  const companyLine = c.name ? ` · ${esc(c.role || 'Member')} @ ${esc(c.name)}` : '';
  const status = p.available === false
    ? '<span class="badge"><span class="badge__k">status</span><span class="badge__v badge__v--busy">busy</span></span>'
    : '<span class="badge"><span class="badge__k">status</span><span class="badge__v badge__v--ok">available</span></span>';
  const badges = (d.stats || []).map((s) =>
    `<span class="badge"><span class="badge__k">${esc(s.label)}</span><span class="badge__v">${esc(s.value)}</span></span>`).join('') + status;
  const about = (d.about || []).map((t) => `<p>${esc(t)}</p>`).join('');
  const gh = mainSocial(d.socials, 'github');
  const resume = safePdf(p.resume);
  const companyUrl = safeUrl(c.url);

  return `
  <div class="readme">
    <div class="readme__main">
      <p class="comment"># README.md</p>
      <h1 class="readme__name">${esc(p.name)}<span class="cursor blink" aria-hidden="true"></span></h1>
      <p class="readme__role">${esc(p.role)}${companyLine}</p>
      ${p.headline ? `<p class="readme__headline">${highlight(p.headline)}</p>` : ''}
      <div class="badges">${badges}</div>
      ${about ? `<div class="readme__about">${about}</div>` : ''}
      <div class="readme__actions">
        <a class="btn btn--accent" href="#projects">Open projects.kt</a>
        ${gh ? `<a class="btn" href="${esc(safeUrl(gh.url))}"${linkAttrs(gh.url)}>${ICONS.github} GitHub</a>` : ''}
        ${resume ? `<a class="btn" href="${esc(resume)}" download>Résumé.pdf</a>` : ''}
      </div>
    </div>
    <aside class="readme__side">
      ${avatarHtml(p, 'photo')}
      <div class="infocard">
        ${p.location ? `<span class="tk-prop">location</span> = ${str(p.location)}<br>` : ''}
        ${c.name ? `<span class="tk-prop">company</span> = ${companyUrl ? `<a href="${esc(companyUrl)}"${linkAttrs(companyUrl)}>${str(c.name)}</a>` : str(c.name)}<br>` : ''}
        <span class="tk-prop">timezone</span> = ${str(utcLabel(p.utcOffset))}<br>
        ${p.email ? `<span class="tk-prop">email</span> = ${str(p.email)}` : ''}
      </div>
    </aside>
  </div>`;
}

/* ---------------- projects.kt ---------------- */
function projectIcon(pr) {
  const src = safeAsset(pr.icon);
  const color = /^#[0-9a-f]{6}$/i.test(pr.color || '') ? pr.color : 'var(--accent)';
  return src
    ? `<span class="project__icon"><img src="${esc(src)}" alt="" width="40" height="40" loading="lazy"></span>`
    : `<span class="project__icon" style="background:${esc(color)}" aria-hidden="true">${esc(unbracket(pr.name).charAt(0).toUpperCase())}</span>`;
}

function projects(d) {
  const list = d.projects || [];
  const cards = list.map((pr, i) => {
    const links = (pr.links || []).filter((l) => safeUrl(l.url));
    const host = links[0]?.label ? links[0].label.toLowerCase() : '';
    const platforms = (pr.platforms || []).map((x) => esc(x)).join(', ');
    const metrics = (pr.metrics || []).map((m) => `<div class="metric"><b>${esc(m.value)}</b><span>${esc(m.label)}</span></div>`).join('');
    return `
    <article class="project" style="--i:${i}">
      <div class="project__meta"><span class="project__kind">${esc(KIND[pr.kind] || pr.kind || '')}</span><span class="project__host">${esc(host)}</span></div>
      <div class="project__head">${projectIcon(pr)}<h3 class="project__name">${esc(pr.name)}</h3></div>
      <p class="project__summary">${esc(pr.summary)}</p>
      ${platforms ? `<p class="project__platforms">platforms = [${platforms}]</p>` : ''}
      ${metrics ? `<div class="metrics">${metrics}</div>` : ''}
      ${pr.install ? `<div class="snippet" tabindex="0" aria-label="Install snippet">${esc(pr.install)}</div>` : ''}
      ${links.length ? `<div class="project__links">${links.map((l) =>
        `<a href="${esc(safeUrl(l.url))}"${linkAttrs(l.url)}>${esc(l.label)} ${ICONS.arrow}</a>`).join('')}</div>` : ''}
    </article>`;
  }).join('');

  return `
    <p class="code-line"><span class="tk-kw">val</span> projects = <span class="tk-prop">listOf</span>(</p>
    ${cards ? `<div class="projects">${cards}</div>` : '<p class="empty">// nothing here yet — add items to "projects" in portfolio.json</p>'}
    <p class="code-line">)</p>`;
}

/* ---------------- experience.log ---------------- */
function experience(d) {
  let headUsed = false;
  const rows = (d.experience || []).map((e, i) => {
    const head = !headUsed && isNow(e.to);
    if (head) headUsed = true;
    const dates = [e.from, e.to].filter(Boolean).map(esc).join(' – ');
    const ref = head
      ? `<span class="head-tag">HEAD → now</span><span class="commit__dates">${dates}</span>`
      : `<span class="commit__ref">${hash7(`${e.role}${e.org}`)}</span> <span class="commit__dates">${dates}</span>`;
    return `
    <div class="commit${head ? ' commit--head' : ''}" style="--i:${i}">
      <div class="commit__rail" aria-hidden="true"><span class="commit__dot"></span><span class="commit__line"></span></div>
      <div class="commit__body">
        <div>${ref}</div>
        <h3 class="commit__title">${esc(e.role)} <span class="commit__org">— ${esc(e.org)}</span></h3>
        ${e.summary ? `<p class="commit__summary">${esc(e.summary)}</p>` : ''}
      </div>
    </div>`;
  }).join('');
  return `<div class="gitlog"><p class="gitlog__cmd">$ git log --graph --oneline career</p>${rows || '<p class="empty">// no commits yet</p>'}</div>`;
}

/* ---------------- skills.gradle.kts ---------------- */
function skills(d) {
  const groups = d.skills || [];
  const deps = groups.map((g) => [
    `    <span class="tk-com">// ${esc(g.group)}</span>`,
    ...(g.items || []).map((it) => `    implementation(${str(`${slug(g.group)}:${slug(it)}`)})`)
  ].join('\n')).join('\n');
  const chips = groups.map((g) => `
    <div class="chipgroup">
      <p class="comment">// ${esc(g.group.toLowerCase())}</p>
      <ul class="chips">${(g.items || []).map((it) => `<li class="chip">${esc(it)}</li>`).join('')}</ul>
    </div>`).join('');
  return `
  <div class="skills">
    <div class="gradle" tabindex="0" aria-label="Skills as a Gradle dependencies block"><span class="tk-kw">dependencies</span> {
${deps}
}</div>
    <div class="chipgroups">${chips}</div>
  </div>`;
}

/* ---------------- services.md ---------------- */
function services(d) {
  const cards = (d.services || []).map((s, i) => `
    <article class="service" style="--i:${i}">
      <h3 class="service__title"><span class="mono">- [x]</span>${esc(s.title)}</h3>
      <p>${esc(s.text)}</p>
    </article>`).join('');
  return `<h2 class="md-h"><span class="mono">##</span>What I can build for you</h2><div class="services">${cards}</div>`;
}

/* ---------------- contact.sh ---------------- */
function contact(d) {
  const p = d.person || {};
  const email = String(p.email || '').trim();
  const mail = email ? safeUrl(`mailto:${email}`) : '';
  const subject = encodeURIComponent(`Hello ${unbracket(p.name).split(' ')[0] || ''}`.trim());
  const socials = (d.socials || []).filter((s) => safeUrl(s.url)).map((s) =>
    `<div>${esc(slug(s.label).replace(/-/g, '_'))}=<a href="${esc(safeUrl(s.url))}"${linkAttrs(s.url)}>"${esc(prettyUrl(s.url))}"</a></div>`).join('');
  return `
  <div class="script">
    <div class="tk-com">#!/bin/bash</div>
    <div><span class="tk-prop">echo</span> ${str("Let's build something together.")}</div>
    <div>name=${str(p.name)}</div>
    ${mail ? `<div>email=<a href="${esc(mail)}">"${esc(email)}"</a></div>` : ''}
    ${socials}
    ${p.location ? `<div>location=${str(p.location)} <span class="tk-com"># ${esc(utcLabel(p.utcOffset))}</span></div>` : ''}
    <div>status=${str(p.available === false ? 'busy' : 'available')}${p.availableNote ? ` <span class="tk-com"># ${esc(p.availableNote)}</span>` : ''}</div>
    <div class="script__actions">
      ${mail ? `<a class="btn btn--accent" href="${esc(mail)}?subject=${subject}">▶ ./contact.sh — Email me</a>` : ''}
      ${email ? `<button class="btn" type="button" data-copy="${esc(email)}">Copy email</button>` : ''}
    </div>
  </div>`;
}

const PANELS = { readme, projects, experience, skills, services, contact };

/* ---------------- shell (explorer, profile, status bar) ---------------- */
function shell(d, files) {
  const p = d.person || {};
  const c = p.company || {};
  fill('files', files.map((f) =>
    `<li><a class="file" href="#${f.id}" data-file="${f.id}"><span class="file__icon" style="color:${f.color}" aria-hidden="true">${f.icon}</span>${esc(f.name)}</a></li>`).join(''));
  fill('tabs', files.map((f) => `<a class="tab" href="#${f.id}" data-file="${f.id}">${esc(f.name)}</a>`).join(''));
  fill('profile', `
    ${avatarHtml(p, 'avatar')}
    <div>
      <p class="profile__name">${esc(p.name)}</p>
      ${c.name ? `<p class="profile__company"><svg class="mark" viewBox="0 0 100 100" aria-hidden="true"><polyline class="mark-peak" points="16,84 50,16 84,84"/><rect class="mark-cursor" x="36" y="58" width="28" height="13"/></svg>${esc(c.name)}</p>` : ''}
    </div>`);
  text('slug', slug(p.name));
  text('status-name', unbracket(p.name));
  fill('status-available', p.available === false
    ? '<span class="status-dot status-dot--busy" aria-hidden="true"></span>busy'
    : '<span class="status-dot" aria-hidden="true"></span>available');
}

/** Renders everything and returns the list of files that exist for this person. */
export function renderAll(data) {
  const files = FILE_DEFS.filter((f) => !f.when || f.when(data));
  for (const f of FILE_DEFS) {
    const exists = files.includes(f);
    fill(`panel-${f.id}`, exists ? PANELS[f.id](data) : '');
  }
  shell(data, files);
  return files;
}
