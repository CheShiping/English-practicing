# 会话进度日志

## 当前状态

**最后更新：** 2026-11-13
**当前功能：** feat-014 单选练习全量出题、进度续答与答题卡底部弹层（已完成）；README 视觉改造与部署地址更新

## 2026-11-13 单选练习全量出题、续答与答题卡弹层；README 改造（feat-014）

- **删除题量选择**：设置页只保留考点大类 / 细分考点 / 顺序，开始练习直接出当前考点全部题目（全池 2774 题可用）
- **进度续答**：新增 `practice.resume.v1`（试卷题目顺序、作答、标记实时写盘）；重新进入 `#/practice` 自动恢复，光标落在最后答过的那道题上，已答统计与标记一并恢复；「完成练习」或存档题目失效时清除；退出练习不再弹确认框
- **答题卡底部弹层**：移除页面常驻答题卡，导航栏中间新增「答题卡」按钮，底部弹出面板（遮罩点击 / Esc / 收起按钮关闭，`safe-area-inset-bottom` 适配，打开时锁背景滚动），点题号跳题并关闭
- **README 改造**：新增 `assets/readme/hero.svg`（纸感 + 行线 + 精读印章视觉，含在线入口文案）与 5 张真实界面截图；重排阅读顺序（hero → 界面速览 → 它是什么 → 功能 → 快速开始 → 添加文章 → 部署 → 目录结构 → 说明）；部署地址 `https://cheshiping.github.io/English-practicing/` 写入正文
- **部署**：git remote 由 `CheShiping/English-reading.git` 改为 `cheshiping/English-practicing.git`；部署工作流用 `actions/configure-pages` 自动探测 base_path，无需改配置
- **证据**：headless 实测 size-block-gone:true、开始练习（2774 题）、inline-sheet:absent、sheet-opens:true、弹层点题号跳到第 5 题、刷新后 resume「第 5 / 2774 题 · 已答 2 · 对 1」均 PASS；`npx tsc --noEmit` exit 0；`npm run build` exit 0（导出 2/2）；beautify-github-readme 审计脚本「image references and SVG basics」PASS；hero 在 1200 宽与 GitHub 360 宽缩放下目检通过
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

- [ ] 新内容批次（未提交，属用户已有改动）
  - 详情：`article/历史人文类专项训练.md`、`article/社会生活类专项训.md`、`src/data/answers/lishi-shehui-*.json`、`shehui-*.json`
  - 阻塞：历史人文类 Passage 3、应用文类 Passage 3 原文截断，构建时被跳过

### 下一步

1. 继续核对新增文章（当前构建 63 篇 / 304 题 / 16470 词），检查文章库与阅读器（feat-002 / feat-004）
2. 更新 README 分类与内容统计（feat-005）
3. 用户确认后提交本批内容与 UI 精修

## 阻塞 / 风险

- [ ] 截断文章：`历史人文类专项训练.md` Passage 3 与 `应用文类专项训练.md` Passage 3 无题目，构建警告但不阻断
- [ ] Windows 构建缓存：`npx next build` 可能因缺失 `.next/static/<id>/_ssgManifest.js` 失败；先删除 `.next` 并预建 `.next\static` 再构建
- [ ] 生成文件噪声：`src/data/articles.generated.json` 含 `generatedAt` 时间戳，每次构建都会产生 diff
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
