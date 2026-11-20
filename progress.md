# 会话进度日志

## 当前状态

**最后更新：** 2026-11-20
**当前功能：** feat-025 网站 3.1：背题模式（单选 + 完型）（已完成）

## 2026-11-20 网站 3.1：背题模式上线（feat-025）

- **用户需求**：新增背题功能，覆盖单选与完型两处，系统版本升到 3.1.1，验证完直接提交
- **背题模式（单选）**：`PracticePage` 加 `drill` 状态与「做题 / 背题」模式块。背题时**不显示选项**、只给题干与「想好了？翻开答案」按钮；翻开后四个选项按 2×2 排出、正确项绿色高亮并给出中文解析与考点标签，再自评「记住了 / 没记住」——自评完自动翻到下一题，背起来连贯
- **背题模式（完型）**：`ClozePage` 顶部加「背题」开关。切过去后**正文空格直接按正确答案填好并标绿**（`.cloze-inline.recite`），右侧面板 / 移动端弹层改显示「正确答案 + 中文解析 + 原句依据」并给逐空自评按钮；空号一览与答题卡按绿（已记住）/ 红（没记住）着色，移动端底栏「继续背」自动跳到下一个还没自评的空
- **统一背题本**（`#/recite`）：新增 `src/components/pages/RecitePage.tsx`，把单选「没记住」的题与完型「没记住」的空汇总到一处，可按单选 / 完型筛选；点「显示答案」核对，确认记住后移出。Header 导航与首页 3.1 横幅都加了入口
- **数据层**：新增 `src/lib/recite.ts`，统一存自评（`moread.recite.v1`，已加入 `storage.ts` 的 KEYS，跟着备份导出 / 导入走）。单选用 `practice:<题目 id>`，完型用 `cloze:<篇 id>#<空号>`
- **只背没记住的**：单选练习页在背题模式下多一个「只背没记住的（N 题）」按钮，直接出卷背题本里那批题，不用从头过
- **存档隔离**：背题与做题各占一个存档位（`recite:<大类>:<细分>` vs `pool:<大类>:<细分>`），互不覆盖；`PracticeResume` 加 `mode` 与 `seen` 字段，`answeredCount` 按模式分别计「已背 / 已答」
- **口径**：背题**不计入**做题正确率统计，也不写入练习历史——它是记忆活动，不是测评
- **一个踩坑**：新加的 `useMemo` 一开始放在了条件 `return` 之后，React 报 #310（渲染时 hook 数量变化）；已全部提到组件顶层。`out/` 目录被 Python 静态服务占用时 `next build` 清理失败，先停服务再构建即可
- **证据**：`npx tsc --noEmit` exit 0；`npm run build` exit 0（静态导出 2/2）；headless Chrome 实测单选：切背题后主按钮变「开始背题（2774 题）」、题干区 0 个选项、点「想好了？翻开答案」后出现 4 个选项且正确项 `Dcame` 高亮、解析正常、自评「没记住」后进度变「第 1 / 2774 题 · 已背 1」并自动跳到第 2 题、`moread.recite.v1` 写入 `practice:danxuan-01-001` status=unknown、续答存档独立落在 `recite:全部:全部`；「只背没记住的（1 题）」出卷 1 题、题干正确；完型：`#/cloze/b01` 切背题后正文空格由 `1/2/3/4` 变为 `houses/lonely/free/attention`、右侧面板显示「正确答案 D. houses」+中文解析+原句依据、自评「没记住」写入 `cloze:b01#1`、进度变「已背 1 / 10 空」；背题本：单选 + 完型各 1 条汇总为「2 待背条目」、两个分区标题正确、点「显示答案」出正确答案与解析、点「记住了」后条目移出（待背 0 / 已记住 1）且存储状态改为 known；移动端 390px 下练习设置 / 背题卡 / 完型背题 / 背题本四页 `scrollWidth === clientWidth`；桌面 1280 与 1100 宽下导航 7 项单行不换行、无横向溢出
- **本次改动文件**：`src/lib/recite.ts`（新增）、`src/components/pages/RecitePage.tsx`（新增）、`src/lib/storage.ts`、`src/lib/practice.ts`、`src/lib/router.ts`、`src/components/AppShell.tsx`、`src/components/Header.tsx`、`src/components/pages/PracticePage.tsx`、`src/components/pages/ClozePage.tsx`、`src/components/pages/HomePage.tsx`、`app/pages.css`、`app/globals.css`、`package.json`、`README.md`、`feature_list.json`、`progress.md`、`session-handoff.md`

## 2026-11-19 移动端整句选区工具条避让（feat-023）

- **用户反馈**：滑词翻译正常，但移动端划句子做标记时浏览器弹出的「复制」气泡盖住了高亮/批注工具条
- **做法**：`SelectionTools` 按选区是否为单词加 `sel-toolbar-sentence`，定位改走 CSS 变量；`reader.css` 在文章正文及子节点加 `-webkit-touch-callout: none`（iOS 长按气泡），并在 `(hover: none) and (pointer: coarse)` 下把整句工具条固定到底栏上方、水平居中（Android 复制气泡无法用 CSS 屏蔽，改从位置上避开）；`ArticleBody` 只在 coarse pointer 下拦 `contextmenu`，桌面右键菜单不受影响
- **边界**：单词选区不加深色句选类，仍在手指选区上方原位；练习页题干的 `SelectionBar` 仍用行内 `top/left`，不受 CSS 变量化影响
- **证据**：headless Chrome 移动仿真 360×732：选句工具条 bottom=72px、top=625px，点色块成功落 1 个 `.ann`；选单词工具条 top=270px 且无 `sel-toolbar-sentence`；`contextmenu` defaultPrevented=true。桌面 1280 宽选句工具条 top=326px、右键 defaultPrevented=false；练习页题干条 top=169px；`npx tsc --noEmit` exit 0；`npm run build` exit 0（导出 2/2）
- **本次改动文件**：`src/components/reader/SelectionTools.tsx`、`src/components/reader/ArticleBody.tsx`、`app/reader.css`、`feature_list.json`、`progress.md`

## 2026-11-19 网站 3.0：完型填空上线（feat-024）

