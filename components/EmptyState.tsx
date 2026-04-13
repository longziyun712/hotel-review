// T037: 空结果状态组件
export function EmptyState({ keyword }: { keyword?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <div className="text-5xl">🔍</div>
      <div className="text-[#1a2744] font-semibold text-lg">
        {keyword ? `未找到包含"${keyword}"的评论` : "暂无符合条件的评论"}
      </div>
      <p className="text-sm text-[#6b7280] max-w-xs">
        请尝试调整筛选条件或更换关键词
      </p>
    </div>
  );
}
