import Link from "next/link";
import { siteConfig } from "@/lib/config/site";

/**
 * 全ページ共通ヘッダー。
 * スマートフォンファースト方針のため、モバイルでは「ロゴ+探す導線」のみを出す簡潔な構成にする。
 */
export function SiteHeader() {
  return (
    <header className="border-brand-100 bg-surface border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          {/* ロゴ画像は後から差し替え可能。現時点では文字ロゴ */}
          <span
            aria-hidden="true"
            className="bg-brand-600 flex h-8 w-8 items-center justify-center rounded-md text-base font-bold text-white"
          >
            空
          </span>
          <span className="text-brand-800 text-lg font-bold tracking-tight">{siteConfig.name}</span>
        </Link>

        <nav aria-label="主要メニュー">
          <ul className="flex items-center gap-4 text-sm">
            <li>
              <Link href="/search" className="text-ink-muted hover:text-brand-700">
                道場を探す
              </Link>
            </li>
            <li>
              <Link
                href="/for-dojos"
                className="border-brand-200 text-brand-700 hover:bg-brand-50 rounded-md border px-3 py-1.5"
              >
                道場の方へ
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
