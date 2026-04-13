// T017: 顶部统计胶囊 (Server Component)
import type { Stats } from "@/lib/types";

interface Props {
  stats: Stats;
}

export function StatsHeader({ stats }: Props) {
  return (
    <div className="flex gap-4 flex-shrink-0">
      <StatPill value={stats.total.toLocaleString()} label="条评论" />
      <StatPill value={stats.avgScore.toFixed(1)} label="平均评分" />
      <StatPill value={stats.withImages.toLocaleString()} label="含图评论" />
    </div>
  );
}

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center px-4 py-1 bg-white/10 rounded-full">
      <div className="text-lg font-bold text-[#c9973a]">{value}</div>
      <div className="text-[11px] text-white/60">{label}</div>
    </div>
  );
}
