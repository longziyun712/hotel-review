# Tasks: 花园酒店评论浏览网页

**输入文档**: `specs/001-hotel-review-browser/`（plan.md + spec.md）
**技术栈**: Next.js 14 App Router · TypeScript · Tailwind CSS · Insforge

**格式说明**
- `[P]` — 可与同阶段其他标 `[P]` 任务并行执行（不同文件，无未完成依赖）
- `[USn]` — 归属用户故事编号（对应 spec.md 中的 US1–US4）

---

## Phase 1: Setup（项目初始化）

**目的**: 创建 Next.js 工程骨架，配置开发工具链

- [X] T001 在仓库根目录执行 `npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --eslint` 初始化 Next.js 项目（保留已有 `public/`、`specs/` 目录）
- [X] T002 [P] 安装运行时依赖：`npm install @insforge/sdk`，安装开发依赖：`npm install -D tsx vitest @playwright/test`
- [X] T003 [P] 更新 `tsconfig.json`：启用 `strict: true`，配置 `paths` 别名 `@/*` → `./*`
- [X] T004 [P] 更新 `tailwind.config.ts`：添加 `colors` 扩展（`gold: '#c9973a'`、`navy: '#1a2744'`），对应原型配色
- [X] T005 [P] 更新 `.gitignore`：确保 `.env.local`、`node_modules/`、`.next/` 均已包含

**Checkpoint**: `npm run dev` 启动成功，访问 `localhost:3000` 显示默认 Next.js 页面

---

## Phase 2: Foundational（数据库建表 + 共享基础层）

**目的**: 建立数据库表结构、完成 CSV 导入、创建所有用户故事共用的类型与工具函数

**⚠️ CRITICAL**: 此阶段全部完成后，各用户故事才可开始实现

- [X] T006 通过 Insforge CLI Skill 创建 `comments` 表，字段类型严格按以下规格：`_id text PK`、`comment text`、`images json`、`score numeric(3,1)`、`publish_date date`、`room_type text`、`fuzzy_room_type text`、`travel_type text`、`comment_len integer`、`log_comment_len numeric(10,6)`、`useful_count integer`、`log_useful_count numeric(10,6)`、`review_count integer`、`log_review_count numeric(10,6)`、`quality_score numeric(4,1)`、`categories json`、`category1 text`、`category2 text`、`category3 text`、`star integer`
- [X] T007 创建 `scripts/import-comments.ts`：读取 `public/enriched_comments.csv`，应用以下转换后批量 upsert 至 `comments` 表（`_id` 冲突则覆盖）：`images` → `JSON.parse()`；`categories` → `JSON.parse(row.categories.replace(/'/g, '"'))`；`category1/2/3` → `cats[0]/[1]/[2] ?? null`；`star` → `Math.min(5, Math.max(1, Math.floor(parseFloat(row.score))))`；`publish_date` → 保持 `'YYYY-MM-DD'` 字符串；其余数值字段 → `parseFloat` / `parseInt`
- [X] T008 执行 `npx tsx scripts/import-comments.ts` 并验证：总行数 = 2542；`star` 分布 `{1:32, 2:32, 3:99, 4:420, 5:1959}`；`publish_date` 可范围查询；`category1 IS NOT NULL` 行数 ≥ 2533
- [X] T009 [P] 创建 `lib/types.ts`，定义并导出：`Comment`（含所有表字段）、`CommentsQuery`（page/pageSize/search/star/travel[]/room[]/cats[]/sort）、`CommentsResult`（data/total/page/pageSize）、`SortKey`（6 个枚举值）、`FilterOptions`（travelTypes/roomTypes/categories）
- [X] T010 [P] 创建 `lib/db.ts`：使用 `createClient` 从 `@insforge/sdk` 创建单例客户端，读取 `process.env.INSFORGE_URL` 和 `process.env.INSFORGE_KEY`，使用 `!` 非空断言并在缺失时抛出描述性错误
- [X] T011 [P] 创建 `lib/categories.ts`：导出 `CATEGORY_GROUPS`（分类体系分组常量）和 `ALL_CATEGORIES`（全部 14 个小类名称数组）：设施类（房间设施/公共设施/餐饮设施）、服务类（前台服务/客房服务/退房入住效率）、位置类（交通便利性/周边配套/景观朝向）、价格类（性价比/价格合理性）、体验类（整体满意度/安静程度/卫生状况）
- [X] T012 [P] 在仓库根目录创建 `.env.local`，填入 Insforge 项目的 `INSFORGE_URL` 和 `INSFORGE_KEY`（不提交到 git）

**Checkpoint**: 可在 Insforge 控制台查询 `SELECT COUNT(*) FROM comments` 返回 2542；`lib/types.ts` TypeScript 编译通过