- **题目提取**：新增 `scripts/extract-cloze-pdf.py`，把 `article/完型/` 的 3 份 PDF 还原成 markdown——按「第（N）篇」切分、把散落的数字行/`__N__`/`N ______` 统一成 `___N___`、合并被换行拆断的句子与 `life-\nsaving` 这类连字符、按出现顺序把 A-D 选项对回题号（PDF 里有编号重复与错位）。40 篇中 35 篇有完整选项，第 22/23/37/38/40 篇 PDF 本身没有选项，未收录；3 处原文缺空格/编号笔误（第 3 篇缺第 3 空、第 15 篇把 11 写成 2、第 20 篇漏下划线）在脚本里定点修补
- **题库规模**：`完形填空_题目提取.md` 基础 30 篇 + PDF 提取的进阶 35 篇 = **65 篇 / 1065 空**；每空都补了 A-D 答案与中文解析，解析写成 `src/data/answers/cloze-*.json`（11 个文件），中文小标题写进 `src/data/cloze-meta.ts`
- **内容管线**：新增 `scripts/build-cloze.mjs`，读两份 md 与 `answers/cloze*.json`，重排不连续题号（第 18 篇原文 21-35 → 1-15）、把 PDF 里的 `/` 选项显示成「（不填）」、自动从正文截取含答案的「原句」，生成 `public/data/cloze.json`；`npm run content` 已串上这一步
- **前端**：新增 `#/cloze` 题库页与 `#/cloze/:id` 作答页——正文里空格做成编号胶囊（点胶囊跳到小题）、逐空 2×2 选项、选中即判定并显示中文解析与原句、答题卡弹层（绿对/红错/金框当前）、交卷结果页只列错题、可重做本篇；作答实时写 `moread.cloze.v1`，重新打开同一篇带着上次答案继续
- **入口与版本**：Header 与移动端底栏新增「完型」（移动端顺序为 首页 / 文库 / 完型 / 单选 / 语法 / 数据），首页 hero 下新增 3.0 横幅，`package.json` 升到 `3.0.0`
- **作答布局（用户反馈改版）**：桌面端把答题区挪到正文右侧的固定面板（当前空选项 + 空号一览 + 上一空/下一空），移动端改为点正文空格从底部弹层作答，取消原来的长列表滚动；弹层锁背景滚动、Esc/遮罩/X 关闭
- **全文翻译（用户反馈新增）**：新增 `src/data/translations-cloze*.json`（65 篇 / 245 段，空格按正确答案译出、不跳过），「全文翻译」抽屉里英文行用正确答案补全并标绿、下方给逐段中文；桌面端右侧滑出、移动端底部弹出
- **划线批注与划词翻译（用户反馈新增）**：复用阅读器的 `SelectionToolbar` / `NoteModal` / `SelectionAnalysisModal`，选中正文可四色高亮、写批注、翻译、复制；批注存 `moread.annotations.v1`，`articleId = cloze:<篇 id>`；偏移以整段文本为坐标系、空格按 `___N___` 宽度计（答案变了偏移不变），选区文本先把空格按正确答案补全再送翻译
- **批注侧栏（用户反馈补充）**：正文右上角新增「批注（N）」，从右侧滑出本篇全部划线（移动端底部弹出），每条显示高亮色、被标注原句、笔记、段号与时间，支持编辑（复用 NoteModal）、定位回原文、删除；空态给出选中即标注的提示
- **一个踩坑**：选区跨 `.w` 词 span 与空格胶囊，`commonAncestorContainer` 常常不是段落本身；改为「找包含选区起点的 `.cloze-para`」；另外一条高亮被空格切成多段时会重复画小圆点，改为只在标注真实结尾输出一次，并把圆点改成 8px 命中区 + 负外边距，既不占字宽也点得到
- **一个交互坑**：点卡片后先 `setPaper` 再改 hash，路由副作用会用旧 `passageId` 把页面打回题库；改成用 `enteredRef` 记住已进入的篇目、路由副作用只负责「直链进入」与「回题库」两种情况
- **证据**：`npm run content` 完型 65 篇 / 1065 空 / 含解析 1065 空 / 含全文翻译 65 篇、无警告；`npx tsc --noEmit` exit 0；`npm run build` exit 0（导出 2/2）；headless Chrome 实测题库 65 张卡片、chips「全部 65 篇 / 1065 空 / 基础 30 篇 / 450 空 / 进阶 35 篇 / 615 空」；b01 有 10 个内联空格与 10 道小题，选 D 即时判对、胶囊变绿、`moread.cloze.v1` 写入、刷新后恢复；答满 10 空出现「查看结果」→ 4/10 · 40% + 6 条错题回顾，题库卡片变「已完成 · 40%」；直链 `#/cloze/j17` 进入 20 空篇、答题卡 20 格、点第 5 格跳第 5 空；交卷显示「未答 10 空」，重做后已答标记清零；390px 视口题库页与答题页 `scrollWidth === clientWidth`，底部 6 个 tab；改版后复测：桌面 744+356 双栏、右侧面板点第 3 个空格即切到第 3 空、选 B 判对并出解析、空号格变绿；移动端右侧面板隐藏、底部进度条常驻、点空格弹出选项（4 项）、选 A 判对、下一空留在弹层、关闭后胶囊显示 A、`body.overflow=hidden`；全文翻译抽屉桌面 3 段 / 10 个补全词、无 `___` 残留，移动端 6 段、无横向溢出；划线批次复测：三击选中段落后工具条出现（4 色）、点黄色生成 4 段 `mark.ann`、`moread.annotations.v1` 写入 `cloze:b01/0/0-336/yellow`、刷新后标注仍在、点圆点打开批注弹窗、选中第二段点翻译弹出「翻译与句法提示」且正文为按答案补全的 `pay attention to it`；移动端工具条出现在底栏上方，标黄成功、无横向溢出
- **本次改动文件**：`scripts/extract-cloze-pdf.py`（新增）、`scripts/build-cloze.mjs`（新增）、`article/完型/完型填空_PDF提取.md`（生成）、`article/完型/完形填空_题目提取.md`（补 1 处缺失空格）、`src/data/answers/cloze-*.json`（新增 11 个）、`src/data/cloze-meta.ts`（新增）、`src/lib/cloze.ts`（新增）、`src/lib/types.ts`、`src/lib/router.ts`、`src/lib/storage.ts`、`src/components/pages/ClozePage.tsx`（新增）、`src/components/AppShell.tsx`、`src/components/Header.tsx`、`src/components/MobileTabBar.tsx`、`src/components/pages/HomePage.tsx`、`app/pages.css`、`app/globals.css`、`package.json`、`README.md`、`AGENTS.md`、`feature_list.json`

## 2026-11-19 五大语法分区全面更新与内容目录重组（feat-022）

