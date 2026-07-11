# X-Sleep Lab Website Balanced Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复双语与参与者页面缺陷，让核心内容无需 JavaScript 也可读取，并在保留现有视觉和静态架构的同时完成性能、SEO 与无障碍优化。

**Architecture:** `js/content.js` 只保存数据，`js/md-loader.js` 保留唯一浏览器渲染实现；新增无依赖 Node 脚本把核心数据预渲染进 HTML。自动化验收使用 Node 内置 `node:test`，图片转换使用现有 Pillow 环境并保留原图。

**Tech Stack:** HTML5、CSS3、Vanilla JavaScript、Node.js 24 内置模块、Python Pillow、Playwright CLI。

## Global Constraints

- 不更改论文、人员、职位、招聘和伦理事实。
- 不改变莫兰迪配色、导航信息架构或纯静态部署方式。
- 不引入 npm 依赖、前端框架或打包器。
- 不删除或覆盖原始图片，只新增优化版本。
- 不提交、不推送、不发布。
- 保护现有未跟踪用户文件，不编辑未在本计划列出的 `.jpg` 文件。

---

### Task 1: 建立回归测试并修复双语与参与者页面

**Files:**
- Create: `tests/site-audit.test.mjs`
- Modify: `js/translations.js:58-108,210-260`
- Modify: `js/lang-switch.js:25-36,109-226`
- Modify: `index.html:73-76`
- Modify: `participate.html:11,425-452,673,733-749`

**Interfaces:**
- Consumes: `translations.en`, `translations.zh`，页面 `data-i18n` 属性。
- Produces: 具备缺失值保护的 `setText(key, value)` 与 `setHTML(key, value)`；参与者页固定中文语义。

- [ ] **Step 1: 写入失败测试**

在 `tests/site-audit.test.mjs` 中使用 `node:test`、`assert`、`fs`、`vm`：

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

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
    assert.equal(typeof translations[lang].team.piLabel, 'string');
    assert.equal(typeof translations[lang].research.item3p2, 'string');
    assert.equal(typeof translations[lang].publications.researchGate, 'string');
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
  assert.match(html, /Featured Publication · TiCS 2025/);
  assert.doesNotMatch(html, /Featured Publication · PNAS 2024/);
});
```

- [ ] **Step 2: 运行测试并确认正确失败**

Run: `node --test tests/site-audit.test.mjs`
Expected: 至少因缺失 `team.piLabel`、`item3p2`、`researchGate`、错误参与者 URL 或地址而失败。

- [ ] **Step 3: 实施最小修复**

补齐中英文键；将 `setText`/`setHTML` 改为仅接受字符串：

```js
function setText(key, value) {
  if (typeof value !== 'string') return;
  document.querySelectorAll('[data-i18n="' + key + '"]').forEach(function (el) {
    el.textContent = value;
  });
}

function setHTML(key, value) {
  if (typeof value !== 'string') return;
  document.querySelectorAll('[data-i18n="' + key + '"]').forEach(function (el) {
    el.innerHTML = value;
  });
}
```

参与者页面修正 URL 和“林萃路”，删除语言切换控件，并在 `lang-switch.js` 中为 `participate` 保持 `zh-CN`：

```js
document.documentElement.lang = page === 'participate'
  ? 'zh-CN'
  : (lang === 'zh' ? 'zh-CN' : 'en');
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node --test tests/site-audit.test.mjs`
Expected: Task 1 的四项测试全部 PASS。

---

### Task 2: 补齐 SEO 与无障碍基础

**Files:**
- Modify: `index.html`
- Modify: `team.html`
- Modify: `research.html`
- Modify: `publications.html`
- Modify: `news.html`
- Modify: `join.html`
- Modify: `participate.html`
- Modify: `css/style.css`
- Modify: `js/nav.js`
- Create: `scripts/optimize_images.py`
- Create: `favicon.png`
- Create: `robots.txt`
- Create: `sitemap.xml`

**Interfaces:**
- Produces: 每页 canonical/favicon/current-page 语义；移动菜单 Escape 行为；首页结构化数据。

- [ ] **Step 1: 添加失败测试**

```js
const pages = ['index.html', 'team.html', 'research.html', 'publications.html', 'news.html', 'join.html', 'participate.html'];

test('all public pages have canonical favicon one h1 and current-page semantics', async () => {
  for (const page of pages) {
    const html = await read(page);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, page);
    assert.match(html, /<link rel="canonical" href="https:\/\/xsleeplab\.cn\//, page);
    assert.match(html, /<link rel="icon" type="image\/png" href="favicon\.png">/, page);
    assert.match(html, /class="active"[^>]*aria-current="page"|aria-current="page"[^>]*class="active"/, page);
    assert.match(html, /aria-controls="main-navigation"/, page);
    assert.match(html, /<nav class="main-nav" id="main-navigation">/, page);
  }
});

