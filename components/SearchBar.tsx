"use client";
// T029: 关键词搜索框 — 250ms 防抖，URL searchParams 驱动
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [value, setValue] = useState(sp.get("search") ?? "");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // 防抖更新 URL
  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const next = new URLSearchParams(sp.toString());
      if (value.trim()) {
        next.set("search", value.trim());
      } else {
        next.delete("search");
      }
      next.set("page", "1");
      router.push(`${pathname}?${next.toString()}`);
    }, 250);
    return () => clearTimeout(timer.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50 text-sm pointer-events-none">
        🔍
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="搜索评论关键词…"
        className="w-full h-9 rounded-full pl-9 pr-4 text-sm bg-white/12 text-white placeholder:text-white/50 outline-none focus:bg-white/22 transition-colors border-none"
        style={{ background: "rgba(255,255,255,0.12)" }}
      />
    </div>
  );
}
