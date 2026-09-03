import "server-only";

import { createClient } from "@supabase/supabase-js";
import { requireServiceRoleKey, requireSupabasePublicEnv } from "@/lib/env";

/**
 * RLS を迂回する管理用クライアント。
 * 使用してよいのは CSV一括登録・道場統合・匿名化cron などのサーバー処理のみ。
 * 公開ページのデータ取得には絶対に使わない(DATABASE_SCHEMA.md 5)。
 */
export function createSupabaseAdminClient() {
  const { url } = requireSupabasePublicEnv();
  return createClient(url, requireServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
