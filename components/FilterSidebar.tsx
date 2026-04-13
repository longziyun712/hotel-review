"use client";
// T025: 筛选侧边栏 — URL searchParams 驱动
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { CATEGORY_GROUPS } from "@/lib/categories";
import type { FilterOptions } from "@/lib/types";

interface Props {
  filterOptions: FilterOptions;
}

export function FilterSidebar({ filterOptions }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const currentStar   = sp.get("star") ?? "all";
  const currentTravel = sp.get("travel")?.split(",").filter(Boolean) ?? [];
  const currentRoom   = sp.get("room")?.split(",").filter(Boolean)   ?? [];
  const currentCats   = sp.get("cats")?.split(",").filter(Boolean)   ?? [];

  function pushParams(updates: Record<string, string | null>) {
    const next = new URLSearchParams(sp.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    });
    next.set("page", "1");
    router.push(`${pathname}?${next.toString()}`);
  }

  function toggleMulti(key: string, current: string[], val: string) {
    const next = current.includes(val)
      ? current.filter((v) => v !== val)
      : [...current, val];
    pushParams({ [key]: next.length ? next.join(",") : null });
  }

  function clearAll() {
    pushParams({ star: null, travel: null, room: null, cats: null, search: null, page: null });
  }

  const hasFilter =
    currentStar !== "all" ||
    currentTravel.length > 0 ||
    currentRoom.length > 0 ||
    currentCats.length > 0;

  return (
    <aside className="bg-white rounded-xl shadow-sm p-5 md:sticky md:top-[80px]">
      <div className="text-xs font-bold uppercase tracking-widest text-[#6b7280] mb-4 pb-3 border-b border-[#e5e0d8]">
        🎛 筛选条件
      </div>

      {/* 评分 */}
      <FilterSection title="综合评分">
        <div className="flex gap-1.5 flex-wrap">
          {[
            { val: "all", label: "全部" },
            { val: "5",   label: "⭐ 5分" },
            { val: "4",   label: "4分" },
            { val: "3",   label: "3分" },
            { val: "low", label: "2分以下" },
          ].map((item) => (
            <button
              key={item.val}
              onClick={() => pushParams({ star: item.val === "all" ? null : item.val })}
              className={`px-2.5 py-1 rounded-full border-[1.5px] text-xs transition-all cursor-pointer
                ${currentStar === item.val || (item.val === "all" && currentStar === "all")
                  ? "bg-[#c9973a] border-[#c9973a] text-white font-semibold"
                  : "bg-white border-[#e5e0d8] text-[#2c2c2c] hover:border-[#c9973a] hover:text-[#c9973a]"
                }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* 出行类型 */}
      <FilterSection title="出行类型">
        <TagGroup
          items={filterOptions.travelTypes}
          active={currentTravel}
          onToggle={(v) => toggleMulti("travel", currentTravel, v)}
        />
      </FilterSection>

      {/* 房型 */}
      <FilterSection title="房间类型">
        <TagGroup
          items={filterOptions.roomTypes}
          active={currentRoom}
          onToggle={(v) => toggleMulti("room", currentRoom, v)}
        />
      </FilterSection>

      {/* 评论分类（按大类分组） */}
      <FilterSection title="评论涉及">
        {Object.entries(CATEGORY_GROUPS).map(([group, cats]) => (
          <div key={group} className="mb-2">
            <div className="text-[11px] text-[#6b7280] mb-1">{group}</div>
            <TagGroup
              items={cats}
              active={currentCats}
              onToggle={(v) => toggleMulti("cats", currentCats, v)}
              navy
            />
          </div>
        ))}
      </FilterSection>

      <button
        onClick={clearAll}
        className={`w-full py-2 rounded-lg border-[1.5px] text-xs transition-all mt-1
          ${hasFilter
            ? "border-[#e57373] text-[#e57373] hover:bg-red-50 cursor-pointer"
            : "border-[#e5e0d8] text-[#6b7280] cursor-default"
          }`}
        disabled={!hasFilter}
      >
        ✕ 清除所有筛选
      </button>
    </aside>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1a2744] mb-2">
        <span className="w-1.5 h-1.5 bg-[#c9973a] rounded-full" />
        {title}
      </div>
      {children}
    </div>
  );
}

function TagGroup({
  items,
  active,
  onToggle,
  navy = false,
}: {
  items: string[];
  active: string[];
  onToggle: (v: string) => void;
  navy?: boolean;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {items.map((item) => {
        const isActive = active.includes(item);
        return (
          <button
            key={item}
            onClick={() => onToggle(item)}
            className={`px-2.5 py-1 rounded-full border-[1.5px] text-[11px] transition-all cursor-pointer
              ${isActive
                ? navy
                  ? "bg-[#1a2744] border-[#1a2744] text-white"
                  : "bg-[#1a2744] border-[#1a2744] text-white"
                : "bg-white border-[#e5e0d8] text-[#6b7280] hover:border-[#1a2744] hover:text-[#1a2744]"
              }`}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}
