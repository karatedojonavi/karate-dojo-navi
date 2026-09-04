/**
 * データベースの投入内容と検索関数の動作確認。
 * 使い方: npm run check:db
 *
 * 未ログイン利用者と同じ anon キーで実行するため、RLS が正しく効いているかも同時に確認できる。
 */
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((line) => line.trim() && !line.trim().startsWith("#") && line.includes("="))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    }),
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

let failed = false;

function check(label, actual, expected) {
  const ok = actual === expected;
  console.log(`${ok ? "OK  " : "NG  "} ${label}: ${actual}${ok ? "" : ` (期待値 ${expected})`}`);
  if (!ok) failed = true;
}

function report(label, value) {
  console.log(`     ${label}: ${value}`);
}

async function count(table) {
  const { count: n, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(`${table} の件数取得に失敗: ${error.message}`);
  return n;
}

console.log("=== マスタデータ ===");
check("都道府県", await count("prefectures"), 47);
check("市区町村", await count("municipalities"), 1741);
check("流派", await count("styles"), 4);
check("会派・団体", await count("organizations"), 4);

console.log("\n=== 道場データ ===");
check("公開中の道場", await count("dojos"), 15);
check("稽古場所", await count("practice_locations"), 21);
check("稽古枠", await count("practice_schedules"), 35);

console.log("\n=== 検索関数 ===");

async function search(params) {
  const { data, error } = await supabase.rpc("search_dojos", params);
  if (error) throw new Error(`検索に失敗: ${error.message}`);
  return data;
}

const all = await search({});
check("条件なしの検索件数", all.length, 15);
check("総件数(total_count)", Number(all[0].total_count), 15);

const gunma = await search({ p_prefecture_id: 10 });
check("群馬県で絞り込み", gunma.length, 3);

const maebashi = await search({ p_prefecture_id: 10, p_municipality_id: 10201 });
check("前橋市で絞り込み", maebashi.length, 1);
report("先頭の道場", maebashi[0].name);
report("スコア", maebashi[0].score);

const saturday = await search({ p_days: [6] });
report("土曜に稽古がある道場", `${saturday.length}件`);
check("土曜の絞り込みが機能している", saturday.length < 15, true);

const cheap = await search({ p_fee_min: 0, p_fee_max: 3000 });
report("月会費 〜3,000円", `${cheap.length}件`);
check("月会費の絞り込みが機能している", cheap.length < 15, true);

const shotokan = await search({ p_style_ids: [1] });
report("松濤館流", `${shotokan.length}件`);
check("流派の絞り込みが機能している", shotokan.length < 15, true);

const keyword = await search({ p_keyword: "親子" });
report("キーワード「親子」", `${keyword.length}件: ${keyword.map((d) => d.name).join(", ")}`);
check("キーワード検索が機能している", keyword.length >= 1, true);

const para = await search({ p_para_support: true });
report("パラ空手・障害者対応あり", `${para.length}件`);
check("パラ空手の絞り込みが機能している", para.length < 15 && para.length > 0, true);

console.log("\n=== 並び順(市区町村一致が最上位に来るか)===");
const ranked = await search({ p_prefecture_id: 10, p_municipality_id: 10202 });
report("高崎市で検索した先頭", `${ranked[0].name}(スコア ${ranked[0].score})`);
check("市区町村一致が最上位", ranked[0].municipality_id, 10202);
check(
  "スコアが降順",
  ranked.every((d, i) => i === 0 || ranked[i - 1].score >= d.score),
  true,
);

console.log("\n=== 詳細取得と関連データ ===");
const { data: detail, error: detailError } = await supabase
  .from("dojos")
  .select(
    "name, practice_locations ( name, practice_schedules ( day_of_week ) ), dojo_styles ( styles ( name ) )",
  )
  .eq("id", "11111111-0000-4000-8000-000000000002")
  .maybeSingle();
if (detailError) throw new Error(`詳細取得に失敗: ${detailError.message}`);
check("稽古場所が3件ある道場", detail.practice_locations.length, 3);
report("道場名", detail.name);
report("流派", detail.dojo_styles.map((s) => s.styles.name).join(", "));

console.log("\n=== RLS(未ログインからの書き込みが拒否されるか)===");
const { error: insertError } = await supabase
  .from("dojos")
  .insert({ name: "不正登録テスト", prefecture_id: 10, municipality_id: 10201 });
check("未ログインからの道場登録が拒否される", insertError !== null, true);
if (insertError) report("拒否理由", insertError.message);

// RLS では「更新できる行が見つからない」扱いになりエラーは返らないため、
// 実際に値が書き換わっていないことで確認する。
const TARGET_ID = "11111111-0000-4000-8000-000000000001";
const { data: before } = await supabase.from("dojos").select("name").eq("id", TARGET_ID).single();
await supabase.from("dojos").update({ name: "不正更新テスト" }).eq("id", TARGET_ID);
const { data: after } = await supabase.from("dojos").select("name").eq("id", TARGET_ID).single();
check("未ログインからの道場更新が反映されない", after.name === before.name, true);
report("道場名", after.name);

const { error: deleteError } = await supabase.from("dojos").delete().eq("id", TARGET_ID);
const remaining = await count("dojos");
check("未ログインからの道場削除が反映されない", remaining, 15);
if (deleteError) report("削除の拒否理由", deleteError.message);

if (failed) {
  console.error("\n確認に失敗した項目があります。");
  process.exit(1);
}
console.log("\nすべての確認項目に合格しました。");
