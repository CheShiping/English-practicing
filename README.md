# 墨读英语 · Moread

一个完全静态、可部署在 GitHub Pages 上的英语精读网站。把每一篇真题读成自己的语感。

## 功能

- **文章库**：按科普 / 经历记叙 / 应用文 / 经济商业分类，展示词数、题量、难度、阅读进度与收藏。
- **点词查义**：内置 2.6 万词离线英汉词典（ECDICT），支持词形还原、音标、考试标签与浏览器发音。
- **划句翻译与句法提示**：选中句子后查看参考译文、重点词汇与从句/逻辑提示；也可生成全文翻译。
- **批注**：选中文本后四色高亮、写笔记；批注面板可回跳原文。
- **做题与解析**：右侧题目面板答题、标记题目、提交判分、查看答案与逐题解析、只看错题、重做。
- **单选练习**：2774 道专升本词汇语法单选题，按语法框架（六大词性 / 两个态 / 三大从句 / 五大句型 / 四个重点 / 其他）分大类与细分考点组卷，支持随机 / 顺序、逐题解析与错题本。
- **计时**：正计时 / 倒计时、快捷键、暂停、隐藏、可拖动悬浮卡，离开页面不丢失。
- **生词本**：收录、搜索、筛选、发音、掌握度、间隔复习、导出 CSV。
- **学习数据**：阅读时长、完成文章、正确率、连续天数、14 天柱状图与题材进度。
- **排版**：纸感 / 纯白 / 夜间主题，字号、行高、字体、版心宽度、两端对齐、防误触、生词高亮。
- **导入文章**：在站内粘贴 Markdown 或拖入 `.md` / `.txt`，自动识别文章、题目、答案与解析。
- **本地优先**：所有数据保存在浏览器 localStorage，支持完整 JSON 备份与恢复。

## 技术栈

- Next.js 15（App Router，`output: 'export'` 静态导出）
- React 19 + TypeScript
- 纯 CSS 设计系统（无 UI 框架）
- lucide-react 图标
- 离线词典：ECDICT（MIT），按首字母拆分为 `public/dict/words/*.json`，点词时只加载对应字母块

## 本地开发

```bash
npm install
npm run dev
```

打开 http://localhost:3000。

构建静态站点：

```bash
npm run build
```

产物在 `out/`，可直接用任意静态服务器预览：

```bash
python -m http.server 3000 --directory out
```

## 添加 / 修改文章

文章源文件放在 `article/*.md`。支持以下格式：

```markdown
# 科普类专项训练

Passage 1

English passage...

1. Question ______.
A. Option A
B. Option B
C. Option C
D. Option D
答案：A
解析：在原文第 2 段...
```

- 用 `Passage 1`、`## Passage 1` 分隔多篇。
- 题目以 `1.` 开头，选项以 `A.` 开头。
- `答案：A` 与 `解析：...` 可选；没有答案也能作为纯练习导入。
- 以 `-` 或 `*` 开头的行会渲染成列表。

修改后运行：

```bash
npm run content
```

会重新生成 `src/data/articles.generated.json`。

新增未注册的题材文件（例如 `科技类专项训练.md`）会自动归入同名分类，使用默认配色与书本图标；如果希望给它单独的配色和图标，在 `src/data/article-meta.ts` 的 `CATEGORY_META` 中补一项即可。

### 答案与译文

- 答案：`src/data/answers/*.json`，按文章 id 和题号组织。
- 译文：`src/data/translations-part*.json`，数组顺序与文章段落/列表块一一对应。
- 单选练习的答案、考点分类与解析：`src/data/answers/danxuan.json`（键为练习组 id + 组内顺序索引），由 `npm run content` 合并生成 `public/data/practice.json` 供练习页按需加载。

例如：

```json
{
  "kepu-01": {
    "1": {
      "answer": "A",
      "explanation": "全文围绕睡眠展开。",
      "evidence": "Sleep is necessary for good health."
    }
  }
}
```

### 站内导入

普通使用者不需要改代码：进入「导入文章」页面，粘贴内容或拖入文件即可。导入文章保存在浏览器本地，并可随时删除。

## 部署到 GitHub Pages

1. 新建 GitHub 仓库并推送本项目到 `main` 分支。
2. 工作流中的 `actions/configure-pages` 会尝试自动启用 Pages（`enablement: true`）。若仓库或组织策略禁止自动启用，请到 **Settings → Pages → Build and deployment → Source** 手动选择 **GitHub Actions**。
3. 推送后，`.github/workflows/deploy.yml` 会自动构建并部署。
4. 若部署在 `https://<user>.github.io/<repo>/`，工作流会自动注入 `NEXT_PUBLIC_BASE_PATH`；无需手动改配置。

> 本站使用 hash 路由（`#/read/kepu-01`），因此 GitHub Pages 不需要任何 404 重写规则。

## 目录结构

```
app/                  Next.js 页面、全局样式与设计系统
article/              文章 Markdown 源文件
scripts/              文章解析、词典生成脚本
src/data/             生成的文章数据、答案、译文、分类元信息
src/components/       页面与阅读器组件
src/lib/              解析、词典、翻译、存储、路由、工具
src/state/            全局学习数据（localStorage 持久化）
public/dict/          离线英汉词典
.github/workflows/    GitHub Pages 自动部署
```

## 说明

- 翻译与句法提示：内置文章使用本地译文；导入文章可调用 MyMemory 在线翻译，结果会缓存到本地。
- 词典数据来自 [ECDICT](https://github.com/skywind3000/ECDICT)（MIT License）。如果重新生成了 `public/dict/ecdict.json`，请运行 `npm run dict:split` 重新生成按字母拆分的词典块。
- 文章内容仅用于学习，请勿用于商业转载。
