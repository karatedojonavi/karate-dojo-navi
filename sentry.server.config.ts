// サーバー(Node.js ランタイム)側の Sentry 初期化。
// SENTRY_DSN(NEXT_PUBLIC_SENTRY_DSN)が未設定の場合は何もしない。
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    // 個人情報を Sentry へ送らない(SECURITY_AND_PRIVACY.md 2)
    sendDefaultPii: false,
    debug: false,
  });
}
