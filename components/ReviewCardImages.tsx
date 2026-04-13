"use client";
// T033: 图片缩略图 + 灯箱集成 (Client Component)
import { useState } from "react";
import { ImageLightbox } from "./ImageLightbox";

interface Props {
  images: string[];
  commentId: string;
}

export function ReviewCardImages({ images, commentId }: Props) {
  const [lbIndex, setLbIndex] = useState<number | null>(null);
  const show  = images.slice(0, 4);
  const extra = images.length - show.length;

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        {show.map((url, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${commentId}-${i}`}
            src={url}
            alt={`图片${i + 1}`}
            width={68}
            height={68}
            className="rounded-lg object-cover border-2 border-transparent hover:border-[#c9973a] hover:opacity-90 hover:scale-105 transition-all duration-150 cursor-pointer"
            style={{ width: 68, height: 68 }}
            onClick={() => setLbIndex(i)}
            onError={(e) => {
              const t = e.currentTarget as HTMLImageElement;
              const div = document.createElement("div");
              div.className =
                "rounded-lg bg-gray-100 border border-[#e5e0d8] flex flex-col items-center justify-center gap-0.5 text-gray-400 text-[10px] text-center";
              div.style.cssText = "width:68px;height:68px;flex-shrink:0";
              div.innerHTML = '<span style="font-size:16px">🖼</span>加载失败';
              t.replaceWith(div);
            }}
          />
        ))}
        {extra > 0 && (
          <div
            className="flex items-center justify-center rounded-lg text-white text-sm font-bold cursor-pointer bg-[#1a2744] hover:bg-[#2d3f6b] transition-colors flex-shrink-0"
            style={{ width: 68, height: 68 }}
            onClick={() => setLbIndex(show.length)}
          >
            +{extra}
          </div>
        )}
      </div>

      {lbIndex !== null && (
        <ImageLightbox
          images={images}
          startIndex={lbIndex}
          currentIndex={lbIndex}
          onClose={() => setLbIndex(null)}
          onPrev={() => setLbIndex((i) => Math.max(0, (i ?? 0) - 1))}
          onNext={() =>
            setLbIndex((i) => Math.min(images.length - 1, (i ?? 0) + 1))
          }
        />
      )}
    </>
  );
}
