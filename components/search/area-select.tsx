"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Municipality, Prefecture } from "@/lib/queries/dojos";

type Props = {
  prefectures: Prefecture[];
  /** サーバー側で用意した初期値(選択済みの都道府県の市区町村) */
  initialMunicipalities?: Municipality[];
  defaultPrefectureId?: number | null;
  defaultMunicipalityId?: number | null;
  /** 縦積み(トップページ)か横並び(検索ページ)か */
  layout?: "stacked" | "inline";
};

const selectClass =
  "w-full rounded-md border border-brand-200 bg-surface px-3 py-2.5 text-base text-ink";

/**
 * 都道府県セレクト + 市区町村セレクト。
 * 都道府県を選ぶと、その県の市区町村だけを読み込んで切り替える。
 * 一度読み込んだ県は保持し、選び直しても再取得しない。
 */
export function AreaSelect({
  prefectures,
  initialMunicipalities = [],
  defaultPrefectureId = null,
  defaultMunicipalityId = null,
  layout = "stacked",
}: Props) {
  const [prefectureId, setPrefectureId] = useState<string>(
    defaultPrefectureId ? String(defaultPrefectureId) : "",
  );
  const [municipalityId, setMunicipalityId] = useState<string>(
    defaultMunicipalityId ? String(defaultMunicipalityId) : "",
  );
  const [cache, setCache] = useState<Record<string, Municipality[]>>(() =>
    defaultPrefectureId && initialMunicipalities.length > 0
      ? { [String(defaultPrefectureId)]: initialMunicipalities }
      : {},
  );

  // 表示する市区町村は状態から導出する(未選択なら空、読み込み前なら undefined)
  const municipalities = prefectureId ? cache[prefectureId] : [];
  const isLoading = prefectureId !== "" && municipalities === undefined;

  useEffect(() => {
    if (!prefectureId || cache[prefectureId]) return;

    let cancelled = false;
    void createSupabaseBrowserClient()
      .from("municipalities")
      .select("id, prefecture_id, name, slug")
      .eq("prefecture_id", Number(prefectureId))
      .order("sort_order")
      .then(({ data }) => {
        if (cancelled) return;
        setCache((prev) => ({ ...prev, [prefectureId]: data ?? [] }));
      });

    return () => {
      cancelled = true;
    };
  }, [prefectureId, cache]);

  return (
    <div className={layout === "inline" ? "grid grid-cols-1 gap-3 sm:grid-cols-2" : "space-y-3"}>
      <div>
        <label htmlFor="pref" className="text-ink mb-1 block text-sm font-semibold">
          都道府県
        </label>
        <select
          id="pref"
          name="pref"
          className={selectClass}
          value={prefectureId}
          onChange={(e) => {
            setPrefectureId(e.target.value);
            setMunicipalityId("");
          }}
        >
          <option value="">選択してください</option>
          {prefectures.map((pref) => (
            <option key={pref.id} value={pref.id}>
              {pref.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="city" className="text-ink mb-1 block text-sm font-semibold">
          市区町村
        </label>
        <select
          id="city"
          name="city"
          className={`${selectClass} disabled:bg-surface-subtle disabled:text-ink-muted`}
          value={municipalityId}
          onChange={(e) => setMunicipalityId(e.target.value)}
          disabled={!prefectureId || isLoading}
        >
          <option value="">
            {!prefectureId
              ? "先に都道府県を選んでください"
              : isLoading
                ? "読み込み中…"
                : "すべての市区町村"}
          </option>
          {(municipalities ?? []).map((municipality) => (
            <option key={municipality.id} value={municipality.id}>
              {municipality.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
