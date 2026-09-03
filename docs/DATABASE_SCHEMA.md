# データベース設計書(DATABASE_SCHEMA)

PostgreSQL(Supabase)。全テーブルに created_at / updated_at(トリガー自動更新)を持たせる。
主キーは uuid(gen_random_uuid())。マスタ系のみ数値ID可。

## 1. マスタテーブル

### prefectures(都道府県)
| カラム | 型 | 備考 |
|---|---|---|
| id | smallint PK | JIS都道府県コード(1〜47) |
| name | text | 群馬県 |
| slug | text UNIQUE | gunma(URL用ローマ字) |

### municipalities(市区町村)
| カラム | 型 | 備考 |
|---|---|---|
| id | integer PK | 総務省 全国地方公共団体コード |
| prefecture_id | smallint FK | |
| name | text | 前橋市 |
| slug | text | maebashi(県内UNIQUE) |

政令指定都市の区は市に集約して投入する。

### styles(流派マスタ)
| カラム | 型 | 備考 |
|---|---|---|
| id | serial PK | |
| name | text UNIQUE | 松濤館流/剛柔流/糸東流/和道流+自由入力から追加 |
| is_preset | boolean | 初期4流派はtrue |
| merged_into_id | integer FK NULL | 表記揺れ統合先(管理者操作) |

### organizations(会派・団体マスタ)
styles と同構造。初期値: 日本空手協会/全日本空手道連盟剛柔会/全日本空手道連盟糸東会/全日本空手道連盟和道会。

## 2. 中核テーブル

### dojos(道場)
| カラム | 型 | 備考 |
|---|---|---|
| id | uuid PK | |
| name | text NOT NULL | 道場名 |
| name_kana | text | ふりがな |
| description | text | 紹介文 |
| operator_name | text NULL | 運営団体名(道場名と異なる場合のみ) |
| representative_name | text | 代表者氏名 |
| prefecture_id | smallint FK NOT NULL | 主たる所在 |
| municipality_id | integer FK NOT NULL | 主な市区町村 |
| phone | text NULL | |
| phone_accepts | boolean default false | 電話受付可否 |
| phone_days | text NULL | 受付曜日(自由記述) |
| phone_hours | text NULL | 受付時間(自由記述) |
| phone_contact_name | text NULL | 担当窓口名 |
| phone_note | text NULL | 補足(稽古中は出られない等) |
| email | text NULL | 通知送信先 |
| website_url / instagram_url / facebook_url / x_url / line_url / other_url | text NULL | 各リンク |
| recruit_note | text NULL | 生徒募集自由記述 |
| policy_note | text NULL | 活動内容・指導方針 |
| beginner_note | text NULL | 初心者受入れ自由記述 |
| beginner_welcome | boolean default false | 検索用フラグ |
| tournament_note | text NULL | 大会参加自由記述 |
| achievements_note | text NULL | 道場の主な大会実績 |
| para_support | boolean default false | パラ空手・障害者対応 |
| para_note | text NULL | 対応補足 |
| target_note | text NULL | 対象者(幼児から成人まで 等) |
| features_note | text NULL | その他の特徴 |
| jkf_dan | text NULL | 全空連公認段位(例: 全空連公認三段) |
| local_dan | text NULL | 都道府県連盟等の段位 |
| dan_note | text NULL | その他段位補足 |
| instructor_note | text NULL | 代表者・指導者紹介 |
| fee_min | integer NULL | 月会費最低額(円) |
| fee_max | integer NULL | 月会費最高額(円) |
| fee_note | text NULL | 月会費補足 |
| accepts_form / accepts_phone / accepts_email / accepts_line / accepts_website / accepts_external_form | boolean default false | 受付方法 |
| external_form_url | text NULL | 外部フォームURL |
| accepting_paused | boolean default false | 受付停止中 |
| jkf_affiliation_confirmed | boolean NOT NULL default false | 全空連系自己申告チェック |
| is_published | boolean default false | 公開状態 |
| priority_boost | integer default 0 | 将来の有料優先表示用(MVPでは常に0) |
| plan | text default 'free' | 将来の課金用 |
| admin_note | text NULL | 運営管理用メモ(非公開) |
| flag_status | text default 'none' | none/reported/reviewing(非公開・管理用) |
| source | text default 'owner' | owner/admin/csv(登録経路) |
| last_content_update | timestamptz | 公開情報の最終更新日(表示用) |

