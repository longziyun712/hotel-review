"use client";
// 排序选择器 — URL searchParams 驱动
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function SortSelect({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  return (
    <select
      value={current}
      onChange={(e) => {
        const next = new URLSearchParams(sp.toString());
        next.set("sort", e.target.value);
        next.set("page", "1");
        router.push(`${pathname}?${next.toString()}`);
      }}
      className="px-3.5 py-1.5 rounded-lg border-[1.5px] border-[#e5e0d8] bg-white text-sm text-[#2c2c2c] outline-none focus:border-[#c9973a] cursor-pointer"
    >
      <option value="date_desc">最新发布</option>
      <option value="date_asc">最早发布</option>
      <option value="score_desc">评分最高</option>
      <option value="score_asc">评分最低</option>
      <option value="quality_desc">质量分最高</option>
      <option value="useful_desc">最多人觉得有用</option>
    </select>
  );
}
