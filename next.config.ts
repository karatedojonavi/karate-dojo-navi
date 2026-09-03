import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    // Supabase Storage の画像を next/image で配信する(フェーズ2以降で使用)
    remotePatterns: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? [
          {
            protocol: "https",
            hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

// Sentry の設定は DSN がある時だけ有効化する(未設定でもビルドが通るようにする)
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: !process.env.CI,
      // ソースマップは SENTRY_AUTH_TOKEN がある環境(CI/Vercel)でのみアップロードされる
      widenClientFileUpload: true,
      disableLogger: true,
    })
  : nextConfig;
