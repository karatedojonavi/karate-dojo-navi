import { siteConfig } from "@/lib/config/site";

/**
 * トップページの雛形(フェーズ0)。
 * 検索フォーム・各セクションの本実装はフェーズ1で
 * docs/PRODUCT_REQUIREMENTS.md 3-1 の構成・原稿に従って作成する。
 */
export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <section>
        <h1 className="text-brand-800 text-2xl font-bold tracking-tight sm:text-3xl">
          {siteConfig.catchCopy}
          <span className="text-brand-600 mt-1 block text-lg font-semibold sm:text-xl">
            — {siteConfig.catchCopySub}
          </span>
        </h1>
        <p className="text-ink-muted mt-4 max-w-2xl">{siteConfig.leadCopy}</p>
      </section>

      <section className="border-brand-100 bg-surface-subtle mt-10 rounded-lg border p-5">
        <h2 className="text-brand-800 text-base font-bold">開発中のお知らせ</h2>
        <p className="text-ink-muted mt-2 text-sm">
          現在はフェーズ0(基盤準備)の段階です。地域検索・道場詳細・体験申込みなどの各機能は、
          フェーズ1以降で順に公開していきます。
        </p>
      </section>
    </div>
  );
}
