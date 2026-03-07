# 睡眠与认知实验室网站

睡眠与记忆研究实验室的官方网站，设计参考了 [UCI Cognitive Neuroscience of Sleep Lab](https://sleep.bio.uci.edu/lab-members/) 和 [HKU SCNLab](https://www.psychology.hku.hk/scnlab/knowledgeexchange.html)。

## 网站结构

- **index.html** - 首页：实验室介绍、研究概览、主题配图
- **team.html** - 团队成员：按角色展示 PI、实验室管理员、研究生、研究助理、本科生
- **research.html** - 研究项目：主要研究方向及代表性论文
- **publications.html** - 研究成果：论文、会议报告、获奖情况
- **knowledge-exchange.html** - 知识交流：科普内容下载（心理健康、睡眠与健康等）
- **contact.html** - 联系我们：地址、联系方式、参与研究、加入实验室

## 使用方法

直接使用浏览器打开 `index.html` 即可浏览网站。也可将项目部署到任何静态网页托管服务（如 GitHub Pages、Netlify 等）。

## 自定义内容

请根据您的实验室实际情况修改以下内容：

1. **团队信息**：在 `team.html` 中替换为真实成员姓名、邮箱、简介
2. **研究项目**：在 `research.html` 中更新研究方向和论文列表
3. **研究成果**：在 `publications.html` 中更新论文、会议报告和获奖信息
4. **知识交流**：在 `knowledge-exchange.html` 中替换为实际科普材料及下载链接
5. **联系方式**：在 `contact.html` 和所有页脚的 `lab@example.edu` 中填写真实邮箱和地址
6. **首页图片**：可在 `index.html` 中修改 `.hero-image img` 的 `src` 为本地图片路径或更换图片链接

## 语言切换

- 默认显示中文
- 点击导航栏的「EN」可切换为英文
- 语言偏好会保存在浏览器 localStorage，跨页面访问时保持所选语言

## 技术说明

- HTML + CSS + JavaScript（用于语言切换）
- 响应式设计，支持移动端浏览
- 使用思源宋体（Noto Serif SC）作为标题字体
