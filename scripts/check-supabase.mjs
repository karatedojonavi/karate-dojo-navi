/**
 * Supabase への接続確認スクリプト。
 * 使い方: npm run check:supabase
 * 「接続OK」と表示されれば、.env.local のキーが正しく設定されています。
 */
import fs from "node:fs";

const envFile = ".env.local";

if (!fs.existsSync(envFile)) {
  console.error(`${envFile} がありません。.env.example をコピーして作成してください。`);
  process.exit(1);
}

const env = Object.fromEntries(
  fs
    .readFileSync(envFile, "utf8")
    .split("\n")
    .filter((line) => line.trim() && !line.trim().startsWith("#") && line.includes("="))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    }),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
if (!url) {
  console.error("NEXT_PUBLIC_SUPABASE_URL が設定されていません。");
  process.exit(1);
}

let failed = false;

/**
 * REST API に問い合わせ、キーが受け付けられるかを確認する。
 * 存在しないテーブルを指定しているので、キーが正しければ「テーブルが無い」エラーが返る。
 * キーが誤っている場合は 401(Invalid API key)になるため、この2つで判別できる。
 */
async function probe(label, key) {
  if (!key) {
    console.log(`${label}: 未設定`);
    failed = true;
    return;
  }
  const res = await fetch(`${url}/rest/v1/__connection_probe__?select=*&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });

  if (res.status === 401 || res.status === 403) {
    console.log(`${label}: 接続失敗(キーが正しくありません) ${await res.text()}`);
    failed = true;
    return;
  }
  console.log(`${label}: 接続OK`);
}

console.log("接続先:", url);
await probe("anon キー        ", env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
await probe("service_role キー", env.SUPABASE_SERVICE_ROLE_KEY);

if (failed) {
  console.error("\n接続に失敗した項目があります。.env.local のキーを確認してください。");
  process.exit(1);
}
console.log("\nすべて接続できました。");
