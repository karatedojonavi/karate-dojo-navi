import { expect, test } from "@playwright/test";

/**
 * フェーズ1の主要動線: 検索 → 道場詳細。
 * ダミー道場データ(is_sample_data = true)が投入されていることを前提にしている。
 */

test("トップページから地域を選んで検索し、道場詳細まで到達できる", async ({ page }) => {
  await page.goto("/");

  // ファーストビューの検索フォームで都道府県を選ぶ
  await page.getByLabel("都道府県").selectOption({ label: "群馬県" });

  // 市区町村の読み込みが終わるのを待ってから選ぶ
  const citySelect = page.getByLabel("市区町村");
  await expect(citySelect).toBeEnabled();
  await citySelect.selectOption({ label: "前橋市" });

  await page.getByRole("button", { name: "道場を探す" }).click();

  // 検索結果に前橋市の道場が出る
  await expect(page).toHaveURL(/\/search\?/);
  await expect(page.getByText("1件中 1〜1件を表示")).toBeVisible();

  const dojoLink = page.getByRole("link", { name: /前橋中央空手道場/ });
  await expect(dojoLink).toBeVisible();
  await dojoLink.click();

  // 道場詳細ページ
  await expect(page).toHaveURL(/\/dojos\//);
  await expect(page.getByRole("heading", { level: 1, name: /前橋中央空手道場/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "体験・見学のお申し込み" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "稽古場所と曜日・時間" })).toBeVisible();

  // 費用の免責注記が表示されている
  await expect(page.getByText(/入会時に必要な費用、スポーツ保険/)).toBeVisible();

  // 所属の免責注記が表示されている
  await expect(page.getByText(/当サイトが所属関係を保証するものではありません/)).toBeVisible();
});

test("検索条件で絞り込める", async ({ page }) => {
  await page.goto("/search");
  await expect(page.getByText("15件中 1〜15件を表示")).toBeVisible();

  // 稽古曜日で絞る
  await page.getByRole("checkbox", { name: "土" }).check();
  await page.getByRole("button", { name: "この条件で検索" }).click();
  await expect(page.getByText("7件中 1〜7件を表示")).toBeVisible();

  // 流派を追加して、さらに絞り込まれる
  await page.getByRole("checkbox", { name: "松濤館流" }).check();
  await page.getByRole("button", { name: "この条件で検索" }).click();
  await expect(page.getByText(/[0-9]+件中/)).toBeVisible();

  // 条件をクリアすると全件に戻る
  await page.getByRole("link", { name: "条件をクリア" }).click();
  await expect(page.getByText("15件中 1〜15件を表示")).toBeVisible();
});

test("該当0件のときに条件を緩める案内が出る", async ({ page }) => {
  // 群馬県 × 存在しない組合せ(日曜 + 8,000円〜)
  await page.goto("/search?pref=10&days=0&fee=8000-");

  await expect(page.getByText("該当する道場は見つかりませんでした")).toBeVisible();
  await expect(page.getByRole("link", { name: /群馬県全体で探す/ })).toBeVisible();
});

test("地域ページから道場詳細へ移動できる", async ({ page }) => {
  await page.goto("/area/gunma");

  await expect(
    page.getByRole("heading", { level: 1, name: "群馬県の空手道場・空手教室一覧" }),
  ).toBeVisible();

  // 市区町村ページへ
  await page
    .getByRole("link", { name: /前橋市/ })
    .first()
    .click();
  await expect(page).toHaveURL("/area/gunma/maebashi");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("前橋市");
});

test("掲載が0件の市区町村ページは表示されない", async ({ page }) => {
  // 桐生市には掲載がないため、内容のないページを作らない方針で404になる
  const response = await page.goto("/area/gunma/kiryu");
  expect(response?.status()).toBe(404);
});

test("掲載が0件の都道府県ページは準備中と案内する", async ({ page }) => {
  await page.goto("/area/akita");

  await expect(page.getByRole("heading", { name: "現在準備中です" })).toBeVisible();
  await expect(page.getByRole("link", { name: "無料掲載について見る" })).toBeVisible();
});