- **用户更新**：5 个语法框架 md 全部重写，内容量约 2.4 倍——两个态 10239、三大从句 7494、四个重点 23321、五大句型 11735、六大词性 15951 字符（合计约 6.9 万字，此前约 2.9 万字）；新增主谓一致、虚拟语气、非谓语、倒装、反义疑问、感叹、强调、祈使等大量内容，`六大词性` 新增「介词」「连词」两个考点
- **同时发生的目录重组**：`article/` 拆成 `阅读/`（10 个分类文件）、`单选/`（原单选源）与 `完型/`（3 份 PDF + 提取的 md），另有一份高频词组 PDF
- **发现的阻塞**：`build-content.mjs` 只扫 `article/` 顶层（此时已无 md，会静默生成 0 篇），`build-practice.mjs` 仍指向已移动的单选源（会 ENOENT 抛错）；GitHub Actions 跑的正是 `npm run build`，直接推送会导致部署失败、语法更新也上不了线
- **管线适配**：`build-content.mjs` 改为递归扫描 `article/`，跳过 `语法框架` / `单选` / `完型` 三个目录，`file` 字段仍取纯文件名；`build-practice.mjs` 单选源支持 `article/单选/` 与顶层两个候选路径，都找不到时警告并保留现有 `practice.json`，不再让构建崩溃
- **渲染增强**：`grammar-md.ts` 支持标准分割线 `---` / `***` / `___` → `<hr/>`（`五大句型` 的「完全倒装 / 部分倒装」之间有一条）；`pages.css` 补 `.grammar-content hr` 虚线样式
- **核对结果**：`articles.generated.json` 与 `practice.json` 除 `generatedAt` 外与 HEAD **完全一致**（10 个阅读文件与单选源 sha1 逐一比对均与旧文件相同，只是移动位置），网站文章库与题库不受影响
- **证据**：`npm run content` 120 篇 / 588 题 / 32568 词 + 2774 单选 + 语法 5 分区（130 / 176 / 273 / 185 / 312 行）；`npx tsc --noEmit` exit 0；`npm run build` exit 0（导出 2/2）；headless Chrome `#/grammar` 无错误页，DOM 含 5 个分区标题、16 张表格、1 条 `<hr>`、1 个 callout、38 处彩色 span；五个分区「源 md ↔ 渲染可见文字」逐一比对全部一致；1440 宽截图确认 `两个态` / `五大句型` / `四个重点` 的标题层级、表格与列表排版正常
- **本次改动文件**：`article/语法框架/*.md`（5 个，用户改动）、`article/` 目录重组（用户改动）、`scripts/build-content.mjs`、`scripts/build-practice.mjs`、`src/lib/grammar-md.ts`、`app/pages.css`、`src/data/grammar.generated.json`（生成）、`README.md`、`AGENTS.md`、`feature_list.json`、`progress.md`、`session-handoff.md`

## 2026-11-14 同步六大词性语法知识点更新（feat-021）

- **用户更新**：`article/语法框架/六大词性.md` 重新导出，从 212 行 / 8532 字变成 1 行 / 13763 字；新增名词复数变化口诀与不可数名词具体化、人称代词五行六列表格、比较级变化规则、数词 / 冠词 / 情态动词的大量补充，并出现 `color:rgb(38, 38, 38)` 形式的颜色标注
- **问题**：整篇压成一行会让按行解析的渲染器把 1.3 万字塞进单个 `<p>`，标题、表格、彩色标注全丢；`rgb()` 颜色也不被 `fontToSpan` 识别
- **做法**：源文件保持用户导出的原样，改造内容管线而不是手改 md
  - `scripts/build-grammar.mjs` 新增 `restoreFlattenedMarkdown`：只在「单个超长非空行 + ≥2 个内联标题或内联表格」时启用；把 `| |` 交界拆成表格行、用标签栈保护 `<font>` / `<u>` 内部空格、按两个以上空格还段落、把 `# XX考点` 与正文分离；表格 10 行连续拼接（否则渲染器收不成表）；末尾用「去空白后逐字比对」做保真校验，不一致直接中止生成
  - `src/lib/grammar-md.ts` 的 `fontToSpan` 支持 `#hex` 与 `rgb()`；`#262626` / `rgb(38,38,38)` / `rgb(15,17,21)` / 纯白视为笔记默认色，去掉后跟随站点主题（夜间模式不会黑字）；跳过只剩空标记的段落
- **结果**：六大词性 224 行 / 13763 字，6 个考点标题、1 张 10 行表格、27 处彩色标注、0 空段落；源 md ↔ 生成内容 ↔ 渲染可见文字一致；另 4 个分区内容与行数完全未变（97 / 152 / 234 / 56）
- **证据**：`npm run content` 120 篇 / 588 题 / 32568 词、2774 单选、语法 5 分区（06 标注「已还原压平导出」）；`npx tsc --noEmit` exit 0；`npm run build` exit 0（静态导出 2/2）；headless Chrome 实测 `#/grammar` DOM 含 6 个考点标题、新增口诀「妻子持刀去宰狼」与「情态动词加have done表虚拟语气」、6 张表格、31 处彩色 span、无错误页；1440 宽截图确认标题分层、分段、下划线、彩色标注与表格表头正常
- **本次改动文件**：`scripts/build-grammar.mjs`、`src/lib/grammar-md.ts`、`src/data/grammar.generated.json`（生成）、`feature_list.json`、`progress.md`、`session-handoff.md`；`article/语法框架/六大词性.md` 为用户改动，原样保留
- **提交卫生**：`public/data/practice.json` 与 `src/data/articles.generated.json` 只有 `generatedAt` 时间戳变化，已还原，不纳入提交

## 2026-11-13 补齐 29 条元数据并重拍全部界面截图（feat-020）

- **发现的问题**：重拍文库截图时，第二排卡片仍显示 `Passage 5` / `Passage 6` 这类首句回退标题；全站 120 篇里只有 91 篇有 `ARTICLE_META`
- **元数据补齐**：`src/data/article-meta.ts` 补 29 条（kepu-11~17、shehui-13~21、lishi-03~12、jingli-12、yingyong-03/04），每条含英文标题、中文副标题、2~3 个标签与一句话摘要；现在 120 篇一一对应，missing 0 / extra 0
- **重拍截图**：用 `out/` 静态产物 + headless Chromium 重拍 6 张，替换 `assets/readme/` 下原 5 张，新增 `shot-practice-resumes.png`
  - 桌面 5 张 1440×900：首页 / 阅读器 / 文章库 / 练习答题卡 / 练习存档面板
  - 移动端 1 张 390×844：练习答题卡
  - 练习图按真实答题造出绿对 / 红错 / 金框标记三种题号状态，呼应 README 的答题卡与存档说明
- **可见差异**：首页总词数由旧的 `32,558` 更新为 `32,568`；文库第二排变成 `Should Obesity Be Called a Disease?` / `The Harm of Second-hand Smoke` 及中文摘要
- **README**：界面速览引用新图，新增「未完成的练习」存档图与说明，桌面 / 移动端答题卡 alt 补上颜色图例
- **证据**：`npx tsc --noEmit` exit 0；`npm run build` exit 0（静态导出 2/2）；6 张图尺寸与引用路径逐一核对
- **本次改动文件**：`src/data/article-meta.ts`、`README.md`、`assets/readme/*.png`（5 张替换 + 1 张新增）、`feature_list.json`

## 2026-11-13 补齐 17 篇旧文章译文与解析（feat-019）

