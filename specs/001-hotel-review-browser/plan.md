# 实现计划：花园酒店评论浏览网页

**分支**: `001` | **日期**: 2026-04-13 | **规格**: [spec.md](./spec.md)

---

## 概述

将现有静态 HTML 原型重构为 Next.js 全栈应用，以 Insforge 作为数据库后端。核心变化：

- **数据层**：CSV → Insforge 数据库（PostgreSQL），支持服务端分页/筛选/搜索
- **前端**：纯 HTML → Next.js 14 App Router，TypeScript，Tailwind CSS
- **API**：本地 fetch CSV → Insforge SDK 查询（服务端 RSC + API Route）

---

## 技术上下文

| 项目 | 值 |
|---|---|
| 前端框架 | Next.js 14（App Router，React Server Components） |
| 语言 | TypeScript |
| 样式 | Tailwind CSS |
| 后端/数据库 | Insforge（PostgreSQL 兼容） |
| SDK | `@insforge/sdk`（通过已配置的 MCP/Skill 调用） |
| 数据来源 | `public/enriched_comments.csv`（2542 行） |
| 测试 | Vitest（单元）、Playwright（E2E 关键流程） |
| 目标平台 | 桌面 Web（Chrome/Safari/Firefox 最新版） |
| 性能目标 | 首屏 < 2s，筛选响应 < 300ms（服务端分页后无需加载全量数据） |

---

## 原则检查（依据 CONSTITUTION.md）

- ✅ 代码质量：函数职责单一，TS 类型严格，无 `any`
- ✅ 安全性：所有数据库查询使用参数化查询，不拼接 SQL
- ✅ 测试：核心数据转换逻辑有单元测试
- ✅ 性能：服务端分页，每页 12 条；不将 2542 条全量传至客户端
- ✅ 用户体验：错误状态、空状态、加载骨架屏均须实现

---

## 项目结构

