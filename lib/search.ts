/** 稽古曜日(0=日曜 〜 6=土曜)。DB の practice_schedules.day_of_week と一致させる */
export const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * 月会費の絞り込み区分(docs/PRODUCT_REQUIREMENTS.md 3-2)。
 * max が null の区分は「上限なし」を意味する。
 */
export const FEE_RANGES = [
  { value: "0-3000", label: "〜3,000円", min: 0, max: 3000 },
  { value: "3000-5000", label: "3,000〜5,000円", min: 3000, max: 5000 },
  { value: "5000-8000", label: "5,000〜8,000円", min: 5000, max: 8000 },
  { value: "8000-", label: "8,000円〜", min: 8000, max: null },
] as const;

export type FeeRangeValue = (typeof FEE_RANGES)[number]["value"];

/** 1ページあたりの表示件数 */
export const PAGE_SIZE = 20;

/** 検索結果1件分(SQL 関数 public.search_dojos の返り値と対応) */
export type DojoSearchResult = {
  id: string;
  name: string;
  name_kana: string | null;
  description: string | null;
  prefecture_id: number;
  prefecture_name: string;
  prefecture_slug: string;
  municipality_id: number;
  municipality_name: string;
  municipality_slug: string;
  fee_min: number | null;
  fee_max: number | null;
  fee_note: string | null;
  beginner_welcome: boolean;
  para_support: boolean;
  accepts_form: boolean;
  accepts_phone: boolean;
  accepts_email: boolean;
  accepts_line: boolean;
  accepts_website: boolean;
  accepts_external_form: boolean;
  accepting_paused: boolean;
  thumb_path: string | null;
  photo_alt: string | null;
  style_names: string[];
  practice_days: number[];
  score: number;
  total_count: number;
};

export type DojoSearchQuery = {
  prefectureId?: number | null;
  municipalityId?: number | null;
  days?: number[];
  feeMin?: number | null;
  feeMax?: number | null;
  styleIds?: number[];
  keyword?: string | null;
  beginnerWelcome?: boolean;
  paraSupport?: boolean;
  page?: number;
};

// =========================================================================
// 並び順スコア
// =========================================================================

/**
 * 並び順スコアの加点表。
 * supabase/migrations/20260904000006_search_function.sql と同じ値にすること。
 */
export const SCORE_WEIGHTS = {
  /** 検索した市区町村と一致 */
  municipalityMatch: 100,
  /** 検索した都道府県のみ一致 */
  prefectureMatch: 50,
  /** 紹介文が登録されている */
  hasDescription: 10,
  /** 写真が登録されている */
  hasPhoto: 10,
  /** 稽古場所が1件以上登録されている */
  hasLocation: 10,
  /** 月会費が登録されている */
  hasFee: 10,
  /** 指導方針が登録されている */
  hasPolicy: 5,
  /** 90日以内に更新されている */
  updatedWithin90Days: 10,
  /** 365日以内に更新されている */
  updatedWithin365Days: 5,
} as const;

export type ScoreInput = {
  prefectureId: number;
  municipalityId: number;
  hasDescription: boolean;
  hasPhoto: boolean;
  hasLocation: boolean;
  hasFee: boolean;
  hasPolicy: boolean;
  /** 公開情報の最終更新日 */
  lastContentUpdate: Date;
  /** 将来の有料優先表示用。MVPでは常に0 */
  priorityBoost?: number;
};

/**
 * 並び順スコアを求める(docs/TECHNICAL_DESIGN.md 6)。
 *
 * 情報の充実度への加点は「情報を登録している道場を見つけやすくする」ためのもので、
 * 指導内容の優劣を表すものではない(CLAUDE.md 判断原則3)。
 *
 * この関数は SQL 側 public.dojo_content_score / public.search_dojos と
 * 同じ式を実装している。片方だけを変更しないこと。
 */
export function calculateSortScore(
  dojo: ScoreInput,
  query: { prefectureId?: number | null; municipalityId?: number | null } = {},
  now: Date = new Date(),
): number {
  let score = 0;

  // 地域の一致度
  if (query.municipalityId != null && dojo.municipalityId === query.municipalityId) {
    score += SCORE_WEIGHTS.municipalityMatch;
  } else if (query.prefectureId != null && dojo.prefectureId === query.prefectureId) {
    score += SCORE_WEIGHTS.prefectureMatch;
  }

  // 情報の充実度
  if (dojo.hasDescription) score += SCORE_WEIGHTS.hasDescription;
  if (dojo.hasPhoto) score += SCORE_WEIGHTS.hasPhoto;
  if (dojo.hasLocation) score += SCORE_WEIGHTS.hasLocation;
  if (dojo.hasFee) score += SCORE_WEIGHTS.hasFee;
  if (dojo.hasPolicy) score += SCORE_WEIGHTS.hasPolicy;

  // 更新日の新しさ
  const elapsedDays = (now.getTime() - dojo.lastContentUpdate.getTime()) / 86_400_000;
  if (elapsedDays <= 90) {
    score += SCORE_WEIGHTS.updatedWithin90Days;
  } else if (elapsedDays <= 365) {
    score += SCORE_WEIGHTS.updatedWithin365Days;
  }

  return score + (dojo.priorityBoost ?? 0);
}

// =========================================================================
// 月会費の範囲判定
// =========================================================================

export type FeeRange = { min: number | null; max: number | null };

/**
 * 利用者が指定した月会費の希望範囲と、道場が登録している月会費の範囲が重なるか。
 *
 * - 道場側が片方しか登録していない場合は、登録されている額を上下限の両方として扱う
 * - 道場側が未登録(両方 null)の場合は、費用で絞り込むと対象外になる
 * - 希望範囲の null は「制限なし」を意味する
 */
export function feeRangesOverlap(dojo: FeeRange, query: FeeRange): boolean {
  // 費用の条件が指定されていなければ、すべて対象
  if (query.min == null && query.max == null) return true;

  // 道場側に費用の登録がない場合は、費用で絞り込むと対象外
  if (dojo.min == null && dojo.max == null) return false;

  const dojoMin = dojo.min ?? dojo.max!;
  const dojoMax = dojo.max ?? dojo.min!;
  const queryMin = query.min ?? Number.NEGATIVE_INFINITY;
  const queryMax = query.max ?? Number.POSITIVE_INFINITY;

  return dojoMin <= queryMax && dojoMax >= queryMin;
}

/** 「3,000〜5,000円/月」形式の表示文字列を作る */
export function formatFeeRange(feeMin: number | null, feeMax: number | null): string {
  const yen = (value: number) => `${value.toLocaleString("ja-JP")}円`;

  if (feeMin == null && feeMax == null) return "月会費は未登録";
  if (feeMin != null && feeMax != null) {
    return feeMin === feeMax ? `${yen(feeMin)}/月` : `${yen(feeMin)}〜${yen(feeMax)}/月`;
  }
  return `${yen((feeMin ?? feeMax)!)}/月`;
}
