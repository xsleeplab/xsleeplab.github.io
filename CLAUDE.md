# CLAUDE.md — X-Sleep Lab Website

## 项目概述 (Project Overview)

**X-Sleep Lab** — 探索睡眠认知神经科学的学术实验室网站。
- **X** 代表：探索睡眠中的未知（eXplore the unknown in sleep），以及 PI 姓氏 **Xia**
- **PI**: Xia Tao（夏涛）— 睡眠认知神经科学研究者，博士后/新晋PI，曾就职于香港大学心理学系
- **研究领域**: 睡眠认知神经科学，以人类睡眠为研究对象

## PI 信息 (PI Information)

- **姓名**: Xia Tao（夏涛）
- **学历**: Ph.D.（毕业于香港大学 The University of Hong Kong）
- **现任职**: 中国科学院心理研究所，认知科学与心理健康全国重点实验室，Principal Investigator（PI）
- **专业方向**: 睡眠与记忆神经科学，EEG，靶向记忆再激活（TMR），情绪记忆调控，闭环脑机接口
- **ResearchGate**: https://www.researchgate.net/profile/Tao-Xia-6
- **所在机构**: Institute of Psychology, Chinese Academy of Sciences (IPcas)
- **实验室**: State Key Laboratory of Cognitive Science and Mental Health
- **合作者**: Xiaoqing Hu (HKU), Ken A. Paller (Northwestern), James W. Antony (Cal Poly)

## 研究方向 (Research Directions)

1. **睡眠中负性情感记忆的调控** — Regulation of Negative Emotional Memory During Sleep
   - 通过靶向记忆再激活（TMR）在睡眠中调控负性情绪记忆
   - 代表作：PNAS 2024, Current Biology 2023

2. **无创闭环睡眠脑机接口** — Non-invasive Closed-loop Sleep Brain-Computer Interface
   - 实时EEG解码睡眠状态，精准时机干预记忆加工
   - 结合神经振荡相位依赖性刺激技术

3. **清醒梦中的认知加工机制及其与意识的关系** — Cognitive Processing in Lucid Dreams and Consciousness
   - 探索清醒梦状态的神经机制
   - 研究睡眠意识连续谱及其认知功能

## 网站结构 (Site Structure)

| 文件 | 页面 | 说明 |
|------|------|------|
| `index.html` | 首页 | 动态 hero 轮播、关于我们 |
| `team.html` | 团队成员 | PI、研究生、研究助理 |
| `research.html` | 研究项目 | 三大研究方向 |
| `publications.html` | 研究成果 | 按年份论文列表 |
| `news.html` | 新闻 | 原"知识交流"，改为实验室新闻动态 |
| `join.html` | 加入我们 | 原"联系我们"，招募信息 |
| `css/style.css` | 样式 | Morandi 莫兰迪配色，酷炫字体 |
| `js/translations.js` | 翻译文案 | 中英双语 |
| `js/lang-switch.js` | 语言切换 | 默认英文，可切中文 |

## 设计规范 (Design Specifications)

### 莫兰迪深蓝色系 (Morandi Deep Blue Palette)
- 主色: `#4A6580`（莫兰迪深蓝）
- 主色深: `#2E4A63`（深藏青）
- 辅色: `#6B8BA4`（莫兰迪中蓝）
- 强调色: `#8AACBF`（莫兰迪浅蓝）
- 背景: `#F0F4F7`（冷白/淡蓝白）
- 卡片背景: `#FFFFFF`（纯白）
- 文字主色: `#2C3E4A`（深蓝黑）
- 文字次色: `#5A7080`（中蓝灰）
- 边框: `#C8D8E4`（淡蓝灰）
- 导航背景: `rgba(46, 74, 99, 0.96)`（深蓝半透明）

### 字体 (Typography)
- **英文标题**: Space Grotesk（酷炫现代感）+ Cormorant Garamond（优雅衬线备选）
- **中文**: Noto Serif SC（思源宋体）
- **正文**: DM Sans / Inter

### Hero 区域
- 动态轮播图（Swiper.js 或原生 CSS）
- 支持新增论文图片 / 新闻图片
- 半透明莫兰迪色遮罩

### 语言
- **默认英文**，可切换中文
- `data-i18n` 属性驱动翻译

### 导航变更
- `knowledge-exchange.html` → `news.html`（知识交流 → News / 新闻）
- `contact.html` → `join.html`（联系我们 → Join Us / 加入我们）
- 导航字体适当增大（0.95rem → 1rem+）

## 技术栈 (Tech Stack)

- 纯 HTML + CSS + Vanilla JS（无框架依赖）
- Google Fonts（Space Grotesk, DM Sans, Noto Serif SC, Cormorant Garamond）
- Swiper.js CDN（hero 轮播）
- 响应式设计，移动端适配

---

## 工作流要求 (Workflow Rules)

- **强制计划模式**：在进行任何复杂的文件修改、重构或新功能开发之前，必须先输出一个 step-by-step 的计划。
- 在我明确回复"同意"或"继续"之前，绝对不要直接修改代码或运行终端命令。
