/**
 * 地域マスタ(都道府県・市区町村)のマイグレーションSQLを生成する。
 *
 * 使い方: node scripts/generate-region-seed.mjs
 * 出力先: supabase/migrations/20260904000003_seed_region_master.sql
 *
 * 生成されたSQLはリポジトリにコミットする。このスクリプトは再生成が必要になったとき
 * (市町村合併などでコードが変わったとき)にだけ実行する。
 *
 * 出典:
 *  - 総務省 全国地方公共団体コード(コード・かな)
 *    https://github.com/nojimage/local-gov-code-jp (cities.json)
 *  - 市区町村名のローマ字表記
 *    https://github.com/kebhr/localgovlistjp (localgov_utf8_lf.csv)
 */
import fs from "node:fs";
import path from "node:path";

const SOURCES = {
  cities: "https://raw.githubusercontent.com/nojimage/local-gov-code-jp/master/cities.json",
  romaji: "https://raw.githubusercontent.com/kebhr/localgovlistjp/master/localgov_utf8_lf.csv",
};

const CACHE_DIR = ".tmp";
const OUT_FILE = path.join("supabase", "migrations", "20260904000003_seed_region_master.sql");

/** ダウンロード結果を .tmp にキャッシュして、実行のたびに取得しに行かないようにする */
async function fetchCached(name, url) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const file = path.join(CACHE_DIR, name);
  if (fs.existsSync(file)) return fs.readFileSync(file, "utf8");

  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} の取得に失敗しました (HTTP ${res.status})`);
  const text = await res.text();
  fs.writeFileSync(file, text, "utf8");
  return text;
}

/**
 * ローマ字表記から URL 用の slug を作る。
 *  - 末尾の -shi / -ku / -cho などの種別を落とす(例: Maebashi-shi -> maebashi)
 *  - 出典が旧ヘボン式(「ん」を b/m/p の前で m と綴る)のため、現代表記の n に統一する。
 *    例: Gumma -> gunma、Mombetsu -> monbetsu。
 *    docs/SEO_CONTENT_PLAN.md が /area/gunma を例示しているためこちらに合わせる。
 */
function toSlug(romaji) {
  return romaji
    .toLowerCase()
    .replace(/-(shi|ku|cho|machi|mach|mac|mura|mu|son|gun|to|fu|ken)$/, "")
    .replace(/m(?=[bmp])/g, "n")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function sqlText(value) {
  if (value === null || value === undefined) return "null";
  return `'${String(value).replace(/'/g, "''")}'`;
}

const cities = JSON.parse(await fetchCached("cities.json", SOURCES.cities));
const romajiCsv = await fetchCached("localgov.csv", SOURCES.romaji);

// --- ローマ字辞書: 「都道府県名|市区町村名」-> ローマ字 -------------------
const romajiByCity = new Map();
const romajiByPref = new Map();

for (const line of romajiCsv.trim().split("\n")) {
  const [prefName, prefRomaji, cityName, cityRomaji] = line.split(",");
  if (!prefName || !cityName) continue;
  romajiByPref.set(prefName, prefRomaji);
  romajiByCity.set(`${prefName}|${cityName}`, cityRomaji);
}

// --- 都道府県 -------------------------------------------------------------
const prefectures = new Map();
for (const row of cities) {
  const id = Number(row.pref_code.slice(0, 2));
  if (prefectures.has(id)) continue;
  const romaji = romajiByPref.get(row.pref_name);
  if (!romaji) throw new Error(`都道府県のローマ字が見つかりません: ${row.pref_name}`);
  prefectures.set(id, { id, name: row.pref_name, slug: toSlug(romaji) });
}

if (prefectures.size !== 47) {
  throw new Error(`都道府県が47件になりません: ${prefectures.size}件`);
}

// --- 市区町村 -------------------------------------------------------------
const municipalities = [];
const skipped = [];

/**
 * 北方領土の6村(色丹村・泊村・留夜別村・留別村・紗那村・蘂取村)。
 * 全国地方公共団体コードには登録されているが行政実体がないため、掲載対象から外す。
 */
const NORTHERN_TERRITORIES_CODES = new Set([1695, 1696, 1697, 1698, 1699, 1700]);

/**
 * 2つの出典で漢字の字体が異なるもの。
 * 左が総務省コード側の表記(DBに保存する正式名)、右がローマ字表記側の表記。
 */
const KANJI_VARIANTS = {
  "高知県|梼原町": "高知県|檮原町",
  "福岡県|須恵町": "福岡県|須惠町",
};

