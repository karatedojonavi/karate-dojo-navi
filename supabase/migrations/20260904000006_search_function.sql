-- =========================================================================
-- フェーズ1: 道場検索(絞り込み + 並び順スコア + ページング)
-- 対応: docs/TECHNICAL_DESIGN.md 6「検索実装」
--
-- 並び順スコアの式は lib/search.ts の calculateSortScore と同一である。
-- 片方だけを変更しないこと(単体テストで定数を固定している)。
-- =========================================================================

-- -------------------------------------------------------------------------
-- 情報の充実度スコア
-- 「情報を登録している道場を見つけやすくする」ための加点であり、
-- 指導内容の優劣を表すものではない(CLAUDE.md 判断原則3)。
-- -------------------------------------------------------------------------
create or replace function public.dojo_content_score(p_dojo_id uuid)
returns integer
language sql
stable
as $function$
  select
    -- 紹介文あり +10
    case when nullif(btrim(coalesce(d.description, '')), '') is not null then 10 else 0 end
    -- 写真あり +10
    + case when exists (
        select 1 from public.dojo_photos p
        where p.dojo_id = d.id and not p.is_hidden
      ) then 10 else 0 end
    -- 稽古場所1件以上 +10
    + case when exists (
        select 1 from public.practice_locations l where l.dojo_id = d.id
      ) then 10 else 0 end
    -- 費用登録 +10
    + case when d.fee_min is not null or d.fee_max is not null then 10 else 0 end
    -- 指導方針あり +5
    + case when nullif(btrim(coalesce(d.policy_note, '')), '') is not null then 5 else 0 end
    -- 更新日の新しさ: 90日以内 +10 / 365日以内 +5
    + case
        when d.last_content_update >= now() - interval '90 days' then 10
        when d.last_content_update >= now() - interval '365 days' then 5
        else 0
      end
    -- 将来の有料優先表示用。MVPでは全道場0のため影響しない
    + d.priority_boost
  from public.dojos d
  where d.id = p_dojo_id;
$function$;