---

## Phase 3: User Story 1 — 评论浏览与分页 (P1) 🎯 MVP

**目标**: 用户打开网页即可看到分页评论卡片列表，可翻页，每页 12 条

**独立测试**: 访问 `localhost:3000`，无任何操作可看到 12 张评论卡片，点击"下一页"加载第 2 页

### 实现

- [X] T013 [P] [US1] 在 `lib/comments.ts` 实现 `getStats(): Promise<{ total: number; avgScore: number; withImages: number }>`：查询 `COUNT(*)`、`AVG(score)`、`COUNT(*) WHERE jsonb_array_length(images) > 0`
- [X] T014 [P] [US1] 在 `lib/comments.ts` 实现 `getComments(query: CommentsQuery): Promise<CommentsResult>`：支持 `page`/`pageSize` 分页（LIMIT/OFFSET）、`sort` 排序（6 种映射见 plan.md）；筛选条件留空占位（Phase 4/5 扩展）
- [X] T015 [US1] 创建 `app/api/comments/route.ts`：解析 `URLSearchParams`（page/pageSize/sort），校验合法性（page 须正整数，sort 须枚举值），调用 `getComments()`，返回 `CommentsResult` JSON；错误时返回 `{ error: string }` + HTTP 500
- [X] T016 [US1] 创建 `app/layout.tsx`：全局布局，顶部 Header（深蓝渐变背景，酒店 Logo，金色标题"花园酒店"/"住客评论中心"），`{children}` 插槽，全局 `font-family` 和背景色（`#f7f5f0`）
- [X] T017 [US1] 创建 `components/StatsHeader.tsx`（Server Component）：接收 `stats` prop，展示"条评论"/"平均评分"/"含图评论"三枚统计胶囊，使用金色数值 + 深蓝标签
- [X] T018 [US1] 创建 `components/ReviewCard.tsx`（Server Component）：接收 `comment: Comment` 和可选 `keyword?: string` prop；渲染：评分色阶徽章（5分绿/4分浅绿/3分橙/2分深橙/1分红）+ 星级字符串；出行类型蓝色徽章 + 房型紫色徽章；评论正文（超 200 字默认折叠至 4 行，"展开全文"按钮为 Client Component `<ExpandButton>`）；分类标签（金色背景）；`useful_count` 和 `quality_score`；图片区域占位（Phase 4 填充）
- [X] T019 [US1] 创建 `components/ExpandButton.tsx`（Client Component，`'use client'`）：接收 `text: string`，管理展开/折叠 `useState`，渲染折叠文本 + 展开按钮
- [X] T020 [US1] 创建 `components/Pagination.tsx`（Client Component）：接收 `total/page/pageSize` props，渲染带省略号的页码列表；翻页时调用 `router.push` 更新 URL `?page=N`；首页/末页按钮禁用逻辑
- [X] T021 [US1] 创建 `app/page.tsx`（Server Component）：读取 `searchParams.page`/`searchParams.sort`，并行调用 `getStats()` 和 `getComments()`，渲染两列布局（左侧筛选面板占位，右侧卡片网格 + 分页）

**Checkpoint**: `localhost:3000` 显示 12 张评论卡片，分页翻页正常，URL 更新为 `?page=2`

---

## Phase 4: User Story 2 — 多维度筛选 (P1)

**目标**: 侧边栏筛选面板支持按评分/出行类型/房型/分类标签组合筛选，结果实时更新

**独立测试**: 选择"家庭亲子"+"套房"，卡片仅显示同时满足两个条件的评论，结果数 > 0

### 实现

- [X] T022 [P] [US2] 在 `lib/comments.ts` 实现 `getFilterOptions(): Promise<FilterOptions>`：查询 `DISTINCT travel_type`、`DISTINCT fuzzy_room_type`，从 `lib/categories.ts` 导出 `ALL_CATEGORIES`
- [X] T023 [US2] 扩展 `lib/comments.ts` → `getComments()`：添加筛选逻辑——`star` → `WHERE star = ?`；`travel[]` → `WHERE travel_type = ANY(?)`；`room[]` → `WHERE fuzzy_room_type = ANY(?)`；`cats[]` → `WHERE (category1 = ANY(?) OR category2 = ANY(?) OR category3 = ANY(?))`；**必须使用参数化查询，严禁字符串拼接**
- [X] T024 [US2] 扩展 `app/api/comments/route.ts`：解析 `star`（整数 1–5）、`travel`（逗号分隔字符串 → 数组）、`room`（同上）、`cats`（同上）参数，传入 `getComments()`
- [X] T025 [US2] 创建 `components/FilterSidebar.tsx`（Client Component）：星级单选按钮（全部/5/4/3/2分以下）；出行类型多选标签；房型多选标签；分类标签（按 `CATEGORY_GROUPS` 分组显示）；"清除所有筛选"按钮；所有变更调用 `router.push` 更新 URL searchParams（`star`/`travel`/`room`/`cats`）
- [X] T026 [US2] 更新 `app/page.tsx`：并行调用 `getFilterOptions()`，将 `filterOptions` 传入 `FilterSidebar`；从 `searchParams` 读取 `star`/`travel`/`room`/`cats` 并传入 `getComments()` 查询

