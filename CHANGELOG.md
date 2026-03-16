# Changelog

本文件记录项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。

---

## [Unreleased]

### 新增（ChatQ 主数据管理完整流程）

- **Admin ChatQ 主数据管理页面**（2026-03-15，author: Jaxon）
  - 新增 `admin/src/pages/Settings/chatq-data/index.tsx`：ChatQ 主数据 CRUD 管理页面。
  - 包含 5 个 Tab：维度、人设标签、场景、关系、人设包，每个 Tab 支持列表展示、新增、编辑、删除操作。
  - 人设标签 Tab 支持按维度筛选；人设包 Tab 的标签/场景字段为多选联动。
  - 使用 tRPC `chatqManage` router，遵循项目 Ant Design + Tailwind 编码规范。
- **数据库迁移 & Seed 数据**（2026-03-15，author: Jaxon）
  - 执行 `drizzle-kit push` 在数据库中创建 5 张 `chatq_*` 表和 2 个 `chatq_*` 枚举。
  - 执行 `seed-chatq-data.ts` 将 8 个维度、151 个人设标签、8 个场景、10 个关系、8 个人设包写入数据库。
  - 整体端到端验证通过：后端 tRPC 接口正常返回 → Admin 管理页面加载数据并可执行 CRUD。

### 变更（ChatQ 枚举前缀统一）

- **DB 枚举名统一加 `chatq_` 前缀**（2026-03-15，author: Jaxon）
  - `persona_tag_sentiment` → `chatq_persona_tag_sentiment`
  - `persona_package_gender` → `chatq_persona_package_gender`
  - 删除旧迁移 `0008_conscious_madame_masque.sql`，重新生成 `0008_condemned_ken_ellis.sql`，表名和枚举名全部统一为 `chatq_` 前缀。

### 新增（聊商人设维度 JSON 数据）

- **personaDimensions.json**（2026-03-15，author: Jaxon）
  - 新增 `server/src/app_settings/chatq/data/personaDimensions.json`：从 `apps/chatq_keyboard/docs/标签体系v3.0.md` 中「二、人设标签数据（JSON格式）」完整提取 dimensions 数组（8 个维度及全部标签），格式为 `{"dimensions": [...]}`。
  - 修正文档中的笔误：敏感标签的 description 由「心思想对细腻」改为「心思相对细腻」。
  - 说明：源文档 JSON 块内实际共 151 个标签（personality 33 + language 25 + psychology 25 + social 20 + behavior 15 + values 9 + aura 18 + emotion 6），与文档内 statistics.total_tags 的 153 存在不一致，当前以文档内 JSON 为准。

### 新增（聊商配置模板与后端接口）

- **ChatQ 配置模板与后端接口设计**（2026-03-15，author: Jaxon）
  - **文档**：新增 `apps/chatq_keyboard/docs/配置模板与后端接口设计.md`，定义配置模板 defaultConfig 结构（features、limits、sceneIds、relationIds、defaultPersonaPackageIds）及主数据 API 约定。
  - **配置模板**：`server` 内置模板 chatq 的 defaultConfig 扩展为包含 8 场景 ID、10 关系 ID、8 个人设包 ID，以及 features（customReply、keywordReply、enableAISmartAdjust 等）、limits（maxKeywordCount、maxPersonaCards 等）；proCandidateCount 调整为 3 以对齐 PRD「一次生成 3 条」。
  - **主数据接口**：在 `server/src/app_settings/chatq` 下新增主数据与路由：
    - `data/scenes.ts`、`data/relations.ts`、`data/personaDimensions.ts`、`data/personaPackages.ts`：8 场景、10 关系、8 维度人设标签（示例标签）、8 个人设包，与 PRD/标签体系 v3.0 对齐。
    - `routers/configData.ts`：`chatq.configData.listScenes`、`listRelations`、`listPersonaDimensions`、`listPersonaPackages`，使用 appProcedure（x-api-key 即可），供键盘端与管理端拉取。
  - **注册**：chatq 模块注册 configData 路由；调用路径为 `/trpc/chatq.configData.listScenes` 等。

