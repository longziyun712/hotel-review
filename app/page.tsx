// T021: 首页 Server Component
import { Suspense } from "react";
import { getComments, getStatsSimple, getFilterOptions } from "@/lib/comments";
import { StatsHeader } from "@/components/StatsHeader";
import { ReviewCard } from "@/components/ReviewCard";
import { Pagination } from "@/components/Pagination";
import { FilterSidebar } from "@/components/FilterSidebar";
import { SearchBar } from "@/components/SearchBar";
import { SortSelect } from "@/components/SortSelect";
import { EmptyState } from "@/components/EmptyState";
import type { SortKey } from "@/lib/types";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getSP(
  sp: Record<string, string | string[] | undefined>,
  key: string,
  fallback = ""
): string {
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v ?? fallback;
}

export default async function Home({ searchParams }: PageProps) {
  const sp = await searchParams;

  const page    = Math.max(1, parseInt(getSP(sp, "page", "1")) || 1);
  const search  = getSP(sp, "search") || undefined;
  const sort    = (getSP(sp, "sort", "date_desc")) as SortKey;
  const starRaw = getSP(sp, "star");
  const star    = starRaw === "low" ? 2
    : starRaw ? (parseInt(starRaw) || undefined) : undefined;
  const travel  = getSP(sp, "travel") ? getSP(sp, "travel").split(",").filter(Boolean) : [];
  const room    = getSP(sp, "room")   ? getSP(sp, "room").split(",").filter(Boolean)   : [];
  const cats    = getSP(sp, "cats")   ? getSP(sp, "cats").split(",").filter(Boolean)   : [];

  const [stats, result, filterOptions] = await Promise.all([
    getStatsSimple(),
    getComments({ page, search, star, travel, room, cats, sort }),
    getFilterOptions(),
  ]);

  return (
    <>
      {/* ─── Header ─── */}
      <header className="bg-gradient-to-br from-[#1a2744] to-[#2d3f6b] text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center gap-6">
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-9 h-9 bg-[#c9973a] rounded-lg flex items-center justify-center text-lg">
              🏨
            </div>
            <div>
              <div className="text-[17px] font-bold tracking-wide">花园酒店</div>
              <div className="text-[11px] text-white/60">住客评论中心</div>
            </div>
          </div>

          <div className="flex-1 max-w-[480px]">
            <Suspense>
              <SearchBar />
            </Suspense>
          </div>

          <div className="ml-auto hidden md:flex">
            <StatsHeader stats={stats} />
          </div>
        </div>
      </header>

      {/* ─── 主体 ─── */}
      <div className="max-w-[1400px] mx-auto px-6 py-6 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 items-start">

        {/* 筛选侧边栏 */}
        <Suspense>
          <FilterSidebar filterOptions={filterOptions} />
        </Suspense>

        {/* 内容区 */}
        <main>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <p className="text-sm text-[#6b7280]">
              共找到{" "}
              <strong className="text-base text-[#2c2c2c]">{result.total}</strong>{" "}
              条评论
            </p>
            <Suspense>
              <SortSelect current={sort} />
            </Suspense>
          </div>

          {result.data.length === 0 ? (
            <EmptyState keyword={search} />
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {result.data.map((comment) => (
                <ReviewCard key={comment._id} comment={comment} keyword={search} />
              ))}
            </div>
          )}

          <Suspense>
            <Pagination total={result.total} page={result.page} pageSize={result.pageSize} />
          </Suspense>
        </main>
      </div>
    </>
  );
}