test('accessibility motion and focus rules exist', async () => {
  const css = await read('css/style.css');
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  const nav = await read('js/nav.js');
  assert.match(nav, /Escape/);
  assert.match(nav, /toggle\.focus\(\)/);
});

test('robots sitemap and organization data exist', async () => {
  const robots = await read('robots.txt');
  const sitemap = await read('sitemap.xml');
  const home = await read('index.html');
  assert.match(robots, /Sitemap: https:\/\/xsleeplab\.cn\/sitemap\.xml/);
  for (const page of pages) assert.match(sitemap, new RegExp(page === 'index.html' ? 'https://xsleeplab.cn/' : page));
  assert.match(home, /application\/ld\+json/);
  assert.match(home, /ResearchOrganization/);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test tests/site-audit.test.mjs`
Expected: canonical、favicon、ARIA、CSS、robots 或 sitemap 相关断言失败。

- [ ] **Step 3: 实施 SEO 与无障碍修复**

逐页添加 canonical/favicon；当前链接添加 `aria-current="page"`；菜单按钮添加 `aria-controls="main-navigation"`，导航添加对应 `id`。首页加入合法 JSON-LD。`js/nav.js` 监听 Escape 并返回焦点。

CSS 新增：

```css
:where(a, button):focus-visible {
  outline: 3px solid var(--color-accent-light);
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

首页 Swiper 使用 `matchMedia('(prefers-reduced-motion: reduce)')` 决定 `autoplay`。参与者页删除内联菜单脚本并引入 `js/nav.js`。

- [ ] **Step 4: 生成 favicon**

使用 Pillow 从现有 `home_pic/xt.png` 制作 64×64 PNG，不覆盖原图：

Run: `& 'C:\Program Files\PsychoPy\python.exe' scripts/optimize_images.py --favicon-only`
Expected: `favicon.png` 存在且小于 50 KiB。

- [ ] **Step 5: 运行测试确认通过**

Run: `node --test tests/site-audit.test.mjs`
Expected: Task 1–2 全部 PASS。

---

### Task 3: 预渲染核心内容并消除重复渲染器

**Files:**
- Create: `scripts/render-static-content.mjs`
- Modify: `js/content.js:225-391`
- Modify: `js/md-loader.js`
- Modify: `index.html:165-170`
- Modify: `team.html:88-98`
- Modify: `publications.html:61-64`
- Modify: `news.html:58-61`
- Modify: `tests/site-audit.test.mjs`

**Interfaces:**
- Consumes: `SITE_CONTENT`。
- Produces: `renderPublications()`, `renderNewsPage(lang)`, `renderNewsStrip(lang)`, `renderTeamMembers(lang)` 仅由 `md-loader.js` 导出；静态生成器更新四类标记区域。

- [ ] **Step 1: 写入失败测试**

```js
test('content data file does not duplicate render functions', async () => {
  const content = await read('js/content.js');
  assert.doesNotMatch(content, /function renderPublications/);
  assert.doesNotMatch(content, /function renderNewsPage/);
  assert.doesNotMatch(content, /function renderTeamMembers/);
});

test('core content is pre-rendered in html', async () => {
  const expectations = [
    ['publications.html', 'STATIC:PUBLICATIONS:START', 'Temporal proximity to sleep determines emotional memory interference'],
    ['news.html', 'STATIC:NEWS:START', 'X-Sleep Lab is Recruiting'],
    ['team.html', 'STATIC:TEAM:START', 'Yiru Bao'],
    ['index.html', 'STATIC:NEWS-STRIP:START', 'Memory editing during sleep']
  ];
  for (const [page, marker, copy] of expectations) {
    const html = await read(page);
    assert.match(html, new RegExp(marker));
    assert.match(html, new RegExp(copy));
  }
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test tests/site-audit.test.mjs`
Expected: 重复函数与空静态内容断言失败。

- [ ] **Step 3: 实施生成器与单一渲染器**

`scripts/render-static-content.mjs` 使用 `fs/promises` 和 `vm` 读取 `SITE_CONTENT`，以纯函数产生英文后备 HTML，并使用以下接口替换标记区域：

```js
function replaceMarkedRegion(source, marker, generated) {
  const start = `<!-- STATIC:${marker}:START -->`;
  const end = `<!-- STATIC:${marker}:END -->`;
  const pattern = new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`);
  if (!pattern.test(source)) throw new Error(`Missing static markers: ${marker}`);
  return source.replace(pattern, `${start}\n${generated}\n${end}`);
}
```

生成器导出渲染纯函数并在直接运行时更新 HTML。成员邮箱为空时省略整个联系段落。`content.js` 删除第 225 行后的重复函数。

- [ ] **Step 4: 运行生成器两次验证幂等**

Run: `node scripts/render-static-content.mjs`
Run: `git diff --check`
Run again: `node scripts/render-static-content.mjs`
Expected: 第二次运行不产生新的文件变化；命令退出码均为 0。

- [ ] **Step 5: 运行测试确认通过**

Run: `node --test tests/site-audit.test.mjs`
Expected: Task 1–3 全部 PASS。

---

### Task 4: 优化活动图片并落实加载预算

**Files:**
- Create: `scripts/optimize_images.py`
- Create: `dream.webp`
- Create: `home_pic/direction1.webp`
- Create: `home_pic/direction2.webp`
- Create: `home_pic/direction3.webp`
- Create: `home_pic/xt.webp`
- Create: `home_pic/byr.webp`
- Create: `home_pic/chenjiahe.webp`
- Create: `home_pic/zhangtiantong.webp`
- Create: `home_pic/linxiaoai.webp`
- Create: `home_pic/lipeirong.webp`
- Create: `home_pic/hanxue.webp`
- Create: `news_pic/plos-computational-biology.webp`
- Create: `news_pic/trends-in-cognitive-sciences.webp`
- Create: `news_pic/pnas.webp`
- Create: `news_pic/current-biology.webp`
- Modify: `js/content.js`
- Modify: `index.html`
- Modify: `js/md-loader.js`
- Modify: `tests/site-audit.test.mjs`

**Interfaces:**
- Produces: deterministic WebP assets; `img` markup with width/height/loading/decoding.

- [ ] **Step 1: 添加失败测试**

```js
import { stat } from 'node:fs/promises';

test('optimized image references and homepage budget are enforced', async () => {
  const home = await read('index.html');
  assert.match(home, /dream\.webp/);
  for (const name of ['direction1.webp', 'direction2.webp', 'direction3.webp']) {
    assert.match(home, new RegExp(name));
  }
  assert.match(home, /loading="lazy"/);
  assert.match(home, /decoding="async"/);
  const files = ['dream.webp', 'home_pic/direction1.webp', 'home_pic/direction2.webp', 'home_pic/direction3.webp'];
  let bytes = 0;
  for (const file of files) bytes += (await stat(new URL(file, root))).size;
  assert.ok(bytes <= 2 * 1024 * 1024, `homepage images are ${bytes} bytes`);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test tests/site-audit.test.mjs`
Expected: WebP 文件不存在或预算断言失败。

- [ ] **Step 3: 创建并运行无损原图保护的优化脚本**

扩展 Task 2 创建的 `scripts/optimize_images.py`：Hero 最大宽度 1600、研究图最大宽度 960、新闻图最大宽度 1400、成员头像最大边 640；WebP quality 82、method 6。脚本只写 `.webp` 和 `favicon.png`，不删除源文件。

Run: `& 'C:\Program Files\PsychoPy\python.exe' scripts/optimize_images.py`
Expected: 所有活动图片的 WebP 输出存在，首页四图合计不超过 2 MiB。

- [ ] **Step 4: 更新图片引用与 HTML 属性**

Hero 使用 `dream.webp`。研究卡片与动态新闻/成员图片使用 WebP。首屏以下图片统一：

```html
<img ... width="960" height="644" loading="lazy" decoding="async">
```

Hero 背景不设置懒加载；其余内容图均延迟加载。

- [ ] **Step 5: 运行测试确认通过**

Run: `node --test tests/site-audit.test.mjs`
Expected: Task 1–4 全部 PASS，图片预算断言通过。

---

### Task 5: 全站验证与交付检查

**Files:**
- Modify only if verification exposes an in-scope defect.

**Interfaces:**
- Consumes: 全部七页和自动化测试。
- Produces: 可复现的最终验证证据；不产生持久审查文件。

- [ ] **Step 1: 运行完整自动化测试**

Run: `node --test tests/site-audit.test.mjs`
Expected: 0 failed。

- [ ] **Step 2: 验证静态生成幂等与语法**

Run: `node scripts/render-static-content.mjs`
Run again: `node scripts/render-static-content.mjs`
Run: `node --check js/content.js`
Run: `node --check js/md-loader.js`
Run: `node --check js/lang-switch.js`
Run: `node --check js/nav.js`
Expected: 全部退出码 0，第二次生成无新增 diff。

- [ ] **Step 3: 本地浏览器桌面与移动验收**

启动只读静态服务器，在 1440×1000、390×844 逐页检查：图片完整、无横向溢出、无空翻译、移动菜单与 Escape 正常、控制台 0 error。

- [ ] **Step 4: 验证退化模式**

禁用 JavaScript 后检查 `publications.html`、`news.html`、`team.html`、`index.html` 的核心内容仍存在；模拟 `prefers-reduced-motion: reduce`，确认 Swiper 不自动轮播。

- [ ] **Step 5: 检查变更范围与用户文件保护**

Run: `git diff --check`
Run: `git status --short`
Expected: 无空白错误；用户原有未跟踪 `.jpg` 文件保持未修改；无提交、推送或部署操作。
