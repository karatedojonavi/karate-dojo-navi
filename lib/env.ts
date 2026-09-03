/**
 * 環境変数の読み出しヘルパー。
 * 値が無い場合は「起動時に分かりやすく落とす」ことを優先する(本番で気付かず壊れるのを防ぐ)。
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `環境変数 ${name} が設定されていません。.env.example を参考に .env.local を確認してください。`,
    );
  }
  return value;
}

/** 公開して問題ない値(ブラウザにも渡る) */
export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
};

/** Supabase 接続情報が揃っているか(未接続でもトップ画面は表示できるようにするための判定) */
export function hasSupabaseConfig(): boolean {
  return Boolean(publicEnv.supabaseUrl && publicEnv.supabaseAnonKey);
}

export function requireSupabasePublicEnv() {
  return {
    url: required("NEXT_PUBLIC_SUPABASE_URL", publicEnv.supabaseUrl),
    anonKey: required("NEXT_PUBLIC_SUPABASE_ANON_KEY", publicEnv.supabaseAnonKey),
  };
}

/** サーバー専用。クライアントから呼ばれた場合は server-only により import 時点で失敗する */
export function requireServiceRoleKey(): string {
  return required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
}
