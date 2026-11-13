# 会话交接

## 当前目标

- 目标：完成内容侧收尾（feat-018 / feat-019）、全站文档同步（feat-005）与视觉素材更新（feat-020）
- 当前状态：120 篇 / 588 题全量译文、解析、原文依据与 ARTICLE_META；README、AGENTS、功能清单、交接文档与 6 张界面截图已同步；构建通过，已提交
- 分支 / 提交：`main`

## 本次会话已完成

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

## 验证证据

| 检查项 | 命令 | 结果 | 备注 |
|---|---|---|---|
| 内容生成 | `npm run content` | 通过 | 120 篇 / 588 题 / 32568 词；答案 588 题；译文 120 篇；无警告 |
| 答案与解析 | 校验脚本 | 通过 | 588 题 answer / explanation / evidence 均非空 |
| 译文覆盖 | 校验脚本 | 通过 | 全站 582 个 block 均有 translation，缺失 0 |
| 类型检查 | `npx tsc --noEmit` | 通过 | exit 0 |
| 元数据覆盖 | 校验脚本 | 通过 | ARTICLE_META 120 条，missing 0 / extra 0 |
| 截图资产 | headless Chromium | 通过 | 1440×900 五张 + 390×844 一张，引用路径与尺寸逐一核对 |
| 静态构建 | `npm run build` | 通过 | 静态导出 2/2 |

## 文件变更

- 新增 `src/data/answers/read-01-20.json`、`read-21-40.json`、`legacy-11-21.json`
- 新增 `src/data/translations-part13.json`、`translations-part14.json`、`translations-part15.json`
- 修改 `src/data/answers/` 下 10 个旧答案文件（21 道题补 evidence）
- 修改 `src/data/article-meta.ts`（40 + 29 条元数据）、`article/` 下 7 个分类文件
- 替换 `assets/readme/` 下 5 张 PNG，新增 `shot-practice-resumes.png`
- 修改 `README.md`、`AGENTS.md`、`feature_list.json`、`progress.md`、`session-handoff.md`

## 已做出的决策

- 答案与解析统一按「文章 id → 题号」写入 `src/data/answers/*.json`，不手改生成物
- 译文按 block 索引写入 `translations-part*.json`，与正文段落严格一一对应
- 旧文章补解析时保留源文件答案，仅在发现明显矛盾时才校订（本次 84 题答案全部经复核，未改动）
- 元数据标题风格对齐既有 80 篇：英文标题 + 中文副标题 + 2~3 个标签 + 一句话摘要

## 阻塞 / 风险

- 生成物时间戳仍会造成 diff，属正常现象

## 下一会话启动

1. 阅读 `AGENTS.md`。
2. 阅读 `feature_list.json` 与 `progress.md`。
3. 查看本交接文档。
4. 编辑前运行 `powershell -ExecutionPolicy Bypass -File .\init.ps1`（或 `bash init.sh`）。

## 下一步建议

- 例行检查：改动后跑 `npm run content`，确认「含答案 588 题 · 含译文 120 篇」且无警告
- 若再次调整界面，用 `out/` 静态产物 + headless Chromium 按 1440×900 / 390×844 两档重拍 `assets/readme/` 截图，练习图需先真实答几题以呈现绿对 / 红错 / 金框标记