for (const row of cities) {
  const code5 = Number(row.code.slice(0, 5));
  if (NORTHERN_TERRITORIES_CODES.has(code5)) {
    skipped.push(`${row.pref_name}${row.city_name}(北方領土)`);
    continue;
  }

  const key = `${row.pref_name}|${row.city_name}`;
  const romaji = romajiByCity.get(key) ?? romajiByCity.get(KANJI_VARIANTS[key]);
  if (!romaji) {
    skipped.push(`${row.pref_name}${row.city_name}(ローマ字表記なし)`);
    continue;
  }
  municipalities.push({
    // 全国地方公共団体コードの上5桁(チェックデジットを除いた標準地域コード)
    id: code5,
    prefectureId: Number(row.pref_code.slice(0, 2)),
    name: row.city_name,
    slug: toSlug(romaji),
    fullRomaji: romaji.toLowerCase(),
  });
}

// --- slug の重複解消(同一県内で重複したら接尾辞つきのローマ字を使う)-----
const byPrefSlug = new Map();
for (const m of municipalities) {
  const key = `${m.prefectureId}|${m.slug}`;
  if (!byPrefSlug.has(key)) byPrefSlug.set(key, []);
  byPrefSlug.get(key).push(m);
}

const collisions = [];

// 第1段階: 「府中市 / 府中町」のように種別が異なるものは、接尾辞つきのローマ字で区別する
for (const [key, group] of byPrefSlug) {
  if (group.length === 1) continue;
  collisions.push(`${key}: ${group.map((m) => m.name).join(" / ")}`);
  for (const m of group) {
    m.slug = m.fullRomaji
      .replace(/m(?=[bmp])/g, "n")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
}

// 第2段階: 「江差町 / 枝幸町」のように読みも種別も同じものは、
// コードの小さい方をそのままにし、以降に地方公共団体コードを付けて区別する
const afterFirstPass = new Map();
for (const m of municipalities.sort((a, b) => a.id - b.id)) {
  const key = `${m.prefectureId}|${m.slug}`;
  if (!afterFirstPass.has(key)) {
    afterFirstPass.set(key, m);
    continue;
  }
  m.slug = `${m.slug}-${m.id}`;
  collisions.push(`${key}: 読みが同一のため ${m.name} を ${m.slug} にしました`);
}

// 解消後も重複していないか最終確認
const finalKeys = new Set();
for (const m of municipalities) {
  const key = `${m.prefectureId}|${m.slug}`;
  if (finalKeys.has(key)) throw new Error(`slug の重複を解消できませんでした: ${key}`);
  finalKeys.add(key);
}

// --- SQL 生成 -------------------------------------------------------------
const lines = [];
lines.push("-- =========================================================================");
lines.push("-- フェーズ1: 地域マスタ(都道府県・市区町村)の初期投入");
lines.push("--");
lines.push("-- このファイルは scripts/generate-region-seed.mjs が自動生成している。");
lines.push("-- 直接編集せず、市町村合併などで更新が必要な場合はスクリプトを再実行すること。");
lines.push("--");
lines.push("-- 出典: 総務省 全国地方公共団体コード / 市区町村名のローマ字表記");
lines.push("-- 市区町村の id は全国地方公共団体コードの上5桁(標準地域コード)。");
lines.push("-- 政令指定都市の区は市に集約されている(出典データの時点で集約済み)。");
lines.push("-- =========================================================================");
lines.push("");
lines.push("insert into public.prefectures (id, name, slug, sort_order) values");

const prefRows = [...prefectures.values()]
  .sort((a, b) => a.id - b.id)
  .map((p) => `  (${p.id}, ${sqlText(p.name)}, ${sqlText(p.slug)}, ${p.id})`);
lines.push(prefRows.join(",\n") + ";");
lines.push("");

lines.push("insert into public.municipalities (id, prefecture_id, name, slug, sort_order) values");
const muniRows = municipalities
  .sort((a, b) => a.id - b.id)
  .map((m) => `  (${m.id}, ${m.prefectureId}, ${sqlText(m.name)}, ${sqlText(m.slug)}, ${m.id})`);
lines.push(muniRows.join(",\n") + ";");
lines.push("");

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, lines.join("\n"), "utf8");

console.log(`出力: ${OUT_FILE}`);
console.log(`  都道府県: ${prefectures.size}件`);
console.log(`  市区町村: ${municipalities.length}件`);
if (collisions.length > 0) {
  console.log(`  slug重複を解消: ${collisions.length}件`);
  for (const c of collisions) console.log(`    - ${c}`);
}
if (skipped.length > 0) {
  console.log(`  ローマ字表記が無いため除外: ${skipped.length}件`);
  console.log(`    ${skipped.join(", ")}`);
}
