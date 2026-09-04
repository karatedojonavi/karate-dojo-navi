import { describe, expect, it } from "vitest";
import { buildSearchQueryString, hasAnyFilter, parseSearchParams } from "./search-params";

describe("parseSearchParams(URLの検索条件の読み取り)", () => {
  it("条件が何も無いときは、絞り込み条件を一切作らない", () => {
    const query = parseSearchParams({});
    expect(query.prefectureId).toBeNull();
    expect(query.municipalityId).toBeNull();
    // 空文字を数値化すると 0(=日曜)になってしまう誤りを防ぐ
    expect(query.days).toEqual([]);
    expect(query.styleIds).toEqual([]);
    expect(query.feeMin).toBeNull();
    expect(query.feeMax).toBeNull();
    expect(query.keyword).toBeNull();
    expect(query.beginnerWelcome).toBe(false);
    expect(query.paraSupport).toBe(false);
    expect(query.page).toBe(1);
  });

  it("空文字のパラメータは条件として扱わない", () => {
    const query = parseSearchParams({ days: "", styles: "", q: "  ", pref: "" });
    expect(query.days).toEqual([]);
    expect(query.styleIds).toEqual([]);
    expect(query.keyword).toBeNull();
    expect(query.prefectureId).toBeNull();
  });

  it("複数値をカンマ区切りでも配列でも読み取れる", () => {
    expect(parseSearchParams({ days: "1,3,6" }).days).toEqual([1, 3, 6]);
    expect(parseSearchParams({ days: ["1", "3", "6"] }).days).toEqual([1, 3, 6]);
    expect(parseSearchParams({ styles: ["2", "4"] }).styleIds).toEqual([2, 4]);
  });

  it("曜日は0〜6の範囲外を除外する", () => {
    expect(parseSearchParams({ days: "-1,3,9" }).days).toEqual([3]);
  });

  it("月会費の区分から下限・上限を求める", () => {
    expect(parseSearchParams({ fee: "0-3000" })).toMatchObject({ feeMin: 0, feeMax: 3000 });
    expect(parseSearchParams({ fee: "8000-" })).toMatchObject({ feeMin: 8000, feeMax: null });
  });

  it("存在しない月会費区分は無視する", () => {
    const query = parseSearchParams({ fee: "999-999" });
    expect(query.feeMin).toBeNull();
    expect(query.feeMax).toBeNull();
  });

  it("ページ番号は1未満にならない", () => {
    expect(parseSearchParams({ page: "0" }).page).toBe(1);
    expect(parseSearchParams({ page: "-5" }).page).toBe(1);
    expect(parseSearchParams({ page: "3" }).page).toBe(3);
  });
});

describe("buildSearchQueryString(検索条件のURL化)", () => {
  it("条件が無ければ空文字になる", () => {
    expect(buildSearchQueryString(parseSearchParams({}))).toBe("");
  });

  it("読み取った条件をそのまま復元できる", () => {
    const input = {
      pref: "10",
      city: "10201",
      days: "1,6",
      fee: "3000-5000",
      styles: "1,2",
      q: "前橋",
    };
    const query = parseSearchParams(input);
    const restored = parseSearchParams(
      Object.fromEntries(new URLSearchParams(buildSearchQueryString(query))),
    );
    expect(restored).toEqual(query);
  });

  it("ページ番号を上書きできる(1ページ目は付けない)", () => {
    const query = parseSearchParams({ pref: "10" });
    expect(buildSearchQueryString(query, { page: 1 })).toBe("pref=10");
    expect(buildSearchQueryString(query, { page: 2 })).toBe("pref=10&page=2");
  });
});

describe("hasAnyFilter(絞り込み条件の有無)", () => {
  it("都道府県だけの指定は絞り込みとみなさない(「県全体で探す」の案内を出さないため)", () => {
    expect(hasAnyFilter(parseSearchParams({ pref: "10" }))).toBe(false);
  });

  it("市区町村やその他の条件があれば絞り込みとみなす", () => {
    expect(hasAnyFilter(parseSearchParams({ pref: "10", city: "10201" }))).toBe(true);
    expect(hasAnyFilter(parseSearchParams({ days: "6" }))).toBe(true);
    expect(hasAnyFilter(parseSearchParams({ q: "空手" }))).toBe(true);
    expect(hasAnyFilter(parseSearchParams({ beginner: "1" }))).toBe(true);
  });
});
