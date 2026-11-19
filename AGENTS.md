# AGENTS.md

墨读英语（Moread）：Next.js 15 + React 19 + TypeScript 的纯静态英语精读站点，`output: 'export'` 导出到 `out/` 并部署 GitHub Pages。无后端，学习数据全部存 localStorage。

## 启动工作流

开始写代码前，按顺序完成：

1. **确认工作目录**：`pwd`，应为仓库根目录。
2. **读完本文件与 `README.md`**。
3. **检查仓库状态**：`git status --short` 与 `git log --oneline -5`。未提交改动可能属于用户，不要擅自回滚。
4. **运行验证**：Windows 用 `powershell -ExecutionPolicy Bypass -File .\init.ps1`；Bash 环境用 `bash init.sh`。
5. **读 `feature_list.json` 与 `progress.md`**，确认当前功能与下一步。

基线验证失败时，先修复基线，不要叠加新功能。

## 项目地图

| 路径 | 作用 |
|---|---|
| `app/` | App Router 入口与全局样式（`globals.css` / `pages.css` / `reader.css`） |
| `src/components/pages/` | 十个页面：首页、文章库、阅读器、单选练习、完型填空、语法速查、生词本、统计、设置、导入 |
| `src/components/reader/` | 阅读器子组件（正文、题目、批注、翻译抽屉、计时器等） |
| `src/state/AppProvider.tsx` | 全局状态与 localStorage 持久化 |
| `src/lib/` | 词典、Markdown 解析、路由、存储、翻译、类型定义 |
| `src/data/article-meta.ts` | 文章标题/副标题/标签/摘要与分类文案（按文章 id 索引） |
| `article/阅读/*.md` | 阅读文章与题目源文件（唯一内容源，10 个题材分类） |
| `article/单选/*.md` | 单选练习题库源文件（由 `build-practice.mjs` 处理） |
| `article/完型/` | 完型填空题源：`完形填空_题目提取.md`（基础 30 篇）、`完型填空_PDF提取.md`（进阶 35 篇，脚本提取）、原始 PDF 存档 |
| `scripts/build-content.mjs` | 内容管线：解析文章 → `src/data/articles.generated.json` |
| `scripts/build-cloze.mjs` | 完型管线：解析两份完型 md + `answers/cloze*.json` → `public/data/cloze.json` |
| `scripts/extract-cloze-pdf.py` | 一次性工具：把 `article/完型/*.pdf` 提取成 markdown（需 PyMuPDF，产物需人工校对） |
| `src/data/answers/*.json` | 阅读题答案、解析、原文依据；`danxuan.json` 为单选练习答案与考点；`cloze-*.json` 为完型逐空答案与解析 |
| `src/data/cloze-meta.ts` | 完型中文小标题（英文标题由管线取首句生成） |
| `src/data/translations-part*.json` | 逐段中文译文，数组下标对应 `blocks` 索引 |
| `public/data/practice.json` | 单选练习题库（生成产物，按需 fetch） |
| `public/data/cloze.json` | 完型填空题库（生成产物，按需 fetch） |
| `public/dict/` | 离线词典块（生成产物，勿手改） |

## 内容管线

- **新增/修改文章**：只改 `article/阅读/*.md`，然后跑 `npm run content`；不要手改 `src/data/articles.generated.json`。
- **目录边界**：`build-content.mjs` 递归扫描 `article/`，但跳过 `语法框架` / `单选` / `完型`；`build-practice.mjs` 依次尝试 `article/单选/` 与顶层，找不到时保留现有 `practice.json`。
- **文件名决定分类**：映射表在 `scripts/build-content.mjs` 顶部的 `CATEGORY_MAP`；新增分类还需同步 `src/data/article-meta.ts` 的 `CATEGORY_META`。
- **答案与解析**：写 `src/data/answers/*.json`，按文章 id 与题号 `num` 合并；每项含 `answer`、`explanation`、`evidence`（可定位的英文原句）。
- **译文**：写 `src/data/translations-part*.json`，键为文章 id，值为按 `blocks` 顺序排列的译文数组，长度必须与 `blocks` 一致。
- **内容四件套**：新增文章时，题目的 answer/explanation/evidence、逐段译文、`ARTICLE_META` 标题/副标题/标签/摘要必须一并补齐；缺任何一项都算未完成。
- **完型填空**：改 `article/完型/*.md`（空格写 `___N___`，选项写 `N. A. … B. … C. … D. …`），答案与解析写 `src/data/answers/cloze-*.json`，中文小标题写 `src/data/cloze-meta.ts`，然后跑 `npm run content` 生成 `public/data/cloze.json`；PDF 原件用 `python scripts/extract-cloze-pdf.py` 重新提取，产物必须逐篇校对空格与选项。
- **完型答案完整性**：每篇每个空都要有 `a`（A-D）与 `n`（中文解析），管线会逐空报「无答案 / 选项数不对」；交卷页的「原句」由管线自动从正文截取。
- **词典**：`npm run dict:split` 重建 `public/dict/`，成本高，非必要不跑。
- `articles.generated.json` 每次生成都会更新 `generatedAt` 时间戳，该文件出现 diff 属正常。

## 验证命令

必须运行的检查：

- `npx tsc --noEmit` — TypeScript 类型检查
- `npm run build` — 内容生成 + 静态导出（产物在 `out/`）

说明：

- `npm run lint` 当前不可用：仓库没有 ESLint 配置，`next lint` 会进入交互式初始化。不要把它当作验证门槛。
- UI 改动需手动确认：`npm run dev` 后打开 http://localhost:3000。

## 完成定义

功能只有满足全部条件才算完成：

- [ ] 目标行为已实现，且只改了相关文件
- [ ] `npx tsc --noEmit` 与 `npm run build` 均通过
- [ ] 证据（命令 + 结果）写入 `feature_list.json` 的 `evidence` 或 `progress.md`
- [ ] 内容类改动已跑 `npm run content`，生成文件与源文件一致
- [ ] 内容类改动已核对四件套：每题 `answer` / `explanation` / `evidence` 非空，所有 `block` 有 `translation`，`ARTICLE_META` 有对应条目
- [ ] 仓库仍可从干净状态按启动路径恢复
- [ ] 验证通过后直接 commit 并 push，无需等待用户手动提交或推送

## 范围边界

- **一次只做一个功能**：从 `feature_list.json` 挑一个 `in-progress`，或首个依赖已满足的 `not-started` 功能。
- **不改生成物**：`src/data/articles.generated.json`、`src/data/grammar.generated.json`、`public/data/practice.json`、`public/dict/`、`.next/`、`out/`、`node_modules/`。
- **不回滚用户改动**：已有的未提交修改可能属于用户，只做加法或明确要求的修改。
- **架构/需求不清**：先查 `README.md` 与 `src/lib/types.ts`；仍不明确就问用户。
- **范围模糊**：回到 `feature_list.json` 的完成定义收敛。

## 结束会话

1. 更新 `progress.md`：当前状态、已完成、下一步、阻塞。
2. 更新 `feature_list.json` 的状态与 `evidence`。
3. 记录未解决风险；跨会话的大改动写 `session-handoff.md`。
4. 验证通过后直接 `git commit` 并 `git push`，不要等用户手动提交或推送。不要提交 `.next/`、`out/`、`node_modules/`。
5. 确认下一会话可直接运行 `init.ps1` / `init.sh`。

仓库应始终保持可随时重启的干净状态。
