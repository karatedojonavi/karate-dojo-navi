import Link from "next/link";
import { DAY_LABELS, formatFeeRange, type DojoSearchResult } from "@/lib/search";

/** 体験・見学の受付方法を短いラベルにする */
function acceptLabels(dojo: DojoSearchResult): string[] {
  if (dojo.accepting_paused) return ["受付停止中"];

  const labels: string[] = [];
  if (dojo.accepts_form) labels.push("サイトから申込み");
  if (dojo.accepts_phone) labels.push("電話");
  if (dojo.accepts_email) labels.push("メール");
  if (dojo.accepts_line) labels.push("LINE");
  if (dojo.accepts_website) labels.push("公式HP");
  if (dojo.accepts_external_form) labels.push("外部フォーム");
  return labels;
}

/** 検索結果・地域ページで使う道場カード */
export function DojoCard({ dojo }: { dojo: DojoSearchResult }) {
  const days = [...dojo.practice_days].sort((a, b) => a - b);
  const accepts = acceptLabels(dojo);

  return (
    <li className="border-brand-100 bg-surface overflow-hidden rounded-lg border">
      <Link href={`/dojos/${dojo.id}`} className="hover:bg-brand-50 block p-4">
        <div className="flex gap-4">
          {/* 写真(未登録時は共通のプレースホルダー) */}
          <div
            aria-hidden="true"
            className="bg-brand-100 text-brand-500 flex h-20 w-20 shrink-0 items-center justify-center rounded-md text-2xl font-bold"
          >
            空
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-brand-800 text-base font-bold">{dojo.name}</h3>
            <p className="text-ink-muted mt-0.5 text-sm">
              {dojo.prefecture_name} {dojo.municipality_name}
            </p>

            {dojo.style_names.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {dojo.style_names.map((style) => (
                  <li
                    key={style}
                    className="border-brand-200 bg-brand-50 text-brand-700 rounded border px-1.5 py-0.5 text-xs"
                  >
                    {style}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <dl className="mt-3 grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
          <div className="flex gap-2">
            <dt className="text-ink-muted shrink-0">稽古曜日</dt>
            <dd>{days.length > 0 ? days.map((d) => DAY_LABELS[d]).join("・") : "未登録"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-ink-muted shrink-0">月会費</dt>
            <dd>{formatFeeRange(dojo.fee_min, dojo.fee_max)}</dd>
          </div>
        </dl>

        {accepts.length > 0 && (
          <p className="text-ink-muted mt-2 text-xs">体験・見学の受付: {accepts.join(" / ")}</p>
        )}
      </Link>
    </li>
  );
}
