# 会话进度日志

## 当前状态

**最后更新：** 2026-11-10
**当前功能：** feat-007 - 首页与共享样式 unslop 精修（已完成）；移动端适配打磨（2026-11-10 完成）；feat-002 内容批次仍在进行

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

## 给下一会话的备注

仓库中存在用户未提交的内容批次改动，开工前先 `git status --short`，不要回滚这些文件。
