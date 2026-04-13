// T018 + T033: 评论卡片 (Server Component)
import type { Comment } from "@/lib/types";
import { ExpandButton } from "./ExpandButton";
import { ReviewCardImages } from "./ReviewCardImages";

interface Props {
  comment: Comment;
  keyword?: string;
  onImageClick?: string; // 序列化的事件标识（客户端灯箱用）
}

function scoreClass(s: number): string {
  if (s >= 5) return "bg-[#2e7d32]";
  if (s >= 4) return "bg-[#558b2f]";
  if (s >= 3) return "bg-[#f57f17]";
  if (s >= 2) return "bg-[#e65100]";
  return "bg-[#b71c1c]";
}

function starStr(s: number): string {
  const full = Math.min(5, Math.round(s));
  return "★".repeat(full) + "☆".repeat(Math.max(0, 5 - full));
}

export function ReviewCard({ comment: c, keyword }: Props) {
  const imgs = Array.isArray(c.images) ? c.images : [];
  const cats = Array.isArray(c.categories) ? c.categories : [];

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      {/* 顶部：元信息 + 评分 */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[#6b7280]">📅 {c.publish_date}</span>
          <div className="flex gap-1.5 flex-wrap mt-0.5">
            {c.travel_type && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#e8f4fd] text-[#1976d2]">
                {c.travel_type}
              </span>
            )}
            {c.fuzzy_room_type && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#f3e5f5] text-[#7b1fa2]">
                {c.fuzzy_room_type}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white ${scoreClass(c.score)}`}
          >
            {c.score}
          </div>
          <span className="text-xs text-[#c9973a] tracking-wide">{starStr(c.score)}</span>
        </div>
      </div>

      {/* 评论文本（含高亮） */}
      <ExpandButton text={c.comment || ""} keyword={keyword} />

      {/* 分类标签 */}
      {cats.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {cats.map((cat) => (
            <span
              key={cat}
              className="px-2 py-0.5 bg-[#f5e8cc] text-[#8b6012] rounded-full text-[11px] font-medium"
            >
              {cat}
            </span>
          ))}
        </div>
      )}

      {/* 图片区域（含灯箱） */}
      {imgs.length > 0 && (
        <ReviewCardImages images={imgs} commentId={c._id} />
      )}

      {/* 底部 */}
      <div className="flex items-center justify-between pt-2.5 border-t border-[#e5e0d8] text-xs text-[#6b7280]">
        <span>👍 {c.useful_count} 人觉得有用</span>
        <span>质量分 {Number(c.quality_score).toFixed(1)}</span>
      </div>
    </div>
  );
}
