/**
 * 一時的な診断用エンドポイント。
 * 本番環境での障害調査が終わったら削除する。
 * 秘密情報は返さない(値ではなく「設定されているか」と長さのみ)。
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const steps: Record<string, unknown> = {};

  steps.env = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
    anonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length ?? 0,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
    sentryDsnSet: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
    nodeVersion: process.version,
  };

  try {
    const { cookies } = await import("next/headers");
    const store = await cookies();
    steps.cookies = { ok: true, count: store.getAll().length };
  } catch (error) {
    steps.cookies = { ok: false, error: String(error) };
  }

  try {
    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("prefectures").select("id").limit(1);
    steps.supabaseSelect = { ok: !error, rows: data?.length ?? 0, error: error?.message ?? null };
  } catch (error) {
    steps.supabaseSelect = { ok: false, error: String(error) };
  }

  try {
    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("search_dojos", { p_limit: 1, p_offset: 0 });
    steps.searchRpc = { ok: !error, rows: data?.length ?? 0, error: error?.message ?? null };
  } catch (error) {
    steps.searchRpc = { ok: false, error: String(error) };
  }

  return NextResponse.json(steps);
}