- **聊商配置与接口 — 完全实施计划**（2026-03-15，author: Jaxon）
  - 新增 `apps/chatq_keyboard/docs/配置模板与后端接口-实施计划.md`：分 Phase 1（后端补全）、Phase 2（管理端对齐）、Phase 3（键盘端接入），列出 1.1–1.3、2.1–2.2、3.1–3.4 共 9 项任务，每项含目标、产出、验收标准与建议步骤；附任务与文件对照表，便于按计划完全实现。

### 实施计划执行（2026-03-15，author: Jaxon）

- **Phase 1 后端**
  - **1.1 补全人设标签**：从标签体系 v3.0 抽取完整 dimensions 至 `server/src/app_settings/chatq/data/personaDimensions.json`（151 标签），`personaDimensions.ts` 改为从 JSON 导入；build 时复制 JSON 到 dist。
  - **1.2 扩展 generate**：`chatq.customReply.generate` 增加可选入参 `sceneId`、`relationId`、`personaTagWeights`、`candidateCount`（1–3）；按场景/关系/标签拼 prompt，返回 `result` + `candidates`；`KeyboardGenerateOutput` 增加 `candidates?: string[]`。
  - **REST**：`server/src/routers/rest-adapter.ts` 新增 `POST /api/aikeyboard/reply` → `chatq.customReply.generate`。
- **Phase 2 管理端**
  - **2.1 ChatQ 设置对齐**：功能配置增加 `enableAISmartAdjust`（AI 智能调整，默认关）；配额限制增加 `maxPersonaCards`（0=不限）；`ChatqFeaturePanel` 支持新开关。
- **Phase 3 键盘端**
  - **3.1 configData**：新增 `apps/chatq_keyboard/src/services/configData.ts`，封装 `listScenes`/`listRelations`/`listPersonaDimensions`/`listPersonaPackages`（tRPC GET），AsyncStorage 缓存 24h，暴露 `getConfigData`/`getScenes`/`getRelations`/`getPersonaDimensions`/`getPersonaPackages`。
  - **3.2 类型与状态**：新增 `types/configData.ts`（SceneItem、RelationItem、PersonaDimensionItem、PersonaPackageItem、ConfigDataCache）；`AppState` 增加 `configData`、`keyboard.currentCandidates`，Action 增加 `SET_CONFIG_DATA`、`SET_CURRENT_CANDIDATES`；ChatContext 初始化时拉取主数据并暴露 `loadConfigData`。
  - **3.3 人设卡片表单**：未实现完整 UI；主数据与类型已就绪，后续可做场景/关系/标签选择页。
  - **3.4 生成与多候选**：`GenerateRequest` 增加 `sceneId`、`relationId`、`personaTagWeights`、`candidateCount`；`GenerateResponse` 增加 `candidates`；`api.generateReply` 改为调用 `POST /api/aikeyboard/reply` 并解析 `result`/`candidates`；`handleKeyboardRequest` 传入 `candidateCount: 3` 并写入 `currentCandidates`。

### 修复与改进（按分析建议）

