import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "道場を探す流れ・道場えらびのポイント",
  description:
    "はじめて空手道場を探す方へ。伝統空手とフルコンタクト空手のちがい、道場を選ぶときの見どころ、体験・見学の進め方をご案内します。",
  alternates: { canonical: `${siteConfig.url}/guide` },
};

const POINTS = [
  {
    title: "通いやすさ",
    body: "続けられるかどうかは、通いやすさで大きく変わります。稽古場所までの距離、曜日と時間帯、送り迎えの必要性、駐車場の有無を確認しましょう。稽古場所が複数ある道場では、通いやすい会場を選べる場合があります。",
  },
  {
    title: "費用",
    body: "月会費のほかに、入会金、スポーツ保険、連盟の登録料、道着・防具代、審査料、大会参加費などがかかる場合があります。金額も有無も道場ごとに異なるため、見学・体験の際に総額の目安を聞いておくと安心です。",
  },
  {
    title: "対象年齢とクラス分け",
    body: "幼児から受け入れている道場、小学生以上の道場、成人クラスがある道場などさまざまです。年齢や経験でクラスが分かれているか、初心者向けの稽古があるかも確認しましょう。",
  },
  {
    title: "指導者と道場の雰囲気",
    body: "同じ流派でも、道場によって稽古の雰囲気は異なります。実際に見学して、指導者の話し方、子どもたちの様子、保護者の関わり方を見ることをおすすめします。当サイトでは道場に順位や評価をつけていません。合うかどうかはご自身の目でお確かめください。",
  },
  {
    title: "保護者の関わり方",
    body: "当番や大会の引率、行事の手伝いの有無は道場ごとに違います。ご家庭の事情に合うかどうか、事前に確認しておくとよいでしょう。",
  },
  {
    title: "大会への参加",
    body: "大会参加を目指すのか、健康づくりや礼儀を身につけることを重視するのかによって、合う道場は変わります。どちらの方針かを聞いてみましょう。所属する会派によって参加できる大会が異なる場合もあります。",
  },
];

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-brand-800 text-2xl font-bold">道場を探す流れ</h1>
      <p className="text-ink-muted mt-3 text-sm leading-relaxed">
        はじめて空手道場を探す方に向けて、探し方と見どころをまとめました。
      </p>

      <section className="mt-8">
        <h2 className="text-brand-800 text-lg font-bold">当サイトが扱う空手について</h2>
        <p className="text-ink-muted mt-3 text-sm leading-relaxed">
          空手にはいくつかの系統があります。当サイトが扱うのは、全日本空手道連盟(全空連)系の道場です。
          全空連系の空手は「伝統空手」と呼ばれることが多く、形(かた)の演武と、寸止めを基本とした組手競技を行います。
          オリンピック競技として採用された空手もこの系統です。一方、直接打撃を行う「フルコンタクト空手」(極真空手など)は
          別の系統であり、当サイトの掲載対象外です。どちらも素晴らしい空手ですが、当サイトでは運営者自身が歩んできた
          全空連系の道場をご紹介しています。
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-brand-800 text-lg font-bold">探すところから体験までの流れ</h2>
        <ol className="mt-4 space-y-4">
          {[
            {
              title: "地域から候補を探す",
              body: "お住まいの都道府県・市区町村から探します。通える曜日や月会費の希望が決まっていれば、あわせて絞り込めます。",
            },
            {
              title: "道場の詳細を確認する",
              body: "稽古場所と曜日・時間、月会費、対象年齢、指導方針を確認します。気になる道場は2〜3か所ほど候補にしておくと比べやすくなります。",
            },
            {
              title: "見学または体験を申し込む",
              body: "サイト内のフォーム、電話、メールなど、道場が受け付けている方法で連絡します。未成年の方の申し込みは、保護者の方からお願いします。",
            },
            {
              title: "実際に道場へ行く",
              body: "動きやすい服装で伺えば十分な道場がほとんどです。持ち物や服装は申し込みの際に確認しておきましょう。",
            },
            {
              title: "話を聞いて決める",
              body: "費用の総額、必要な用具、保護者の関わり方などを確認します。その場で決めず、持ち帰って検討してかまいません。",
            },
          ].map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span className="bg-brand-100 text-brand-700 flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                {i + 1}
              </span>
              <div>
                <h3 className="text-brand-700 text-sm font-bold">{step.title}</h3>
                <p className="text-ink-muted mt-1 text-sm">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-brand-800 text-lg font-bold">道場えらびで見ておきたいこと</h2>
        <ul className="mt-4 space-y-4">
          {POINTS.map((point) => (
            <li key={point.title} className="border-brand-100 rounded-lg border p-4">
              <h3 className="text-brand-700 text-sm font-bold">{point.title}</h3>
              <p className="text-ink-muted mt-1.5 text-sm leading-relaxed">{point.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-brand-100 bg-surface-subtle mt-10 rounded-lg border p-5">
        <h2 className="text-brand-800 text-base font-bold">まずは地域から探してみましょう</h2>
        <Link
          href="/search"
          className="bg-brand-600 hover:bg-brand-700 mt-3 inline-block rounded-md px-4 py-2.5 text-sm font-bold text-white"
        >
          道場を探す
        </Link>
      </section>
    </div>
  );
}
