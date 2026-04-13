"use client";
// T020: 分页控件 (Client Component) — URL searchParams 驱动
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

interface Props {
  total: number;
  page: number;
  pageSize: number;
}

export function Pagination({ total, page, pageSize }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const goTo = useCallback(
    (p: number) => {
      const next = new URLSearchParams(sp.toString());
      next.set("page", String(p));
      router.push(`${pathname}?${next.toString()}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [router, pathname, sp]
  );

  // 构建显示页码（含省略号）
  const pages: (number | "…")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  return (
    <div className="flex justify-center items-center gap-2 mt-8 flex-wrap">
      <PageBtn disabled={page === 1} onClick={() => goTo(page - 1)}>
        ‹ 上一页
      </PageBtn>

      {pages.map((p, idx) =>
        p === "…" ? (
          <span key={`dot-${idx}`} className="text-sm text-[#6b7280] px-1">
            …
          </span>
        ) : (
          <PageBtn
            key={p}
            active={p === page}
            onClick={() => goTo(p as number)}
          >
            {p}
          </PageBtn>
        )
      )}

      <PageBtn disabled={page === totalPages} onClick={() => goTo(page + 1)}>
        下一页 ›
      </PageBtn>
    </div>
  );
}

function PageBtn({
  children,
  active,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3.5 py-1.5 rounded-lg border-[1.5px] text-sm transition-all
        ${active
          ? "bg-[#c9973a] border-[#c9973a] text-white font-semibold"
          : "bg-white border-[#e5e0d8] text-[#2c2c2c] hover:border-[#c9973a] hover:text-[#c9973a]"}
        ${disabled ? "opacity-40 cursor-default pointer-events-none" : "cursor-pointer"}`}
    >
      {children}
    </button>
  );
}
