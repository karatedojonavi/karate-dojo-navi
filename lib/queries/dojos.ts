import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PAGE_SIZE, type DojoSearchQuery, type DojoSearchResult } from "@/lib/search";

// =========================================================================
// マスタ
// =========================================================================

export type Prefecture = {
  id: number;
  name: string;
  slug: string;
};

export type Municipality = {
  id: number;
  prefecture_id: number;
  name: string;
  slug: string;
};

export type Style = {
  id: number;
  name: string;
};

export async function getPrefectures(): Promise<Prefecture[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("prefectures")
    .select("id, name, slug")
    .order("sort_order");

  if (error) throw new Error(`都道府県の取得に失敗しました: ${error.message}`);
  return data ?? [];
}

export async function getPrefectureBySlug(slug: string): Promise<Prefecture | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("prefectures")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`都道府県の取得に失敗しました: ${error.message}`);
  return data;
}

export async function getMunicipalities(prefectureId: number): Promise<Municipality[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("municipalities")
    .select("id, prefecture_id, name, slug")
    .eq("prefecture_id", prefectureId)
    .order("sort_order");

  if (error) throw new Error(`市区町村の取得に失敗しました: ${error.message}`);
  return data ?? [];
}

export async function getMunicipalityBySlug(
  prefectureId: number,
  slug: string,
): Promise<Municipality | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("municipalities")
    .select("id, prefecture_id, name, slug")
    .eq("prefecture_id", prefectureId)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`市区町村の取得に失敗しました: ${error.message}`);
  return data;
}

/** 検索フォームの流派セレクト用。統合済み(merged_into_id あり)の流派は除外する */
export async function getStyles(): Promise<Style[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("styles")
    .select("id, name")
    .is("merged_into_id", null)
    .order("sort_order")
    .order("id");

  if (error) throw new Error(`流派の取得に失敗しました: ${error.message}`);
  return data ?? [];
}

// =========================================================================
// 掲載件数(地域ページ・トップページの「地域から探す」で使用)
// =========================================================================

/** 都道府県ごとの掲載件数。掲載0件の県は含まれない */
export async function getDojoCountByPrefecture(): Promise<Map<number, number>> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("dojos")
    .select("prefecture_id")
    .eq("is_published", true);

  if (error) throw new Error(`掲載件数の取得に失敗しました: ${error.message}`);

  const counts = new Map<number, number>();
  for (const row of data ?? []) {
    counts.set(row.prefecture_id, (counts.get(row.prefecture_id) ?? 0) + 1);
  }
  return counts;
}

/**
 * 指定した都道府県の、掲載が1件以上ある市区町村と件数。
 * 掲載0件の市区町村ページは生成しない方針のため、リンク生成にはこの結果だけを使う
 * (docs/SEO_CONTENT_PLAN.md 3)。
 */
export async function getMunicipalitiesWithDojos(
  prefectureId: number,
): Promise<Array<Municipality & { dojoCount: number }>> {
  const supabase = await createSupabaseServerClient();

  const [{ data: dojoRows, error: dojoError }, municipalities] = await Promise.all([
    supabase
      .from("dojos")
      .select("municipality_id")
      .eq("is_published", true)
      .eq("prefecture_id", prefectureId),
    getMunicipalities(prefectureId),
  ]);

  if (dojoError) throw new Error(`掲載件数の取得に失敗しました: ${dojoError.message}`);

  const counts = new Map<number, number>();
  for (const row of dojoRows ?? []) {
    counts.set(row.municipality_id, (counts.get(row.municipality_id) ?? 0) + 1);
  }

  return municipalities
    .filter((m) => counts.has(m.id))
    .map((m) => ({ ...m, dojoCount: counts.get(m.id)! }));
}

// =========================================================================
// 検索
// =========================================================================

export type DojoSearchResponse = {
  dojos: DojoSearchResult[];
  totalCount: number;
  page: number;
  pageCount: number;
};

export async function searchDojos(query: DojoSearchQuery): Promise<DojoSearchResponse> {
  const supabase = await createSupabaseServerClient();
  const page = Math.max(query.page ?? 1, 1);

  const { data, error } = await supabase.rpc("search_dojos", {
    p_prefecture_id: query.prefectureId ?? null,
    p_municipality_id: query.municipalityId ?? null,
    p_days: query.days?.length ? query.days : null,
    p_fee_min: query.feeMin ?? null,
    p_fee_max: query.feeMax ?? null,
    p_style_ids: query.styleIds?.length ? query.styleIds : null,
    p_keyword: query.keyword?.trim() || null,
    p_beginner_welcome: query.beginnerWelcome ?? false,
    p_para_support: query.paraSupport ?? false,
    p_limit: PAGE_SIZE,
    p_offset: (page - 1) * PAGE_SIZE,
  });

  if (error) throw new Error(`道場の検索に失敗しました: ${error.message}`);

  const dojos = (data ?? []) as DojoSearchResult[];
  const totalCount = dojos.length > 0 ? Number(dojos[0].total_count) : 0;

  return {
    dojos,
    totalCount,
    page,
    pageCount: Math.max(Math.ceil(totalCount / PAGE_SIZE), 1),
  };
}

