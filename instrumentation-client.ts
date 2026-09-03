// ブラウザ側の Sentry 初期化。
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    debug: false,
  });
}

// クライアント側のページ遷移計測(未初期化でも安全に動作する)
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
