# 会话进度日志

## 当前状态

**最后更新：** 2026-11-13
**当前功能：** feat-018 新增 40 篇补答案、解析、译文与文库元数据（已完成）

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
- [x] 首页与全站共享样式 unslop 精修：统一控件圆角与字重，清理伪头像与悬停位移；按用户要求保留样张印章、READ 背景字、今日卡光斑与渐变进度条（feat-007）
- [x] 品牌标记：C1 猫头鹰标记接入页头、启动页、404 与 favicon（feat-006）

### 进行中

- [ ] feat-019 补齐 17 篇旧文章译文与解析
  - 范围：`kepu-11` ~ `kepu-17`、`shehui-13` ~ `shehui-21`、`jingli-12`（89 个正文块、84 道题）
  - 现状：有答案，但 `explanation` 为空、无任何中文译文

### 下一步

1. 按 feat-018 的口径为上述 17 篇补译文与解析（可复用 `translations-part15.json` 与 `answers/legacy-*.json`）
2. 补完后复核全站 120 篇译文覆盖与 588 题解析完整度
3. 视需要更新 README 的内容统计

## 阻塞 / 风险

- [ ] 17 篇旧文章（冲刺训练2 拆分产物）缺译文与解析，阅读器翻译抽屉与「答案/解析」在这些篇目下为空
- [ ] Windows 构建缓存：`npx next build` 可能因缺失 `.next/static/<id>/_ssgManifest.js` 失败；先删除 `.next` 并预建 `.next\static` 再构建
- [ ] 生成文件噪声：`src/data/articles.generated.json`、`public/data/practice.json`、`src/data/grammar.generated.json` 含 `generatedAt` 时间戳，每次构建都会产生 diff
- [ ] 无 ESLint 配置：`npm run lint` 会进入交互式初始化，不能作为验证门槛

## 已做出的决策

- **验证门槛只保留类型检查与构建**：`npx tsc --noEmit` + `npm run build`，避免不可用的 lint 阻塞 agent
- **Windows 入口独立**：`init.ps1` 供 PowerShell 使用，`init.sh` 保留为跨平台入口
- **不手改生成物**：只改 `article/*.md` 与 `src/data/answers/*.json`，由 `npm run content` 生成 `articles.generated.json`

## 本次会话修改的文件

- `AGENTS.md` - 新增项目级 agent 指令
- `init.sh`、`init.ps1` - 新增标准启动与验证入口
- `feature_list.json` - 建立功能追踪
- `progress.md` - 记录当前状态
- `session-handoff.md` - 建立交接模板

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
