import { describe, expect, it } from "vitest";
import { normalizeSiteUrl, normalizeSupabaseUrl } from "./env";

const PROJECT_URL = "https://hyxqlkswxxyhihhuhpwz.supabase.co";

describe("normalizeSupabaseUrl(Supabase接続先URLの正規化)", () => {
  it("正しいプロジェクトURLはそのまま", () => {
    expect(normalizeSupabaseUrl(PROJECT_URL)).toBe(PROJECT_URL);
  });

  it("末尾のスラッシュを取り除く", () => {
    expect(normalizeSupabaseUrl(`${PROJECT_URL}/`)).toBe(PROJECT_URL);
    expect(normalizeSupabaseUrl(`${PROJECT_URL}///`)).toBe(PROJECT_URL);
  });

  it("前後の空白を取り除く", () => {
    expect(normalizeSupabaseUrl(`  ${PROJECT_URL}  `)).toBe(PROJECT_URL);
  });

  it("REST APIのURLを貼ってしまった場合も復元する", () => {
    // 管理画面から REST エンドポイントをコピーすると全ページが 500 になるため、ここで吸収する
    expect(normalizeSupabaseUrl(`${PROJECT_URL}/rest/v1/`)).toBe(PROJECT_URL);
    expect(normalizeSupabaseUrl(`${PROJECT_URL}/rest/v1`)).toBe(PROJECT_URL);
  });

  it("Auth・Storage などのエンドポイントURLも復元する", () => {
    expect(normalizeSupabaseUrl(`${PROJECT_URL}/auth/v1`)).toBe(PROJECT_URL);
    expect(normalizeSupabaseUrl(`${PROJECT_URL}/storage/v1/`)).toBe(PROJECT_URL);
    expect(normalizeSupabaseUrl(`${PROJECT_URL}/realtime/v1`)).toBe(PROJECT_URL);
    expect(normalizeSupabaseUrl(`${PROJECT_URL}/functions/v1`)).toBe(PROJECT_URL);
  });

  it("プロジェクト名にrestを含む場合でも壊さない", () => {
    expect(normalizeSupabaseUrl("https://restaurant.supabase.co")).toBe(
      "https://restaurant.supabase.co",
    );
  });
});

describe("normalizeSiteUrl(サイトURLの正規化)", () => {
  it("末尾のスラッシュを取り除く", () => {
    expect(normalizeSiteUrl("https://example.com/")).toBe("https://example.com");
    expect(normalizeSiteUrl("https://example.com")).toBe("https://example.com");
  });

  it("前後の空白を取り除く", () => {
    expect(normalizeSiteUrl("  https://example.com/  ")).toBe("https://example.com");
  });
});