```text
specs/001-hotel-review-browser/
├── plan.md              ← 本文件
├── spec.md
└── tasks.md             ← /speckit.tasks 生成

（Next.js 应用位于仓库根目录）
├── app/                            # Next.js App Router
│   ├── page.tsx                    # 首页（评论列表）
│   ├── layout.tsx
│   └── api/
│       └── comments/
│           └── route.ts            # GET /api/comments（分页+筛选+搜索）
├── components/
│   ├── ReviewCard.tsx              # 单条评论卡片
│   ├── FilterSidebar.tsx           # 筛选面板
│   ├── SearchBar.tsx               # 搜索框
│   ├── Pagination.tsx              # 分页控件
│   ├── ImageLightbox.tsx           # 图片灯箱
│   └── StatsHeader.tsx             # 顶部统计
├── lib/
│   ├── db.ts                       # Insforge 客户端单例
│   ├── comments.ts                 # 数据查询函数
│   └── types.ts                    # 共享类型定义
├── scripts/
│   └── import-comments.ts          # 数据导入脚本（一次性）
├── public/
│   └── enriched_comments.csv       # 原始数据（import 后可保留）
├── .env.local                      # INSFORGE_URL, INSFORGE_KEY
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 数据库 Schema

### `comments` 表

| 字段名 | 类型 | 来源 | 说明 |
|---|---|---|---|
| `_id` | text (PK) | CSV | MongoDB ObjectId 格式字符串 |
| `comment` | text | CSV | 评论正文 |
| `images` | json | CSV | `string[]`，携程图片 URL 数组 |
| `score` | numeric(3,1) | CSV | 综合评分 0.5–5.0 |
| `publish_date` | date | CSV | 发布日期 `YYYY-MM-DD` |
| `room_type` | text | CSV | 详细房型名称 |
| `fuzzy_room_type` | text | CSV | 模糊房型（大床房/双床房/套房/主题房） |
| `travel_type` | text | CSV | 出行类型（7 类） |
| `comment_len` | integer | CSV | 评论字符长度 |
| `log_comment_len` | numeric(10,6) | CSV | ln(comment_len) |
| `useful_count` | integer | CSV | 有用数 |
| `log_useful_count` | numeric(10,6) | CSV | ln(useful_count+1) |
| `review_count` | integer | CSV | 用户历史评论总数 |
| `log_review_count` | numeric(10,6) | CSV | ln(review_count) |
| `quality_score` | numeric(4,1) | CSV | 质量综合评分 0–10 |
| `categories` | json | CSV | `string[]`，最多 3 个小类标签 |
| `category1` | text | **新增** | categories[0]，便于精确筛选 |
| `category2` | text | **新增** | categories[1]，可为空 |
| `category3` | text | **新增** | categories[2]，可为空 |
| `star` | integer | **新增** | `CLAMP(FLOOR(score), 1, 5)`，整星评级 |

### 分类体系（用于前端筛选分组展示）

```
设施类：房间设施、公共设施、餐饮设施
服务类：前台服务、客房服务、退房/入住效率
位置类：交通便利性、周边配套、景观/朝向
价格类：性价比、价格合理性
体验类：整体满意度、安静程度、卫生状况
```

---

## 实现阶段

### 阶段 0 — 数据库建表与数据导入

**目标**：`comments` 表建立完毕，2542 条记录全部导入，字段类型正确。

**步骤**：

0-A. 通过 Insforge CLI Skill 创建 `comments` 表，按上方 Schema 指定类型：
  - `images`、`categories` → `json` 类型
  - `publish_date` → `date` 类型
  - `star` → `integer` 类型
  - `category1/2/3` → `text` 类型

0-B. 编写 `scripts/import-comments.ts` 数据导入脚本：
  ```
  读取 CSV → 逐行转换 → 批量 upsert（_id 为主键，冲突则覆盖）
  ```
  
  **转换逻辑**：
  ```typescript
  // images 字段：JSON.parse（已是合法 JSON 数组）
  images: JSON.parse(row.images || '[]')
  
  // categories 字段：Python list → JSON
  categories: JSON.parse(row.categories.replace(/'/g, '"') || '[]')
  
  // category1/2/3：解构 categories 数组
  category1: cats[0] ?? null
  category2: cats[1] ?? null
  category3: cats[2] ?? null
  
  // star：floor(score) 夹紧至 [1,5]
  star: Math.min(5, Math.max(1, Math.floor(parseFloat(row.score))))
  
  // publish_date：保持 'YYYY-MM-DD' 字符串，数据库类型为 date
  publish_date: row.publish_date
  
  // 数值字段：parseFloat / parseInt
  score:        parseFloat(row.score)
  comment_len:  parseInt(row.comment_len)
  useful_count: parseInt(row.useful_count)
  // ...其余数值字段同理
  ```

0-C. 执行导入脚本，验证：
  - 行数 = 2542
  - `star` 分布：{1:32, 2:32, 3:99, 4:420, 5:1959}
  - `publish_date` 可按日期范围查询
  - `category1 IS NOT NULL` 的行数 ≥ 2533

---

### 阶段 1 — Next.js 项目初始化

**目标**：Next.js 应用可启动，Insforge 连接可用。

**步骤**：

1-A. `npx create-next-app@latest . --typescript --tailwind --app --no-src-dir`
  （在仓库根目录初始化，保留已有 `public/` 和 `specs/` 目录）

1-B. 安装依赖：
  ```bash
  npm install @insforge/sdk
  npm install -D tsx  # 用于执行 import 脚本
  ```

1-C. 创建 `lib/types.ts`，定义共享类型：
  ```typescript
  export interface Comment {
    _id: string
    comment: string
    images: string[]
    score: number
    publish_date: string   // 'YYYY-MM-DD'
    room_type: string
    fuzzy_room_type: string
    travel_type: string
    comment_len: number
    useful_count: number
    quality_score: number
    categories: string[]
    category1: string | null
    category2: string | null
    category3: string | null
    star: number
  }
  
  export interface CommentsQuery {
    page?: number         // 默认 1
    pageSize?: number     // 默认 12
    search?: string       // 搜索 comment 字段
    star?: number         // 1–5，null = 全部
    travel?: string[]     // 出行类型（OR 关系）
    room?: string[]       // 房型（OR 关系）
    cats?: string[]       // 分类标签（category1/2/3，OR 关系）
    sort?: SortKey
  }
  
  export type SortKey =
    | 'date_desc' | 'date_asc'
    | 'score_desc' | 'score_asc'
    | 'quality_desc' | 'useful_desc'
  
  export interface CommentsResult {
    data: Comment[]
    total: number
    page: number
    pageSize: number
  }
  ```

1-D. 创建 `lib/db.ts`（Insforge 客户端单例）：
  ```typescript
  import { createClient } from '@insforge/sdk'
  
  export const db = createClient({
    url: process.env.INSFORGE_URL!,
    key: process.env.INSFORGE_KEY!,
  })
  ```

1-E. 配置 `.env.local`（含 Insforge 连接信息，不提交到 git）

---

### 阶段 2 — 数据查询层

**目标**：`lib/comments.ts` 实现所有查询函数，通过单元测试。

**步骤**：

2-A. 实现 `getComments(query: CommentsQuery): Promise<CommentsResult>`

  **筛选映射**：
  - `search` → `comment ILIKE '%keyword%'`（参数化）
  - `star` → `star = ?`
  - `travel[]` → `travel_type IN (?,...)`
  - `room[]` → `fuzzy_room_type IN (?,...)`
  - `cats[]` → `(category1 IN (?,…) OR category2 IN (?,…) OR category3 IN (?,…))`
  
  **排序映射**：
  | SortKey | SQL ORDER BY |
  |---|---|
  | date_desc | publish_date DESC |
  | date_asc | publish_date ASC |
  | score_desc | score DESC |
  | score_asc | score ASC |
  | quality_desc | quality_score DESC |
  | useful_desc | useful_count DESC |

2-B. 实现 `getFilterOptions()` — 返回筛选面板所需枚举值：
  ```typescript
  {
    travelTypes: string[]     // DISTINCT travel_type
    roomTypes: string[]       // DISTINCT fuzzy_room_type
    categories: string[]      // 14 个固定小类（从分类体系常量导出）
  }
  ```

2-C. 实现 `getStats()` — 返回顶部统计数据：
  ```typescript
  { total: number, avgScore: number, withImages: number }
  ```

2-D. 单元测试（Vitest）覆盖：
  - `star` 映射（边界：score=0.3 → star=1，score=4.5 → star=4，score=5.0 → star=5）
  - `categories` 解析（Python list 格式转换）
  - `category1/2/3` 空值处理

---

### 阶段 3 — API 路由

**目标**：`GET /api/comments` 接受 query string 参数，返回分页 JSON。

**步骤**：

3-A. 创建 `app/api/comments/route.ts`：
  ```
  GET /api/comments?page=1&pageSize=12&search=&star=&travel=家庭亲子&room=套房&cats=前台服务&sort=date_desc
  ```
  - 解析 URLSearchParams，构建 `CommentsQuery`
  - 调用 `getComments()`，返回 `CommentsResult` JSON
  - 错误时返回 `{ error: string }` + HTTP 500

3-B. 输入校验：
  - `page` 须为正整数，否则取默认值 1
  - `star` 须为 1–5 或未传，否则忽略
  - `sort` 须为合法枚举值，否则取 `date_desc`

---

### 阶段 4 — 前端页面与组件

**目标**：复刻原静态页面所有功能，升级为 Next.js RSC 架构。

**组件职责**：

| 组件 | 类型 | 职责 |
|---|---|---|
| `app/page.tsx` | Server Component | 获取初始数据（stats + 首页评论）+ 布局 |
| `StatsHeader` | Server Component | 展示总数/均分/含图数（从服务端 props 读取） |
| `FilterSidebar` | Client Component | 本地筛选状态管理，变化时更新 URL searchParams |
| `SearchBar` | Client Component | 250ms 防抖搜索，更新 URL searchParams |
| `ReviewCard` | Server Component | 单条评论渲染（评分/内容/标签/图片缩略图）|
| `ImageLightbox` | Client Component | 全屏灯箱，键盘控制，图片失败显示占位符 |
| `Pagination` | Client Component | 翻页控件，操作更新 URL searchParams |

**状态管理策略**：
- 所有筛选/搜索/分页状态存入 URL searchParams（`useRouter` + `useSearchParams`）
- 页面刷新保持当前筛选状态（URL 驱动）
- 无需 Redux/Zustand，URL 即状态

  > **注**：此处与澄清记录 Q4 有调整——URL 持久化为 RSC 架构的自然结果且实现成本为零，比无持久化更优。若用户确认仍不需要，可在 Pagination/Filter 改为 `useState`。

**步骤**：

4-A. `app/page.tsx`：读取 searchParams，调用 `getComments()` + `getStats()`，渲染布局

4-B. `components/FilterSidebar.tsx`：
  - 从常量导出分类体系分组
  - 多选标签：点击 → `router.push` 更新 URL
  - 星级单选、出行多选、房型多选

4-C. `components/ReviewCard.tsx`：
  - 评分色阶（5分→绿，3分→橙，1分→红）
  - 长评论折叠（客户端 `useState`）
  - 图片缩略图：最多显示 4 张 + "+N" 按钮，`onerror` 降级为灰色占位符

4-D. `components/ImageLightbox.tsx`（Client Component）：
  - 全局 `Dialog`/`modal`，使用 `createPortal` 挂载至 `body`
  - 键盘：`→` 下一张，`←` 上一张，`ESC` 关闭
  - 图片 URL 替换为大图尺寸：`_R_150_150_` → `_R_800_525_`

4-E. 样式：复用原 HTML 原型的金色/深蓝色主题配色，迁移至 Tailwind 工具类

---

### 阶段 5 — 质量保障与收尾

**步骤**：

5-A. E2E 测试（Playwright）覆盖关键路径：
  1. 页面加载显示评论卡片
  2. 输入"早餐"搜索，结果卡片含高亮词
  3. 选择"家庭亲子"筛选，URL 更新，结果正确
  4. 点击图片缩略图，灯箱打开，ESC 关闭

5-B. 图片加载失败降级验证：Mock 图片请求失败，确认占位符正确渲染

5-C. 静态分析：`tsc --noEmit` 零错误；ESLint 零 warning

5-D. 性能验证：
  - 首屏 LCP < 2s（Lighthouse）
  - API 路由响应 < 300ms（本地实测）

5-E. 删除已不再需要的纯 HTML 版本（`public/index.html`），或保留作为 fallback 并在 README 注明

---

## 关键风险与缓解

| 风险 | 影响 | 缓解措施 |
|---|---|---|
| `categories` Python list 格式解析失败 | 数据导入部分行 category 为空 | 导入前先验证全量数据，不通过则 abort |
| 携程 CDN 图片跨域/403 | 灯箱大图无法加载 | `onerror` 降级占位符；缩略图大小调整为 `_R_300_300_` 代替 `_R_150_150_` |
| Insforge 全文搜索性能 | `ILIKE` 在 2542 行上足够快（< 50ms），无需额外索引 | 若未来数据量增长，可对 `comment` 加 GIN 索引 |
| Next.js App Router 与 Insforge SDK 的 SSR 兼容性 | 客户端 SDK 可能不支持 Node 环境 | 仅在 Server Components 和 API Routes 中调用 SDK，客户端组件仅调用 `/api/comments` |

---

## 实施顺序（依赖链）

```
阶段 0（建表+导入）
    ↓
阶段 1（Next.js 初始化）
    ↓
阶段 2（查询层）  ←  可与阶段 3 并行开始
    ↓                       ↓
阶段 3（API 路由）←─────────┘
    ↓
阶段 4（前端组件）
    ↓
阶段 5（测试+收尾）
```

**预计最小可演示版本**（阶段 0-3 完成后）：API 接口可响应带筛选的查询请求，即可验证数据层正确性，再继续前端开发。

---

*计划生成时间：2026-04-13*
