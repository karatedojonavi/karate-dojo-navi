import Link from "next/link";

/**
 * 準備中ページの共通表示。
 * 利用規約・プライバシーポリシー・掲載基準・お問い合わせの各ページは
 * フェーズ7で作成する。それまでフッターのリンクが404にならないようにするための暫定表示。
 */
export function PreparingPage({ title, note }: { title: string; note: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-brand-800 text-2xl font-bold">{title}</h1>
      <div className="border-brand-100 bg-surface-subtle mt-6 rounded-lg border p-5">
        <p className="text-brand-700 text-sm font-semibold">このページは現在準備中です。</p>
        <p className="text-ink-muted mt-2 text-sm">{note}</p>
      </div>
      <Link
        href="/"
        className="text-brand-600 mt-6 inline-block text-sm font-semibold hover:underline"
      >
        ← トップページへ戻る
      </Link>
    </div>
  );
}
