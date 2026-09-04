import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DojoCard } from "@/components/dojo/dojo-card";
import {
  getMunicipalitiesWithDojos,
  getMunicipalityBySlug,
  getPrefectureBySlug,
  searchDojos,
} from "@/lib/queries/dojos";
import { siteConfig } from "@/lib/config/site";

export async function generateMetadata(props: PageProps<"/area/[pref]/[city]">): Promise<Metadata> {
  const { pref, city } = await props.params;
  const prefecture = await getPrefectureBySlug(pref);
  if (!prefecture) return { title: "地域が見つかりません" };

  const municipality = await getMunicipalityBySlug(prefecture.id, city);
  if (!municipality) return { title: "地域が見つかりません" };

  return {
    title: `${municipality.name}の空手道場・空手教室`,
    description: `${municipality.name}(${prefecture.name})の全空連系道場一覧。稽古曜日・月会費・流派から探せます。`,
    alternates: { canonical: `${siteConfig.url}/area/${prefecture.slug}/${municipality.slug}` },
  };
}

export default async function MunicipalityPage(props: PageProps<"/area/[pref]/[city]">) {
  const { pref, city } = await props.params;

  const prefecture = await getPrefectureBySlug(pref);
  if (!prefecture) notFound();

  const municipality = await getMunicipalityBySlug(prefecture.id, city);
  if (!municipality) notFound();

  const [result, siblings] = await Promise.all([
    searchDojos({ prefectureId: prefecture.id, municipalityId: municipality.id }),
    getMunicipalitiesWithDojos(prefecture.id),
  ]);

  // 掲載0件の市区町村ページは生成しない(docs/SEO_CONTENT_PLAN.md 3)。
  // 内容のないページを検索エンジンに出さないため、404 として扱う。
  if (result.totalCount === 0) notFound();

  const others = siblings.filter((m) => m.id !== municipality.id);

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
          <li>
            <Link href={`/area/${prefecture.slug}`} className="hover:underline">
              {prefecture.name}
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li aria-current="page">{municipality.name}</li>
        </ol>
      </nav>

      <h1 className="text-brand-800 mt-3 text-2xl font-bold">
        {municipality.name}({prefecture.name})の空手道場・空手教室
      </h1>
      <p className="text-ink-muted mt-3 text-sm">
        {municipality.name}にある全日本空手道連盟系の空手道場・教室を{result.totalCount}
        件掲載しています。稽古曜日、月会費、流派から探せます。
      </p>

      <div className="mt-5">
        <Link
          href={`/search?pref=${prefecture.id}&city=${municipality.id}`}
          className="bg-brand-600 hover:bg-brand-700 inline-block rounded-md px-4 py-2.5 text-sm font-bold text-white"
        >
          条件を決めて絞り込む
        </Link>
      </div>

      <ul className="mt-6 space-y-3">
        {result.dojos.map((dojo) => (
          <DojoCard key={dojo.id} dojo={dojo} />
        ))}
      </ul>

      {others.length > 0 && (
        <section className="border-brand-100 mt-10 border-t pt-6">
          <h2 className="text-brand-800 text-base font-bold">{prefecture.name}のほかの市区町村</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {others.map((other) => (
              <li key={other.id}>
                <Link
                  href={`/area/${prefecture.slug}/${other.slug}`}
                  className="border-brand-200 text-brand-700 hover:bg-brand-50 inline-flex items-baseline gap-1.5 rounded-md border px-3 py-2 text-sm"
                >
                  {other.name}
                  <span className="text-brand-600 text-xs">{other.dojoCount}件</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
