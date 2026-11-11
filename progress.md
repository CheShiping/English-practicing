# 会话进度日志

## 当前状态

**最后更新：** 2026-11-11
**当前功能：** feat-011 语法知识点页（已完成）；feat-002 内容批次仍在进行

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

## 给下一会话的备注

本次提交后工作树应保持干净；开工前先 `git status --short` 确认。