- **范围**：冲刺训练2 拆分产生的 `kepu-11` ~ `kepu-17`、`shehui-13` ~ `shehui-21`、`jingli-12`，共 17 篇 / 89 段 / 84 题
- **译文**：新增 `src/data/translations-part15.json`，按 block 索引逐段对应，含列表型文章的 5 条建议
- **解析**：新增 `src/data/answers/legacy-11-21.json`，`answer` 沿用源文件（校验 84 题答案与原文完全一致），补写中文 `explanation` 与英文 `evidence`
- **覆盖结果**：全站 120 篇全部有译文、582 个正文块全部有 `translation`、588 题全部有 `answer` / `explanation` / `evidence`
- **原文依据补齐**：21 道旧题（kepu-01/03/05/08/09、shehui-01/02/04/06/08/09/10、chongci-06/07/10/11/12、lishi-02、jingli-04、yingyong-04）按各文件原有排版逐行插入 `evidence`，10 个文件合计 21 行 diff，无整体重排
- **证据**：`npm run content` 120 篇 / 588 题 / 32568 词，含答案 588 题、含译文 120 篇，无警告；校验缺失块 0、缺失解析 0、缺失依据 0，21 条新依据均可在正文定位；`npx tsc --noEmit` exit 0；`npm run build` exit 0（导出 2/2）
- **本次改动文件**：`src/data/translations-part15.json`（新增）、`src/data/answers/legacy-11-21.json`（新增）、`src/data/answers/chongci-01-08.json`、`chongci-09-13.json`、`lishi-shehui-01-02.json`、`shehui-03-06.json`、`shehui-07-10.json`、`jingli-04-06.json`、`kepu-01-03.json`、`kepu-04-06.json`、`kepu-07-10.json`、`yingyong-03-04.json`、`feature_list.json`

## 2026-11-13 新增 40 篇内容收尾：答案、解析、译文与元数据（feat-018）

- **答案与解析**：新增 `src/data/answers/read-01-20.json`、`read-21-40.json`，覆盖 read-01 ~ read-40 共 200 题，每题含 `answer`、中文 `explanation` 与英文 `evidence`
- **译文**：新增 `src/data/translations-part13.json`、`translations-part14.json`，按 block 索引覆盖 40 篇 / 172 段，与源文段落一一对应
- **文库元数据**：`article-meta.ts` 新增 40 条 `ARTICLE_META`，补齐英文标题、中文副标题、标签与一句话摘要，文库不再使用首句回退标题
- **源文件修复（影响题目与段落）**：清掉 9 处被并进选项行尾的 `## Exercise N` 分节标记（read-04/08/12/16/20/24/28/32/36）；合并 7 处被空行截断的句子（read-03/04/05/18/19/26/33）；补全 read-05 两处右边界截词与 read-11 首句缺失的谓语
- **证据**：`npm run content` 生成 120 篇 / 588 题 / 32568 词，含答案 588 题、含译文 103 篇，无警告；校验 588 题 answer 与 explanation 均非空、read-01~40 的 172 个正文块全部有译文、无 `## Exercise` 残留；`npx tsc --noEmit` exit 0；`npm run build` exit 0（导出 2/2）
- **本次改动文件**：`src/data/answers/read-01-20.json`（新增）、`src/data/answers/read-21-40.json`（新增）、`src/data/translations-part13.json`（新增）、`src/data/translations-part14.json`（新增）、`src/data/article-meta.ts`、`article/*.md`（7 个分类文件的断句与标记清理）、`feature_list.json`

## 2026-11-13 练习支持多份未完成记录（feat-017）

- **问题**：续答只有一条 `practice.resume.v1`，换分类开新卷会把上一条覆盖掉，之前的速度全废
- **存档改多槽**：换成 `moread.practice.resumes.v2`，key 为 `pool:大类:细分` / `wrong` / `marked`，每份卷各存 `ids / picks / marks / label / source / cursor / updatedAt`；`savePracticeResume` 按 `updatedAt` 淘汰，最多留 20 份
- **新增 API**：`practiceResumeKey` / `getPracticeResumes` / `getPracticeResume(key)` / `clearPracticeResume(key)` / `clearAllPracticeResumes` / `answeredCount`；`PracticeResume` 增加 `key` 与 `cursor`（续答回到上次停留的题，不再只回到最后答过的那道）
- **设置页**：单张「上次练习」卡片换成「未完成的练习」列表——每行显示标签、已答 / 总数、相对时间（刚刚 / N 分钟前 / 昨天 / N 天前），右侧「继续」与删除图标；面板右上「清空全部」，超过 4 条时底部「展开全部（N）」/「收起」
- **开始区**：当前考点已有记录时，主按钮变「继续练习（已答 N / M）」，旁边给「重新开始（N 题）」，提示文案说明重新开始会覆盖这个考点的记录
- **兼容**：首次读取时把旧的 `practice.resume.v1` 迁成 `legacy:<时间戳>` 槽并清掉 v1，历史进度不丢
- **证据**：headless 实测两大考点各答几题后两槽共存、列表两行；继续后回到第 3 题且已答 2；完成练习只清当前槽；重新开始覆盖同一 key（0 picks、ids=2774）；5 条记录默认展示 4 行 + 展开全部；旧 v1 迁移为 legacy 槽且 v1 被删除；1280 / 390 截图确认行内不折行、按钮不溢出；`npx tsc --noEmit` exit 0；`npm run build` exit 0（导出 2/2）
- **本次改动文件**：`src/components/pages/PracticePage.tsx`、`src/lib/practice.ts`、`src/lib/storage.ts`、`app/pages.css`、`feature_list.json`

## 2026-11-13 练习标记本、切题回顶与题干点词查义（feat-016）

