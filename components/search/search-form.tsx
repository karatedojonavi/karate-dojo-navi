import { AreaSelect } from "@/components/search/area-select";
import { DAY_LABELS, FEE_RANGES, type DojoSearchQuery } from "@/lib/search";
import type { Municipality, Prefecture, Style } from "@/lib/queries/dojos";

type Props = {
  prefectures: Prefecture[];
  styles: Style[];
  municipalities?: Municipality[];
  query: DojoSearchQuery & { feeRange?: string | null };
};

/**
 * 検索結果ページの絞り込みフォーム。
 * GET で /search に送るため、検索条件がそのままURLに残り、共有・ブックマークできる。
 */
export function SearchForm({ prefectures, styles, municipalities = [], query }: Props) {
  const selectedDays = new Set(query.days ?? []);
  const selectedStyles = new Set(query.styleIds ?? []);

  return (
    <form
      action="/search"
      method="get"
      className="border-brand-100 bg-surface rounded-lg border p-4"
    >
      <h2 className="text-brand-800 text-base font-bold">条件で絞り込む</h2>

      <div className="mt-4 space-y-4">
        <AreaSelect
          prefectures={prefectures}
          initialMunicipalities={municipalities}
          defaultPrefectureId={query.prefectureId}
          defaultMunicipalityId={query.municipalityId}
          layout="inline"
        />

        <div>
          <label htmlFor="q" className="text-ink mb-1 block text-sm font-semibold">
            キーワード
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={query.keyword ?? ""}
            placeholder="道場名・ふりがな・紹介文から探す"
            className="border-brand-200 bg-surface w-full rounded-md border px-3 py-2.5 text-base"
          />
        </div>

        <fieldset>
          <legend className="text-ink mb-1.5 text-sm font-semibold">稽古曜日</legend>
          <div className="flex flex-wrap gap-2">
            {DAY_LABELS.map((label, day) => (
              <label
                key={day}
                className="border-brand-200 has-checked:border-brand-500 has-checked:bg-brand-50 flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm"
              >
                <input
                  type="checkbox"
                  name="days"
                  value={day}
                  defaultChecked={selectedDays.has(day)}
                  className="size-4"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="fee" className="text-ink mb-1 block text-sm font-semibold">
            月会費
          </label>
          <select
            id="fee"
            name="fee"
            defaultValue={query.feeRange ?? ""}
            className="border-brand-200 bg-surface w-full rounded-md border px-3 py-2.5 text-base"
          >
            <option value="">指定しない</option>
            {FEE_RANGES.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          <p className="text-ink-muted mt-1 text-xs">
            月会費で絞り込むと、月会費が未登録の道場は表示されません。
          </p>
        </div>

        <fieldset>
          <legend className="text-ink mb-1.5 text-sm font-semibold">流派</legend>
          <div className="flex flex-wrap gap-2">
            {styles.map((style) => (
              <label
                key={style.id}
                className="border-brand-200 has-checked:border-brand-500 has-checked:bg-brand-50 flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm"
              >
                <input
                  type="checkbox"
                  name="styles"
                  value={style.id}
                  defaultChecked={selectedStyles.has(style.id)}
                  className="size-4"
                />
                {style.name}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-ink mb-1.5 text-sm font-semibold">こだわり条件</legend>
          <div className="space-y-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="beginner"
                value="1"
                defaultChecked={query.beginnerWelcome}
                className="size-4"
              />
              初心者歓迎の記載あり
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="para"
                value="1"
                defaultChecked={query.paraSupport}
                className="size-4"
              />
              パラ空手・障害者対応あり
            </label>
          </div>
        </fieldset>
      </div>

      <div className="mt-5 flex gap-3">
        <button
          type="submit"
          className="bg-brand-600 hover:bg-brand-700 flex-1 rounded-md px-4 py-3 text-base font-bold text-white"
        >
          この条件で検索
        </button>
        <a
          href="/search"
          className="border-brand-200 text-brand-700 hover:bg-brand-50 rounded-md border px-4 py-3 text-sm"
        >
          条件をクリア
        </a>
      </div>
    </form>
  );
}
