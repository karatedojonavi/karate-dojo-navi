# 空手道場ナビ(仮称)

全日本空手道連盟(全空連)系の道場・空手教室に特化した、全国対応の道場検索プラットフォームです。

> 本サイトは全日本空手道連盟の公式サイトではありません。

## ドキュメント

仕様・設計はすべて `docs/` にあります。実装前に該当ドキュメントを読んでください。
プロジェクト全体の方針は [CLAUDE.md](./CLAUDE.md) にまとめています。

| ファイル | 内容 |
|---|---|
| [docs/PRODUCT_REQUIREMENTS.md](./docs/PRODUCT_REQUIREMENTS.md) | 製品要件・画面・ユーザーフロー |
| [docs/TECHNICAL_DESIGN.md](./docs/TECHNICAL_DESIGN.md) | 技術スタック・構成・環境変数 |
| [docs/DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md) | データモデル・RLS |
| [docs/SECURITY_AND_PRIVACY.md](./docs/SECURITY_AND_PRIVACY.md) | セキュリティ・個人情報・法務 |
| [docs/SEO_CONTENT_PLAN.md](./docs/SEO_CONTENT_PLAN.md) | URL構造・SEO |
| [docs/IMPLEMENTATION_PLAN.md](./docs/IMPLEMENTATION_PLAN.md) | フェーズ0〜8の実装計画 |
| [docs/OPERATIONS.md](./docs/OPERATIONS.md) | 非エンジニア向け運用マニュアル |

## 技術スタック

Next.js 16(App Router)/ TypeScript / Tailwind CSS v4 / Supabase / Vercel / Resend / Sentry

## セットアップ

```bash
# 1. 依存パッケージのインストール
npm install

# 2. 環境変数の用意(値は docs/OPERATIONS.md を参照)
cp .env.example .env.local

# 3. 開発サーバー起動 → http://localhost:3000
npm run dev
```

E2Eテストを実行する場合は、初回のみブラウザの取得が必要です。

```bash
npx playwright install chromium
```

## よく使うコマンド

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 本番ビルド |
| `npm run check` | 型チェック + Lint + 単体テストをまとめて実行 |
| `npm run test` | 単体テスト(Vitest) |
| `npm run test:e2e` | E2Eテスト(Playwright) |
| `npm run format` | Prettier で整形 |

## ディレクトリ構成

```
app/          画面(App Router)
components/   UIコンポーネント
lib/          設定・Supabaseクライアント・共通ロジック
e2e/          Playwright の E2E テスト
docs/         仕様・設計ドキュメント
supabase/     マイグレーション・seed(フェーズ1以降)
```
