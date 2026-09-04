import type { Metadata } from "next";
import Link from "next/link";
import { SearchForm } from "@/components/search/search-form";
import { DojoCard } from "@/components/dojo/dojo-card";
import { getMunicipalities, getPrefectures, getStyles, searchDojos } from "@/lib/queries/dojos";
import { buildSearchQueryString, hasAnyFilter, parseSearchParams } from "@/lib/search-params";
import { PAGE_SIZE } from "@/lib/search";

export const metadata: Metadata = {
  title: "道場を探す",
  description:
    "全日本空手道連盟系の空手道場・教室を、地域・稽古曜日・月会費・流派・キーワードから検索できます。",
  // クエリの組合せが無限に増えるため検索結果ページはインデックスさせない
  // (docs/SEO_CONTENT_PLAN.md 2)。リンクはたどらせる。
  robots: { index: false, follow: true },
};

export default async function SearchPage(props: PageProps<"/search">) {
  const searchParams = await props.searchParams;
  const query = parseSearchParams(searchParams);

  const [prefectures, styles, result, municipalities] = await Promise.all([
    getPrefectures(),
    getStyles(),
    searchDojos(query),
    query.prefectureId ? getMunicipalities(query.prefectureId) : Promise.resolve([]),
  ]);

  const selectedPrefecture = prefectures.find((p) => p.id === query.prefectureId);
  const firstIndex = (result.page - 1) * PAGE_SIZE + 1;
  const lastIndex = Math.min(result.page * PAGE_SIZE, result.totalCount);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-brand-800 text-xl font-bold sm:text-2xl">道場を探す</h1>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <div className="lg:sticky lg:top-4 lg:self-start">
          <SearchForm
            prefectures={prefectures}
            styles={styles}
            municipalities={municipalities}
            query={query}
          />
        </div>

        <div>
          <p className="text-ink-muted text-sm" aria-live="polite">
            {result.totalCount > 0
              ? `${result.totalCount}件中 ${firstIndex}〜${lastIndex}件を表示`
              : "該当する道場は見つかりませんでした"}
          </p>

          {result.dojos.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {result.dojos.map((dojo) => (
                <DojoCard key={dojo.id} dojo={dojo} />
              ))}
            </ul>
          ) : (
            <div className="border-brand-100 bg-surface-subtle mt-4 rounded-lg border p-5">
              <h2 className="text-brand-800 text-base font-bold">条件を変えて探してみてください</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {/* 条件を緩めた提案(docs/PRODUCT_REQUIREMENTS.md 3-2) */}
                {selectedPrefecture && hasAnyFilter(query) && (
                  <li>
                    <Link
                      href={`/search?pref=${selectedPrefecture.id}`}
                      className="text-brand-600 font-semibold hover:underline"
                    >
                      {selectedPrefecture.name}全体で探す →
                    </Link>
                  </li>
                )}
                <li>
                  <Link href="/search" className="text-brand-600 font-semibold hover:underline">
                    すべての条件をはずして探す →
                  </Link>
                </li>
                <li>
                  <Link href="/for-dojos" className="text-brand-600 font-semibold hover:underline">
                    お近くの道場の方へ、無料掲載をご案内する →
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {result.pageCount > 1 && (
            <nav className="mt-6 flex items-center justify-between" aria-label="ページ送り">
              {result.page > 1 ? (
                <Link
                  href={`/search?${buildSearchQueryString(query, { page: result.page - 1 })}`}
                  className="border-brand-200 text-brand-700 hover:bg-brand-50 rounded-md border px-4 py-2 text-sm"
                >
                  ← 前のページ
                </Link>
              ) : (
                <span />
              )}
              <span className="text-ink-muted text-sm">
                {result.page} / {result.pageCount}
              </span>
              {result.page < result.pageCount ? (
                <Link
                  href={`/search?${buildSearchQueryString(query, { page: result.page + 1 })}`}
                  className="border-brand-200 text-brand-700 hover:bg-brand-50 rounded-md border px-4 py-2 text-sm"
                >
                  次のページ →
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}

          <p className="text-ink-muted mt-8 text-xs">
            表示順は、検索した地域との一致と、掲載情報の充実度・更新の新しさをもとにしています。
            指導内容や段位、大会実績によって順位をつけることはしていません。
          </p>
        </div>
      </div>
    </div>
  );
}