- **admin - 应用管理点击「设置」后页面显示不正确**（2026-03-15，author: Jaxon）
  - **原因**：从应用管理跳转到 `/:appId/settings` 或 `/:appId/settings/:templateId` 时，首帧依赖 store 的 `currentApp`；若 store 尚未同步（或 app 不在当前 apps 列表），`currentApp` 为空，导致模板设置页误判为「请先选择一个应用」、默认设置页副标题出现 `undefined`。
  - **修改**：
    - `pages/Settings.tsx`：配置模板优先用 URL 的 `templateId` 再回退到 `currentApp?.configTemplate`，避免首帧无 store 时走错分支；默认设置页副标题与订阅提示在 `currentApp` 为空时使用「当前应用」占位。
    - `pages/Settings/configs/chatq`、`ai-keyboard`、`clipboard`：仅在没有 URL 中的 `appId` 时展示「请先选择一个应用」；有 `appId` 无 `currentApp` 时仍渲染表单，副标题用「当前应用的专属配置」占位。
  - **调试**：在设置流程中增加 `[Settings]` 前缀的 console 日志，便于复现后根据控制台输出定位问题（入口、TemplateSettingsLoader、TemplateSettingsSelector、DefaultSettingsPage、ChatqSettingsPage、应用管理点击设置）。
  - **根因修复**（根据用户日志 `currentAppFromStore: null`、`appsCount: 1` 且无网络请求）：
    - `stores/appStore.ts`：`setApps` 在传入空列表时不再把 `currentAppId` 置为 `null`。
    - `pages/Settings.tsx`：用 `useLayoutEffect` 同步 URL 的 `appId` 到 store；**入口用 props 向下传递 URL 的 appId**：`TemplateSettingsLoader` 接收 `appId` 并传给各模板页为 `appIdFromParent`。
    - **模板未真正渲染的 bug**：原先 `templateSettingsImports[templateId]` 是「返回 Promise 的 import 函数」，被当作组件渲染时实际渲染的是该函数（调用后得到 Promise），导致模板页从未挂载、无 `settings.app` 请求、无子组件日志。改为使用 `React.lazy()` 得到真实懒加载组件后再渲染，并传入 `appIdFromParent`。
    - `pages/Settings/configs/chatq`、`ai-keyboard`、`clipboard`：接收可选 `appIdFromParent`，`currentAppId = appIdFromParent || ...`，避免首帧无请求。

- **清理无用 console 日志**（author: Jaxon）
  - **admin**：移除 Settings 入口/TemplateSettingsLoader/TemplateSettingsSelector/DefaultSettingsPage、ChatqSettingsPage、Apps 点击设置、Login、AppSwitcher 中的调试用 `console.log`。

- **设置页「基础信息」与所选 app 一致**（author: Jaxon）
  - **server** `routers/settings.ts`：`settings.app` 返回中增加 `bundleId`，便于前端展示当前应用基本信息。
  - **admin** `Settings/configs/chatq`、`ai-keyboard`、`clipboard`：加载配置时把接口返回的 `appName`、`bundleId` 与 store 的 `currentApp` 合并进表单初始值，使「基础信息」tab 显示当前选中 app 的名称与 Bundle ID。

- **antd List 弃用**（2026-03-15，author: Jaxon）
  - **admin** `Settings/configs/chatq/components/ChatqStylesPanel.tsx`：用 `Flex` + `map` 替代已弃用的 `List`/`List.Item`/`List.Item.Meta`，消除 “[antd: List] The List component is deprecated” 警告。

- **ChatqSettingsPage Hooks 顺序与 antd Space 弃用**（2026-03-15，author: Jaxon）
  - **admin** `Settings/configs/chatq/index.tsx`：将「渲染: 表单」的 `useEffect` 移到所有条件 return 之前，避免「Rendered more hooks than during the previous render」。
  - **admin** 全局：所有 `Space` 的 `direction` 改为 `orientation`（Apps、Settings/configs/ai-keyboard、chatq、system、templates），消除 antd 弃用警告。

- **应用设置全链路分析与修复**（2026-03-15，author: Jaxon）
  - 新增 `docs/SETTINGS_FLOW_ANALYSIS.md`：梳理从应用管理点击设置到模板页展示/保存的完整前后端流程，列出已修复点与剩余注意点。
  - **server** `routers/settings.ts`：`settings.updateApp` 的 input 使用 `.passthrough()`，并将请求体中未在「已知顶层字段」中的键归入 `customUpdates`，与 `customFeatures` 一并摊平写入 `app.settings`，避免模板页（如 ChatQ）提交的自定义字段被 Zod 丢弃或报错。

