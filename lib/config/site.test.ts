import { describe, expect, it } from "vitest";
import { siteConfig } from "./site";

describe("siteConfig", () => {
  it("サービス名が設定されている", () => {
    expect(siteConfig.name).toBeTruthy();
  });

  it("全空連の公式サイトではない旨の注記を持つ", () => {
    // SECURITY_AND_PRIVACY.md 3: 全ページ共通で常時表示する必須文言
    expect(siteConfig.disclaimer).toContain("公式サイトではありません");
  });

  it("サイトURLが絶対URLである(canonical/OGP生成のため)", () => {
    expect(() => new URL(siteConfig.url)).not.toThrow();
  });
});
