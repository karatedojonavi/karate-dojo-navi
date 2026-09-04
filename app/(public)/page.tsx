import Link from "next/link";
import { AreaSelect } from "@/components/search/area-select";
import { getDojoCountByPrefecture, getPrefectures } from "@/lib/queries/dojos";
import { siteConfig } from "@/lib/config/site";
import { HOME_FAQS } from "@/lib/content/faq";

export default async function HomePage() {
  const [prefectures, dojoCounts] = await Promise.all([
    getPrefectures(),
    getDojoCountByPrefecture(),
  ]);

  // 掲載がある都道府県を上に、強調して並べる(docs/PRODUCT_REQUIREMENTS.md 3-1)
  const withDojos = prefectures.filter((p) => (dojoCounts.get(p.id) ?? 0) > 0);
  const withoutDojos = prefectures.filter((p) => (dojoCounts.get(p.id) ?? 0) === 0);

  return (
    <>
      {/* 1. ファーストビュー ------------------------------------------------ */}
      <section className="bg-brand-50">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
          <h1 className="text-brand-800 text-2xl font-bold tracking-tight sm:text-3xl">
            {siteConfig.catchCopy}
            <span className="text-brand-600 mt-1 block text-lg font-semibold sm:text-xl">
              — {siteConfig.catchCopySub}
            </span>
          </h1>
          <p className="text-ink-muted mt-4 max-w-2xl">{siteConfig.leadCopy}</p>

          <form
            action="/search"
            method="get"
            className="border-brand-100 bg-surface mt-6 rounded-lg border p-4 shadow-sm"
          >
            <AreaSelect prefectures={prefectures} />
            <button
              type="submit"
              className="bg-brand-600 hover:bg-brand-700 mt-4 w-full rounded-md px-4 py-3 text-base font-bold text-white"
            >
              道場を探す
            </button>
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4">
        {/* 2. こだわり検索への導線 ----------------------------------------- */}
        <section className="py-10">
          <h2 className="text-brand-800 text-xl font-bold">条件を決めて探す</h2>
          <p className="text-ink-muted mt-2 text-sm">通える曜日や月会費、流派から絞り込めます。</p>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { href: "/search?days=6,0", label: "土日に稽古", note: "平日が難しい方に" },
              { href: "/search?fee=0-3000", label: "月3,000円まで", note: "月会費から探す" },
              { href: "/search?beginner=1", label: "初心者歓迎", note: "はじめての方に" },
              { href: "/search", label: "流派から探す", note: "松濤館流・剛柔流ほか" },
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="border-brand-200 hover:bg-brand-50 block h-full rounded-lg border p-3"
                >
                  <span className="text-brand-700 block text-sm font-bold">{item.label}</span>
                  <span className="text-ink-muted mt-1 block text-xs">{item.note}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* 3. 空手を習う魅力 ------------------------------------------------ */}
        <section className="border-brand-100 border-t py-10">
          <h2 className="text-brand-800 text-xl font-bold">空手で育つ、心とからだ。</h2>
          <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              {
                title: "礼儀と挨拶が身につく",
                body: "稽古は礼に始まり礼に終わります。挨拶、相手を尊重する姿勢、年長者を敬う心を、日々の稽古の中で自然に学びます。",
              },
              {
                title: "心身の健やかな成長",
                body: "形(かた)と組手(くみて)の両方に取り組み、柔軟性・体幹・集中力・忍耐力をバランスよく育てます。",
              },
              {
                title: "仲間と居場所ができる",
                body: "先輩が後輩を支える文化の中で、学校とは別の仲間と安心できる居場所が得られます。",
              },
              {
                title: "男女問わず、幼児から大人まで",
                body: "多くの道場が幼児から成人まで受け入れており、大人になってから始める人・再開する人も少なくありません。",
              },
              {
                title: "続けやすい習い事",
                body: "屋内での稽古が中心で天候に左右されにくく、道具の消耗も比較的少なめ。保護者当番や遠征が少ない道場もあります。",
              },
              {
                title: "目標を持って続けられる",
                body: "全空連公認段位の取得を目標にできます。長く努力を続けた実績のひとつとして、履歴書などに記載する人もいます。",
              },
            ].map((item) => (
              <li
                key={item.title}
                className="border-brand-100 bg-surface-subtle rounded-lg border p-4"
              >
                <h3 className="text-brand-700 text-sm font-bold">{item.title}</h3>
                <p className="text-ink-muted mt-1.5 text-sm">{item.body}</p>
              </li>
            ))}
          </ul>
          <p className="text-ink-muted mt-4 text-xs">
            費用・安全対策・保護者の関わり方は道場ごとに異なります。見学・体験の際に各道場へご確認ください。
          </p>
        </section>

        {/* 4. 初めての方へ -------------------------------------------------- */}
        <section className="border-brand-100 border-t py-10">
          <h2 className="text-brand-800 text-xl font-bold">初めての方へ</h2>

          <h3 className="text-brand-700 mt-5 text-base font-bold">
            伝統空手とフルコンタクト空手のちがい
          </h3>
          <p className="text-ink-muted mt-2 text-sm leading-relaxed">
            空手にはいくつかの系統があります。当サイトが扱うのは、全日本空手道連盟(全空連)系の道場です。
            全空連系の空手は「伝統空手」と呼ばれることが多く、形(かた)の演武と、寸止めを基本とした組手競技を行います。
            オリンピック競技として採用された空手もこの系統です。一方、直接打撃を行う「フルコンタクト空手」(極真空手など)は
            別の系統であり、当サイトの掲載対象外です。どちらも素晴らしい空手ですが、当サイトでは運営者自身が歩んできた
            全空連系の道場をご紹介しています。
          </p>

          <h3 className="text-brand-700 mt-6 text-base font-bold">道場を探す流れ</h3>
          <ol className="text-ink-muted mt-2 space-y-2 text-sm">
            {[
              "地域や曜日、月会費などの条件で道場を探す",
              "気になる道場の詳細ページで、稽古場所・時間・費用を確認する",
              "見学または体験を申し込む(サイト内のフォーム・電話・メールなど)",
              "実際に道場へ行き、雰囲気や指導者との相性を確かめる",
            ].map((step, i) => (
              <li key={step} className="flex gap-3">
                <span className="bg-brand-100 text-brand-700 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <Link
            href="/guide"
            className="text-brand-600 mt-4 inline-block text-sm font-semibold hover:underline"
          >
            道場えらびのポイントを詳しく見る →
          </Link>
        </section>

        {/* 5. 地域から探す -------------------------------------------------- */}
        <section className="border-brand-100 border-t py-10">
          <h2 className="text-brand-800 text-xl font-bold">地域から探す</h2>

          {withDojos.length > 0 && (
            <>
              <h3 className="text-ink mt-4 text-sm font-bold">掲載のある都道府県</h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {withDojos.map((pref) => (
                  <li key={pref.id}>
                    <Link
                      href={`/area/${pref.slug}`}
                      className="border-brand-300 bg-brand-50 text-brand-700 hover:bg-brand-100 inline-flex items-baseline gap-1.5 rounded-md border px-3 py-2 text-sm font-semibold"
                    >
                      {pref.name}
                      <span className="text-brand-600 text-xs font-normal">
                        {dojoCounts.get(pref.id)}件
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          <h3 className="text-ink mt-6 text-sm font-bold">そのほかの都道府県</h3>
          <p className="text-ink-muted mt-1 text-xs">
            現在は掲載準備中です。道場運営者の方は無料で掲載できます。
          </p>
          <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-2">
            {withoutDojos.map((pref) => (
              <li key={pref.id}>
                <Link
                  href={`/area/${pref.slug}`}
                  className="text-ink-muted hover:text-brand-700 text-sm"
                >
                  {pref.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* 6. 道場運営者の方へ ---------------------------------------------- */}
        <section className="border-brand-100 border-t py-10">
          <div className="border-accent-200 bg-accent-50 rounded-lg border p-5">
            <h2 className="text-accent-700 text-lg font-bold">道場運営者の方へ</h2>
            <p className="text-ink-muted mt-2 text-sm">
              全日本空手道連盟系の道場・教室であれば、どなたでも無料で掲載できます。
              稽古場所や曜日、月会費を登録すると、地域で道場を探している方に見つけてもらいやすくなります。
              掲載料・成約手数料はいただきません。
            </p>
            <Link
              href="/for-dojos"
              className="bg-accent-600 hover:bg-accent-700 mt-4 inline-block rounded-md px-4 py-2.5 text-sm font-bold text-white"
            >
              無料掲載について見る
            </Link>
          </div>
        </section>

        {/* 7. 運営理念 ------------------------------------------------------ */}
        <section className="border-brand-100 border-t py-10">
          <h2 className="text-brand-800 text-xl font-bold">運営理念</h2>
          <p className="text-ink-muted mt-3 text-sm leading-relaxed">
            全空連系の道場の情報は、県連・市連・会派・各道場のホームページ・SNS・地図サービス・公共施設の案内などに
            散らばっています。歴史があり熱心な指導者がいる道場でも、情報発信が得意でないために見つけてもらえないことがあります。
            情報発信の力と指導の質は別のものです。この差をできるだけ小さくして、地域や転居先で自分や子どもに合った道場を
            見つけやすくすることが、このサイトの目的です。
          </p>
          <Link
            href="/about"
            className="text-brand-600 mt-3 inline-block text-sm font-semibold hover:underline"
          >
            このサイトについて詳しく見る →
          </Link>
        </section>

        {/* 8. よくある質問 -------------------------------------------------- */}
        <section className="border-brand-100 border-t py-10">
          <h2 className="text-brand-800 text-xl font-bold">よくある質問</h2>
          <dl className="mt-4 space-y-4">
            {HOME_FAQS.map((faq) => (
              <div key={faq.question} className="border-brand-100 rounded-lg border p-4">
                <dt className="text-brand-700 text-sm font-bold">Q. {faq.question}</dt>
                <dd className="text-ink-muted mt-1.5 text-sm">{faq.answer}</dd>
              </div>
            ))}
          </dl>
          <Link
            href="/faq"
            className="text-brand-600 mt-4 inline-block text-sm font-semibold hover:underline"
          >
            よくある質問をもっと見る →
          </Link>
        </section>
      </div>
    </>
  );
}