- **admin**
  - `utils/trpc.ts`：请求头中的 `x-app-id` 改为从 `useAppStore.getState().currentAppId` 读取，不再直接解析 localStorage，避免 key/结构变更导致遗漏。
- **server**
  - CORS 的 `Access-Control-Allow-Origin` 改为可配置：优先使用环境变量 `CORS_ORIGIN` 或 `ADMIN_ORIGIN`，未设置时保持 `*`；请求头中增加 `x-app-id` 的允许。
- **apps/chatq_keyboard**
  - `services/api.ts` 重写：支持通过 `setApiConfig({ baseUrl, apiKey, deviceId, userToken? })` 配置真实后端；已配置时调用 `POST /api/ai/generate`，未配置时仍使用 mock；带重试的 fetch 与统一错误解析。

### 修复（TypeScript / Lint）

- **admin**
  - 测试与组件：Loading.test 使用 vi、修正 Loading 默认导出与未使用参数；useLoading.test、AdminLayout、Dashboard、Analytics、Settings、Chatq 面板、Users、Subscriptions 等移除未使用变量/导入或补充类型。
  - 类型：Subscription 增加 `planId?`；AppInfo 在 appStore.test 中补全 slug/description/platform/status；TemplateInfo 的 icon/description/defaultConfig 支持 `null`；BackendApp 的 slug/configTemplate/settings 支持 `null`；trpc 错误处理与 `setupGlobalErrorHandler` 的 onError 类型与 `getErrorMessage` 的 error 窄类型。
  - 表单与 Table：Settings 的 `initialValues` 传 `settings ?? undefined` 避免 null；Subscriptions 的 `useSmartLoading` 改为传入 `{ manualStates: [...] }`，Table columns 类型断言；Settings/system 的 AIConfig 补全 `enableStream` 与 `defaultProvider` 类型，aiProviders 做 Array.isArray 判断。
- **server**
  - customReply：短语数量与最大排序改用 `sql\`count(*)\`` / `sql\`coalesce(max(...))\``，修正 Drizzle 查询类型。
  - trpc：context/router 的 `@/` 改为相对路径以便 admin 构建时解析；CreateFastifyContextOptions 改为 type-only 导入。
  - 各 router：移除未使用导入（analytics/settings/template/user/user-manage/app/ai/service/apple），为回调参数补充显式类型（analytics/user-manage 等），user-manage 的 `inArray(users.id, tierFilteredUserIds as string[])` 与密码重置处去掉未使用的 `updated`，subscription 的 restore 去掉未使用的 `input`。
  - services/ai：AIServiceError 等改为在构造函数外声明 `readonly` 以兼容 erasableSyntaxOnly；ProviderUnavailableError 从 service 中移除未使用导入；apple mock-service 恢复 AppleNotification 类型导入并修正未使用参数。

---

## [0.6.0] - 2026-02-10

### 变更（重大重构）
- **多 App 架构升级**：管理后台从单一 AI Keyboard 管理重构为多应用统一管理平台
- 平台名称从 "AI Keyboard 管理后台" 更名为 "应用管理平台"
- 所有业务页面（仪表盘、用户管理、订阅管理、应用设置）均改为 App 感知模式
- 删除了 AI Keyboard 专属的"风格管理"页面，替换为通用的"数据分析"页面

### 新增
- **App 数据模型**（`AppInfo`）：
  - 支持 id、name、slug、description、icon、platform、bundleId、status 等字段
  - 平台类型：iOS / Android / Web / 跨平台
  - 状态管理：运行中 / 未激活 / 维护中 / 已归档
- **App 状态管理**（`appStore`）：
  - Zustand 持久化存储，维护 App 列表和当前选中的 App ID
  - 支持增删改查 + 切换当前 App
  - 内置 3 个模拟 App（AI Keyboard、AI Translator、AI Writer）
