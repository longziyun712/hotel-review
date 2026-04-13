// T009: 共享类型定义

export interface Comment {
  _id: string;
  comment: string;
  images: string[];
  score: number;
  publish_date: string; // 'YYYY-MM-DD'
  room_type: string;
  fuzzy_room_type: string;
  travel_type: string;
  comment_len: number;
  useful_count: number;
  quality_score: number;
  categories: string[];
  category1: string | null;
  category2: string | null;
  category3: string | null;
  star: number;
}

export type SortKey =
  | "date_desc"
  | "date_asc"
  | "score_desc"
  | "score_asc"
  | "quality_desc"
  | "useful_desc";

export interface CommentsQuery {
  page?: number;      // default 1
  pageSize?: number;  // default 12
  search?: string;    // ILIKE on comment field
  star?: number;      // 1–5, undefined = all
  travel?: string[];  // OR within, AND with others
  room?: string[];
  cats?: string[];    // matches category1 OR category2 OR category3
  sort?: SortKey;
}

export interface CommentsResult {
  data: Comment[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FilterOptions {
  travelTypes: string[];
  roomTypes: string[];
  categories: string[];
}

export interface Stats {
  total: number;
  avgScore: number;
  withImages: number;
}
