# 技術設計書(TECHNICAL_DESIGN)

## 1. 技術スタック(確定と根拠)

| 領域 | 採用 | 根拠 |
|---|---|---|
| フレームワーク | Next.js (App Router) + TypeScript | SSR/SSGによるSEO対応、Server Actionsでフォーム処理を安全に完結、Claude Codeとの相性が良い |
| スタイリング | Tailwind CSS | モバイルファースト設計が容易、保守者が変わっても読みやすい |
| DB/認証/ストレージ | Supabase (PostgreSQL / Auth / Storage) | 無料枠で開始可能、RLSで権限制御、自動バックアップ(Pro)あり |
| ホスティング | Vercel | Next.jsとの親和性、自動デプロイ、無料枠あり |
| メール送信 | Resend | 無料枠3,000通/月、実装が単純 |
| 地図 | MVPは埋め込みなし。Googleマップへの外部リンク+国土地理院ジオコーディングAPI | Google Maps Platformの従量課金・APIキー管理リスクを回避。国土地理院APIは無料・キー不要 |
| ジオコーディング補正 | 管理画面のみ Leaflet + OpenStreetMap でピン微調整UI | 無料。一般公開ページには地図を埋め込まない(MVP) |
| エラー監視 | Sentry(無料枠) | 障害の自動通知(運営継続性要件) |
| アクセス解析 | Vercel Analytics または Umami | 個人情報を収集しない軽量解析 |
| 決済(将来) | Stripe | MVPでは実装しない。契約状態カラムのみDB設計に含める |

## 2. アーキテクチャ方針

- データ取得: React Server Components でSupabaseから直接取得(公開データ)
- データ更新: Server Actions のみ(APIルートは電話タップ計測など最小限)
- 認証: Supabase Auth(メール+パスワード)。roleは profiles テーブルで管理(admin / staff / owner)
- アクセス制御: Supabase RLS を必須とする。「アプリ側で絞っているからRLS不要」は禁止
- 画像: Supabase Storage。アップロード時にサーバー側で検証(MIME/容量)→リサイズ・WebP変換(sharp)→保存。1道場1枚制約はDBで担保
- 検索: PostgreSQLクエリ+インデックス。キーワード検索は pg_trgm による部分一致(道場名・ふりがな・紹介文)
- 地域マスタ: 総務省の全国地方公共団体コードに基づく都道府県・市区町村マスタを初期投入(政令市の区は市に集約)
- 個人情報の自動匿名化: Supabase の pg_cron で日次実行(SECURITY_AND_PRIVACY.md 参照)

## 3. ディレクトリ構成

```
/
├── CLAUDE.md
├── docs/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                    # トップ
│   │   ├── search/page.tsx             # 検索結果
│   │   ├── dojos/[id]/page.tsx         # 道場詳細
│   │   ├── dojos/[id]/apply/page.tsx   # 体験申込み
│   │   ├── area/[pref]/page.tsx        # 都道府県ページ
│   │   ├── area/[pref]/[city]/page.tsx # 市区町村ページ
│   │   ├── about/ guide/ faq/ for-dojos/ terms/ privacy/ guidelines/ contact/
│   ├── owner/                          # 運営者マイページ(認証必須)
│   ├── admin/                          # 管理者画面(admin/staff権限必須)
│   ├── api/
│   │   └── phone-tap/route.ts          # タップ計測(POST)
│   ├── sitemap.ts
│   └── robots.ts
├── components/                         # UIコンポーネント
├── lib/
│   ├── supabase/                       # クライアント生成(server/client/admin)
│   ├── actions/                        # Server Actions(dojo, location, application, claim, admin)
│   ├── validation/                     # zodスキーマ
│   ├── geocode.ts                      # 国土地理院API
│   ├── email.ts                        # Resend送信
│   └── search.ts                       # 検索クエリ・並び順スコア
├── supabase/
│   ├── migrations/                     # SQLマイグレーション
│   └── seed.sql                        # 地域マスタ・流派マスタ・ダミーデータ
└── public/
```

## 4. 環境変数一覧

| 変数名 | 用途 | 備考 |
|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL | Supabase接続 | 公開可 |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase匿名キー | 公開可(RLS前提) |
| SUPABASE_SERVICE_ROLE_KEY | 管理処理・cron | サーバーのみ。絶対にクライアントへ出さない |
| RESEND_API_KEY | メール送信 | サーバーのみ |
| NEXT_PUBLIC_SITE_URL | canonical/OGP生成 | 本番ドメイン |
| SENTRY_DSN | エラー監視 | 任意 |
| ADMIN_NOTIFICATION_EMAIL | 通報・申請の管理者通知先 | 複数可(カンマ区切り) |
| CRON_SECRET | 定期処理エンドポイント保護 | サーバーのみ |