- **AppSwitcher 组件**：
  - 侧边栏 App 切换器，支持展开/收起两种展示模式
  - 下拉选项展示 App 图标、名称和状态标签
- **应用管理页面**（`/apps`）：
  - 4 个统计卡片（应用总数、运行中、维护中、iOS 应用）
  - 应用列表表格（图标、名称、Slug、描述、平台、Bundle ID、状态、更新时间）
  - 新增/编辑应用弹窗（名称、图标、Slug、描述、平台、状态、Bundle ID）
  - "进入"按钮一键切换到该应用上下文
  - 删除确认对话框
- **数据分析页面**（`/analytics`，替代原风格管理）：
  - Per-App 的 API 调用分析数据
  - 4 个核心指标卡片（总 API 调用、平均响应时间、错误率、高峰时段）
  - 热门接口 Top 5 表格（接口路径、调用次数、平均耗时、错误率）
  - 近 7 天趋势表格（日期、调用次数、错误数、错误率）
- **侧边栏布局重构**：
  - 顶部：平台 Logo + App 切换器
  - 中部：当前 App 业务菜单（仪表盘、用户管理、订阅管理、数据分析、应用设置）
  - 底部：平台管理菜单（应用管理）
  - 顶部栏显示当前 App 名称和图标
- **tRPC 客户端升级**：
  - 自动在请求头中附带 `x-app-id`，标识当前操作的应用
  - 从 Zustand 持久化存储中读取 App 上下文
- **Per-App 模拟数据**：
  - 仪表盘：每个 App 有独立的统计数据、最近用户、今日快报
  - 用户管理：按 App 过滤用户，不同 App 展示不同设备前缀和版本号
  - 订阅管理：按 App 过滤订阅记录
  - 应用设置：每个 App 有独立的 API 配置、AI 模型、订阅定价、安全配置
  - 数据分析：每个 App 有独立的 API 调用统计和接口排行
- **常量配置升级**：
  - 新增 App 状态/平台的标签和颜色映射
  - 移除 AI Keyboard 专属常量

## [0.5.0] - 2026-02-10

### 新增
- 在 `admin/` 目录下生成完整的 React 管理后台项目
- **技术栈**：Vite + React 19 + TypeScript + Ant Design 6 + Tailwind CSS 4 + tRPC 11 + React Query 5 + Zustand 5 + React Router 7
- **tRPC 集成**：
  - 配置 tRPC React Query 客户端，支持 HTTP 批量请求
  - 自动附带 JWT Token 的认证头
  - 占位 AppRouter 类型，可无缝对接服务端
  - Vite 代理配置 `/api/trpc` 到后端服务
- **管理布局**（`AdminLayout`）：
  - 可折叠侧边栏，含 Logo + 5 个导航菜单项
  - 顶部栏含折叠按钮、用户头像下拉菜单（个人信息 / 退出登录）
  - 响应式布局，Sticky 顶部栏
- **登录页**（`Login`）：
  - 渐变背景 + 居中卡片式登录表单
  - 表单校验、Loading 状态、模拟登录（admin / admin123）
  - 路由守卫：未登录重定向到登录页，已登录重定向到首页
- **仪表盘**（`Dashboard`）：
  - 4 个统计卡片（总用户数、活跃用户、Pro 会员、总收入），含趋势指示
  - 今日快报卡片（新增用户、AI 调用次数、新增/取消订阅）
  - 热门风格排行表格
  - 最近注册用户表格
- **用户管理**（`Users`）：
  - 搜索框 + 订阅方案/状态筛选 + 刷新/导出按钮
  - 分页数据表格（ID、设备ID、平台、版本、订阅方案、状态、注册/活跃时间）
  - 用户详情弹窗 + 禁用用户确认对话框
