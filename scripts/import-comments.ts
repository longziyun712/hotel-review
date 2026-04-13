/**
 * T007: CSV 数据导入脚本（使用 Insforge SDK）
 * 将 public/enriched_comments.csv 导入 Insforge comments 表
 * 用法: npx tsx scripts/import-comments.ts
 */

import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { createClient } from "@insforge/sdk";

// ─── 读取项目配置 ────────────────────────────────────────────────────────────
const projectConfig = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), ".insforge/project.json"), "utf-8")
);

const db = createClient({
  baseUrl: projectConfig.oss_host,
  anonKey: projectConfig.api_key,
});

// ─── 类型定义 ────────────────────────────────────────────────────────────────
interface CsvRow {
  _id: string;
  comment: string;
  images: string;
  score: string;
  publish_date: string;
  room_type: string;
  fuzzy_room_type: string;
  travel_type: string;
  comment_len: string;
  log_comment_len: string;
  useful_count: string;
  log_useful_count: string;
  review_count: string;
  log_review_count: string;
  quality_score: string;
  categories: string;
}

interface CommentRecord {
  _id: string;
  comment: string;
  images: string[];
  score: number;
  publish_date: string;
  room_type: string;
  fuzzy_room_type: string;
  travel_type: string;
  comment_len: number;
  log_comment_len: number;
  useful_count: number;
  log_useful_count: number;
  review_count: number;
  log_review_count: number;
  quality_score: number;
  categories: string[];
  category1: string | null;
  category2: string | null;
  category3: string | null;
  star: number;
}

// ─── 转换单行 ────────────────────────────────────────────────────────────────
function parseCategories(raw: string): string[] {
  if (!raw || raw.trim() === "[]") return [];
  try {
    return JSON.parse(raw.replace(/'/g, '"'));
  } catch {
    return [];
  }
}

function parseImages(raw: string): string[] {
  if (!raw || raw.trim() === "[]") return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function transformRow(row: CsvRow): CommentRecord {
  const cats = parseCategories(row.categories);
  const score = parseFloat(row.score) || 0;
  const star = Math.min(5, Math.max(1, Math.floor(score)));

  return {
    _id: row._id,
    comment: row.comment || "",
    images: parseImages(row.images),
    score,
    publish_date: row.publish_date,
    room_type: row.room_type || "",
    fuzzy_room_type: row.fuzzy_room_type || "",
    travel_type: row.travel_type || "",
    comment_len: parseInt(row.comment_len) || 0,
    log_comment_len: parseFloat(row.log_comment_len) || 0,
    useful_count: parseInt(row.useful_count) || 0,
    log_useful_count: parseFloat(row.log_useful_count) || 0,
    review_count: parseInt(row.review_count) || 0,
    log_review_count: parseFloat(row.log_review_count) || 0,
    quality_score: parseFloat(row.quality_score) || 0,
    categories: cats,
    category1: cats[0] ?? null,
    category2: cats[1] ?? null,
    category3: cats[2] ?? null,
    star,
  };
}

// ─── 批量插入 ────────────────────────────────────────────────────────────────
async function insertBatch(batch: CommentRecord[]): Promise<void> {
  const { error } = await db.database.from("comments").insert(batch);
  if (error) throw new Error(JSON.stringify(error));
}

// ─── 主流程 ──────────────────────────────────────────────────────────────────
async function main() {
  const csvPath = path.join(process.cwd(), "public/enriched_comments.csv");
  console.log(`📂 读取 CSV: ${csvPath}`);

  const content = fs.readFileSync(csvPath, "utf-8");
  const rows: CsvRow[] = parse(content, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    trim: true,
  });

  console.log(`📊 共 ${rows.length} 行，开始转换…`);
  const records = rows.map(transformRow);

  // 验证
  const starDist: Record<number, number> = {};
  records.forEach((r) => { starDist[r.star] = (starDist[r.star] || 0) + 1; });
  console.log("⭐ star 分布:", starDist);
  console.log(`🏷  category1 非空: ${records.filter((r) => r.category1 !== null).length}`);

  // 分批插入（每批 100 条）
  const BATCH_SIZE = 100;
  let inserted = 0;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    await insertBatch(batch);
    inserted += batch.length;
    process.stdout.write(`\r⬆  已导入 ${inserted}/${records.length}`);
  }

  console.log("\n✅ 导入完成！");

  // 验证行数
  const { data } = await db.database
    .from("comments")
    .select("_id", { count: "exact" });
  console.log(`🔍 数据库实际行数: ${(data as unknown as { count: number })?.count ?? "查询完成"}`);
}

main().catch((err) => {
  console.error("❌ 导入失败:", err.message);
  process.exit(1);
});
