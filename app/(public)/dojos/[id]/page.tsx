import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDojoById } from "@/lib/queries/dojos";
import { formatFeeRange, DAY_LABELS } from "@/lib/search";
import { WeeklySchedule, formatTime } from "@/components/dojo/weekly-schedule";
import { siteConfig } from "@/lib/config/site";

export async function generateMetadata(props: PageProps<"/dojos/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const dojo = await getDojoById(id);
  if (!dojo) return { title: "道場が見つかりません" };

  return {
    title: `${dojo.name}(${dojo.municipalities.name}の空手道場)`,
    description: `${dojo.name}の稽古場所・曜日・月会費・流派・体験申込み情報。`,
    alternates: { canonical: `${siteConfig.url}/dojos/${dojo.id}` },
  };
}

/** 住所からGoogleマップの検索リンクを作る(地図は埋め込まず外部リンクにする) */
function googleMapsUrl(address: string | null, name: string): string {
  const query = [address, name].filter(Boolean).join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-brand-100 border-t py-6">
      <h2 className="text-brand-800 text-lg font-bold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** 改行を保った自由記述の表示 */
function FreeText({ text }: { text: string }) {
  return <p className="text-ink-muted text-sm leading-relaxed whitespace-pre-wrap">{text}</p>;
}

export default async function DojoDetailPage(props: PageProps<"/dojos/[id]">) {
  const { id } = await props.params;
  const dojo = await getDojoById(id);
  if (!dojo) notFound();

  const styles = dojo.dojo_styles.map((s) => s.free_text || s.styles.name);
  const organizations = dojo.dojo_organizations.map((o) => o.free_text || o.organizations.name);
  const links = [
    { label: "公式ホームページ", url: dojo.website_url },
    { label: "Instagram", url: dojo.instagram_url },
    { label: "Facebook", url: dojo.facebook_url },
    { label: "X", url: dojo.x_url },
    { label: "LINE", url: dojo.line_url },
    { label: "その他", url: dojo.other_url },
  ].filter((link) => link.url);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* パンくず */}
      <nav aria-label="パンくずリスト" className="text-ink-muted text-xs">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/" className="hover:underline">
              トップ
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li>
            <Link href={`/area/${dojo.prefectures.slug}`} className="hover:underline">
              {dojo.prefectures.name}
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li>
            <Link
              href={`/area/${dojo.prefectures.slug}/${dojo.municipalities.slug}`}
              className="hover:underline"
            >
              {dojo.municipalities.name}
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li aria-current="page">{dojo.name}</li>
        </ol>
      </nav>

      {/* 1. 道場名・流派・地域・写真 ------------------------------------- */}
      <header className="mt-4">
        <h1 className="text-brand-800 text-2xl font-bold">{dojo.name}</h1>
        {dojo.name_kana && <p className="text-ink-muted mt-1 text-sm">{dojo.name_kana}</p>}
        <p className="text-ink-muted mt-2 text-sm">
          {dojo.prefectures.name} {dojo.municipalities.name}
        </p>
        {styles.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {styles.map((style) => (
              <li
                key={style}
                className="border-brand-200 bg-brand-50 text-brand-700 rounded border px-2 py-0.5 text-xs"
              >
                {style}
              </li>
            ))}
          </ul>
        )}
        <div
          aria-hidden="true"
          className="bg-brand-100 text-brand-400 mt-4 flex h-44 items-center justify-center rounded-lg text-4xl font-bold"
        >
          空
        </div>
      </header>

      {/* 2. 体験・見学の申込み(最重要CTA)------------------------------- */}
      <section className="border-accent-200 bg-accent-50 mt-6 rounded-lg border p-4">
        <h2 className="text-accent-700 text-lg font-bold">体験・見学のお申し込み</h2>

        {dojo.accepting_paused ? (
          <p className="text-ink-muted mt-2 text-sm">
            現在は体験・見学の受付を停止しています。再開の時期については道場へお問い合わせください。
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {dojo.accepts_form && (
              <Link
                href={`/dojos/${dojo.id}/apply`}
                className="bg-accent-600 hover:bg-accent-700 block rounded-md px-4 py-3 text-center text-base font-bold text-white"
              >
                このサイトから申し込む
              </Link>
            )}
            {dojo.accepts_phone && dojo.phone && (
              <a
                href={`tel:${dojo.phone.replace(/[^0-9+]/g, "")}`}
                className="border-accent-300 bg-surface text-accent-700 hover:bg-accent-100 block rounded-md border px-4 py-3 text-center text-base font-bold"
              >
                電話でお問い合わせ({dojo.phone})
              </a>
            )}
            {dojo.accepts_email && dojo.email && (
              <a
                href={`mailto:${dojo.email}`}
                className="border-accent-300 bg-surface text-accent-700 hover:bg-accent-100 block rounded-md border px-4 py-3 text-center text-sm font-semibold"
              >
                メールで問い合わせる
              </a>
            )}
            {dojo.accepts_line && dojo.line_url && (
              <a
                href={dojo.line_url}
                target="_blank"
                rel="noopener noreferrer"
                className="border-accent-300 bg-surface text-accent-700 hover:bg-accent-100 block rounded-md border px-4 py-3 text-center text-sm font-semibold"
              >
                LINEで問い合わせる
              </a>
            )}
            {dojo.accepts_website && dojo.website_url && (
              <a
                href={dojo.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="border-accent-300 bg-surface text-accent-700 hover:bg-accent-100 block rounded-md border px-4 py-3 text-center text-sm font-semibold"
              >
                公式ホームページから申し込む
              </a>
            )}
            {dojo.accepts_external_form && dojo.external_form_url && (
              <a
                href={dojo.external_form_url}
                target="_blank"
                rel="noopener noreferrer"
                className="border-accent-300 bg-surface text-accent-700 hover:bg-accent-100 block rounded-md border px-4 py-3 text-center text-sm font-semibold"
              >
                道場の申込みフォームへ
              </a>
            )}
            {!dojo.accepts_form &&
              !dojo.accepts_phone &&
              !dojo.accepts_email &&
              !dojo.accepts_line &&
              !dojo.accepts_website &&
              !dojo.accepts_external_form && (
                <p className="text-ink-muted text-sm">
                  この道場は受付方法を登録していません。公開されている連絡先をご確認ください。
                </p>
              )}
          </div>
        )}
      </section>

      {/* 3. 道場紹介 ------------------------------------------------------ */}
      {(dojo.description || dojo.recruit_note) && (
        <Section title="道場紹介">
          {dojo.description && <FreeText text={dojo.description} />}
          {dojo.recruit_note && (
            <div className="mt-3">
              <h3 className="text-brand-700 text-sm font-bold">生徒募集について</h3>
              <div className="mt-1">
                <FreeText text={dojo.recruit_note} />
              </div>
            </div>
          )}
        </Section>
      )}

      {/* 4. 稽古場所と曜日・時間 ------------------------------------------ */}
      {dojo.practice_locations.length > 0 && (
        <Section title="稽古場所と曜日・時間">
          <ul className="space-y-4">
            {dojo.practice_locations.map((location) => (
              <li key={location.id} className="border-brand-100 rounded-lg border p-4">
                <h3 className="text-brand-700 text-base font-bold">{location.name}</h3>
                {location.address && (
                  <p className="text-ink-muted mt-1 text-sm">
                    {location.postal_code && `〒${location.postal_code} `}
                    {location.address}
                    {location.building && ` ${location.building}`}
                  </p>
                )}
                <a
                  href={location.gmap_url ?? googleMapsUrl(location.address, location.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 mt-1 inline-block text-sm font-semibold hover:underline"
                >
                  Googleマップで見る →
                </a>
                {location.parking_note && (
                  <p className="text-ink-muted mt-1 text-sm">駐車場: {location.parking_note}</p>
                )}

                {location.practice_schedules.length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm">
                    {location.practice_schedules.map((slot) => (
                      <li key={slot.id} className="flex flex-wrap gap-x-3">
                        <span className="w-8 shrink-0 font-semibold">
                          {DAY_LABELS[slot.day_of_week]}
                        </span>
                        <span className="whitespace-nowrap">
                          {formatTime(slot.start_time)}〜{formatTime(slot.end_time)}
                        </span>
                        {slot.class_note && (
                          <span className="text-ink-muted">{slot.class_note}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>

          {dojo.practice_locations.length > 1 && (
            <>
              <h3 className="text-brand-700 mt-6 text-sm font-bold">週間の稽古一覧</h3>
              <WeeklySchedule locations={dojo.practice_locations} />
            </>
          )}
        </Section>
      )}

      {/* 5. 費用 ---------------------------------------------------------- */}
      <Section title="費用">
        <p className="text-base font-semibold">{formatFeeRange(dojo.fee_min, dojo.fee_max)}</p>
        {dojo.fee_note && (
          <div className="mt-2">
            <FreeText text={dojo.fee_note} />
          </div>
        )}
        <p className="bg-surface-subtle text-ink-muted mt-3 rounded-md p-3 text-xs">
          入会時に必要な費用、スポーツ保険、登録料、道着・防具代、審査料、大会参加費等については、
          見学・体験時に各道場へご確認ください。
        </p>
      </Section>

      {/* 6. 対象者 -------------------------------------------------------- */}
      {(dojo.target_note || dojo.para_support || dojo.para_note) && (
        <Section title="対象者">
          {dojo.target_note && <FreeText text={dojo.target_note} />}
          {dojo.para_support && (
            <div className="mt-3">
              <h3 className="text-brand-700 text-sm font-bold">パラ空手・障害者対応</h3>
              <p className="text-ink-muted mt-1 text-sm">
                {dojo.para_note ?? "対応の実績があります。詳しくは道場へお問い合わせください。"}
              </p>
            </div>
          )}
        </Section>
      )}

      {/* 7. 代表者・指導者 ------------------------------------------------ */}
      {(dojo.representative_name ||
        dojo.jkf_dan ||
        dojo.local_dan ||
        dojo.dan_note ||
        dojo.instructor_note) && (
        <Section title="代表者・指導者">
          <dl className="space-y-2 text-sm">
            {dojo.representative_name && (
              <div className="flex gap-3">
                <dt className="text-ink-muted w-28 shrink-0">代表者</dt>
                <dd>{dojo.representative_name}</dd>
              </div>
            )}
            {dojo.jkf_dan && (
              <div className="flex gap-3">
                <dt className="text-ink-muted w-28 shrink-0">全空連公認段位</dt>
                <dd>{dojo.jkf_dan}</dd>
              </div>
            )}
            {dojo.local_dan && (
              <div className="flex gap-3">
                <dt className="text-ink-muted w-28 shrink-0">連盟等の段位</dt>
                <dd>{dojo.local_dan}</dd>
              </div>
            )}
            {dojo.dan_note && (
              <div className="flex gap-3">
                <dt className="text-ink-muted w-28 shrink-0">段位の補足</dt>
                <dd>{dojo.dan_note}</dd>
              </div>
            )}
          </dl>
          {dojo.instructor_note && (
            <div className="mt-3">
              <FreeText text={dojo.instructor_note} />
            </div>
          )}
        </Section>
      )}

      {/* 8. 活動内容・指導方針 -------------------------------------------- */}
      {(dojo.policy_note ||
        dojo.beginner_note ||
        dojo.tournament_note ||
        dojo.achievements_note ||
        dojo.features_note) && (
        <Section title="活動内容・指導方針">
          {dojo.policy_note && <FreeText text={dojo.policy_note} />}
          {dojo.beginner_note && (
            <div className="mt-3">
              <h3 className="text-brand-700 text-sm font-bold">初心者の受入れ</h3>
              <div className="mt-1">
                <FreeText text={dojo.beginner_note} />
              </div>
            </div>
          )}
          {dojo.tournament_note && (
            <div className="mt-3">
              <h3 className="text-brand-700 text-sm font-bold">大会への参加</h3>
              <div className="mt-1">
                <FreeText text={dojo.tournament_note} />
              </div>
            </div>
          )}
          {dojo.achievements_note && (
            <div className="mt-3">
              <h3 className="text-brand-700 text-sm font-bold">主な大会実績</h3>
              <div className="mt-1">
                <FreeText text={dojo.achievements_note} />
              </div>
            </div>
          )}
          {dojo.features_note && (
            <div className="mt-3">
              <h3 className="text-brand-700 text-sm font-bold">その他の特徴</h3>
              <div className="mt-1">
                <FreeText text={dojo.features_note} />
              </div>
            </div>
          )}
        </Section>
      )}

      {/* 9. 所属 ---------------------------------------------------------- */}
      {(styles.length > 0 || organizations.length > 0) && (
        <Section title="所属">
          <dl className="space-y-2 text-sm">
            {styles.length > 0 && (
              <div className="flex gap-3">
                <dt className="text-ink-muted w-20 shrink-0">流派</dt>
                <dd>{styles.join("、")}</dd>
              </div>
            )}
            {organizations.length > 0 && (
              <div className="flex gap-3">
                <dt className="text-ink-muted w-20 shrink-0">会派・団体</dt>
                <dd>{organizations.join("、")}</dd>
              </div>
            )}
          </dl>
          <p className="text-ink-muted mt-3 text-xs">
            所属会派により参加できる大会が異なる場合があります。詳しくは各道場にご確認ください。
          </p>
        </Section>
      )}

      {/* 10. リンク ------------------------------------------------------- */}
      {links.length > 0 && (
        <Section title="リンク">
          <ul className="space-y-1.5 text-sm">
            {links.map((link) => (
              <li key={link.label}>
                <a
                  href={link.url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 font-semibold hover:underline"
                >
                  {link.label} →
                </a>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 11. 電話受付情報 ------------------------------------------------- */}
      {dojo.phone_accepts && dojo.phone && (
        <Section title="電話でのお問い合わせ">
          <dl className="space-y-2 text-sm">
            <div className="flex gap-3">
              <dt className="text-ink-muted w-24 shrink-0">電話番号</dt>
              <dd>
                <a
                  href={`tel:${dojo.phone.replace(/[^0-9+]/g, "")}`}
                  className="text-brand-600 font-semibold hover:underline"
                >
                  {dojo.phone}
                </a>
              </dd>
            </div>
            {dojo.phone_days && (
              <div className="flex gap-3">
                <dt className="text-ink-muted w-24 shrink-0">受付曜日</dt>
                <dd>{dojo.phone_days}</dd>
              </div>
            )}
            {dojo.phone_hours && (
              <div className="flex gap-3">
                <dt className="text-ink-muted w-24 shrink-0">受付時間</dt>
                <dd>{dojo.phone_hours}</dd>
              </div>
            )}
            {dojo.phone_contact_name && (
              <div className="flex gap-3">
                <dt className="text-ink-muted w-24 shrink-0">担当</dt>
                <dd>{dojo.phone_contact_name}</dd>
              </div>
            )}
          </dl>
          <p className="text-ink-muted mt-3 text-xs">
            {dojo.phone_note ?? "稽古中は電話に出られない場合があります。"}
          </p>
        </Section>
      )}

      {/* 12. 免責注記 ----------------------------------------------------- */}
      <section className="bg-surface-subtle mt-8 rounded-md p-4">
        <p className="text-ink-muted text-xs">
          掲載されている所属情報は、原則として各道場からの申告または公開情報に基づいています。
          当サイトが所属関係を保証するものではありません。
        </p>
        <p className="text-ink-muted mt-2 text-xs">
          最終更新日: {new Date(dojo.last_content_update).toLocaleDateString("ja-JP")}
        </p>
        <p className="mt-2 text-xs">
          <Link href="/contact" className="text-brand-600 hover:underline">
            掲載内容の修正・削除を依頼する
          </Link>
        </p>
      </section>
    </div>
  );
}
