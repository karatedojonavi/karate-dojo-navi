import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireSupabasePublicEnv } from "@/lib/env";

/**
 * Server Component / Server Action から使う Supabase クライアント。
 * ログインセッションを cookie 経由で引き継ぐ。権限は必ず RLS 側で担保する。
 * Next.js 16 では cookies() が非同期のため、この関数も async。
 */
export async function createSupabaseServerClient() {
  const { url, anonKey } = requireSupabasePublicEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component からは cookie を書き込めない。
          // セッション更新は proxy.ts(旧 middleware)側で行うため、ここでは無視してよい。
        }
      },
    },
  });
}
