# 会话交接

## 当前目标

- 目标：完成阅读文章重新分类与新增 40 篇（feat-012）
- 当前状态：10 个新分类、120 篇文章已进入管线，构建通过，待提交
- 分支 / 提交：`main`

## 本次会话已完成

- [x] 新增 `article/阅读.md` 的 40 篇 / 200 题，按题材并入新分类
- [x] 原 7 个旧分类重组为 10 个新分类：健康与医学、自然与科技、心理与行为、教育与成长、职场与商业、社会与城市、旅行与出行、文化与历史、人物与故事、实用文书
- [x] 旧文章通过 `<!-- id: ... -->` 保留原 id，答案、译文、元数据与本地进度不受影响
- [x] 完成去重比对与构建验证

## 验证证据

| 检查项 | 命令 | 结果 | 备注 |
|---|---|---|---|
| 内容生成 | `npm run content` | 通过 | 120 篇 / 588 题 / 32558 词；答案 388 题；译文 63 篇 |
| 类型检查 | `npx tsc --noEmit` | 通过 | 2026-11-11 |
| 静态构建 | `npm run build` | 通过 | 静态导出 2/2 |
| UI 抽查 | 浏览器 | 通过 | 首页 10 个分类卡片；文库 10 个筛选 chip，全部 120 篇 |

## 文件变更

- 新增 `article/` 下 10 个分类文件；删除原 7 个旧分类文件与 `article/阅读.md`
- `scripts/build-content.mjs`：新分类映射、`<!-- id: ... -->` 支持
- `src/data/article-meta.ts`：新 `CATEGORY_META`
- `src/components/pages/HomePage.tsx`、`LibraryPage.tsx`、`ImportPage.tsx`：新分类图标与文案
- `src/lib/parse-markdown.ts`：导入文章分类推断更新
- `README.md`、`feature_list.json`、`progress.md`

## 已做出的决策

- 文章 id 与分类解耦：旧 id 原样保留，新文章使用 `read-01` ~ `read-40`
- 分类按题材重组，不再保留“冲刺训练”混合分类
- 答案/译文按旧 id 继续生效，不迁移 JSON 键

## 阻塞 / 风险

- 新增 40 篇的源文件不含答案，当前 200 道新题无答案与解析
- 新增 40 篇暂无中文译文
- 新增 40 篇暂无 `ARTICLE_META` 自定义标题/摘要，文库使用首句回退标题

## 下一会话启动

1. 阅读 `AGENTS.md`。
2. 阅读 `feature_list.json` 与 `progress.md`。
3. 查看本交接文档。
4. 编辑前运行 `powershell -ExecutionPolicy Bypass -File .\init.ps1`（或 `bash init.sh`）。

## 下一步建议

- 如需要，为 `read-01` ~ `read-40` 补答案、解析与译文
- 如需要，为新增文章补 `ARTICLE_META` 标题、摘要与标签