- **标记落成真正的本子**：`storage.ts` 新增 `moread.practice.mark.v1`，`types.ts` 新增 `PracticeMarkEntry`；`lib/practice` 提供 `getMarkBook/getMarkedIds/markQuestion/removeMark/toggleMarkQuestion/clearMarkBook`
- **标记不再随练习消失**：`PracticePage` 的 `marks` 从局部 state 改为读标记本（`markVersion` 驱动刷新），点标记即写盘；旧续答存档里的 `marks` 在恢复时自动补写进标记本，`PracticeResume.source` 扩展为 `pool | wrong | marked`
- **标记本页面**：新路由 `#/practice/marked`（`router.ts` 的 `tab` 扩为 `wrong | marked`），设置页在「错题本」右侧新增「标记本（N）」入口；页面复用错题本版式，卡片带金色左边框与「标记于 11/13 13:19」，支持取消标记、清空、重做标记题（按标记时间出卷）
- **切题回到顶部**：`cursor` 或阶段变化时 `window.scrollTo({ top: 0 })`，上一题、下一题、答题卡跳转都会回到顶部，同时关掉可能残留的词典卡；对 `prefers-reduced-motion` 用户降级为瞬时滚动
- **题干点词查义**：新增 `src/components/WordText.tsx`（把英文切成可点词 span，复用阅读器 `.w` 悬停样式），单选题干改用它渲染，点词弹出同一个 `WordPopover`
- **题干划词翻译**：新增 `src/components/SelectionBar.tsx`（复用 `.sel-toolbar` 样式，只保留「翻译」与「复制」），题干 `mouseup`/`touchend` 捕获选区，选中多个词才出工具条、单选一个词仍走点词查义；点「翻译」打开阅读器同款 `SelectionAnalysisModal`（参考译文 + 重点词汇 + 句法提示），点别处或 Esc 收起；题干上方提示改为「点词查义 · 选中可翻译」
- **头部布局**：`.practice-head` 左列改为可收缩（`flex: 1 1 auto; min-width: 0`）、`.practice-head-actions` 不收缩，三个入口在 1280 与 390 两档都不换行
- **证据**：headless 实测点标记后 `moread.practice.mark.v1` 写入 `danxuan-01-001`；重载 `#/practice/marked` 渲染「标记本」1 条并带金色左边框；「重做标记题」得到「标记题重做」2 题卷；取消标记后列表转空态且 store 变 `{}`；900×520 窗口滚到 273px 点「下一题」后 `scrollY=0`；点第 4 个可点词弹出 the 的词典卡；选中 `good chance the child` 出工具条、点「翻译」弹出「翻译与句法提示」（参考译文「孩子很有可能」、重点词汇 chance/child），只选一个词不出工具条，点外部自动收起；`npx tsc --noEmit` exit 0；`npm run build` exit 0（导出 2/2）
- **本次改动文件**：`src/components/pages/PracticePage.tsx`、`src/components/WordText.tsx`（新增）、`src/components/SelectionBar.tsx`（新增）、`src/lib/practice.ts`、`src/lib/router.ts`、`src/lib/storage.ts`、`src/lib/types.ts`、`app/pages.css`、`feature_list.json`

## 2026-11-13 动效审计与五处交互补齐（feat-015）

- **审计口径**：按「频率 → 目的 → 时长 → 是否妨碍功能」四道门槛筛，候选先淘汰再落地；全站只留 5 处，题目切换、文章库筛选重排、首页数字滚动、路由切换一律不动
- **练习即时判定**：判定解析块以 `practice-reveal-in` 200ms `--ease` 从 `translateY(4px)` 落位；对错图标 `practice-state-in` 140ms 从 `scale(0.8)` 起跳（不用 0）
- **交卷结果页**：成绩卡 `practice-score-in` 280ms（新增 `--dur-slow`）；错题回顾按 60/100/140/180/220/260ms 递进，只作用于 `.practice-review-list.result`，错题本整页列表保持静态
- **生词卡展开**：释义文本固定渲染 6 行，用 `max-height: calc(2 * 1.7em) → calc(6 * 1.7em)` 过渡裁切，替代原来的 `slice(0, open ? 6 : 2)` 行数跳变
- **Toast 退场**：`ToastItem` 增加 `closing`，`dismissToast` 先打标记、180ms 后再摘节点；`.toast` 入场改用 `@starting-style`，退场走 `.closing`，同一条边进出；自动消失从 3200ms 调整为 3000ms + 180ms 过渡
- **证据**：headless 实测 reveal 200ms / stateIcon 140ms / scoreCard 280ms / 回顾首项 delay 60ms / 生词卡 40.8px→122.4px / toast 入场 opacity 0.69 中间态、3050ms 带 closing、3550ms 已移除，pageerrors none；`npx tsc --noEmit` exit 0；`npm run build` exit 0（导出 2/2）
- **本次改动文件**：`app/globals.css`、`app/pages.css`、`app/reader.css`、`src/state/AppProvider.tsx`、`src/components/ToastStack.tsx`、`src/components/pages/PracticePage.tsx`、`src/components/pages/VocabPage.tsx`

## 2026-11-13 单选练习全量出题、续答与答题卡弹层；README 改造（feat-014）

- **删除题量选择**：设置页只保留考点大类 / 细分考点 / 顺序，开始练习直接出当前考点全部题目（全池 2774 题可用）
- **进度续答**：新增 `practice.resume.v1`（试卷题目顺序、作答、标记实时写盘）；重新进入 `#/practice` 自动恢复，光标落在最后答过的那道题上，已答统计与标记一并恢复；「完成练习」或存档题目失效时清除；退出练习不再弹确认框
- **答题卡底部弹层**：移除页面常驻答题卡，导航栏中间新增「答题卡」按钮，底部弹出面板（遮罩点击 / Esc / 收起按钮关闭，`safe-area-inset-bottom` 适配，打开时锁背景滚动），点题号跳题并关闭
- **README 改造**：新增 `assets/readme/hero.svg`（纸感 + 行线 + 精读印章视觉，含在线入口文案）与 5 张真实界面截图；重排阅读顺序（hero → 界面速览 → 它是什么 → 功能 → 快速开始 → 添加文章 → 部署 → 目录结构 → 说明）；部署地址 `https://cheshiping.github.io/English-practicing/` 写入正文
- **部署**：git remote 由 `CheShiping/English-reading.git` 改为 `cheshiping/English-practicing.git`；部署工作流用 `actions/configure-pages` 自动探测 base_path，无需改配置
- **续答路径补全（用户反馈修复）**：自动续答原本只在重新打开页面时生效，用户「退出 → 再点开始练习」会开出全新试卷覆盖进度；现退出后设置页顶部显示「继续上次练习」卡片（已答 N / 总数 · 考点标签），一键恢复到最后答过的题，附「放弃」清除入口；恢复逻辑抽为 `restoreResume` 供挂载自动续答与卡片共用
- **续答改为手动（用户反馈调整）**：取消「一进练习页自动跳回答题」的行为，进入页面一律停在设置页，由顶部「继续上次练习」卡片手动进入；挂载逻辑恢复 cleanup，去掉自动恢复分支
- **证据**：headless 实测 size-block-gone:true、开始练习（2774 题）、inline-sheet:absent、sheet-opens:true、弹层点题号跳到第 5 题、刷新后 resume「第 5 / 2774 题 · 已答 2 · 对 1」均 PASS；续答卡片流程实测 no-resume-card-fresh:true、resume-card「已答 2 / 2774 题 · 全部考点」、continue「第 2 / 2774 题 · 已答 2 · 对 1」、discard:card-gone、fresh-after-discard 第 1 题、reload-resume「第 1 / 2774 题 · 已答 1」全部 PASS；改为手动续答后复测 reenter:setup、auto-quiz:none、card 正常、continue 回到第 2 题 PASS；`npx tsc --noEmit` exit 0；`npm run build` exit 0（导出 2/2）；beautify-github-readme 审计脚本「image references and SVG basics」PASS；hero 在 1200 宽与 GitHub 360 宽缩放下目检通过
- **本次改动文件**：`src/components/pages/PracticePage.tsx`、`src/lib/practice.ts`、`src/lib/storage.ts`、`app/pages.css`、`README.md`、`assets/readme/*`（新增）、`feature_list.json`

