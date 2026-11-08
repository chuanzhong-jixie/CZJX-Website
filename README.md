# 川中计算机协会官网

面向社员的信息站：**看活动排期、读技术文档、了解社团**。三个任务对应三个入口，没有登录、报名、后台等额外功能。

## 技术栈

零构建、零依赖的静态站点：原生 HTML + CSS + ES5 级 JavaScript，数据用 JSON，文档用 Markdown，浏览器端渲染。

选这套的理由：

- Cloudflare Pages 直接把仓库当产物部署，不需要构建命令和 Node 环境。
- 没有依赖，就不会有依赖升级和供应链问题，社团换届时谁都能接手。
- 内容维护只需要改 JSON 和 Markdown，不需要懂前端框架。

## 目录结构

```
.
├── index.html                首页：社团简介 + 最新活动 + 方向概览
├── activities.html           活动排期（全部，含已结束）
├── docs.html                 文档库（按分类分组）
├── doc.html                  文档阅读页，通过 ?id=<文档 id> 打开
├── about.html                关于社团：方向、架构、加入方式、联系方式
├── 404.html                  404 页
├── _headers                  Cloudflare Pages 响应头（安全 + 缓存策略）
├── events/                   独立活动页（自带样式，不是站点模板的一部分）
├── data/
│   ├── activities.json       活动数据
│   └── docs.json             文档目录
├── content/docs/*.md         文档正文
└── assets/
    ├── css/style.css         全部样式（含主题 Token）
    ├── img/                  站点图标与 logo
    └── js/
        ├── app.js            共享工具：取数、日期、状态推导、状态区渲染
        ├── activities.js     活动列表
        ├── docs.js           文档目录
        ├── doc.js            文档阅读页
        └── markdown.js       极简 Markdown 渲染器
```

## 本地预览

页面通过 `fetch` 读取 JSON 和 Markdown，**直接双击 HTML 打不开数据**，必须起一个本地服务器：

```bash
python -m http.server 8000
# 然后访问 http://127.0.0.1:8000
```

## 部署到 Cloudflare Pages

1. 在 Cloudflare 控制台进入 Workers & Pages → Create → Pages → Connect to Git。
2. 选择本仓库，分支 `main`。
3. 构建配置全部留空：
   - Framework preset：`None`
   - Build command：留空
   - Build output directory：`/`
4. 保存并部署。之后每次 push 到 `main` 会自动重新发布。

`_headers` 会被 Pages 自动识别，无需额外配置。

## 维护内容

### 新增或修改活动

编辑 `data/activities.json`：

```json
{
  "id": "spring-meetup-2027",
  "title": "活动标题",
  "startAt": "2027-03-14T19:00:00+08:00",
  "endAt": "2027-03-14T21:00:00+08:00",
  "location": "图书馆2楼 · 计算机活动室",
  "tags": ["分享会"],
  "summary": "一句话说明这场活动讲什么。",
  "details": ["19:00 — 第一段", "19:40 — 第二段"],
  "link": "events/ai-contest.html",
  "linkLabel": "查看大赛详情 →"
}
```

`link` 可选。填了就在卡片底部生成一个按钮，指向独立活动页；`linkLabel` 是按钮文案，不写则默认「了解详情 →」。

活动页顶部公告条按 `STATUS_START` / `STATUS_END` 自动切换文案（赛前 / 赛中 / 赛后），改赛程时改脚本里那两行即可。

独立活动页左上角的返回按钮会读 `document.referrer`：从活动排期点进去的返回「活动排期」，直接打开或从别处进来的返回「首页」。页内已内置这段脚本，新增活动页时复制 `events/ai-contest.html` 的写法即可。

- `id` 会作为页内锚点，保持唯一，用英文小写加连字符。
- **不要手动写「已结束」「即将开始」**。状态由 `startAt` / `endAt` 与当前时间比较得出，全站自动同步。
- 时间必须带 `+08:00` 时区偏移，否则按 UTC 解析，会差 8 小时。
- 排序也自动：进行中 → 未开始 → 已结束（已结束按时间倒序）。
- 改完把顶层 `updatedAt` 更新为当天，页面上会显示「数据更新于 …」。

### 新增文档

1. 在 `content/docs/` 下新建 `.md` 文件。
2. 在 `data/docs.json` 的 `docs` 数组里加一项：

```json
{
  "id": "some-doc",
  "title": "文档标题",
  "category": "开发环境",
  "updatedAt": "2026-11-05",
  "summary": "一句话摘要，显示在列表里。",
  "path": "content/docs/some-doc.md",
  "published": true
}
```

- `category` 决定分组，顺序按该分类在 JSON 中首次出现的顺序。
- `published: false` 时列表中显示为「整理中」的不可点状态，适合先挂目录、后补正文。
- 正文从二级标题 `##` 开始写，页面自身已提供一级标题。支持的语法：标题、段落、粗体/斜体、行内代码、代码块、有序/无序列表、引用、表格、分割线、链接、图片。
- 图片放在 `content/docs/assets/<文档 id>/` 下，正文里用 `content/docs/assets/<文档 id>/xxx.png` 引用（路径相对站点根目录）。图片会懒加载，不写宽高也可以。

### 需要替换的占位内容

上线前请替换成真实信息：

- `about.html` 的联系邮箱 `czjx@example.edu.cn`。
- 首页与 `about.html` 里「图书馆2楼」「每周三第 8 节课」等活动室与时间描述。
- 页脚年份与 `_headers` 中的安全策略（如需嵌入外部内容，需放宽 `X-Frame-Options`）。
- 各页 `<meta name="description">` 如需针对具体学校措辞调整。

## 设计与可访问性约定

- 主题为赛博朋克霓虹，主题来源是 `cyberpunk-neon` 风格包 + StyleKit showcase：
  - 底色 `#0a0a0f`，面板 `#0d0d18`，主色 `#00ffff`，强调色 `#ff00ff`。
  - 全站等宽字体，中文回落到系统黑体；标签一律等宽大写 + 宽字距。
  - 面板内置 3px 周期扫描线，页面底层是 4px 周期青色扫描线并缓慢漂移。
  - 主按钮为实心青底黑字，次按钮为品红描边；按下有 `translate(2px,-1px)` 错位。
  - HUD 指标块用四角准星 + 发光大数字，区块标题带 `// 01` 编号。
  - 圆角统一 2px（风格包上限为 `rounded-lg` 的 8px）。
- 颜色 Token 集中在 `assets/css/style.css` 顶部，改主题只需改那一段。
- 正文对比度按 WCAG AA 取值。风格包原文里 `rgba(255,255,255,.35~.45)` 的辅助文字对比度不足，本站统一提到 0.56 以上。
- 所有交互元素支持键盘操作，焦点环为青色高亮；页面顶部有跳转主内容的链接。
- 尊重 `prefers-reduced-motion`：扫描线漂移、脉冲数字、光标闪烁、加载条动画、平滑滚动都会关闭。
- 活动状态通过静态文案表达（不打断读屏器），列表加载状态使用 `role="status"`，错误使用 `role="alert"`。

## 浏览器支持

现代浏览器（Chrome / Edge / Firefox / Safari 最近两个大版本）。使用了 `Intl.DateTimeFormat`、CSS `background-clip: text`、`backdrop-filter`；后者在旧浏览器上会退化为不透明背景，不影响可用性。
