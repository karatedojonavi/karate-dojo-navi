import { expect, test } from "@playwright/test";

test("トップページが表示され、共通ヘッダー・フッターが出る", async ({ page }) => {
  await page.goto("/");

  // 見出し(キャッチコピー)
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // 共通ヘッダーの検索導線
  const header = page.getByRole("banner");
  await expect(header.getByRole("link", { name: "道場を探す", exact: true })).toBeVisible();

  // 共通フッター: 全空連の公式サイトではない旨の注記が常時表示されていること
  const footer = page.getByRole("contentinfo");
  await expect(
    footer.getByText("本サイトは全日本空手道連盟の公式サイトではありません。"),
  ).toBeVisible();
});
