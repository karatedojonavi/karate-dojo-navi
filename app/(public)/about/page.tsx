import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "このサイトについて・運営理念",
  description:
    "空手道場ナビの運営理念と、掲載の考え方についてご説明します。本サイトは全日本空手道連盟の公式サイトではありません。",
  alternates: { canonical: `${siteConfig.url}/about` },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-brand-800 text-2xl font-bold">このサイトについて</h1>

      <section className="mt-6">
        <h2 className="text-brand-800 text-lg font-bold">解決したい課題</h2>
        <p className="text-ink-muted mt-3 text-sm leading-relaxed">
          全空連系の道場の情報は、都道府県連盟・市区町村連盟・会派・各道場のホームページ・SNS・
          地図サービス・公共施設の案内など、さまざまな場所に散らばっています。
          歴史があり、熱心な指導者がいる道場でも、情報発信が得意でないために見つけてもらえないことがあります。
        </p>
        <p className="text-ink-muted mt-3 text-sm leading-relaxed">
          情報発信の力と、指導の質は別のものです。この差をできるだけ小さくして、
          地域や転居先で自分や子どもに合った道場を見つけやすくすることが、このサイトの目的です。
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-brand-800 text-lg font-bold">大切にしていること</h2>
        <ul className="mt-4 space-y-4">
          {[
            {
              title: "道場に順位や評価をつけません",
              body: "ランキング、点数づけ、段位や大会実績による並び替えは行いません。検索結果の表示順は、検索した地域との一致と、掲載情報の充実度・更新の新しさをもとにしています。掲載料による優先表示も行いません。",
            },
            {
              title: "掲載は道場ご自身の登録によります",
              body: "運営側が道場の許可なく情報を登録することはしません。掲載内容は各道場からの申告に基づいています。対面でお手伝いする場合も、道場の同意を得たうえで代理登録します。",
            },
            {
              title: "子どもの安全を最優先します",
              body: "子ども同士、または指導者と子どもが直接やり取りできる機能は設けていません。体験・見学の申し込みは、保護者の方または成人ご本人から道場へ送る形にしています。",
            },
            {
              title: "掲載は無料です",
              body: "道場の掲載料も、体験申込みの成約手数料もいただいていません。利用者の方の利用料も無料です。",
            },
          ].map((item) => (
            <li key={item.title} className="border-brand-100 rounded-lg border p-4">
              <h3 className="text-brand-700 text-sm font-bold">{item.title}</h3>
              <p className="text-ink-muted mt-1.5 text-sm leading-relaxed">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-brand-800 text-lg font-bold">全日本空手道連盟との関係</h2>
        <p className="border-brand-200 bg-brand-50 text-ink-muted mt-3 rounded-md border p-4 text-sm leading-relaxed">
          {siteConfig.disclaimer}
          全日本空手道連盟が運営・監修しているものではなく、当サイトの掲載が公認や推薦を意味するものでもありません。
          全日本空手道連盟のロゴ・マークは使用していません。「全日本空手道連盟系の道場を掲載している」という
          事実の説明の範囲でのみ、名称を用いています。
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-brand-800 text-lg font-bold">これから取り組みたいこと</h2>
        <p className="text-ink-muted mt-3 text-sm leading-relaxed">
          将来サービスから収益が生まれた場合には、その一部を空手の普及活動に充てることを構想しています。
          幼稚園・保育園や学童へのご案内、空手を知ってもらうための広報、はじめて空手にふれるご家庭への
          情報提供などを考えています。
        </p>
      </section>

      <section className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/guidelines"
          className="border-brand-200 text-brand-700 hover:bg-brand-50 rounded-md border px-4 py-2.5 text-sm font-semibold"
        >
          掲載基準を見る
        </Link>
        <Link
          href="/for-dojos"
          className="border-brand-200 text-brand-700 hover:bg-brand-50 rounded-md border px-4 py-2.5 text-sm font-semibold"
        >
          道場運営者の方へ
        </Link>
        <Link
          href="/contact"
          className="border-brand-200 text-brand-700 hover:bg-brand-50 rounded-md border px-4 py-2.5 text-sm font-semibold"
        >
          お問い合わせ
        </Link>
      </section>
    </div>
  );
}