## 2026-11-11 移动端分类横滑自动居中与语法知识点全量搬入（feat-013）

- **语法知识点**：放弃 19 个精简知识点，改为内容管线 `scripts/build-grammar.mjs` 直接读取 `article/语法框架/*.md` 原文，生成 `src/data/grammar.generated.json`；`GrammarPage` 用 `src/lib/grammar-md.ts` 原样渲染标题、段落、列表、表格、`:::info`、粗体、下划线与彩色标注，5 个分区文本保真校验与源文完全一致
- **移动端语法页**：框架导航在 ≤980px 变为吸顶横向胶囊，滚动时高亮当前分区并自动滑到中间；表格放入独立横向滚动容器，320px 下无页面溢出；正文与标题字号、间距单独适配
- **分类横滑居中**：新增 `ChipScroller`，文章库 `cat-chips` 与单选练习四组 `practice-chips` 在切换分类后把当前按钮自动滑到可视区中间；移动端单选分类条改为单行横向滑动，不再换行堆叠
- **单选默认顺序**：`PracticeMode` 初始值改为 `ordered`，顺序按钮排到随机前面
- **证据**：`npx tsc --noEmit` exit 0；`npm run build` exit 0（120 篇 / 588 题 / 32558 词 + 单选 2774 题，导出 2/2）；headless Chrome 390px 与 320px 下 10 条路由 `scrollWidth === clientWidth`；文章库「文化与历史」centerDelta 0；单选「三大从句」centerDelta 0；语法页 5 分区 / 5 表格，导航自动滑动生效
- **本次改动文件**：`scripts/build-grammar.mjs`（新增）、`src/lib/grammar-md.ts`（新增）、`src/components/ChipScroller.tsx`（新增）、`src/data/grammar.ts`、`src/data/grammar.generated.json`（生成）、`src/components/pages/GrammarPage.tsx`、`src/components/pages/LibraryPage.tsx`、`src/components/pages/PracticePage.tsx`、`app/pages.css`、`package.json`、`README.md`

## 2026-11-11 语法知识点页与生词本入口调整（feat-011）

- **页面结构**：新增 `src/data/grammar.ts`，按用户 23456 框架编排 5 个分区 / 19 个知识点：两个态 → 三大从句 → 四个重点 → 五大句型 → 六大词性；每卡包含速记摘要、规则清单、双语例句与易错点
- **交互**：`GrammarPage` 支持关键词搜索（标题、规则、例句、易错点全量匹配）、单卡折叠、展开/收起全部；桌面端左侧框架索引，移动端横向胶囊导航
- **入口调整**：Header 与移动端底栏的「生词本」改为「语法」（`#/grammar`）；原 `#/vocab` 生词本保留，学习数据页头部新增「生词本」按钮，生词本页脚增加返回学习数据入口
- **做题联动**：单选练习设置页与答题页均增加「语法速查」，答题页用新标签打开，不打断本次作答
- **证据**：`npx tsc --noEmit` exit 0；`npm run build` exit 0（导出 2/2）；dev 实测 5 个分区可见、搜索「虚拟」命中 1 个、展开全部生效、数据页生词本入口可进入、练习页语法速查存在，均 PASS

## 2026-11-11 网站 2.0 单选练习功能（feat-010）

- **内容工程**：`article/专升本词汇语法试题_单选题.md` 共 2774 题（29 个练习组），按语法框架完成大类+细分考点分类；652 道缺答案题补齐；全部题补框架思路中文解析（语法题：标志→规则→锁答案；词汇题：辨析+搭配+翻译）
- **答案校订**：源文件答案键存在多处系统性错误（UNIT 12 区、语法二反义疑问句区等共 155 处），已按框架独立判断校订，校订结果存 `src/data/answers/danxuan.json` 并在解析中注明"原答案有误"；md 源文件补 651 条 `✅ 答案` 行，并修复 25 处选项格式异常（缺选项行、内联选项、重复题号等）
- **数据管线**：新增 `scripts/build-practice.mjs`，`npm run content` 现同时生成 `public/data/practice.json`（1.5MB，按需 fetch，不进主 bundle）；build-content.mjs 跳过该文件避免文章管线噪音警告；danxuan.json 键为练习组 id + 组内顺序索引（规避源文件重复题号）
- **前端**：新增 `#/practice` 路由与 `PracticePage`（考点大类/细分筛选 → 题量与随机/顺序组卷 → 答题卡答题 → 交卷判分 → 逐题解析 → 错题自动入错题本）；`#/practice/wrong` 错题本（错题重做、单题移除、清空、最近练习记录）；Header 与移动端底部导航加"单选练习"入口，首页 hero 加入口按钮；练习数据写入学习统计（recordActivity）
- **证据**：`npx tsc --noEmit` exit 0；`npm run build` exit 0（80 篇 / 388 题不变 + 单选练习 2774 题，导出 2/2）；dev 实测：组卷、答题计分（8/10 · 80%）、逐题对错与解析、只重做错题均 PASS
- **已知边界**：错题本/练习记录存 localStorage，跨浏览器配置不共享（与全站一致）；错题重做（错题本内）当前按顺序出题

## 2026-11-11 练习改为即时判定模式（用户反馈）

- 练习交互从"整组交卷后看解析"改为"答一题判一题"：点选项立即锁定并判对错（对=绿✓/错=红✗/其余变灰），题卡下方即时出现判定条（正确答案、考点标签、中文解析），错题实时入错题本、成绩实时计入学习统计
- 答题卡改为绿=对/红=错着色；最后一题按钮由"交卷"改为"完成练习"，结果页基于实时累计（答对/已答/正确率），只列错题回顾
- 证据：`npx tsc --noEmit` exit 0；`npm run build` exit 0（导出 2/2）；dev 实测：选项锁定、即时判定（对/错两种）、实时计分"已答 2 · 对 1"均 PASS

## 状态概览

### 已完成

