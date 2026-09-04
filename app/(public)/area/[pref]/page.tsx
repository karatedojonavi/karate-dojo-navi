import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DojoCard } from "@/components/dojo/dojo-card";
import { getMunicipalitiesWithDojos, getPrefectureBySlug, searchDojos } from "@/lib/queries/dojos";
import { siteConfig } from "@/lib/config/site";

export async function generateMetadata(props: PageProps<"/area/[pref]">): Promise<Metadata> {
  const { pref } = await props.params;
  const prefecture = await getPrefectureBySlug(pref);
  if (!prefecture) return { title: "地域が見つかりません" };

  const { totalCount } = await searchDojos({ prefectureId: prefecture.id });

  return {
    title:
      totalCount > 0
        ? `${prefecture.name}の空手道場・空手教室${totalCount}件`
        : `${prefecture.name}の空手道場・空手教室`,
    description: `${prefecture.name}の全空連系道場一覧。市区町村・曜日・月会費・流派から探せます。`,
    alternates: { canonical: `${siteConfig.url}/area/${prefecture.slug}` },
    // 掲載0件の県ページは内容が薄いためインデックスさせない
    // (1件以上になれば自動的に index に切り替わる。docs/SEO_CONTENT_PLAN.md 3)
    robots: totalCount === 0 ? { index: false, follow: true } : undefined,
  };
}

export default async function PrefecturePage(props: PageProps<"/area/[pref]">) {
  const { pref } = await props.params;
  const prefecture = await getPrefectureBySlug(pref);
  if (!prefecture) notFound();

  const [result, municipalities] = await Promise.all([
    searchDojos({ prefectureId: prefecture.id }),
    getMunicipalitiesWithDojos(prefecture.id),
  ]);

  // 市区町村ごとにグループ化して表示する
  const grouped = municipalities.map((municipality) => ({
    municipality,
    dojos: result.dojos.filter((d) => d.municipality_id === municipality.id),
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <nav aria-label="パンくずリスト" className="text-ink-muted text-xs">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/" className="hover:underline">
              トップ
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li aria-current="page">{prefecture.name}</li>
        </ol>
      </nav>

      <h1 className="text-brand-800 mt-3 text-2xl font-bold">
        {prefecture.name}の空手道場・空手教室一覧
      </h1>

      {result.totalCount > 0 ? (
        <>
          <p className="text-ink-muted mt-3 text-sm">
            {prefecture.name}にある全日本空手道連盟系の空手道場・教室を{result.totalCount}
            件掲載しています。市区町村、稽古曜日、月会費、流派から探せます。
          </p>

          <div className="mt-5">
            <Link
              href={`/search?pref=${prefecture.id}`}
              className="bg-brand-600 hover:bg-brand-700 inline-block rounded-md px-4 py-2.5 text-sm font-bold text-white"
            >
              条件を決めて絞り込む
            </Link>
          </div>

          {/* 市区町村リンク(掲載が1件以上ある市区町村のみ) */}
          <section className="mt-8">
            <h2 className="text-brand-800 text-lg font-bold">市区町村から探す</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {municipalities.map((municipality) => (
                <li key={municipality.id}>
                  <Link
                    href={`/area/${prefecture.slug}/${municipality.slug}`}
                    className="border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 inline-flex items-baseline gap-1.5 rounded-md border px-3 py-2 text-sm font-semibold"
                  >
                    {municipality.name}
                    <span className="text-brand-600 text-xs font-normal">
                      {municipality.dojoCount}件
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* 市区町村別の道場一覧 */}
          <section className="mt-8">
            <h2 className="text-brand-800 text-lg font-bold">掲載中の道場</h2>
            {grouped.map(({ municipality, dojos }) => (
              <div key={municipality.id} className="mt-6">
                <h3 className="text-brand-700 text-base font-bold">
                  <Link
                    href={`/area/${prefecture.slug}/${municipality.slug}`}
                    className="hover:underline"
                  >
                    {municipality.name}
                  </Link>
                </h3>
                <ul className="mt-2 space-y-3">
                  {dojos.map((dojo) => (
                    <DojoCard key={dojo.id} dojo={dojo} />
                  ))}
                </ul>
              </div>
            ))}
          </section>
        </>
      ) : (
        <div className="border-brand-100 bg-surface-subtle mt-6 rounded-lg border p-5">
          <h2 className="text-brand-800 text-base font-bold">現在準備中です</h2>
          <p className="text-ink-muted mt-2 text-sm">
            {prefecture.name}の道場はまだ掲載されていません。
            道場運営者の方は、無料で掲載していただけます。
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/for-dojos"
              className="bg-accent-600 hover:bg-accent-700 rounded-md px-4 py-2.5 text-sm font-bold text-white"
            >
              無料掲載について見る
            </Link>
            <Link
              href="/search"
              className="border-brand-200 text-brand-700 hover:bg-brand-50 rounded-md border px-4 py-2.5 text-sm"
            >
              ほかの地域から探す
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
