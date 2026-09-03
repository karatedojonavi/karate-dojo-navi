/**
 * サービス名・ドメイン・キャッチコピーの一元管理。
 * CLAUDE.md の方針により、サービス名・ロゴ・ドメイン・メインカラーは後から差し替え可能とする。
 * メインカラーは app/globals.css の @theme(--color-brand-*)で定義している。
 */
export const siteConfig = {
  /** サービス名(仮称)。変更する場合はここだけを書き換える */
  name: "空手道場ナビ",
  /** 短い説明(メタディスクリプション等の共通ベース) */
  description:
    "全日本空手道連盟系の空手道場を地域・曜日・月会費・流派から検索。体験・見学の申込みもかんたん。",
  /** 本番URL。未設定時はローカル開発を想定 */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",

  /**
   * トップページのキャッチコピー。
   * PRODUCT_REQUIREMENTS.md 3-1 の案Aを採用。A/Bテスト時はここを差し替える。
   */
  catchCopy: "礼にはじまり、自信にかわる。",
  catchCopySub: "近くの空手道場が見つかる",
  leadCopy:
    "全日本空手道連盟系の道場・空手教室を、地域・曜日・月会費・流派からかんたん検索。体験・見学の申込みまでこのサイトで。",

  /** 全ページ共通で表示する非公式注記(SECURITY_AND_PRIVACY.md 3) */
  disclaimer: "本サイトは全日本空手道連盟の公式サイトではありません。",
} as const;

export type SiteConfig = typeof siteConfig;
