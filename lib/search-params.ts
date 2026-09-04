import { FEE_RANGES, type DojoSearchQuery } from "@/lib/search";

/**
 * /search のクエリ文字列と検索条件の相互変換。
 * URLをそのまま共有・ブックマークできるようにするため、条件はすべてクエリ文字列で表す。
 */

export type RawSearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function toNumber(value: string | undefined): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * 「1,3,6」のような複数値を数値配列にする。
 * 空文字は Number("") が 0 になってしまうため、数値に変換する前に必ず除外する。
 */
function toNumberList(value: string | string[] | undefined): number[] {
  const raw = Array.isArray(value) ? value.join(",") : (value ?? "");
  return raw
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v !== "")
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n));
}

export function parseSearchParams(params: RawSearchParams): DojoSearchQuery & {
  feeRange: string | null;
} {
  const feeRange = firstValue(params.fee) ?? null;
  const range = FEE_RANGES.find((r) => r.value === feeRange);

  return {
    prefectureId: toNumber(firstValue(params.pref)),
    municipalityId: toNumber(firstValue(params.city)),
    days: toNumberList(params.days).filter((d) => d >= 0 && d <= 6),
    feeMin: range?.min ?? null,
    feeMax: range?.max ?? null,
    styleIds: toNumberList(params.styles),
    keyword: firstValue(params.q)?.trim() || null,
    beginnerWelcome: firstValue(params.beginner) === "1",
    paraSupport: firstValue(params.para) === "1",
    page: Math.max(toNumber(firstValue(params.page)) ?? 1, 1),
    feeRange,
  };
}

/** 検索条件からクエリ文字列を作る(ページ番号は任意で上書きできる) */
export function buildSearchQueryString(
  query: DojoSearchQuery & { feeRange?: string | null },
  overrides: { page?: number } = {},
): string {
  const params = new URLSearchParams();

  if (query.prefectureId) params.set("pref", String(query.prefectureId));
  if (query.municipalityId) params.set("city", String(query.municipalityId));
  if (query.days?.length) params.set("days", query.days.join(","));
  if (query.feeRange) params.set("fee", query.feeRange);
  if (query.styleIds?.length) params.set("styles", query.styleIds.join(","));
  if (query.keyword) params.set("q", query.keyword);
  if (query.beginnerWelcome) params.set("beginner", "1");
  if (query.paraSupport) params.set("para", "1");

  const page = overrides.page ?? query.page ?? 1;
  if (page > 1) params.set("page", String(page));

  return params.toString();
}

/** 適用中の検索条件があるか(0件時の案内の出し分けに使う) */
export function hasAnyFilter(query: DojoSearchQuery & { feeRange?: string | null }): boolean {
  return Boolean(
    query.municipalityId ||
    query.days?.length ||
    query.feeRange ||
    query.styleIds?.length ||
    query.keyword ||
    query.beginnerWelcome ||
    query.paraSupport,
  );
}
