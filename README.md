# X-Sleep Lab 实验室网站

中国科学院心理研究所 · 睡眠认知神经科学实验室官网源码。
线上地址：<https://xsleeplab.cn>

纯静态站点（HTML + CSS + 原生 JS，无构建步骤、无框架依赖），
通过 GitHub Pages 部署，自定义域名由根目录 `CNAME` 指定。

## 页面

| 文件 | 页面 | 说明 |
|------|------|------|
| `index.html` | 首页 | Hero 轮播、研究概览、新闻条 |
| `team.html` | 团队成员 | PI、研究生、研究助理、本科生 |
| `research.html` | 研究项目 | 三大研究方向 |
| `publications.html` | 研究成果 | 按年份的论文列表 |
| `news.html` | 新闻 | 实验室动态 |
| `participate.html` | 参与研究 | 被试须知：设备、环境、准备事项、地点 |
| `signup/index.html` | 报名筛选 | 被试报名与问卷自动筛查（见下） |
| `join.html` | 加入我们 | 招聘信息 |

## 内容如何修改

站点内容集中在数据文件里，**不需要改 HTML**：

- `js/content.js` — 同步数据源（`SITE_CONTENT`），始终生效
- `SITE_DATA.md` — 人类可读的 Markdown 内容文件（可选，需 HTTP 服务器才会被读取）
- `js/md-loader.js` — 渲染函数；先用 `content.js`，再尝试用 `SITE_DATA.md` 覆盖
- `js/translations.js` — 中英文案（i18n）
- `js/lang-switch.js` — 语言切换，**默认英文**，可切中文；偏好存于 localStorage
- `js/nav.js` — 移动端导航

优先级：`SITE_DATA.md` > `content.js`。用 `file://` 直接打开也能正常显示。

脚本载入顺序：`content.js` → `md-loader.js` → `translations.js` → `lang-switch.js`

### 图片规格

| 用途 | 比例 | 目录 |
|------|------|------|
| 研究方向卡片 | 3:2（如 900×600） | `home_pic/` |
| 新闻卡片 | 2:1（如 800×400） | `news_pic/` |
| 成员头像 | 正方形（如 300×300） | `home_pic/` |
| 实验室环境照 | 3:4 竖版 | `signup/photos/` |

站点引用的是 `.webp` 版本，用 `scripts/optimize_images.py` 从原图生成。

## 被试报名系统（`signup/`）

自包含的单页表单，无后端依赖，可直接由 GitHub Pages 托管。

- 入口：`signup/?project=nap-memory` 或 `signup/?project=overnight-sleep`
  （`participate.html` 的「报名筛选」按钮指向这里）
- 9 步流程：知情同意 → 基本信息 → 视力 → 环境适应 → PSQI → ISI → 昼夜节律 → DASS-21 → 时间安排
- 新增实验项目：编辑 `signup/index.html` 里的 `EXPERIMENTS` 数组

### 筛选阈值

| 项 | 通过条件 |
|---|---|
| PSQI | ≤ 5 |
| ISI | < 8 |
| rMEQ（昼夜类型） | 8–21，即排除明显夜晚型与明显清晨型 |
| DASS-21 | 抑郁 ≤ 9、焦虑 ≤ 7、压力 ≤ 14 |
| 视力 | 近视 < 800 度、远视 < 200 度、无散光 |
| 环境适应 | 无睡眠障碍史、不吸烟、未服助眠药物等 |

全部通过才判定为合格。rMEQ 采用简化版 5 题（取自 Horne & Östberg MEQ 的
第 1、7、10、18、19 题，权重与原版一致）。

### 提交链路

表单不直接调用任何第三方服务，而是把结构化数据 POST 到 `scf/` 目录部署的
腾讯云函数，由云函数转发飞书群通知。这样飞书 webhook 不暴露在前端，
被试的敏感健康数据也不出境。详见 `scf/README.md`。

> **注意**：`recruit/` 是本地的被试管理系统开发项目（Flask + Vue），
> 含密钥与大体积依赖，已在 `.gitignore` 中整体排除，**不属于本站点**。

## 本地预览

直接用浏览器打开 `index.html` 即可。若要让 `SITE_DATA.md` 生效，需起一个
HTTP 服务器：

```bash
python -m http.server 8000
# 然后访问 http://localhost:8000
```

## 测试

```bash
node --test tests/site-audit.test.mjs
```

覆盖：双语字段完整性、canonical/favicon/h1 等 SEO 与无障碍约定、
图片引用与首页体积预算、内容预渲染。

## 设计规范

莫兰迪深蓝配色：主色 `#4A6580`、深藏青 `#2E4A63`、中蓝 `#6B8BA4`、
浅蓝 `#8AACBF`、冷白背景 `#F0F4F7`。

字体：Syne / Space Grotesk（品牌与标题）、DM Sans（正文）、
Noto Serif SC（中文）。字体经 Google Fonts 非阻塞加载——该域名在中国大陆
不可达，因此所有字体栈都以平台中文字体（PingFang SC / 微软雅黑）收尾。

详见 `CLAUDE.md`。
