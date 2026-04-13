// T015 + T024 + T028: GET /api/comments
import { NextRequest, NextResponse } from "next/server";
import { getComments } from "@/lib/comments";
import type { SortKey } from "@/lib/types";

const VALID_SORTS: SortKey[] = [
  "date_desc", "date_asc", "score_desc", "score_asc",
  "quality_desc", "useful_desc",
];

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;

    const page     = Math.max(1, parseInt(sp.get("page") || "1") || 1);
    const pageSize = Math.max(1, Math.min(50, parseInt(sp.get("pageSize") || "12") || 12));
    const search   = sp.get("search") || undefined;
    const sortRaw  = sp.get("sort") || "date_desc";
    const sort     = (VALID_SORTS.includes(sortRaw as SortKey)
      ? sortRaw : "date_desc") as SortKey;

    // 星级（1–5）；传 "low" = 2分以下
    const starRaw = sp.get("star");
    let star: number | undefined;
    if (starRaw === "low") star = 2; // 用 lte.2 处理
    else if (starRaw) {
      const n = parseInt(starRaw);
      if (n >= 1 && n <= 5) star = n;
    }

    const travel = sp.get("travel")?.split(",").filter(Boolean) ?? [];
    const room   = sp.get("room")?.split(",").filter(Boolean) ?? [];
    const cats   = sp.get("cats")?.split(",").filter(Boolean) ?? [];

    const result = await getComments({ page, pageSize, search, star, travel, room, cats, sort });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
