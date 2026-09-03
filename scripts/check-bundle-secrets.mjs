/**
 * ビルド成果物にサーバー専用の秘密情報が混入していないかを検査する。
 * SECURITY_AND_PRIVACY.md 1「SUPABASE_SERVICE_ROLE_KEY のクライアントバンドルへの混入をビルド時に検査」に対応。
 *
 * 使い方: npm run build のあとに npm run check:secrets
 */
import fs from "node:fs";
import path from "node:path";

const clientDir = path.join(".next", "static");

if (!fs.existsSync(clientDir)) {
  console.error(`${clientDir} がありません。先に npm run build を実行してください。`);
  process.exit(1);
}

/** ブラウザへ絶対に出してはいけない環境変数 */
const SERVER_ONLY_ENV_KEYS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "CRON_SECRET",
  "SENTRY_AUTH_TOKEN",
];

function readEnvLocal() {
  if (!fs.existsSync(".env.local")) return {};
  return Object.fromEntries(
    fs
      .readFileSync(".env.local", "utf8")
      .split("\n")
      .filter((line) => line.trim() && !line.trim().startsWith("#") && line.includes("="))
      .map((line) => {
        const i = line.indexOf("=");
        return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
      }),
  );
}

function listFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
  });
}

const env = { ...readEnvLocal(), ...process.env };
const secrets = SERVER_ONLY_ENV_KEYS.map((key) => ({ key, value: env[key] })).filter(
  // 短すぎる値は誤検知の元になるため対象外にする
  (item) => item.value && item.value.length >= 16,
);

if (secrets.length === 0) {
  console.log("検査対象の秘密情報が設定されていないため、スキップしました。");
  process.exit(0);
}

const files = listFiles(clientDir);
const hits = [];

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  for (const { key, value } of secrets) {
    if (content.includes(value)) hits.push({ key, file });
  }
}

if (hits.length > 0) {
  console.error("危険: クライアント向けファイルにサーバー専用の値が含まれています。");
  for (const hit of hits) console.error(`  - ${hit.key} が ${hit.file} に混入`);
  console.error(
    "\n該当の値を使うコードが Client Component から参照されていないか確認してください。",
  );
  process.exit(1);
}

console.log(
  `OK: クライアント向けファイル ${files.length} 件を検査し、サーバー専用の値の混入はありませんでした。`,
);
console.log(`  検査した項目: ${secrets.map((s) => s.key).join(", ")}`);
