import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const pages = [
  'index.html',
  'team.html',
  'research.html',
  'publications.html',
  'news.html',
  'join.html',
  'participate.html'
];

async function loadConst(path, name) {
  const source = await read(path);
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${source}\n;globalThis.__value = ${name};`, context);
  return context.__value;
}

test('required bilingual fields exist', async () => {
  const translations = await loadConst('js/translations.js', 'translations');

  for (const lang of ['en', 'zh']) {
    assert.equal(typeof translations[lang].team.piLabel, 'string', `${lang}.team.piLabel`);
    assert.equal(typeof translations[lang].research.item3p2, 'string', `${lang}.research.item3p2`);
    assert.equal(typeof translations[lang].publications.researchGate, 'string', `${lang}.publications.researchGate`);
  }
});

test('participant page uses its canonical URL and Chinese language', async () => {
  const html = await read('participate.html');

  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/xsleeplab\.cn\/participate\.html">/);
  assert.match(html, /<meta property="og:url" content="https:\/\/xsleeplab\.cn\/participate\.html">/);
  assert.doesNotMatch(html, /林翠路/);
  assert.doesNotMatch(html, /class="lang-switch"/);
});

test('fallback text is protected from missing translations', async () => {
  const js = await read('js/lang-switch.js');

  assert.match(js, /typeof value !== 'string'/);
});

test('featured publication fallback copy matches TiCS 2025', async () => {
  const html = await read('index.html');
  const languageScript = await read('js/lang-switch.js');

  assert.match(html, /Featured Publication · TiCS 2025/);
  assert.doesNotMatch(html, /Featured Publication · PNAS 2024/);
  assert.doesNotMatch(languageScript, /IPcas/);
});

test('all public pages have canonical favicon one h1 and current-page semantics', async () => {
  for (const page of pages) {
    const html = await read(page);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, `${page}: h1`);
    assert.match(html, /<link rel="canonical" href="https:\/\/xsleeplab\.cn\//, `${page}: canonical`);
    assert.match(html, /<link rel="icon" type="image\/png" href="favicon\.png">/, `${page}: favicon`);
    assert.match(
      html,
      /class="active"[^>]*aria-current="page"|aria-current="page"[^>]*class="active"/,
      `${page}: aria-current`
    );
    assert.match(html, /aria-controls="main-navigation"/, `${page}: aria-controls`);
    assert.match(html, /<nav class="main-nav" id="main-navigation">/, `${page}: nav id`);
  }
});

test('accessibility motion and focus rules exist', async () => {
  const css = await read('css/style.css');
  const nav = await read('js/nav.js');
  const home = await read('index.html');

  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(nav, /Escape/);
  assert.match(nav, /toggle\.focus\(\)/);
  assert.match(nav, /link\.addEventListener\('click', function \(\) \{\s*closeMenu\(false\);/);
  assert.match(home, /prefers-reduced-motion:\s*reduce/);
  assert.match(home, /typeof Swiper === 'function'/);
});

test('robots sitemap and organization data exist', async () => {
  const robots = await read('robots.txt');
  const sitemap = await read('sitemap.xml');
  const home = await read('index.html');

  assert.match(robots, /Sitemap: https:\/\/xsleeplab\.cn\/sitemap\.xml/);
  for (const page of pages) {
    const expected = page === 'index.html' ? 'https://xsleeplab.cn/' : page;
    assert.match(sitemap, new RegExp(expected));
  }
  assert.match(home, /application\/ld\+json/);
  assert.match(home, /ResearchOrganization/);
});

test('favicon asset exists within its size budget', async () => {
  const favicon = await stat(new URL('favicon.png', root));
  assert.ok(favicon.size > 0);
  assert.ok(favicon.size < 50 * 1024, `favicon is ${favicon.size} bytes`);
});

test('content data file does not duplicate render functions', async () => {
  const content = await read('js/content.js');

  assert.doesNotMatch(content, /function renderPublications/);
  assert.doesNotMatch(content, /function renderNewsPage/);
  assert.doesNotMatch(content, /function renderTeamMembers/);
});

test('core content is pre-rendered in html', async () => {
  const expectations = [
    [
      'publications.html',
      'STATIC:PUBLICATIONS:START',
      'Temporal proximity to sleep determines emotional memory interference'
    ],
    ['news.html', 'STATIC:NEWS:START', 'X-Sleep Lab is Recruiting'],
    ['team.html', 'STATIC:TEAM:START', 'Yiru Bao'],
    ['index.html', 'STATIC:NEWS-STRIP:START', 'Memory editing during sleep']
  ];

  for (const [page, marker, copy] of expectations) {
    const html = await read(page);
    assert.match(html, new RegExp(marker), `${page}: marker`);
    assert.match(html, new RegExp(copy), `${page}: content`);
  }

  const team = await read('team.html');
  const loader = await read('js/md-loader.js');
  assert.doesNotMatch(team, /href="mailto:">/);
  assert.match(loader, /member\.email\s*\?/);
});

test('optimized image references and homepage budget are enforced', async () => {
  const home = await read('index.html');
  const content = await read('js/content.js');
  const loader = await read('js/md-loader.js');

  assert.match(home, /dream\.webp/);
  for (const name of ['direction1.webp', 'direction2.webp', 'direction3.webp']) {
    assert.match(home, new RegExp(name));
  }
  assert.match(home, /loading="lazy"/);
  assert.match(home, /decoding="async"/);
  assert.doesNotMatch(content, /(?:image|photo):\s*'[^']+\.png'/);
  assert.match(loader, /loading="lazy"/);
  assert.match(loader, /decoding="async"/);

  const files = [
    'dream.webp',
    'home_pic/direction1.webp',
    'home_pic/direction2.webp',
    'home_pic/direction3.webp'
  ];
  let bytes = 0;
  for (const file of files) bytes += (await stat(new URL(file, root))).size;
  assert.ok(bytes <= 2 * 1024 * 1024, `homepage images are ${bytes} bytes`);
});

test('news image dimensions do not override the card aspect ratio', async () => {
  const news = await read('news.html');
  const loader = await read('js/md-loader.js');
  const renderer = await read('scripts/render-static-content.mjs');

  for (const [name, source] of [
    ['news.html', news],
    ['js/md-loader.js', loader],
    ['scripts/render-static-content.mjs', renderer]
  ]) {
    assert.doesNotMatch(
      source,
      /class="news-card-img"[^>]*\bheight="600"/,
      `${name}: the height attribute stretches responsive news images`
    );
  }
});