.env.example を必ず用意し、OPERATIONS.md に各キーの再発行手順を記載すること。

## 5. Server Actions / API 一覧

### 公開側
- submitApplication(dojoId, formData): 体験・見学申込み。zod検証→honeypot/レート制限→INSERT→道場へ通知メール→申込者へ自動返信
- POST /api/phone-tap: { dojoId, locationId?, referrer } を記録。レスポンス即時返却(計測失敗でも発信を妨げない)

### 運営者側(要認証+RLS)
- claimDojo(dojoId, reason, contact): 管理権限申請
- createDojo(data): 新規道場登録(全空連系確認チェック必須)
- updateDojo(dojoId, data) / upsertLocation / deleteLocation / upsertScheduleSlots
- uploadDojoPhoto(dojoId, file): 検証→変換→差し替え(旧画像削除)
- updateApplicationStatus(applicationId, status)

### 管理者側(要admin/staff権限)
- approveClaim / rejectClaim(claimId, note)
- adminUpsertDojo / setDojoVisibility / deleteDojo
- importDojosCsv(file): 検証→エラー行レポート→一括INSERT
- exportDojosCsv()
- mergeDojos(keepId, removeId): 関連データ付け替え→削除→監査ログ
- resolveReport(reportId, action)
- grantRole / revokeRole(userId, role)(adminのみ、staffは不可)

すべての更新系アクションは audit_logs に記録する。

## 6. 検索実装

- WHERE句: prefecture_id / municipality_id / 稽古曜日(EXISTS practice_schedules)/ 月会費範囲(fee_min/fee_maxとの重なり判定)/ 流派(EXISTS dojo_styles)/ キーワード(pg_trgm: name, name_kana, description)/ is_published = true
- 並び順スコア(SQLで算出):
  - 市区町村一致 +100、都道府県のみ一致 +50
  - 情報充実度: 紹介文あり+10、写真あり+10、稽古場所1件以上+10、費用登録+10、指導方針あり+5
  - 更新日: 90日以内+10、365日以内+5
  - ORDER BY score DESC, name_kana ASC
- 有料優先表示は実装しないが、将来用に dojos.priority_boost(integer, default 0)をスコア式に加算項として最初から組み込んでおく(全道場0のため影響なし)

## 7. 画像処理仕様

- 受付形式: JPG / PNG / WebP、上限8MB
- サーバー側で sharp により 長辺1600px にリサイズ→WebP変換(品質80)→Storage保存。サムネイル(長辺480px)も生成
- 代替テキスト(alt)を任意入力、未入力時は「(道場名)の写真」
- 未登録時は共通のデフォルト画像を表示
- 削除時はStorageの実ファイルも削除

## 8. メール通知一覧(Resend)

| トリガー | 宛先 | 内容 |
|---|---|---|
| 体験・見学申込み | 道場メール | 申込内容全文+マイページリンク |
| 体験・見学申込み | 申込者 | 受付完了・道場から連絡が来る旨・キャンセル連絡先 |
| 管理権限申請 | 管理者 | 申請内容+承認画面リンク |
| 申請承認/却下 | 申請者 | 結果+理由 |
| 通報受付 | 管理者 | 通報内容 |

送信ドメイン認証(SPF/DKIM)を設定し、送信失敗はSentryに記録する。

## 9. テスト方針

- 単体テスト(Vitest): zodスキーマ、並び順スコア計算、費用範囲の重なり判定、匿名化処理
- 結合テスト: 申込みフロー(送信→DB→通知)、権限(owner が他道場を編集できないこと=RLSテスト)
- E2E(Playwright、主要動線のみ): 検索→詳細→申込み、運営者ログイン→編集、管理者承認
- 各フェーズの完了条件にテスト合格を含める(IMPLEMENTATION_PLAN.md)

## 10. デプロイ・環境

- 環境: local(supabase local または開発プロジェクト)/ production(Vercel + Supabase)
- GitHubリポジトリ(private)→ mainマージでVercel自動デプロイ
- マイグレーションは supabase/migrations で管理し、手動でのテーブル変更を禁止
- 本番公開前チェックリストは IMPLEMENTATION_PLAN.md フェーズ8に記載

## 11. 将来拡張のための予約設計(実装はしない)

- dojos.plan(text, default 'free')/ subscriptions テーブル(Stripe連携用の骨組みのみ定義)
- dojo_photos は複数行を許容する構造(MVPはアプリ側で1枚制限)
- コンテンツページ(空手用品紹介等)用に汎用 pages テーブルは作らず、将来 MDX で追加する方針とだけ記す
- 多言語: ルーティングを /(ja固定) とし、i18nは導入しない
