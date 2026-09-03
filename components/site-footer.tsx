import Link from "next/link";
import { siteConfig } from "@/lib/config/site";

const legalLinks = [
  { href: "/about", label: "このサイトについて" },
  { href: "/guide", label: "道場を探す流れ" },
  { href: "/faq", label: "よくある質問" },
  { href: "/for-dojos", label: "道場運営者の方へ(無料掲載)" },
  { href: "/terms", label: "利用規約" },
  { href: "/privacy", label: "プライバシーポリシー" },
  { href: "/guidelines", label: "掲載基準" },
  { href: "/contact", label: "お問い合わせ・修正削除依頼" },
];

/**
 * 全ページ共通フッター。
 * 全空連の公式サイトではない旨を常時表示する(SECURITY_AND_PRIVACY.md 3「表示上の注意」)。
 */
export function SiteFooter() {
  return (
    <footer className="border-brand-100 bg-surface-subtle mt-16 border-t">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <nav aria-label="サイト情報">
          <ul className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-ink-muted hover:text-brand-700">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="bg-brand-50 text-ink-muted mt-8 rounded-md px-4 py-3 text-sm">
          {siteConfig.disclaimer}
          全日本空手道連盟系の道場に関する情報を、各道場からの申告および公開情報に基づいて掲載している独立したサイトです。
        </p>

        <p className="text-ink-muted mt-6 text-xs">
          © {new Date().getFullYear()} {siteConfig.name}
        </p>
      </div>
    </footer>
  );
}