- **订阅管理**（`Subscriptions`）：
  - 4 个统计卡片（活跃订阅、月度会员、年度会员、试用用户）
  - 方案/状态筛选 + 日期范围选择器
  - 订阅数据表格（交易号、方案、状态、自动续费、起止时间）
- **风格管理**（`Styles`）：
  - 风格列表表格（图标、名称、描述、类型、使用次数）
  - 新增/编辑风格弹窗（名称、描述、Emoji、主题色、Prompt 模板、内置开关）
  - 删除确认 + 内置风格保护（不可删除）
- **系统设置**（`Settings`）：
  - Tab 分组：API 配置、订阅配置、通知配置、安全配置
  - API 配置：基础地址、AI 模型参数（Provider / Model / Tokens / Temperature）
  - 订阅配置：试用天数、免费/Pro 日配额、月度/年度定价
  - 通知配置：邮件通知开关、Slack Webhook、告警阈值
  - 安全配置：JWT Secret/过期天数、速率限制、IP 白名单
- **通用组件**：
  - `StatsCard` 统计卡片组件（支持图标、趋势、Loading）
  - `PageHeader` 页头组件（标题、副标题、面包屑、操作区）
- **状态管理**：
  - Zustand `authStore`（登录/登出/持久化到 localStorage）
  - 常量配置（菜单项、订阅标签/颜色、分页选项）
- **类型定义**：
  - User、Subscription、SpeakingStyle、DashboardStats 等完整 TypeScript 类型
  - 通用分页、API 响应类型
- **工程配置**：
  - Vite 路径别名 `@/` → `src/`
  - Tailwind CSS 全局样式（滚动条美化、页面过渡动画）
  - Ant Design ConfigProvider（中文语言包、主题定制）
  - dayjs 中文 locale
  - ESLint + TypeScript 严格模式

## [0.7.0] - 2026-02-10

### 新增
- **订阅计划表 `subscription_plans`**：
  - 每个 App 可独立配置多个订阅方案（名称、产品ID、价格、周期、功能列表等）
  - 支持 monthly / yearly / lifetime / custom 四种计费周期
  - 价格以"分"为单位存储，支持多币种
  - 功能列表（features JSONB）支持自定义展示内容
  - 同一 App 内 productId 唯一约束
  - 上架/下架状态 + 排序权重
- **数据库枚举 `billing_period`**：monthly / yearly / lifetime / custom
- **管理后台订阅管理路由 `subscriptionManage.*`**：
  - `createPlan` 创建订阅计划
  - `listPlans` 查询指定 App 的订阅计划列表（支持显示已下架）
  - `updatePlan` 更新计划（名称、价格、功能、上下架等）
  - `deletePlan` 删除计划（有活跃订阅时禁止删除，需先下架）
  - `listSubscriptions` 查询指定 App 的用户订阅列表（支持按状态/层级筛选、分页）
  - `activateSubscription` 手动激活用户订阅（用于补偿/促销场景）
  - `cancelSubscription` 手动取消用户订阅
  - `extendSubscription` 延长用户订阅（智能叠加剩余时间）
  - `stats` 订阅数据统计（按状态/层级分组计数、付费转化率）
- **客户端订阅路由增强**：
  - `subscription.plans` 新增：获取当前 App 可用的订阅计划列表（客户端付费墙展示）
  - `subscription.status` 增强：返回关联的计划详情（名称、周期）
  - `subscription.verify` 重构：自动通过 productId 匹配 App 下的订阅计划进行激活

### 变更
- `subscriptions` 表新增 `plan_id` 外键关联 `subscription_plans`（免费用户为 null）
- 客户端购买验证不再硬编码 tier 解析，改为通过 plan 配置动态获取

---

## [0.6.0] - 2026-02-10

### 重构
- **服务端架构升级为多 App 管理后台**，支持一套服务管理多个客户端应用
- 所有业务数据（用户、风格、订阅、用量）全部实现按 App 隔离

