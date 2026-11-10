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
| `src/components/pages/` | 七个页面：首页、文章库、阅读器、生词本、统计、设置、导入 |
| `src/components/reader/` | 阅读器子组件（正文、题目、批注、翻译抽屉、计时器等） |
| `src/state/AppProvider.tsx` | 全局状态与 localStorage 持久化 |
| `src/lib/` | 词典、Markdown 解析、路由、存储、翻译、类型定义 |
| `src/data/article-meta.ts` | 文章标题/摘要/标签与分类文案（按文章 id 索引） |
| `article/*.md` | 文章与题目源文件（唯一内容源） |
| `scripts/build-content.mjs` | 内容管线：解析文章 → `src/data/articles.generated.json` |
| `src/data/answers/*.json` | 答案、解析、原文定位，按文章 id 合并 |
| `public/dict/` | 离线词典块（生成产物，勿手改） |

## 内容管线

- **新增/修改文章**：只改 `article/*.md`，然后跑 `npm run content`；不要手改 `src/data/articles.generated.json`。
- **文件名决定分类**：映射表在 `scripts/build-content.mjs` 顶部的 `CATEGORY_MAP`；新增分类还需同步 `src/data/article-meta.ts` 的 `CATEGORY_META`。
- **答案与解析**：写 `src/data/answers/*.json`，按文章 id 与题号 `num` 合并。
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
- [ ] 仓库仍可从干净状态按启动路径恢复
- [ ] 验证通过后直接 commit 并 push，无需等待用户手动提交或推送

## 范围边界

- **一次只做一个功能**：从 `feature_list.json` 挑一个 `in-progress`，或首个依赖已满足的 `not-started` 功能。
- **不改生成物**：`src/data/articles.generated.json`、`public/dict/`、`.next/`、`out/`、`node_modules/`。
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
