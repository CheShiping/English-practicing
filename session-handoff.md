# 会话交接

## 当前目标

- 目标：内容侧、文档与视觉素材已收口；最新完成五大语法分区全面更新与题型分目录的管线适配（feat-022）
- 当前状态：120 篇 / 588 题全量译文、解析、原文依据与 ARTICLE_META；五个语法分区约 6.9 万字上线（含主谓一致、虚拟语气、非谓语、倒装、介词、连词等）；`article/` 已按 `阅读` / `单选` / `完型` 分目录，内容管线改为递归扫描并跳过非文章目录；构建通过，待提交推送
- 分支 / 提交：`main`

## 本次会话已完成

- [x] 语法同步：5 个语法框架 md 的用户更新全部上线（约 2.9 万 → 6.9 万字），`grammar.generated.json` 重新生成
- [x] 渲染增强：`grammar-md.ts` 支持 `---` / `***` / `___` → `<hr/>`，`pages.css` 补 `.grammar-content hr` 虚线样式
- [x] 管线适配：`build-content.mjs` 递归扫描 `article/` 并跳过 `语法框架` / `单选` / `完型`；`build-practice.mjs` 单选源支持 `article/单选/` 与顶层双路径，缺失时保留现有 `practice.json`
- [x] 数据核对：10 个阅读文件与单选源 sha1 与旧文件一致（仅移动），`articles.generated.json` / `practice.json` 除时间戳外零变化

## 历史会话已完成

- [x] `src/data/answers/read-01-20.json`、`read-21-40.json`：新增 40 篇 200 题的答案、中文解析与原文依据
- [x] `src/data/translations-part13.json`、`translations-part14.json`：新增 40 篇 / 172 段译文
- [x] `src/data/article-meta.ts`：新增 40 条标题、副标题、标签、摘要
- [x] `src/data/translations-part15.json`：17 篇旧文章 / 89 段译文
- [x] `src/data/answers/legacy-11-21.json`：17 篇旧文章 / 84 题的解析与原文依据（答案沿用源文件并逐题核对）
- [x] 21 道旧题补 `evidence`，588 题三字段齐全
- [x] 源文件清理：9 处 `## Exercise N` 选项污染、7 处空行断句、read-05 截词、read-11 缺谓语
- [x] 文档同步：README 增加分类表与规模说明，AGENTS 补译文/元数据/完成定义，feat-002 ~ feat-005 收口
- [x] `src/data/article-meta.ts` 补齐剩余 29 条元数据，120 篇全部有自定义标题/摘要，文库不再出现 `Passage N` 回退
- [x] 用 headless Chromium 重拍 5 张 README 截图（首页 / 阅读器 / 文库 / 练习答题卡 / 移动端答题卡），新增练习存档面板图并更新 README 引用
- [x] 同步 `article/语法框架/六大词性.md` 的知识点更新：`scripts/build-grammar.mjs` 增加压平导出还原与文字保真校验，`src/lib/grammar-md.ts` 支持 `rgb()` 颜色并跳过空段落（feat-021）

## 验证证据

| 检查项 | 命令 | 结果 | 备注 |
|---|---|---|---|
| 内容生成 | `npm run content` | 通过 | 120 篇 / 588 题 / 32568 词；2774 单选；语法 5 分区（130/176/273/185/312 行） |
| 文章数据不变 | 生成物比对 | 通过 | `articles.generated.json` / `practice.json` 除 `generatedAt` 外与 HEAD 完全一致 |
| 答案与解析 | 校验脚本 | 通过 | 588 题 answer / explanation / evidence 均非空 |
| 译文覆盖 | 校验脚本 | 通过 | 全站 582 个 block 均有 translation，缺失 0 |
| 类型检查 | `npx tsc --noEmit` | 通过 | exit 0 |
| 元数据覆盖 | 校验脚本 | 通过 | ARTICLE_META 120 条，missing 0 / extra 0 |
| 截图资产 | headless Chromium | 通过 | 1440×900 五张 + 390×844 一张，引用路径与尺寸逐一核对 |
| 静态构建 | `npm run build` | 通过 | 静态导出 2/2 |
| 语法页渲染 | headless Chrome `#/grammar` | 通过 | 5 个分区 / 16 张表格 / 1 条 hr / 1 个 callout / 38 处彩色标注，五分区可见文字与源文逐一一致 |

## 文件变更

- `article/语法框架/*.md`（5 个，用户更新）
- `article/` 目录重组：10 个分类文件移入 `阅读/`，单选源移入 `单选/`，新增 `完型/`（3 份 PDF + 提取的 md）与一份高频词组 PDF
- `scripts/build-content.mjs`（递归扫描 + 目录跳过）、`scripts/build-practice.mjs`（双路径 + 容错）
- `src/lib/grammar-md.ts`（分割线支持）、`app/pages.css`（hr 样式）
- `src/data/grammar.generated.json`（生成）
- `README.md`、`AGENTS.md`（源文件路径、目录结构与管线边界）
- `feature_list.json`、`progress.md`、`session-handoff.md`

## 已做出的决策

- 答案与解析统一按「文章 id → 题号」写入 `src/data/answers/*.json`，不手改生成物
- 译文按 block 索引写入 `translations-part*.json`，与正文段落严格一一对应
- 旧文章补解析时保留源文件答案，仅在发现明显矛盾时才校订（本次 84 题答案全部经复核，未改动）
- 元数据标题风格对齐既有 80 篇：英文标题 + 中文副标题 + 2~3 个标签 + 一句话摘要
- 语法框架 md 保持笔记软件导出的原样，结构化还原统一放在 `scripts/build-grammar.mjs`：仅检测到「单个超长行 + 多个内联标题或内联表格」时启用，还原后做去空白逐字保真校验；不手改源文件、不手改生成物
- 内容源按题型分目录：文章管线递归扫描 `article/`，但显式跳过 `语法框架` / `单选` / `完型`；单选源用候选路径并在缺失时保留现有 `practice.json`，避免源文件移动导致部署失败

## 阻塞 / 风险

- 生成物时间戳仍会造成 diff，属正常现象

## 下一会话启动

1. 阅读 `AGENTS.md`。
2. 阅读 `feature_list.json` 与 `progress.md`。
3. 查看本交接文档。
4. 编辑前运行 `powershell -ExecutionPolicy Bypass -File .\init.ps1`（或 `bash init.sh`）。

## 下一步建议

- 例行检查：改动后跑 `npm run content`，确认「含答案 588 题 · 含译文 120 篇」且无警告
- 语法框架再更新时：看 `npm run content` 日志是否标注「已还原压平导出」、有无保真校验报错，再用 `out/` + headless Chrome 打开 `#/grammar` 复核标题、表格与彩色标注
- `article/完型/` 已有 3 份完型 PDF 与 `完形填空_题目提取.md`，尚未接入功能；若要做完型练习，需要新增题型页、考点数据与独立内容管线（当前文章管线已显式跳过该目录）
- 若再次调整界面，用 `out/` 静态产物 + headless Chromium 按 1440×900 / 390×844 两档重拍 `assets/readme/` 截图，练习图需先真实答几题以呈现绿对 / 红错 / 金框标记