### 新增
- **数据库新增表**：
  - `admins` 管理员表（用户名、邮箱、密码哈希、角色：super_admin/admin）
  - `apps` 应用表（名称、BundleID、平台、API Key/Secret、自定义配置 JSONB、启停状态）
- **数据库枚举新增**：`admin_role`、`platform`
- **数据库改动**：
  - `users` 表新增 `app_id` 外键，联合唯一索引 `(app_id, device_id)` 替代原 `device_id` 唯一约束
  - `styles` 表新增 `app_id` 外键，内置风格按 App 区分
- **tRPC Procedure 四级权限体系**：
  - `publicProcedure` → 无需认证
  - `appProcedure` → 客户端 App 级别（需 `x-api-key`）
  - `protectedProcedure` → 客户端用户级别（需 `x-api-key` + `x-device-id`）
  - `adminProcedure` → 管理后台（需 `Authorization: Bearer <token>`）
- **管理后台路由 `admin.*`**：
  - `admin.init` 系统初始化（创建首个超级管理员）
  - `admin.login` 管理员登录
  - `admin.create` 创建管理员（仅 super_admin）
  - `admin.me` 当前管理员信息
- **应用管理路由 `app.*`**：
  - `app.create` 创建应用（自动生成 API Key/Secret）
  - `app.list` 应用列表
  - `app.detail` 应用详情（含用户统计）
  - `app.update` 更新应用信息与配置
  - `app.regenerateKey` 重新生成 API Key
  - `app.delete` 删除应用（仅 super_admin，级联删除关联数据）
- **工具模块 `utils/crypto.ts`**：密码哈希（scrypt）、API Key 生成（零外部依赖）
- **App 级别自定义配置（JSONB）**：每个 App 可独立配置免费额度、候选数、功能开关等

### 变更
- `tRPC Context` 重构：自动从 `x-api-key` 请求头解析当前 App 实例
- 所有客户端路由（user/ai/style/subscription）全部改为 App 作用域查询
- AI 路由的用量限制改为从 App settings 动态读取，不再硬编码
- CORS 请求头新增 `x-api-key` 支持

---

## [0.5.0] - 2026-02-10