### practice_locations(稽古場所)
| カラム | 型 | 備考 |
|---|---|---|
| id | uuid PK | |
| dojo_id | uuid FK NOT NULL | ON DELETE CASCADE |
| name | text NOT NULL | 場所名(○○公民館 等) |
| postal_code | text NULL | |
| prefecture_id | smallint FK | |
| municipality_id | integer FK | |
| address | text | 番地まで |
| building | text NULL | 建物・施設名 |
| lat / lng | numeric NULL | 国土地理院APIで自動付与+管理画面で微調整 |
| gmap_url | text NULL | Googleマップリンク(自動生成、手動上書き可) |
| parking_note | text NULL | 駐車場自由記述 |
| sort_order | integer default 0 | |

### practice_schedules(稽古枠)
| カラム | 型 | 備考 |
|---|---|---|
| id | uuid PK | |
| location_id | uuid FK NOT NULL | ON DELETE CASCADE |
| day_of_week | smallint NOT NULL | 0=日〜6=土 |
| start_time / end_time | time NOT NULL | |
| class_note | text NULL | 対象・クラス補足(幼児クラス 等) |

### dojo_styles(道場×流派)
dojo_id / style_id 複合PK。free_text(その他選択時の原文)を保持。

### dojo_organizations(道場×会派)
dojo_id / organization_id 複合PK。free_text 保持。任意項目。

### dojo_photos(写真)
| カラム | 型 | 備考 |
|---|---|---|
| id | uuid PK | |
| dojo_id | uuid FK NOT NULL | |
| storage_path | text NOT NULL | 原本(WebP変換済) |
| thumb_path | text NOT NULL | サムネイル |
| alt_text | text NULL | |
| consent_confirmed | boolean NOT NULL | 肖像権同意チェック |
| is_hidden | boolean default false | 管理者非公開化 |
| sort_order | integer default 0 | 将来の複数写真用 |

MVPではアプリ側で1道場1枚に制限(2枚目は差し替え)。テーブルは複数行対応。

## 3. ユーザー・権限

### profiles(auth.users と1:1)
| カラム | 型 | 備考 |
|---|---|---|
| id | uuid PK | auth.users.id と同一 |
| display_name | text | |
| role | text NOT NULL default 'owner' | 'admin' / 'staff' / 'owner' |
| is_active | boolean default true | 無効化用 |

### dojo_managers(管理権限: user×dojo)
| カラム | 型 | 備考 |
|---|---|---|
| user_id / dojo_id | 複合PK | 1アカウントで複数道場を管理可 |
| granted_by | uuid FK | 承認した管理者 |
| granted_at | timestamptz | |

### manager_claims(管理権限申請)
| カラム | 型 | 備考 |
|---|---|---|
| id | uuid PK | |
| dojo_id / user_id | FK | |
| reason | text | 申請理由・道場との関係 |
| contact | text | 確認用連絡先 |
| status | text | pending / approved / rejected |
| reviewed_by | uuid NULL | 承認者 |
| reviewed_at | timestamptz NULL | |
| verify_note | text NULL | 確認方法メモ(電話確認済み 等) |

## 4. 申込み・計測・運用

