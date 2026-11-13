# 会话交接

## 当前目标

- 目标：完成内容侧收尾——新增 40 篇（feat-018）与 17 篇旧文章（feat-019）的答案、解析、译文、元数据
- 当前状态：全站 120 篇均有译文，582 个正文块全部有译文，588 题全部有答案与解析，构建通过，已提交
- 分支 / 提交：`main`

## 本次会话已完成

- [x] `src/data/answers/read-01-20.json`、`read-21-40.json`：新增 40 篇 200 题的答案、中文解析与原文依据
- [x] `src/data/translations-part13.json`、`translations-part14.json`：新增 40 篇 / 172 段译文
- [x] `src/data/article-meta.ts`：新增 40 条标题、副标题、标签、摘要
- [x] `src/data/translations-part15.json`：17 篇旧文章 / 89 段译文
- [x] `src/data/answers/legacy-11-21.json`：17 篇旧文章 / 84 题的解析与原文依据（答案沿用源文件并逐题核对）
- [x] 源文件清理：9 处 `## Exercise N` 选项污染、7 处空行断句、read-05 截词、read-11 缺谓语

## 验证证据

| 检查项 | 命令 | 结果 | 备注 |
|---|---|---|---|
| 内容生成 | `npm run content` | 通过 | 120 篇 / 588 题 / 32568 词；答案 588 题；译文 120 篇；无警告 |
| 答案与解析 | 校验脚本 | 通过 | 588 题 answer 与 explanation 均非空 |
| 译文覆盖 | 校验脚本 | 通过 | 全站 582 个 block 均有 translation，缺失 0 |
| 类型检查 | `npx tsc --noEmit` | 通过 | exit 0 |
| 静态构建 | `npm run build` | 通过 | 静态导出 2/2 |

## 文件变更

- 新增 `src/data/answers/read-01-20.json`、`read-21-40.json`、`legacy-11-21.json`
- 新增 `src/data/translations-part13.json`、`translations-part14.json`、`translations-part15.json`
- 修改 `src/data/article-meta.ts`、`article/` 下 7 个分类文件、`feature_list.json`、`progress.md`

## 已做出的决策

- 答案与解析统一按「文章 id → 题号」写入 `src/data/answers/*.json`，不手改生成物
- 译文按 block 索引写入 `translations-part*.json`，与正文段落严格一一对应
- 旧文章补解析时保留源文件答案，仅在发现明显矛盾时才校订（本次 84 题答案全部经复核，未改动）
- 元数据标题风格对齐既有 80 篇：英文标题 + 中文副标题 + 2~3 个标签 + 一句话摘要

## 阻塞 / 风险

- 21 道旧题有 `explanation` 但无 `evidence`（kepu-01/03/05/08/09、shehui-01/02/04/06/08/09/10、chongci-06/07/10/11/12、lishi-02、jingli-04、yingyong-04）；界面按 `q.evidence &&` 条件渲染，不会出现空块
- 生成物时间戳仍会造成 diff，属正常现象

## 下一会话启动

1. 阅读 `AGENTS.md`。
2. 阅读 `feature_list.json` 与 `progress.md`。
3. 查看本交接文档。
4. 编辑前运行 `powershell -ExecutionPolicy Bypass -File .\init.ps1`（或 `bash init.sh`）。

## 下一步建议

- 可选：为上述 21 道旧题补 `evidence`，让「原文依据」在 588 题上完全一致
- 更新 README 的内容统计（120 篇 / 588 题 / 全量译文）
