-- =========================================================================
-- フェーズ1: 公開ページの閲覧に必要な RLS のみを設定する
--
-- 方針(docs/DATABASE_SCHEMA.md 5):
--   - 全テーブルで RLS を有効化する。「アプリ側で絞っているから不要」は禁止。
--   - このマイグレーションでは「未ログインの閲覧(SELECT)」だけを許可する。
--     書き込みポリシーは作らないため、anon / authenticated からの
--     INSERT / UPDATE / DELETE はすべて拒否される。
--   - owner / staff / admin 向けのポリシーはフェーズ2で追加する。
--   - service_role キーは RLS を迂回する(サーバー処理専用)。
-- =========================================================================

alter table public.prefectures         enable row level security;
alter table public.municipalities      enable row level security;
alter table public.styles              enable row level security;
alter table public.organizations       enable row level security;
alter table public.dojos               enable row level security;
alter table public.practice_locations  enable row level security;
alter table public.practice_schedules  enable row level security;
alter table public.dojo_styles         enable row level security;
alter table public.dojo_organizations  enable row level security;
alter table public.dojo_photos         enable row level security;

-- -------------------------------------------------------------------------
-- マスタ: 誰でも閲覧可能(地域セレクト・流派セレクトに使用)
-- -------------------------------------------------------------------------
create policy "マスタは誰でも閲覧できる" on public.prefectures
  for select to anon, authenticated using (true);

create policy "マスタは誰でも閲覧できる" on public.municipalities
  for select to anon, authenticated using (true);

create policy "マスタは誰でも閲覧できる" on public.styles
  for select to anon, authenticated using (true);

create policy "マスタは誰でも閲覧できる" on public.organizations
  for select to anon, authenticated using (true);

-- -------------------------------------------------------------------------
-- 道場: 公開中のものだけ閲覧可能
-- -------------------------------------------------------------------------
create policy "公開中の道場は誰でも閲覧できる" on public.dojos
  for select to anon, authenticated using (is_published);

-- -------------------------------------------------------------------------
-- 道場に紐づくデータ: 親の道場が公開中の場合のみ閲覧可能
-- -------------------------------------------------------------------------
create policy "公開中の道場の稽古場所は誰でも閲覧できる" on public.practice_locations
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.dojos d
      where d.id = practice_locations.dojo_id and d.is_published
    )
  );

create policy "公開中の道場の稽古枠は誰でも閲覧できる" on public.practice_schedules
  for select to anon, authenticated
  using (
    exists (
      select 1
      from public.practice_locations l
      join public.dojos d on d.id = l.dojo_id
      where l.id = practice_schedules.location_id and d.is_published
    )
  );

create policy "公開中の道場の流派は誰でも閲覧できる" on public.dojo_styles
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.dojos d
      where d.id = dojo_styles.dojo_id and d.is_published
    )
  );

create policy "公開中の道場の会派は誰でも閲覧できる" on public.dojo_organizations
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.dojos d
      where d.id = dojo_organizations.dojo_id and d.is_published
    )
  );

-- 写真は管理者が非公開化(is_hidden)したものを除外する
create policy "公開中の道場の写真は誰でも閲覧できる" on public.dojo_photos
  for select to anon, authenticated
  using (
    not is_hidden
    and exists (
      select 1 from public.dojos d
      where d.id = dojo_photos.dojo_id and d.is_published
    )
  );