- [x] 建立项目 harness：`AGENTS.md`、`init.ps1` / `init.sh`、功能与进度追踪文件
- [x] 基线验证：`npx tsc --noEmit` 与 `npm run build` 均通过
- [x] 内容资产：10 个题材分类 / 120 篇 / 588 题 / 32568 词；588 题的答案、解析、原文依据齐全，582 个正文块全部有译文，120 篇均有 `ARTICLE_META`（feat-002 ~ feat-009、feat-012、feat-018、feat-019）
- [x] 练习与工具：2774 道单选练习、语法速查、生词本、学习统计、导入与备份（feat-010 ~ feat-017）
- [x] 视觉与品牌：C1 猫头鹰标记、首页与共享样式精修、动效审计（feat-006、feat-007、feat-015）
- [x] 文档同步：README 分类表与规模说明、AGENTS 内容规则、交接文档（feat-005）
- [x] 视觉资产：补齐剩余 29 条 `ARTICLE_META`，重拍 6 张 README 截图并新增练习存档图（feat-020）
- [x] 语法知识点同步：六大词性更新上线，内容管线支持笔记软件压平导出与 `rgb()` 颜色（feat-021）
- [x] 语法框架全面更新：五大分区约 6.9 万字上线，分割线渲染与题型分目录的内容管线适配（feat-022）
- [x] 完型填空：65 篇 / 1065 空题库、内联空格作答页、答题卡与结果页，3.0 上线（feat-024）
- [x] 背题模式：单选与完型都能遮住答案背、自评记住了/没记住、统一背题本，3.1 上线（feat-025）
- [x] 移动端划句标记：整句选区工具条避让浏览器复制气泡，单词选区与桌面端保持原位（feat-023）

### 进行中

- 无。内容、练习、背题、文档与视觉素材各条线均已收口

### 下一步

1. 用户确认后检查一次阅读器与文库的整体展示
2. 若其他语法分区也从笔记软件重新导出，先跑 `npm run content`，确认日志出现「已还原压平导出」且无保真校验报错
3. 完型第 22/23/37/38/40 篇 PDF 内没有选项，未收录；若用户补上选项，重跑 `python scripts/extract-cloze-pdf.py` 再补 `cloze-*.json` 即可
4. 完型的错题与标记尚未并入单选的错题本/标记本，目前按篇独立保存；如需统一，可把完型空号也写进 `practiceWrong`
5. 背题本目前只收「没记住」的条目；若想加「已记住」的复习队列（艾宾浩斯式间隔重复），可在 `recite.ts` 上加 `nextReviewAt` 字段

## 阻塞 / 风险

- [x] 2026-11-14 推送受阻已解除：`git push` 一度因本机代理 `127.0.0.1:63727` 返回 `CONNECT tunnel failed, response 502`（绕过代理直连为 `Connection was reset`）失败；14:16 重试成功，`dc1275b..95e93d8  main -> main`，2 个提交已上远端，GitHub Pages 自动部署已触发
- [x] 2026-11-19 推送受阻已解除：本地提交 `161da01`（feat-023 选区工具条）与 `6062711`、`17e279e`（feat-024 完型）一并推送成功（`ef9849c..17e279e  main -> main`）。当时代理返回 `CONNECT tunnel failed, response 502`、直连超时、schannel 报 `CRYPT_E_REVOCATION_OFFLINE`；最终可用命令是 `git -c http.sslBackend=openssl -c http.schannelCheckRevoke=false push origin main`（会顺带提示 `credential-manager-core` 不是 git 命令，但推送正常完成）
- [x] 2026-11-19 完型交互改版推送成功（`8b03be6..a87a4f3  main -> main`）。当时代理 `127.0.0.1:50619` 对 github.com 返回 `CONNECT tunnel failed, response 502`，直连超时；本机 Clash 端口 `7897` 能通隧道但 schannel 报 `CRYPT_E_REVOCATION_OFFLINE`。**可用命令**：`git -c http.proxy=http://127.0.0.1:7897 -c http.sslBackend=openssl push origin main`（先用 `curl --ssl-no-revoke -x http://127.0.0.1:7897 https://github.com/` 探活；仅加 `sslBackend=openssl` 不带 7897 仍会 502）
- [ ] Windows 构建缓存：`npx next build` 可能因缺失 `.next/static/<id>/_ssgManifest.js` 失败；先删除 `.next` 并预建 `.next\static` 再构建
- [ ] 生成文件噪声：`src/data/articles.generated.json`、`public/data/practice.json`、`src/data/grammar.generated.json` 含 `generatedAt` 时间戳，每次构建都会产生 diff
- [ ] 无 ESLint 配置：`npm run lint` 会进入交互式初始化，不能作为验证门槛

## 已做出的决策

- **验证门槛只保留类型检查与构建**：`npx tsc --noEmit` + `npm run build`，避免不可用的 lint 阻塞 agent
- **Windows 入口独立**：`init.ps1` 供 PowerShell 使用，`init.sh` 保留为跨平台入口
- **不手改生成物**：只改 `article/*.md`、`src/data/answers/*.json`、`src/data/translations-part*.json` 与 `article-meta.ts`，由 `npm run content` 生成数据
- **内容四件套**：答案/解析/依据、逐段译文、文库元数据缺一不可，已写入 `AGENTS.md` 的完成定义

## 本次会话修改的文件

- `README.md` - 分类篇数表、内容规模、译文与答案解析功能点、内容四件套与目录结构
- `AGENTS.md` - 项目地图（译文/答案/练习库）、内容管线规则、完成定义、生成物边界
- `feature_list.json` - feat-002 ~ feat-005 收口，新增 feat-018、feat-019
- `progress.md`、`session-handoff.md` - 状态、证据与下一步同步
- `src/data/answers/*.json`、`src/data/translations-part13/14/15.json`、`src/data/article-meta.ts` - 内容补齐

## 2026-11-09 unslop 精修

- `app/globals.css` - 共享色板/字体/按钮/圆角/动效与首页样式
- `app/pages.css` - 文库筛选控件、卡片悬停、统计柱图颜色
- `src/components/pages/HomePage.tsx` - 首页文案、图标、样张词卡、分类色点
- `src/components/Header.tsx` - 英文品牌字样改为 Moread English
- 证据：`npx tsc --noEmit` exit 0；`npm run build` exit 0（63 篇 / 304 题 / 16470 词，导出 2/2）；桌面、390px 移动端与夜间主题截图复核

## 2026-11-10 卡片设计感恢复

- `src/components/pages/HomePage.tsx` - 恢复样张「精读」印章、`PASSAGE · 01` 标签、今日目标渐变进度条
- `app/globals.css` - 恢复样张倾斜/悬浮词卡、READ 背景字、今日卡红色光斑、卡片 24px 圆角与悬停上浮、进度条渐变
- `app/pages.css` - 移动端样张保持不倾斜，避免 390px 溢出
- 证据：`npx tsc --noEmit` exit 0；`npm run build` exit 0（63 篇 / 304 题 / 16470 词，导出 2/2）；桌面与 390px 移动端截图确认印章、READ 背景字、光斑与词卡均正常且不遮挡正文

## 2026-11-10 全站译文补全