**Checkpoint**: 选择筛选条件后 URL 更新，刷新页面筛选状态保持；结果为空时显示空状态提示

---

## Phase 5: User Story 3 — 关键词搜索 (P1)

**目标**: 顶部搜索框实时过滤评论正文，匹配词高亮显示，250ms 防抖

**独立测试**: 搜索"早餐"，仅含"早餐"的评论显示，评论文本中"早餐"以黄色高亮

### 实现

- [X] T027 [US3] 扩展 `lib/comments.ts` → `getComments()`：添加 `search` 筛选 → `WHERE comment ILIKE $n`（参数值包含 `%` 前后缀，严禁字符串拼接）
- [X] T028 [US3] 扩展 `app/api/comments/route.ts`：解析 `search` 参数（`URLSearchParams.get('search')`，空字符串视为无搜索）
- [X] T029 [US3] 创建 `components/SearchBar.tsx`（Client Component）：受控输入框，250ms `useEffect` 防抖，变更后调用 `router.push` 更新 URL `?search=keyword`；`⌘K` / `Ctrl+K` 快捷键聚焦
- [X] T030 [US3] 更新 `app/layout.tsx`：将 `SearchBar` 嵌入顶部 Header，居中拉伸布局（Tailwind flex）
- [X] T031 [US3] 更新 `components/ReviewCard.tsx`：接收 `keyword` prop，添加 `highlightText(text: string, keyword: string): ReactNode` 工具函数——先 `escape` HTML 特殊字符，再用 `RegExp` 查找匹配（转义用户输入正则特殊字符），包裹 `<mark>` 标签；正则特殊字符须转义：`keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`
- [X] T032 [US3] 更新 `app/page.tsx`：从 `searchParams.search` 读取关键词，传入 `getComments()` 和每张 `ReviewCard` 的 `keyword` prop

**Checkpoint**: 搜索"早餐"，结果卡片文本中"早餐"二字被 `<mark>` 黄色高亮；搜索 `.` 等特殊字符不报错

---

## Phase 6: User Story 4 — 图片查看 (P2)

**目标**: 评论卡片内图片缩略图可点击，进入全屏灯箱查看大图，支持切图和键盘控制

**独立测试**: 点击含图评论缩略图，灯箱打开；按方向键切换图片；按 ESC 关闭；图片加载失败显示占位符

### 实现

- [X] T033 [P] [US4] 更新 `components/ReviewCard.tsx`：添加图片缩略图区域（最多展示 4 张，超出显示 `+N` 暗色按钮）；缩略图使用 `<img>` 标签，`onError` 替换为灰色占位符 div（图标 + "图片加载失败"，保持 68×68px 尺寸）；卡片接收 `onImageClick: (images: string[], idx: number) => void` 回调 prop
- [X] T034 [US4] 创建 `components/ImageLightbox.tsx`（Client Component）：接收 `images: string[]`/`startIndex: number`/`onClose: () => void` props；使用 `createPortal` 挂载至 `document.body`；大图 URL 替换（`_R_150_150_R5_Q70_D` → `_R_800_525_R5_Q80_D`）；`useEffect` 绑定键盘事件（`ArrowLeft`/`ArrowRight`/`Escape`）；点击背景遮罩调用 `onClose`；前后翻页按钮禁用逻辑（首张/末张）；图片加载失败显示占位符
- [X] T035 [US4] 更新 `app/page.tsx`：添加灯箱状态（`lightboxImages: string[] | null`、`lightboxIndex: number`），通过 props 传递 `onImageClick` 至 `ReviewCard`；条件渲染 `<ImageLightbox>`；打开灯箱时 `document.body.style.overflow = 'hidden'`，关闭时还原

**Checkpoint**: 点击含图卡片的缩略图，灯箱展示大图；ESC/背景点击关闭；键盘左右切图；加载失败显示占位

---

## Phase 7: Polish（polish 与横切关注点）

**目的**: 加载状态、空状态、移动响应式、类型检查、静态验证