### 新增
- **server/** 服务端基础架构搭建，技术栈：tRPC + Fastify + Drizzle ORM + PostgreSQL
- **数据库层 (Drizzle ORM)**：
  - `db/schema.ts` 完整数据库 Schema 定义（users / subscriptions / styles / usage_records 四张表）
  - `db/index.ts` postgres.js 驱动连接与 Drizzle 实例初始化
  - `drizzle.config.ts` Drizzle Kit 迁移配置
  - 自定义枚举类型：subscription_tier、subscription_status
- **tRPC 核心层**：
  - `trpc/index.ts` tRPC 初始化，含 publicProcedure / protectedProcedure 两级权限
  - `trpc/context.ts` 请求上下文（注入数据库实例、设备标识、授权信息）
  - `trpc/router.ts` 根路由聚合，整合四大业务模块
- **业务路由模块**：
  - `routers/user.ts` 用户路由（设备注册 / Token 刷新 / 用户信息查询）
  - `routers/ai.ts` AI 路由（回复生成 / 用量限制检查 / 模型列表）
  - `routers/style.ts` 风格路由（内置风格列表 / 用户自定义 CRUD）
  - `routers/subscription.ts` 订阅路由（收据验证 / 状态查询 / 恢复购买）
- **服务入口**：
  - `src/index.ts` Fastify 服务启动，集成 tRPC 插件、CORS 支持、健康检查端点
- **工程配置**：
  - `package.json` 项目依赖与脚本（dev / build / db:generate / db:migrate / db:push / db:studio）
  - `tsconfig.json` TypeScript 严格模式配置
  - `.env` 环境变量模板（数据库连接、JWT 密钥、AI 服务密钥）

---

## [0.4.0] - 2026-02-09

### 新增
- 生成完整 iOS App 项目至 `app/` 目录，使用 XcodeGen 构建 Xcode 工程
- **Shared/** 共享模块：
  - `AppConstants` 全局常量（App Group、免费/Pro 限制、UserDefaults Key 等）
  - `APIConfig` 服务端 API 地址配置（支持 DEBUG/RELEASE 环境切换）
  - `SpeakingStyle` 说话风格数据模型（含 6 种内置风格预设）
  - `StyleCombination` 风格组合模型（支持多风格权重混搭）
  - `Subscription` 订阅状态模型（SubscriptionTier / SubscriptionStatus）
  - `Color+Extension` / `String+Extension` / `UserDefaults+AppGroup` 扩展
- **AIKeyboard/** 主应用：
  - `AIKeyboardApp` SwiftUI App 入口
  - `ContentView` 主 Tab 页（风格 + 设置）
  - `StyleListView` 风格列表页（内置/自定义/组合管理，多选组合）
  - `StyleEditorView` 自定义风格编辑器（图标、颜色、Prompt、参数配置）
  - `SubscriptionView` 付费墙页面（功能对比 + 商品选择 + 试用/购买）
  - `SettingsView` 设置页（订阅状态卡片、键盘设置引导）
  - `AIService` AI 回复生成服务（调用服务端 API）
  - `ClipboardService` 剪贴板监听服务
  - `StyleManager` 风格管理服务（增删改查 + 持久化）
  - `SubscriptionManager` StoreKit 2 订阅管理（购买/恢复/状态同步/App Group）
  - `TokenManager` JWT Token 管理（Keychain 存储 + 设备注册）
- **KeyboardExtension/** 键盘扩展：
  - `KeyboardViewController` 键盘主控制器（UIKit + SwiftUI 混合）
  - `KeyboardMainView` 键盘 SwiftUI 主视图（剪贴板栏 + 回复区 + 工具栏）
  - `ReplyCardView` 回复候选卡片
  - `StyleSelectorView` 风格指示器
  - `KeyboardClipboardHelper` 剪贴板辅助工具
- **Tests/** 单元测试（风格、组合、订阅、字符串扩展、颜色扩展等）
- 资源文件：Info.plist、Entitlements（App Group）、Assets.xcassets
- `project.yml` XcodeGen 配置文件
- `app/.gitignore`

## [0.3.0] - 2026-02-09

### 变更
- 项目结构调整为 monorepo：客户端代码移至 `app/`，服务端代码置于 `server/`
- 技术栈拆分为客户端和服务端两部分独立展示
- 快速开始指南拆分为服务端启动、客户端运行、键盘启用三个步骤

### 新增
- 新增 `server/` 服务端完整目录结构（路由、服务、模型、中间件、工具类）
- 新增服务端技术栈：Node.js + TypeScript + Express/Hono + PostgreSQL + Redis + Docker
- 新增服务端 API 接口文档（订阅验证、状态查询、恢复购买、Webhook、AI 生成、用户注册）
- 新增服务端环境变量配置说明与 Docker 一键部署指南
- Phase 2 开发计划新增 7 项服务端任务（认证、收据验证、Webhook、AI 代理等）

## [0.2.0] - 2026-02-09

### 新增
- README 新增订阅会员体系功能介绍
- README 新增订阅方案对比表（免费版 / Pro 月度 / Pro 年度）
- 技术架构新增 SubscriptionView、Subscription 模型、SubscriptionManager 服务
- 技术栈新增 StoreKit 2 与 App Store Server API
- 开发计划拆分为三阶段，新增 Phase 2 订阅与商业化阶段
- 隐私安全新增订阅支付与取消相关说明

## [0.1.0] - 2026-02-09

### 新增
- 创建项目 README.md，包含完整的项目介绍、核心功能、技术架构、使用流程等内容
- 创建 CHANGELOG.md 变更日志文件
