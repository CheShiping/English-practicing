# 会话交接

## 当前目标

- 目标：网站 3.1 已上线——背题模式覆盖单选与完型，并新增统一背题本（feat-025）
- 当前状态：120 篇 / 588 题阅读、2774 道单选、65 篇 / 1065 空完型（每空答案 + 中文解析 + 原句依据）；单选可切「做题 / 背题」，完型可切「作答 / 背题」；没记住的条目统一收进 `#/recite` 背题本；Header 导航新增「背题本」，首页新增 3.1 横幅，版本号 3.1.1；`npm run content`、`npx tsc --noEmit`、`npm run build` 全通过，headless Chrome 实测通过，已提交推送
- 分支 / 提交：`main`

## 本次会话已完成

- [x] 背题数据层：新增 `src/lib/recite.ts`，统一存「记住了 / 没记住」自评（`moread.recite.v1`，已进 `storage.ts` 的 KEYS，跟着备份走）
- [x] 单选背题：练习页加「做题 / 背题」模式块；背题先遮答案（只给题干 + 「想好了？翻开答案」），翻开才出选项与解析，再自评「记住了 / 没记住」，自评完自动翻下一题
- [x] 完型背题：作答页顶部加「背题」开关，正文空格直接按正确答案填好标绿，右侧面板 / 移动端弹层给答案 + 解析 + 原句依据并逐空自评，空号一览按绿 / 红着色
- [x] 统一背题本（`#/recite`）：汇总单选与完型「没记住」的条目，可按类型筛选、点「显示答案」核对、确认记住后移出
- [x] 只背没记住的：单选练习页一键出卷背题本里那批题
- [x] 存档隔离：背题 `recite:<大类>:<细分>` 与做题 `pool:<大类>:<细分>` 各占一槽，互不覆盖；背题不计入做题正确率统计
- [x] 版本与入口：`package.json` 升到 3.1.1、Header 导航加「背题本」、首页加 3.1 背题横幅、README 补背题功能段

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
| 完型内容 | `npm run content` | 通过 | 65 篇 / 1065 空，含解析 1065 空，无警告 |
| 完型作答 | headless Chrome `#/cloze` → `#/cloze/b01` | 通过 | 65 张卡片；10 空格 + 10 小题；选 D 即时判对、胶囊变绿、`moread.cloze.v1` 写入、刷新恢复；答满后结果 4/10 · 40% + 6 条错题 |
| 完型直链 / 答题卡 | headless Chrome `#/cloze/j17` | 通过 | 20 空篇直达；答题卡 20 格，点第 5 格跳到第 5 空；交卷「未答 10 空」；重做后标记清零 |
| 完型移动端 | headless Chrome 390px | 通过 | 题库/答题页 `scrollWidth === clientWidth`，底部 6 个 tab |
| 完型作答布局 | headless Chrome 1440 / 390 | 通过 | 桌面 744+356 双栏、右侧面板随空格切换；移动端面板隐藏、底部弹层作答、锁定背景滚动 |
| 完型全文翻译 | headless Chrome `#/cloze/b01` / `b13` | 通过 | 桌面 3 段 / 10 个补全词；移动 6 段；无 `___` 残留，无横向溢出 |
| 完型划线批注 | headless Chrome `#/cloze/b01` | 通过 | 标黄生成 4 段 mark、写入 `cloze:b01/0/0-336/yellow`、刷新保留、点圆点打开批注、翻译弹窗正文按答案补全 |
| 单选背题 | headless Chrome `#/practice` | 通过 | 切「背题」后主按钮变「开始背题（2774 题）」、答案遮住、翻开出 4 个选项且正确项高亮、自评后「已背 1」并自动跳题、`moread.recite.v1` 与 `recite:全部:全部` 分别写入 |
| 完型背题 | headless Chrome `#/cloze/b01` | 通过 | 切「背题」后正文空格显示答案词、右侧面板给答案+解析+原句、自评写入 `cloze:b01#1`、进度「已背 1 / 10 空」 |
| 背题本 | headless Chrome `#/recite` | 通过 | 单选 + 完型各 1 条汇总为「2 待背条目」、可揭晓答案、点「记住了」后移出且状态改 known |
| 背题响应式 | headless Chrome 390 / 1280 / 1100 | 通过 | 移动端四页 `scrollWidth === clientWidth`；桌面导航 7 项单行不换行 |

## 文件变更

- `scripts/extract-cloze-pdf.py`（新增）、`scripts/build-cloze.mjs`（新增）
- `article/完型/完型填空_PDF提取.md`（生成）、`article/完型/完形填空_题目提取.md`（补 1 处缺失空格）
- `src/data/answers/cloze-*.json`（新增 11 个）、`src/data/cloze-meta.ts`（新增）
- `src/lib/cloze.ts`（新增）、`src/components/pages/ClozePage.tsx`（新增）
- `src/lib/types.ts`、`src/lib/router.ts`、`src/lib/storage.ts`、`src/components/AppShell.tsx`、`src/components/Header.tsx`、`src/components/MobileTabBar.tsx`、`src/components/pages/HomePage.tsx`
- `app/pages.css`（完型样式）、`app/globals.css`（3.0 横幅）
- `package.json`（3.0.0 + content 脚本串入完型）
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
- 完型答案按「篇 id → 空号」写入 `src/data/answers/cloze-*.json`，解析写中文、原句由管线自动截取；PDF 提取脚本只做排版还原，缺空格/编号笔误用脚本内 `PATCHES` 定点修补，不手改生成物
- 背题自评单独存 `moread.recite.v1`（`src/lib/recite.ts`），键用 `practice:<题目 id>` / `cloze:<篇 id>#<空号>` 区分两类；背题是记忆活动，不写入做题正确率统计

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
- 完型第 22/23/37/38/40 篇 PDF 内没有选项，暂未收录；补到 PDF 后重跑 `python scripts/extract-cloze-pdf.py`，再补 `cloze-*.json` 答案即可
- 完型的错题与标记目前按篇独立保存，没有并入单选的错题本 / 标记本；若要统一，可把完型空号（如 `j17-8`）也写进 `practiceWrong` / `practiceMark`
- 若再次调整界面，用 `out/` 静态产物 + headless Chromium 按 1440×900 / 390×844 两档重拍 `assets/readme/` 截图，练习图需先真实答几题以呈现绿对 / 红错 / 金框标记