- [X] T036 [P] 创建 `components/ReviewCardSkeleton.tsx`：骨架屏组件（灰色脉冲动画），用于 `<Suspense fallback={...}>` 或路由切换加载态
- [X] T037 [P] 创建 `components/EmptyState.tsx`：接收 `message` prop，居中展示图标 + 提示文字 + "清除筛选"链接；在 `app/page.tsx` 中当 `total === 0` 时渲染
- [X] T038 [P] 补全移动端响应式样式：筛选侧边栏在 `<960px` 时改为顶部折叠抽屉（`md:hidden` 切换），卡片网格在 `<560px` 时为单列（`grid-cols-1`）
- [X] T039 执行 `npx tsc --noEmit` 验证 TypeScript 零错误；修复所有类型报错（不得使用 `any` 或 `@ts-ignore` 绕过）
- [ ] T040 在浏览器中人工验证 4 条 E2E 核心路径：①页面加载显示评论卡片；②搜索"早餐"高亮显示；③选择"家庭亲子"筛选 URL 更新；④点击图片灯箱打开 ESC 关闭
- [X] T041 将原静态原型归档：`git mv public/index.html public/legacy/index.html`，在 `public/legacy/` 添加 `README.md` 注明为历史版本

---

## 依赖关系与执行顺序

### 阶段依赖

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational)  ← T006-T008 串行；T009-T012 可与 T007-T008 并行
    ↓
Phase 3 (US1) → Phase 4 (US2) → Phase 5 (US3) → Phase 6 (US4)
                                                        ↓
                                                 Phase 7 (Polish)
```

- **Phase 1**: 无依赖，立即开始
- **Phase 2**: 依赖 Phase 1 完成
- **Phase 3–6**: 依赖 Phase 2 全部完成；用户故事按优先级串行（US1→US2→US3→US4），因 API 路由逐步扩展
- **Phase 7**: 依赖全部用户故事完成

### 阶段内并行机会

| 阶段 | 可并行任务 |
|---|---|
| Phase 1 | T002、T003、T004、T005 同时执行 |
| Phase 2 | T009、T010、T011、T012 可与 T007 并行 |
| Phase 3 | T013 与 T014 可并行（不同函数） |
| Phase 6 | T033 与 T034 可并行（不同文件） |
| Phase 7 | T036、T037、T038 全部并行 |

### 各用户故事内部顺序

```
US1: T013/T014(并行) → T015 → T016 → T017/T018/T019(并行) → T020 → T021
US2: T022 → T023 → T024 → T025 → T026
US3: T027 → T028 → T029/T030(并行) → T031 → T032
US4: T033/T034(并行) → T035
```

---

## 并行示例：Phase 2

```bash
# 串行：必须先建表
T006: 创建 comments 表
T007: 编写导入脚本 scripts/import-comments.ts
T008: 执行导入并验证

# 与 T007 并行启动（不同文件）：
T009: 创建 lib/types.ts
T010: 创建 lib/db.ts
T011: 创建 lib/categories.ts
T012: 配置 .env.local
```

---

## 实施策略

### MVP 优先（仅 US1）

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational（⚠️ 必须全部完成）
3. 完成 Phase 3: US1（评论浏览与分页）
4. **停止并验证**：`localhost:3000` 显示分页评论列表
5. 可选：Demo 或部署

### 增量交付

1. Phase 1 + 2 → 基础就绪
2. + Phase 3 (US1) → **MVP 可演示**
3. + Phase 4 (US2) → 筛选上线
4. + Phase 5 (US3) → 搜索上线
5. + Phase 6 (US4) → 图片查看上线
6. + Phase 7 → 收尾上线

---

## 任务汇总

| 阶段 | 任务数 | 用户故事 |
|---|---|---|
| Phase 1: Setup | 5 (T001–T005) | — |
| Phase 2: Foundational | 7 (T006–T012) | — |
| Phase 3: US1 评论浏览 | 9 (T013–T021) | US1 (P1) |
| Phase 4: US2 多维筛选 | 5 (T022–T026) | US2 (P1) |
| Phase 5: US3 关键词搜索 | 6 (T027–T032) | US3 (P1) |
| Phase 6: US4 图片查看 | 3 (T033–T035) | US4 (P2) |
| Phase 7: Polish | 6 (T036–T041) | — |
| **合计** | **41** | **4 个用户故事** |

---

## 说明

- `[P]` 任务 = 不同文件、无未完成依赖，可安全并行
- `[USn]` 标签追溯任务归属用户故事
- 每个用户故事可独立完成和测试
- **严禁**拼接 SQL 字符串；所有数据库查询必须参数化
- TypeScript 严格模式，禁止 `any` 类型
- 每完成一个 Phase Checkpoint 后建议提交一次 git
