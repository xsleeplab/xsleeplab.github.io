import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function t(value, lang = 'en') {
  if (typeof value === 'string') return value;
  return value?.[lang] || value?.en || '';
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceMarkedRegion(source, marker, generated) {
  const start = `<!-- STATIC:${marker}:START -->`;
  const end = `<!-- STATIC:${marker}:END -->`;
  const pattern = new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`);

  if (!pattern.test(source)) {
    throw new Error(`Missing static markers: ${marker}`);
  }

  return source.replace(pattern, `${start}\n${generated}\n${end}`);
}

function renderPublications(data) {
  let html = '<div class="pub-year-block">\n' +
    '  <h2 class="pub-year">Preprints</h2>\n' +
    data.preprints.map((item) => `  <div class="pub-entry">${item.html}</div>`).join('\n') +
    '\n</div>';

  const byYear = new Map();
  for (const publication of data.publications) {
    if (!byYear.has(publication.year)) byYear.set(publication.year, []);
    byYear.get(publication.year).push(publication);
  }

  for (const year of [...byYear.keys()].sort((a, b) => b - a)) {
    html += '\n<div class="pub-year-block">\n' +
      `  <h2 class="pub-year">${year}</h2>\n` +
      byYear.get(year).map((item) => `  <div class="pub-entry">${item.html}</div>`).join('\n') +
      '\n</div>';
  }

  return html;
}

function renderNews(data, lang = 'en') {
  return data.news.map((item) => {
    const title = t(item.title, lang);
    const media = item.image
      ? `<img class="news-card-img" src="${item.image}" alt="${title}" loading="lazy" decoding="async">`
      : `<div class="news-card-placeholder" style="background:${item.gradient};">${item.emoji}</div>`;
    const readMore = item.link
      ? `<a href="${item.link}"${item.link.startsWith('http') ? ' target="_blank" rel="noopener"' : ''} class="news-read-more">${item.readMore ? t(item.readMore, lang) : 'Read more →'}</a>`
      : '';

    return '<article class="news-card">\n' +
      `  ${media}\n` +
      '  <div class="news-card-body">\n' +
      `    <span class="news-tag">${t(item.tag, lang)}</span>\n` +
      `    <h3>${title}</h3>\n` +
      `    <p>${t(item.desc, lang)}</p>\n` +
      (readMore ? `    ${readMore}\n` : '') +
      `    <span class="news-date">${t(item.date, lang)}</span>\n` +
      '  </div>\n' +
      '</article>';
  }).join('\n');
}

function renderNewsStrip(data, lang = 'en') {
  return data.news
    .filter((item) => item.homepageSlot)
    .sort((a, b) => a.homepageSlot - b.homepageSlot)
    .map((item) => {
      const href = item.homepageLink || item.link || 'news.html';
      const external = href.startsWith('http');
      return `<a href="${href}" class="news-strip-card"${external ? ' target="_blank" rel="noopener"' : ''}>\n` +
        `  <span class="news-strip-tag">${t(item.tag, lang)}</span>\n` +
        `  <h4>${t(item.title, lang)}</h4>\n` +
        `  <p>${t(item.desc, lang)}</p>\n` +
        `  <span class="news-strip-date">${t(item.date, lang)}</span>\n` +
        '</a>';
    }).join('\n');
}

function renderMember(member, lang = 'en') {
  const avatar = member.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.seed}`;
  const contact = member.email
    ? `\n  <p class="member-contact"><a href="mailto:${member.email}">${member.email}</a></p>`
    : '';

  return '<article class="member-card">\n' +
    `  <img class="member-avatar" src="${avatar}" alt="" width="100" height="100" loading="lazy" decoding="async">\n` +
    `  <h3>${t(member.name, lang)}</h3>\n` +
    `  <p class="member-title">${t(member.title, lang)}</p>\n` +
    `  <p class="member-education">${member.education}</p>` +
    contact + '\n' +
    `  <p class="member-research">${t(member.research, lang)}</p>\n` +
    '</article>';
}

function renderMembers(members, lang = 'en') {
  return members.map((member) => renderMember(member, lang)).join('\n');
}

async function loadContent() {
  const source = await readFile(path.join(root, 'js', 'content.js'), 'utf8');
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${source}\n;globalThis.__content = SITE_CONTENT;`, context);
  return context.__content;
}

async function updateFile(relativePath, replacements) {
  const filename = path.join(root, relativePath);
  let source = await readFile(filename, 'utf8');

  for (const [marker, generated] of replacements) {
    source = replaceMarkedRegion(source, marker, generated);
  }

  await writeFile(filename, source, 'utf8');
}

async function main() {
  const data = await loadContent();

  await updateFile('publications.html', [['PUBLICATIONS', renderPublications(data)]]);
  await updateFile('news.html', [['NEWS', renderNews(data)]]);
  await updateFile('index.html', [['NEWS-STRIP', renderNewsStrip(data)]]);
  await updateFile('team.html', [
    ['TEAM', renderMembers(data.members.grad)],
    ['TEAM-RA', renderMembers(data.members.ra)],
    ['TEAM-INTERN', renderMembers(data.members.intern || [])]
  ]);
}

export {
  replaceMarkedRegion,
  renderMembers,
  renderNews,
  renderNewsStrip,
  renderPublications
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
