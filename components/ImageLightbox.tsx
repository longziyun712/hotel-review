"use client";
// T034: 全屏图片灯箱 (Client Component)
import { useEffect } from "react";
import { createPortal } from "react-dom";

interface Props {
  images: string[];
  startIndex: number;
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

function getLargeUrl(url: string): string {
  return url.replace(/_R_\d+_\d+_R5_Q\d+_D/, "_R_800_525_R5_Q80_D");
}

export function ImageLightbox({
  images,
  currentIndex,
  onClose,
  onPrev,
  onNext,
}: Props) {
  // 键盘控制
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape")     onClose();
      if (e.key === "ArrowLeft")  onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose, onPrev, onNext]);

  const url = getLargeUrl(images[currentIndex]);

  return createPortal(
    <div
      className="fixed inset-0 bg-black/88 z-[999] flex flex-col items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute top-5 right-6 w-10 h-10 rounded-full border-2 border-white/40 bg-white/10 text-white text-xl flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
      >
        ✕
      </button>

      {/* 大图 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={`图片 ${currentIndex + 1}`}
        className="max-w-[min(90vw,900px)] max-h-[80vh] rounded-lg object-contain"
        onError={(e) => {
          const t = e.currentTarget as HTMLImageElement;
          t.style.display = "none";
          const parent = t.parentElement!;
          const div = document.createElement("div");
          div.className =
            "flex flex-col items-center justify-center gap-2 text-white/60 p-8";
          div.innerHTML = '<span style="font-size:48px">🖼</span><p>图片加载失败</p>';
          parent.insertBefore(div, t.nextSibling);
        }}
      />

      {/* 控制栏 */}
      <div className="flex items-center gap-6 mt-4">
        <LbBtn onClick={onPrev} disabled={currentIndex === 0}>‹</LbBtn>
        <span className="text-white/70 text-sm">
          {currentIndex + 1} / {images.length}
        </span>
        <LbBtn onClick={onNext} disabled={currentIndex === images.length - 1}>›</LbBtn>
      </div>
    </div>,
    document.body
  );
}

function LbBtn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-11 h-11 rounded-full border-2 border-white/30 bg-white/10 text-white text-xl flex items-center justify-center transition-colors
        ${disabled ? "opacity-30 cursor-default" : "hover:bg-white/25 cursor-pointer"}`}
    >
      {children}
    </button>
  );
}
