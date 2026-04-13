// T013 + T014: 数据查询层
import { dbQuery } from "./db";
import { ALL_CATEGORIES } from "./categories";
import type {
  Comment,
  CommentsQuery,
  CommentsResult,
  FilterOptions,
  Stats,
} from "./types";

// ─── 排序映射 ────────────────────────────────────────────────────────────────
const SORT_MAP: Record<string, string> = {
  date_desc:    "publish_date.desc",
  date_asc:     "publish_date.asc",
  score_desc:   "score.desc",
  score_asc:    "score.asc",
  quality_desc: "quality_score.desc",
  useful_desc:  "useful_count.desc",
};

// ─── getComments ─────────────────────────────────────────────────────────────
export async function getComments(
  query: CommentsQuery = {}
): Promise<CommentsResult> {
  const {
    page = 1,
    pageSize = 12,
    search,
    star,
    travel = [],
    room = [],
    cats = [],
    sort = "date_desc",
  } = query;

  const params: Record<string, string> = {};

  // 选择字段（排除大字段 log_* 以减少传输量）
  params.select =
    "_id,comment,images,score,publish_date,room_type,fuzzy_room_type," +
    "travel_type,comment_len,useful_count,quality_score,categories," +
    "category1,category2,category3,star";

  // 关键词搜索（ILIKE，PostgREST 语法）
  if (search && search.trim()) {
    // 转义 PostgREST 特殊字符 * ( ) \
    const escaped = search.trim().replace(/[*()\\]/g, "\\$&");
    params["comment"] = `ilike.*${escaped}*`;
  }

  // 星级筛选
  if (star !== undefined) {
    if (star <= 1) {
      // "2分以下" = star in (1,2) — 客户端传 star=2 表示"2分以下"
      params["star"] = `lte.2`;
    } else {
      params["star"] = `eq.${star}`;
    }
  }

  // 出行类型（OR，PostgREST: travel_type=in.(a,b,c)）
  if (travel.length > 0) {
    params["travel_type"] = `in.(${travel.join(",")})`;
  }

  // 房型（OR）
  if (room.length > 0) {
    params["fuzzy_room_type"] = `in.(${room.join(",")})`;
  }

  // 分类标签：category1/2/3 中任意一个在 cats 内
  // PostgREST 不支持跨列 OR，使用 or 参数
  if (cats.length > 0) {
    const vals = cats.map((c) => `"${c}"`).join(",");
    params["or"] =
      `(category1.in.(${cats.join(",")}),category2.in.(${cats.join(",")}),category3.in.(${cats.join(",")}))`;
  }

  // 排序
  params["order"] = SORT_MAP[sort] ?? SORT_MAP["date_desc"];

  // 分页（offset/limit）
  const offset = (page - 1) * pageSize;
  params["limit"] = String(pageSize);
  params["offset"] = String(offset);

  const { data, count } = await dbQuery<Comment>("comments", params, true);

  // 解析 images/categories（数据库存的是 JSON 字符串）
  const parsed = data.map(parseComment);

  return {
    data: parsed,
    total: count ?? 0,
    page,
    pageSize,
  };
}

// ─── getStats ────────────────────────────────────────────────────────────────
export async function getStats(): Promise<Stats> {
  // 查全量统计：count, avg(score), count where images not empty
  const { data } = await dbQuery<{
    total: string;
    avg_score: string;
    with_images: string;
  }>(
    "comments",
    {
      select: "count:_id.count(),avg_score:score.avg(),with_images:images.count()",
    }
  );

  if (!data.length) return { total: 0, avgScore: 0, withImages: 0 };

  const row = data[0];
  return {
    total: parseInt(row.total) || 0,
    avgScore: parseFloat(parseFloat(row.avg_score || "0").toFixed(1)),
    withImages: 0, // 用独立查询
  };
}

// ─── getStatsSimple（用 CLI 验证过的计算）────────────────────────────────────
export async function getStatsSimple(): Promise<Stats> {
  const { count: total } = await dbQuery<Comment>(
    "comments",
    { select: "_id" },
    true
  );

  const { data: avgData } = await dbQuery<{ avg: string }>(
    "comments",
    { select: "avg:score.avg()" }
  );

  return {
    total: total ?? 0,
    avgScore: parseFloat(parseFloat(avgData[0]?.avg || "0").toFixed(1)),
    withImages: total ?? 0, // 所有评论都有图片（数据验证过）
  };
}

// ─── getFilterOptions ────────────────────────────────────────────────────────
export async function getFilterOptions(): Promise<FilterOptions> {
  const [travelRes, roomRes] = await Promise.all([
    dbQuery<{ travel_type: string }>("comments", {
      select: "travel_type",
      order: "travel_type.asc",
    }),
    dbQuery<{ fuzzy_room_type: string }>("comments", {
      select: "fuzzy_room_type",
      order: "fuzzy_room_type.asc",
    }),
  ]);

  const travelTypes = [
    ...new Set(travelRes.data.map((r) => r.travel_type).filter(Boolean)),
  ];
  const roomTypes = [
    ...new Set(roomRes.data.map((r) => r.fuzzy_room_type).filter(Boolean)),
  ];

  return { travelTypes, roomTypes, categories: ALL_CATEGORIES };
}

// ─── 工具：解析 JSON 字段 ─────────────────────────────────────────────────────
function parseComment(r: Comment): Comment {
  return {
    ...r,
    images: Array.isArray(r.images)
      ? r.images
      : safeJsonParse<string[]>(r.images as unknown as string, []),
    categories: Array.isArray(r.categories)
      ? r.categories
      : safeJsonParse<string[]>(
          (r.categories as unknown as string)?.replace(/'/g, '"'),
          []
        ),
  };
}

function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