- 新增 `src/data/translations-part7.json` ~ `translations-part12.json`，按 block 索引补齐 39 篇缺失译文（应用文 2、历史人文 12、社会生活 12、冲刺训练 13）
- 覆盖后 63 篇文章全部具备逐段译文；表格类文章（chongci-04）译文以可读文字概述整表
- 证据：`npm run content` 显示「含译文: 63 篇」；校验脚本确认 63 篇所有 block 均有 translation（缺失 0）；`npx tsc --noEmit` exit 0；`npm run build` exit 0（63 篇 / 304 题 / 16470 词，导出 2/2）

### 品牌标记（2026-11-09）

- `public/brand/moread-owl.png` - C1 猫头鹰标记（512×512，裁掉生成水印）
- `src/components/Header.tsx` - 页头印记改用图片
- `src/components/AppShell.tsx` - 启动页与 404 使用同一标记
- `app/globals.css`、`app/reader.css` - 印记容器支持图片裁切
- `app/layout.tsx` - favicon 指向品牌标记
- 移除 `app/icon.svg`

## 2026-11-10 移动端适配打磨

- `app/layout.tsx` - viewport 增加 `viewportFit: 'cover'`，启用 iOS 安全区
- `app/globals.css` - 页头适配顶部安全区
- `app/pages.css` - 移动端底部导航与阅读器底栏加大触控面积并适配底部安全区；文章库筛选改为「搜索整行 + 排序/收藏次行」；窄屏表单控件 16px 防止 iOS 聚焦缩放；阅读器顶栏按钮提升到 40px
- `app/reader.css` - 启动页/阅读器/弹窗/抽屉使用 `100dvh`；底部弹层、更多面板、阅读排版弹窗、翻译抽屉适配安全区；滚动区域增加 `overscroll-behavior: contain`
- `src/components/pages/ReaderPage.tsx`、`src/components/reader/QuestionPanel.tsx` - 移动端文案不再提「右侧」
- `next.config.ts` - 关闭 Next.js 开发指示器（`devIndicators: false`），移除开发模式左下角黑色 N
- 证据：`npx tsc --noEmit` exit 0；`npm run build` exit 0（63 篇 / 304 题 / 16470 词，导出 2/2）；390px 与 320px 视口实测所有页面 `scrollWidth === innerWidth` 无横向溢出，并复核首页、文库、生词、数据、设置、阅读器、题目/更多弹层、阅读排版弹窗与单词卡截图

## 2026-11-10 全站答案与解析补全

- 新增 `src/data/answers/yingyong-03-04.json`（应用文 Passage 3-4，10 题）
- 新增 `src/data/answers/lishi-03-12.json`（历史人文 Passage 3-12，50 题）
- 每题包含 `answer`、中文 `explanation` 与 `evidence` 原文依据；阅读器「答案 / 解析」按钮与交卷后的答案区均可展示
- 证据：`npm run content` 显示「含答案: 304 题」；校验脚本确认 304 题 answer 与 explanation 均非空（缺失 0）；`npx tsc --noEmit` exit 0；`npm run build` exit 0（63 篇 / 304 题 / 16470 词，导出 2/2）

## 完成证据

- [x] 类型检查通过：`npx tsc --noEmit`（exit 0）
- [x] 构建通过：`npm run build`（exit 0，38 篇文章 / 187 题 / 10278 词，导出 2/2）
- [x] 品牌标记构建通过：`npm run build`（exit 0，51 篇文章 / 244 题 / 13539 词，导出 2/2）
- [x] 品牌标记视觉检查：静态导出服务下页头加载 `/brand/moread-owl.png`，无破图，导航单行
- [ ] 手动验证：新分类页面展示待检查

## 2026-11-10 完成状态改为纯手动

- `src/components/pages/ReaderPage.tsx` - 移除滚动进度 ≥97% 时自动 `markComplete` 的调用
- `src/state/AppProvider.tsx` - `updateProgress` 不再按 `percent >= 98` 自动置 `completed`，只保留手动「标记完成」
- 进度条仍正常记录百分比，但不会再生效完成状态；主页/文库/统计的「已完成」只来自手动标记
- 证据：`npx tsc --noEmit` exit 0；`npm run build` exit 0（63 篇 / 304 题 / 16470 词，导出 2/2）

## 2026-11-10 冲刺训练2 拆分归档

- `article/冲刺训练2.md` 的 20 篇文章按主题拆分到现有专项：
  - 科普类 7 篇（Bigfoot、铁路、积极思维、肥胖、二手烟、夜奶、树木交流），Passage 11-17
  - 社会生活类 9 篇（育儿、职业转换、养老、体育压力、极简主义、半真半假、社交媒体、汽车文化、男幼师），Passage 13-21
  - 经历记叙类 1 篇（马达加斯加考察），Passage 12
- 3 篇与现有专项重复，未重复收录：冬季奥运邮票（历史人文 Passage 2）、求职信（社会生活 Passage 8）、石头剪刀布（科普 Passage 7）
- 原文与答案随文迁移，答案以 `答案：X` 保留；正文中的编号建议改为项目符号，避免内容管线误判为题目
- 证据：`npm run content` 生成 80 篇 / 388 题 / 21279 词，无截断或解析警告；17 篇新文章均为 4 选项且答案齐全；`npx tsc --noEmit` exit 0；`npm run build` exit 0（导出 2/2）

## 2026-11-11 阅读文章重新分类与新增 40 篇

- 新增 `article/阅读.md`（专题二 阅读理解，40 篇 / 200 题），按题材并入新的 10 个分类
- 原 7 个旧分类（科普、经历记叙、应用文、经济商业、历史人文、社会生活、冲刺训练）整体重组并改名：
  - 健康与医学 13 篇
  - 自然与科技 11 篇
  - 心理与行为 16 篇
  - 教育与成长 16 篇
  - 职场与商业 13 篇
  - 社会与城市 11 篇
  - 旅行与出行 8 篇
  - 文化与历史 13 篇
  - 人物与故事 14 篇
  - 实用文书 5 篇
- 旧文章通过 `Passage N` 下方的 `<!-- id: ... -->` 保留原 id，答案、译文、文章元数据与本地学习进度不受影响；新增文章使用 `read-01` ~ `read-40`
- 去重检查：对 120 篇正文做词集/5-gram 相似度比对，无高相似重复；旧专项中已存在过的同文文章未再次加入
- 说明：新增 40 篇源文件不含答案，当前有答案 388 题 / 总题 588 题；译文仍为原 63 篇
- 证据：`npm run content` 生成 120 篇 / 588 题 / 32558 词，10 个分类编号连续、无重复 id、40 篇新文章均为 5 题 4 选项；`npx tsc --noEmit` exit 0；`npm run build` exit 0（导出 2/2）

## 给下一会话的备注

本次提交后工作树应保持干净；开工前先 `git status --short` 确认。
