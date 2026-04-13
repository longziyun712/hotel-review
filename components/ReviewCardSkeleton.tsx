// T036: 评论卡片骨架屏 (Suspense fallback)
export function ReviewCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col gap-3 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <div className="h-3 w-24 bg-gray-200 rounded" />
          <div className="h-5 w-16 bg-gray-200 rounded-full" />
        </div>
        <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0" />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="h-3 w-full bg-gray-200 rounded" />
        <div className="h-3 w-full bg-gray-200 rounded" />
        <div className="h-3 w-3/4 bg-gray-200 rounded" />
      </div>
      <div className="flex gap-1.5">
        <div className="h-5 w-14 bg-gray-200 rounded-full" />
        <div className="h-5 w-14 bg-gray-200 rounded-full" />
      </div>
      <div className="flex items-center justify-between pt-2.5 border-t border-[#e5e0d8]">
        <div className="h-3 w-24 bg-gray-200 rounded" />
        <div className="h-3 w-16 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

export function ReviewGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <ReviewCardSkeleton key={i} />
      ))}
    </div>
  );
}