### trial_applications(体験・見学申込み)
| カラム | 型 | 備考 |
|---|---|---|
| id | uuid PK | |
| dojo_id | uuid FK NOT NULL | |
| location_id | uuid FK NULL | 希望稽古場所(任意) |
| applicant_name | text | 匿名化対象 |
| participant_age_band | text NOT NULL | preschool/es_low/es_high/jhs/hs/adult |
| is_minor | boolean | 年代から自動判定 |
| email | text | 匿名化対象 |
| phone | text | 匿名化対象 |
| preferred_date | date NULL | |
| needs_consultation | boolean default false | 日程相談したい |
| visit_type | text NOT NULL | 'kengaku' / 'taiken' |
| has_experience | boolean NOT NULL | |
| message | text NULL | 匿名化対象 |
| status | text default 'received' | received/in_progress/done/cancelled/other |
| anonymized_at | timestamptz NULL | 匿名化実行日時 |

匿名化ジョブ(pg_cron 日次): created_at から180日経過かつ anonymized_at IS NULL の行の applicant_name / email / phone / message をNULL化し anonymized_at を記録。統計項目(道場・地域・日時・区分・状態)は残す。

### phone_tap_events(電話タップ計測)
| カラム | 型 | 備考 |
|---|---|---|
| id | bigserial PK | |
| dojo_id | uuid FK NOT NULL | |
| location_id | uuid FK NULL | |
| tapped_at | timestamptz default now() | |
| referrer_path | text NULL | 流入ページ |
| session_hash | text NULL | 匿名化セッション(cookie値のハッシュ。個人特定情報なし) |

### reports(通報・修正依頼・削除依頼)
id / dojo_id NULL可 / type(report/fix/delete) / body / reporter_contact NULL可 / status(open/in_progress/closed) / handled_by / handled_note

### audit_logs(監査ログ)
id / actor_id / actor_role / action(text) / target_table / target_id / diff(jsonb) / created_at。
全更新系Server Actionから記録。ownerの編集、adminの承認・削除・統合・権限操作を必ず含む。

### subscriptions(将来のStripe用・骨組みのみ)
id / dojo_id / stripe_customer_id / stripe_subscription_id / status / current_period_end。MVPでは行を作らない。

## 5. Row Level Security(RLS)方針

全テーブルでRLSを有効化する。

| テーブル | anon(未ログイン) | owner | staff | admin |
|---|---|---|---|---|
| dojos, practice_locations, practice_schedules, dojo_styles, dojo_organizations, dojo_photos | is_published=true(かつphoto is_hidden=false)の道場のみSELECT | 自分がdojo_managersに載る道場をSELECT/UPDATE(dojosのINSERTは可、削除不可) | 全SELECT/UPDATE(DELETE不可) | 全操作 |
| trial_applications | INSERTのみ(Server Action経由) | 自分の管理道場分をSELECT/status UPDATE | 全SELECT | 全操作 |
| phone_tap_events | INSERTのみ(API経由) | 自分の管理道場分の集計SELECT | 全SELECT | 全操作 |
| manager_claims | — | 自分の申請をINSERT/SELECT | SELECT | 全操作 |
| profiles | — | 自分の行のみ | SELECT | 全操作 |
| audit_logs | — | — | SELECT | SELECT(改変不可、INSERTはサービスロールのみ) |
| reports | INSERT | — | SELECT/UPDATE | 全操作 |

- role判定はprofiles.roleを参照するSECURITY DEFINER関数で行う
- SUPABASE_SERVICE_ROLE_KEY はサーバー側処理(CSV一括登録・統合・匿名化cron)のみで使用

## 6. インデックス

- dojos: (prefecture_id, municipality_id, is_published), fee_min, fee_max, GINインデックス(pg_trgm: name, name_kana, description)
- practice_schedules: (location_id, day_of_week)
- practice_locations: (dojo_id)
- trial_applications: (dojo_id, created_at), (status)
- phone_tap_events: (dojo_id, tapped_at)

## 7. 重複統合(mergeDojos)の仕様

1. 管理者が keep / remove の2道場を指定
2. remove側の practice_locations, dojo_photos(keep側に写真がない場合のみ), trial_applications, phone_tap_events, dojo_managers, manager_claims を keep へ付け替え
3. dojo_styles / dojo_organizations は和集合
4. remove を削除し、audit_logs に統合前スナップショット(jsonb)を保存
5. トランザクションで実行
