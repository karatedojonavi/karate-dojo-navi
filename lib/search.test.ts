import { describe, expect, it } from "vitest";
import {
  calculateSortScore,
  feeRangesOverlap,
  formatFeeRange,
  SCORE_WEIGHTS,
  type ScoreInput,
} from "./search";

const NOW = new Date("2026-09-04T00:00:00+09:00");

/** 加点対象をすべて満たさない道場を基準にする */
function baseDojo(overrides: Partial<ScoreInput> = {}): ScoreInput {
  return {
    prefectureId: 10,
    municipalityId: 10201,
    hasDescription: false,
    hasPhoto: false,
    hasLocation: false,
    hasFee: false,
    hasPolicy: false,
    // 365日より前の更新にして、更新日の加点を0にする
    lastContentUpdate: new Date("2024-01-01T00:00:00+09:00"),
    ...overrides,
  };
}

describe("calculateSortScore(並び順スコア)", () => {
  it("加点対象が何もなければ0点", () => {
    expect(calculateSortScore(baseDojo(), {}, NOW)).toBe(0);
  });

  it("市区町村が一致すると100点", () => {
    const score = calculateSortScore(baseDojo(), { prefectureId: 10, municipalityId: 10201 }, NOW);
    expect(score).toBe(SCORE_WEIGHTS.municipalityMatch);
  });

  it("都道府県のみ一致すると50点", () => {
    const score = calculateSortScore(baseDojo(), { prefectureId: 10, municipalityId: 10202 }, NOW);
    expect(score).toBe(SCORE_WEIGHTS.prefectureMatch);
  });

  it("市区町村一致と都道府県一致は重複して加点しない", () => {
    const score = calculateSortScore(baseDojo(), { prefectureId: 10, municipalityId: 10201 }, NOW);
    expect(score).toBeLessThan(SCORE_WEIGHTS.municipalityMatch + SCORE_WEIGHTS.prefectureMatch);
  });

  it("地域を指定していなければ地域の加点はない", () => {
    expect(calculateSortScore(baseDojo(), {}, NOW)).toBe(0);
  });

  it("情報の充実度が加点される", () => {
    const dojo = baseDojo({
      hasDescription: true,
      hasPhoto: true,
      hasLocation: true,
      hasFee: true,
      hasPolicy: true,
    });
    expect(calculateSortScore(dojo, {}, NOW)).toBe(
      SCORE_WEIGHTS.hasDescription +
        SCORE_WEIGHTS.hasPhoto +
        SCORE_WEIGHTS.hasLocation +
        SCORE_WEIGHTS.hasFee +
        SCORE_WEIGHTS.hasPolicy,
    );
  });

  it("90日以内の更新は10点、365日以内は5点、それ以前は0点", () => {
    const within90 = baseDojo({ lastContentUpdate: new Date("2026-08-01T00:00:00+09:00") });
    const within365 = baseDojo({ lastContentUpdate: new Date("2026-01-01T00:00:00+09:00") });
    const older = baseDojo({ lastContentUpdate: new Date("2020-01-01T00:00:00+09:00") });

    expect(calculateSortScore(within90, {}, NOW)).toBe(SCORE_WEIGHTS.updatedWithin90Days);
    expect(calculateSortScore(within365, {}, NOW)).toBe(SCORE_WEIGHTS.updatedWithin365Days);
    expect(calculateSortScore(older, {}, NOW)).toBe(0);
  });

  it("更新日の加点は90日以内と365日以内で重複しない", () => {
    const dojo = baseDojo({ lastContentUpdate: new Date("2026-09-01T00:00:00+09:00") });
    expect(calculateSortScore(dojo, {}, NOW)).toBe(SCORE_WEIGHTS.updatedWithin90Days);
  });

  it("priority_boost は加算されるが、MVPでは常に0のため影響しない", () => {
    expect(calculateSortScore(baseDojo({ priorityBoost: 0 }), {}, NOW)).toBe(0);
    expect(calculateSortScore(baseDojo({ priorityBoost: 30 }), {}, NOW)).toBe(30);
  });

  it("段位や大会実績はスコアに影響しない(道場に優劣をつけない)", () => {
    // ScoreInput に段位・実績の項目が存在しないことを型と加点表で担保する
    expect(Object.keys(SCORE_WEIGHTS)).not.toContain("dan");
    expect(Object.keys(SCORE_WEIGHTS)).not.toContain("achievements");
  });
});

describe("feeRangesOverlap(月会費の範囲の重なり判定)", () => {
  it("費用の条件を指定しなければ、費用未登録の道場も対象になる", () => {
    expect(feeRangesOverlap({ min: null, max: null }, { min: null, max: null })).toBe(true);
    expect(feeRangesOverlap({ min: 3000, max: 5000 }, { min: null, max: null })).toBe(true);
  });

  it("費用が未登録の道場は、費用で絞り込むと対象外になる", () => {
    expect(feeRangesOverlap({ min: null, max: null }, { min: 0, max: 3000 })).toBe(false);
  });

  it("範囲が重なれば対象", () => {
    // 道場 3,000〜5,000円 / 希望 〜3,000円 -> 3,000円で接するので重なる
    expect(feeRangesOverlap({ min: 3000, max: 5000 }, { min: 0, max: 3000 })).toBe(true);
    // 道場 3,000〜5,000円 / 希望 4,000〜8,000円
    expect(feeRangesOverlap({ min: 3000, max: 5000 }, { min: 4000, max: 8000 })).toBe(true);
    // 道場の範囲が希望を完全に含む
    expect(feeRangesOverlap({ min: 1000, max: 9000 }, { min: 3000, max: 5000 })).toBe(true);
  });

  it("範囲が重ならなければ対象外", () => {
    expect(feeRangesOverlap({ min: 6000, max: 8000 }, { min: 0, max: 3000 })).toBe(false);
    expect(feeRangesOverlap({ min: 1000, max: 2000 }, { min: 5000, max: 8000 })).toBe(false);
  });

  it("上限なしの希望(8,000円〜)は高額の道場に一致する", () => {
    expect(feeRangesOverlap({ min: 9000, max: 12000 }, { min: 8000, max: null })).toBe(true);
    expect(feeRangesOverlap({ min: 2000, max: 3000 }, { min: 8000, max: null })).toBe(false);
  });

  it("道場側が片方しか登録していない場合は、その額を上下限として扱う", () => {
    // 月会費4,000円のみ登録
    expect(feeRangesOverlap({ min: 4000, max: null }, { min: 3000, max: 5000 })).toBe(true);
    expect(feeRangesOverlap({ min: 4000, max: null }, { min: 5000, max: 8000 })).toBe(false);
    expect(feeRangesOverlap({ min: null, max: 4000 }, { min: 3000, max: 5000 })).toBe(true);
  });
});

describe("formatFeeRange(月会費の表示)", () => {
  it("上下限が異なる場合は範囲で表示する", () => {
    expect(formatFeeRange(3000, 5000)).toBe("3,000円〜5,000円/月");
  });

  it("上下限が同じ場合は1つの額で表示する", () => {
    expect(formatFeeRange(4000, 4000)).toBe("4,000円/月");
  });

  it("片方だけ登録されている場合はその額を表示する", () => {
    expect(formatFeeRange(3000, null)).toBe("3,000円/月");
    expect(formatFeeRange(null, 8000)).toBe("8,000円/月");
  });

  it("未登録の場合は未登録と表示する(0円などと誤解させない)", () => {
    expect(formatFeeRange(null, null)).toBe("月会費は未登録");
  });
});