// =========================================================================
// 道場詳細
// =========================================================================

export type PracticeSchedule = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  class_note: string | null;
};

export type PracticeLocation = {
  id: string;
  name: string;
  postal_code: string | null;
  address: string | null;
  building: string | null;
  lat: number | null;
  lng: number | null;
  gmap_url: string | null;
  parking_note: string | null;
  sort_order: number;
  practice_schedules: PracticeSchedule[];
};

export type DojoDetail = {
  id: string;
  name: string;
  name_kana: string | null;
  description: string | null;
  operator_name: string | null;
  representative_name: string | null;
  prefecture_id: number;
  municipality_id: number;
  phone: string | null;
  phone_accepts: boolean;
  phone_days: string | null;
  phone_hours: string | null;
  phone_contact_name: string | null;
  phone_note: string | null;
  email: string | null;
  website_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  x_url: string | null;
  line_url: string | null;
  other_url: string | null;
  recruit_note: string | null;
  policy_note: string | null;
  beginner_note: string | null;
  beginner_welcome: boolean;
  tournament_note: string | null;
  achievements_note: string | null;
  para_support: boolean;
  para_note: string | null;
  target_note: string | null;
  features_note: string | null;
  jkf_dan: string | null;
  local_dan: string | null;
  dan_note: string | null;
  instructor_note: string | null;
  fee_min: number | null;
  fee_max: number | null;
  fee_note: string | null;
  accepts_form: boolean;
  accepts_phone: boolean;
  accepts_email: boolean;
  accepts_line: boolean;
  accepts_website: boolean;
  accepts_external_form: boolean;
  external_form_url: string | null;
  accepting_paused: boolean;
  last_content_update: string;
  prefectures: { id: number; name: string; slug: string };
  municipalities: { id: number; name: string; slug: string };
  practice_locations: PracticeLocation[];
  dojo_styles: Array<{ free_text: string | null; styles: { id: number; name: string } }>;
  dojo_organizations: Array<{
    free_text: string | null;
    organizations: { id: number; name: string };
  }>;
  dojo_photos: Array<{ thumb_path: string; storage_path: string; alt_text: string | null }>;
};

const DOJO_DETAIL_SELECT = `
  id, name, name_kana, description, operator_name, representative_name,
  prefecture_id, municipality_id,
  phone, phone_accepts, phone_days, phone_hours, phone_contact_name, phone_note,
  email, website_url, instagram_url, facebook_url, x_url, line_url, other_url,
  recruit_note, policy_note, beginner_note, beginner_welcome,
  tournament_note, achievements_note, para_support, para_note,
  target_note, features_note,
  jkf_dan, local_dan, dan_note, instructor_note,
  fee_min, fee_max, fee_note,
  accepts_form, accepts_phone, accepts_email, accepts_line,
  accepts_website, accepts_external_form, external_form_url, accepting_paused,
  last_content_update,
  prefectures ( id, name, slug ),
  municipalities ( id, name, slug ),
  practice_locations (
    id, name, postal_code, address, building, lat, lng, gmap_url, parking_note, sort_order,
    practice_schedules ( id, day_of_week, start_time, end_time, class_note )
  ),
  dojo_styles ( free_text, styles ( id, name ) ),
  dojo_organizations ( free_text, organizations ( id, name ) ),
  dojo_photos ( thumb_path, storage_path, alt_text )
`;

/** 公開中の道場のみ取得できる(非公開の道場は RLS により null が返る) */
export async function getDojoById(id: string): Promise<DojoDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("dojos")
    .select(DOJO_DETAIL_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`道場の取得に失敗しました: ${error.message}`);
  if (!data) return null;

  const dojo = data as unknown as DojoDetail;

  // 稽古場所と稽古枠を表示順に整える
  dojo.practice_locations = [...(dojo.practice_locations ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "ja"),
  );
  for (const location of dojo.practice_locations) {
    location.practice_schedules = [...(location.practice_schedules ?? [])].sort(
      (a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time),
    );
  }

  return dojo;
}