-- -------------------------------------------------------------------------
-- 検索本体
--
-- 引数はすべて任意。null を渡すとその条件で絞り込まない。
--   p_days      : 稽古曜日(0=日 〜 6=土)。いずれかに該当すれば対象
--   p_fee_min/max: 月会費の希望範囲。道場の登録範囲と重なるものを対象とする
--                  (月会費が未登録の道場は、費用で絞り込むと対象外になる)
--   p_style_ids : 流派。いずれかに該当すれば対象
--   p_keyword   : 道場名・ふりがな・紹介文の部分一致
-- -------------------------------------------------------------------------
create or replace function public.search_dojos(
  p_prefecture_id    smallint default null,
  p_municipality_id  integer default null,
  p_days             smallint[] default null,
  p_fee_min          integer default null,
  p_fee_max          integer default null,
  p_style_ids        integer[] default null,
  p_keyword          text default null,
  p_beginner_welcome boolean default false,
  p_para_support     boolean default false,
  p_limit            integer default 20,
  p_offset           integer default 0
)
returns table (
  id                  uuid,
  name                text,
  name_kana           text,
  description         text,
  prefecture_id       smallint,
  prefecture_name     text,
  prefecture_slug     text,
  municipality_id     integer,
  municipality_name   text,
  municipality_slug   text,
  fee_min             integer,
  fee_max             integer,
  fee_note            text,
  beginner_welcome    boolean,
  para_support        boolean,
  accepts_form        boolean,
  accepts_phone       boolean,
  accepts_email       boolean,
  accepts_line        boolean,
  accepts_website     boolean,
  accepts_external_form boolean,
  accepting_paused    boolean,
  thumb_path          text,
  photo_alt           text,
  style_names         text[],
  practice_days       smallint[],
  score               integer,
  total_count         bigint
)
language sql
stable
security invoker
set search_path = public
as $function$
  with filtered as (
    select d.*
    from public.dojos d
    where d.is_published
      and (p_prefecture_id is null or d.prefecture_id = p_prefecture_id)
      and (p_municipality_id is null or d.municipality_id = p_municipality_id)
      and (not p_beginner_welcome or d.beginner_welcome)
      and (not p_para_support or d.para_support)
      -- 稽古曜日
      and (
        p_days is null or array_length(p_days, 1) is null or exists (
          select 1
          from public.practice_locations l
          join public.practice_schedules s on s.location_id = l.id
          where l.dojo_id = d.id and s.day_of_week = any (p_days)
        )
      )
      -- 流派
      and (
        p_style_ids is null or array_length(p_style_ids, 1) is null or exists (
          select 1 from public.dojo_styles ds
          where ds.dojo_id = d.id and ds.style_id = any (p_style_ids)
        )
      )
      -- 月会費(希望範囲と道場の登録範囲が重なるか)
      and (
        (p_fee_min is null and p_fee_max is null)
        or (
          (d.fee_min is not null or d.fee_max is not null)
          and coalesce(d.fee_min, d.fee_max) <= coalesce(p_fee_max, 2147483647)
          and coalesce(d.fee_max, d.fee_min) >= coalesce(p_fee_min, 0)
        )
      )
      -- キーワード(道場名・ふりがな・紹介文の部分一致)
      and (
        p_keyword is null or btrim(p_keyword) = ''
        or d.name ilike '%' || btrim(p_keyword) || '%'
        or coalesce(d.name_kana, '') ilike '%' || btrim(p_keyword) || '%'
        or coalesce(d.description, '') ilike '%' || btrim(p_keyword) || '%'
      )
  ),
  scored as (
    select
      f.*,
      (
        -- 地域の一致度: 市区町村一致 +100 / 都道府県のみ一致 +50
        case
          when p_municipality_id is not null and f.municipality_id = p_municipality_id then 100
          when p_prefecture_id is not null and f.prefecture_id = p_prefecture_id then 50
          else 0
        end
        + public.dojo_content_score(f.id)
      )::integer as score
    from filtered f
  )
  select
    s.id,
    s.name,
    s.name_kana,
    s.description,
    s.prefecture_id,
    pref.name as prefecture_name,
    pref.slug as prefecture_slug,
    s.municipality_id,
    muni.name as municipality_name,
    muni.slug as municipality_slug,
    s.fee_min,
    s.fee_max,
    s.fee_note,
    s.beginner_welcome,
    s.para_support,
    s.accepts_form,
    s.accepts_phone,
    s.accepts_email,
    s.accepts_line,
    s.accepts_website,
    s.accepts_external_form,
    s.accepting_paused,
    photo.thumb_path,
    photo.alt_text as photo_alt,
    coalesce(
      (
        select array_agg(st.name order by st.sort_order, st.id)
        from public.dojo_styles ds
        join public.styles st on st.id = ds.style_id
        where ds.dojo_id = s.id
      ),
      array[]::text[]
    ) as style_names,
    coalesce(
      (
        select array_agg(distinct sc.day_of_week)
        from public.practice_locations l
        join public.practice_schedules sc on sc.location_id = l.id
        where l.dojo_id = s.id
      ),
      array[]::smallint[]
    ) as practice_days,
    s.score,
    count(*) over () as total_count
  from scored s
  join public.prefectures pref on pref.id = s.prefecture_id
  join public.municipalities muni on muni.id = s.municipality_id
  left join lateral (
    select p.thumb_path, p.alt_text
    from public.dojo_photos p
    where p.dojo_id = s.id and not p.is_hidden
    order by p.sort_order, p.created_at
    limit 1
  ) photo on true
  order by s.score desc, coalesce(s.name_kana, s.name) asc, s.id asc
  limit greatest(p_limit, 0)
  offset greatest(p_offset, 0);
$function$;

-- 未ログインの利用者からも検索できるようにする(RLS は関数内のクエリに適用される)
grant execute on function public.search_dojos(
  smallint, integer, smallint[], integer, integer, integer[], text, boolean, boolean, integer, integer
) to anon, authenticated;

grant execute on function public.dojo_content_score(uuid) to anon, authenticated;
