import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "道場運営者の方へ|無料掲載のご案内",
  description:
    "全日本空手道連盟系の道場・空手教室を無料で掲載できます。掲載料・成約手数料は無料。稽古場所や曜日、月会費を登録して、地域の方に見つけてもらいましょう。",
  alternates: { canonical: `${siteConfig.url}/for-dojos` },
};

export default function ForDojosPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-brand-800 text-2xl font-bold">道場運営者の方へ</h1>
      <p className="text-accent-700 mt-3 text-base font-semibold">
        全日本空手道連盟系の道場・空手教室を、無料で掲載できます。
      </p>

      <section className="mt-8">
        <h2 className="text-brand-800 text-lg font-bold">掲載でできること</h2>
        <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            {
              title: "地域で探している方に届く",
              body: "都道府県・市区町村のページに掲載され、地域から道場を探している方に見つけてもらいやすくなります。",
            },
            {
              title: "稽古場所を複数登録できる",
              body: "公民館や体育館など、複数の会場で稽古している場合も、会場ごとに曜日・時間・クラスを登録できます。",
            },
            {
              title: "体験・見学の申込みを受けられる",
              body: "サイト内のフォームからの申込みを、ご登録のメールアドレスへお知らせします。電話・メール・LINEなど、既存の受付方法を案内するだけでもかまいません。",
            },
            {
              title: "ご自身で更新できる",
              body: "アカウントを作れば、稽古時間や月会費の変更をいつでもご自身で反映できます。更新に運営の承認は必要ありません。",
            },
          ].map((item) => (
            <li key={item.title} className="border-brand-100 rounded-lg border p-4">
              <h3 className="text-brand-700 text-sm font-bold">{item.title}</h3>
              <p className="text-ink-muted mt-1.5 text-sm">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-brand-800 text-lg font-bold">費用</h2>
        <p className="border-accent-200 bg-accent-50 text-ink-muted mt-3 rounded-md border p-4 text-sm leading-relaxed">
          掲載料、月額利用料、体験申込みの成約手数料は、いずれもいただいていません。
          将来、写真を複数枚載せられるなどの追加機能を有料で提供する可能性はありますが、
          基本情報の無料掲載は今後も続けます。また、料金をお支払いいただいた道場を「優良」「認定」などと
          表示することはしません。
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-brand-800 text-lg font-bold">掲載の対象</h2>
        <p className="text-ink-muted mt-3 text-sm leading-relaxed">
          全日本空手道連盟系の都道府県連盟、市区町村連盟、会派または関係団体に所属している道場・教室が対象です。
          登録の際に、その旨をご自身で確認していただきます。フルコンタクト空手(極真空手など)の道場は
          掲載対象外です。詳しくは
          <Link href="/guidelines" className="text-brand-600 mx-1 font-semibold hover:underline">
            掲載基準
          </Link>
          をご覧ください。
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-brand-800 text-lg font-bold">掲載までの流れ</h2>
        <ol className="mt-4 space-y-4">
          {[
            {
              title: "アカウントを作る",
              body: "メールアドレスとパスワードで登録します。",
            },
            {
              title: "道場の情報を入力する",
              body: "道場名、稽古場所、曜日・時間、月会費、連絡先などを入力します。あとから何度でも変更できます。",
            },
            {
              title: "運営で確認する",
              body: "なりすましや掲載対象外の道場でないかを運営で確認します。ご不明な点があればご連絡することがあります。",
            },
            {
              title: "公開",
              body: "公開後は、ご自身のページからいつでも情報を更新できます。更新はすぐに反映されます。",
            },
          ].map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span className="bg-accent-100 text-accent-700 flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold">
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

      <section className="border-accent-200 bg-accent-50 mt-10 rounded-lg border p-5">
        <h2 className="text-accent-700 text-base font-bold">掲載の受付について</h2>
        <p className="text-ink-muted mt-2 text-sm">
          道場運営者向けの登録機能は、現在準備を進めています。
          お急ぎの場合や、ご質問・掲載のご相談は、お問い合わせページからご連絡ください。
        </p>
        <Link
          href="/contact"
          className="bg-accent-600 hover:bg-accent-700 mt-4 inline-block rounded-md px-4 py-2.5 text-sm font-bold text-white"
        >
          掲載について問い合わせる
        </Link>
      </section>
    </div>
  );
}
