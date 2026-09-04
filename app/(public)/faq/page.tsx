import type { Metadata } from "next";
import Link from "next/link";
import { FAQS } from "@/lib/content/faq";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "よくある質問",
  description:
    "空手道場さがしについてよく寄せられる質問と回答。費用、対象年齢、体験・見学、掲載についてまとめています。",
  alternates: { canonical: `${siteConfig.url}/faq` },
};

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-brand-800 text-2xl font-bold">よくある質問</h1>

      <dl className="mt-6 space-y-4">
        {FAQS.map((faq) => (
          <div key={faq.question} className="border-brand-100 rounded-lg border p-4">
            <dt className="text-brand-700 text-base font-bold">Q. {faq.question}</dt>
            <dd className="text-ink-muted mt-2 text-sm leading-relaxed">{faq.answer}</dd>
          </div>
        ))}
      </dl>

      <section className="border-brand-100 bg-surface-subtle mt-10 rounded-lg border p-5">
        <h2 className="text-brand-800 text-base font-bold">解決しない場合</h2>
        <p className="text-ink-muted mt-2 text-sm">
          掲載内容についてのご指摘やご質問は、お問い合わせページからご連絡ください。
        </p>
        <Link
          href="/contact"
          className="border-brand-200 text-brand-700 hover:bg-brand-50 mt-3 inline-block rounded-md border px-4 py-2.5 text-sm font-semibold"
        >
          お問い合わせ
        </Link>
      </section>
    </div>
  );
}
