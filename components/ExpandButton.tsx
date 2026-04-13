"use client";
// T019: 长评论展开/折叠 (Client Component)
import { useState } from "react";

interface Props {
  text: string;
  keyword?: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function highlightText(text: string, keyword: string): string {
  const escaped = escapeHtml(text);
  const safeKw = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return escaped.replace(
    new RegExp(safeKw, "gi"),
    (m) => `<mark class="bg-yellow-200 rounded-sm px-px">${m}</mark>`
  );
}

export function ExpandButton({ text, keyword }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 200;
  const html = keyword ? highlightText(text, keyword) : escapeHtml(text);

  return (
    <>
      <div
        className={`text-sm leading-7 text-[#333] whitespace-pre-wrap break-words ${
          !expanded && isLong ? "line-clamp-4" : ""
        }`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {isLong && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-xs text-[#c9973a] hover:underline mt-0.5"
        >
          {expanded ? "收起 ▴" : "展开全文 ▾"}
        </button>
      )}
    </>
  );
}
