-- =========================================================================
-- フェーズ1: 公開サイトの骨格に必要なテーブル
-- 対応: docs/DATABASE_SCHEMA.md 1〜2、6
-- 申込み・計測・権限まわりのテーブルはフェーズ2以降で追加する。
-- =========================================================================

-- キーワード検索(道場名・ふりがな・紹介文の部分一致)に使用する
create extension if not exists pg_trgm;

-- -------------------------------------------------------------------------
-- 共通: updated_at の自動更新
-- -------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

-- =========================================================================
-- 1. マスタテーブル
-- =========================================================================

-- 都道府県(id は JIS 都道府県コード 1〜47)
create table public.prefectures (
  id          smallint primary key check (id between 1 and 47),
  name        text not null,
  slug        text not null unique,
  sort_order  smallint not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.prefectures is '都道府県マスタ。id は JIS 都道府県コード。';
comment on column public.prefectures.slug is 'URL用ローマ字(例: gunma)。/area/[pref] に使用。';

-- 市区町村(id は総務省 全国地方公共団体コード。政令指定都市の区は市に集約)
create table public.municipalities (
  id             integer primary key,
  prefecture_id  smallint not null references public.prefectures (id),
  name           text not null,
  slug           text not null,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- slug は同一県内で一意であればよい(例: fuchu は東京都と広島県の双方に存在する)
  unique (prefecture_id, slug)
);

create index municipalities_prefecture_id_idx on public.municipalities (prefecture_id);

comment on table public.municipalities is '市区町村マスタ。政令指定都市の区は市に集約して投入する。';

-- 流派マスタ(表記揺れは merged_into_id で管理者が統合できる)
create table public.styles (
  id              serial primary key,
  name            text not null unique,
  is_preset       boolean not null default false,
  merged_into_id  integer references public.styles (id),
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on column public.styles.merged_into_id is '表記揺れの統合先。値がある場合は検索候補に出さない。';

-- 会派・団体マスタ(styles と同構造)
create table public.organizations (
  id              serial primary key,
  name            text not null unique,
  is_preset       boolean not null default false,
  merged_into_id  integer references public.organizations (id),
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- =========================================================================
-- 2. 中核テーブル
-- =========================================================================

create table public.dojos (
  id                        uuid primary key default gen_random_uuid(),

  -- 基本情報
  name                      text not null,
  name_kana                 text,
  description               text,
  operator_name             text,
  representative_name       text,
  prefecture_id             smallint not null references public.prefectures (id),
  municipality_id           integer not null references public.municipalities (id),

  -- 電話受付
  phone                     text,
  phone_accepts             boolean not null default false,
  phone_days                text,
  phone_hours               text,
  phone_contact_name        text,
  phone_note                text,

  -- 連絡先・リンク
  email                     text,
  website_url               text,
  instagram_url             text,
  facebook_url              text,
  x_url                     text,
  line_url                  text,
  other_url                 text,

  -- 活動情報
  recruit_note              text,
  policy_note               text,
  beginner_note             text,
  beginner_welcome          boolean not null default false,
  tournament_note           text,
  achievements_note         text,
  para_support              boolean not null default false,
  para_note                 text,
  target_note               text,
  features_note             text,

  -- 指導者・段位(優劣判定や並び替えには使用しない)
  jkf_dan                   text,
  local_dan                 text,
  dan_note                  text,
  instructor_note           text,

  -- 費用(月会費)
  fee_min                   integer check (fee_min is null or fee_min >= 0),
  fee_max                   integer check (fee_max is null or fee_max >= 0),
  fee_note                  text,
  constraint dojos_fee_range_check check (fee_min is null or fee_max is null or fee_min <= fee_max),

  -- 体験・見学の受付方法
  accepts_form              boolean not null default false,
  accepts_phone             boolean not null default false,
  accepts_email             boolean not null default false,
  accepts_line              boolean not null default false,
  accepts_website           boolean not null default false,
  accepts_external_form     boolean not null default false,
  external_form_url         text,
  accepting_paused          boolean not null default false,

  -- 掲載確認・公開状態
  jkf_affiliation_confirmed boolean not null default false,
  is_published              boolean not null default false,

  -- 将来拡張用(MVPでは常に既定値のまま)
  priority_boost            integer not null default 0,
  plan                      text not null default 'free',

  -- 運用管理用(非公開)
  admin_note                text,
  flag_status               text not null default 'none' check (flag_status in ('none', 'reported', 'reviewing')),
  source                    text not null default 'owner' check (source in ('owner', 'admin', 'csv')),

  -- 公開情報の最終更新日(表示・並び順スコアに使用)
  last_content_update       timestamptz not null default now(),

  -- 開発用ダミーデータの目印。本番公開前(フェーズ8)に true の行を一括削除する
  is_sample_data            boolean not null default false,

  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

comment on column public.dojos.priority_boost is '将来の有料優先表示用。MVPでは全道場0のため並び順に影響しない。';
comment on column public.dojos.is_sample_data is '開発用ダミーデータの目印。本番公開前に一括削除するために使う。';
comment on column public.dojos.last_content_update is '公開情報の最終更新日。検索の並び順スコアに使用する。';

-- 検索用インデックス(docs/DATABASE_SCHEMA.md 6)
create index dojos_area_published_idx on public.dojos (prefecture_id, municipality_id, is_published);
create index dojos_fee_min_idx on public.dojos (fee_min);
create index dojos_fee_max_idx on public.dojos (fee_max);
create index dojos_name_trgm_idx on public.dojos using gin (name gin_trgm_ops);
create index dojos_name_kana_trgm_idx on public.dojos using gin (name_kana gin_trgm_ops);
create index dojos_description_trgm_idx on public.dojos using gin (description gin_trgm_ops);

-- 稽古場所(1道場に複数)
create table public.practice_locations (
  id               uuid primary key default gen_random_uuid(),
  dojo_id          uuid not null references public.dojos (id) on delete cascade,
  name             text not null,
  postal_code      text,
  prefecture_id    smallint references public.prefectures (id),
  municipality_id  integer references public.municipalities (id),
  address          text,
  building         text,
  lat              numeric(9, 6),
  lng              numeric(9, 6),
  gmap_url         text,
  parking_note     text,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index practice_locations_dojo_id_idx on public.practice_locations (dojo_id);

comment on column public.practice_locations.lat is '国土地理院APIで自動付与し、管理画面のピン操作で微調整する。運営者が数値を直接入力するUIにはしない。';

-- 稽古枠(曜日・時間)
create table public.practice_schedules (
  id           uuid primary key default gen_random_uuid(),
  location_id  uuid not null references public.practice_locations (id) on delete cascade,
  day_of_week  smallint not null check (day_of_week between 0 and 6),
  start_time   time not null,
  end_time     time not null,
  class_note   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index practice_schedules_location_day_idx on public.practice_schedules (location_id, day_of_week);

comment on column public.practice_schedules.day_of_week is '0=日曜 〜 6=土曜';

-- 道場 × 流派
create table public.dojo_styles (
  dojo_id     uuid not null references public.dojos (id) on delete cascade,
  style_id    integer not null references public.styles (id),
  free_text   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (dojo_id, style_id)
);

create index dojo_styles_style_id_idx on public.dojo_styles (style_id);

comment on column public.dojo_styles.free_text is 'その他を選んだ際の入力原文。';

-- 道場 × 会派・団体(任意)
create table public.dojo_organizations (
  dojo_id          uuid not null references public.dojos (id) on delete cascade,
  organization_id  integer not null references public.organizations (id),
  free_text        text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  primary key (dojo_id, organization_id)
);

create index dojo_organizations_organization_id_idx on public.dojo_organizations (organization_id);

-- 写真(MVPはアプリ側で1道場1枚に制限。テーブルは複数行を許容する)
create table public.dojo_photos (
  id                 uuid primary key default gen_random_uuid(),
  dojo_id            uuid not null references public.dojos (id) on delete cascade,
  storage_path       text not null,
  thumb_path         text not null,
  alt_text           text,
  consent_confirmed  boolean not null default false,
  is_hidden          boolean not null default false,
  sort_order         integer not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index dojo_photos_dojo_id_idx on public.dojo_photos (dojo_id);

comment on column public.dojo_photos.consent_confirmed is '被写体の掲載権限・肖像権に関する同意の確認チェック。';

-- =========================================================================
-- 3. updated_at トリガー
-- =========================================================================
do $do$
declare
  t text;
begin
  foreach t in array array[
    'prefectures', 'municipalities', 'styles', 'organizations',
    'dojos', 'practice_locations', 'practice_schedules',
    'dojo_styles', 'dojo_organizations', 'dojo_photos'
  ]
  loop
    execute format(
      'create trigger %I_set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()',
      t, t
    );
  end loop;
end;
$do$;
