import { DAY_LABELS } from "@/lib/search";
import type { PracticeLocation } from "@/lib/queries/dojos";

/** 「18:00:00」を「18:00」にする */
export function formatTime(time: string): string {
  return time.slice(0, 5);
}

/**
 * 曜日 × 稽古場所の週間一覧表(docs/PRODUCT_REQUIREMENTS.md 3-3 の4)。
 * 横スクロールできる形にして、スマートフォンでも崩れないようにする。
 */
export function WeeklySchedule({ locations }: { locations: PracticeLocation[] }) {
  const hasAnySchedule = locations.some((l) => l.practice_schedules.length > 0);
  if (!hasAnySchedule) return null;

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse text-sm">
        <caption className="sr-only">曜日ごとの稽古場所と時間の一覧</caption>
        <thead>
          <tr>
            <th
              scope="col"
              className="border-brand-100 bg-brand-50 border px-2 py-2 text-left font-semibold"
            >
              曜日
            </th>
            {locations.map((location) => (
              <th
                key={location.id}
                scope="col"
                className="border-brand-100 bg-brand-50 border px-2 py-2 text-left font-semibold"
              >
                {location.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAY_LABELS.map((label, day) => {
            // その曜日に稽古がまったく無い行は表示しない
            const hasSchedule = locations.some((l) =>
              l.practice_schedules.some((s) => s.day_of_week === day),
            );
            if (!hasSchedule) return null;

            return (
              <tr key={day}>
                <th
                  scope="row"
                  className="border-brand-100 border px-2 py-2 text-left font-semibold"
                >
                  {label}
                </th>
                {locations.map((location) => {
                  const slots = location.practice_schedules.filter((s) => s.day_of_week === day);
                  return (
                    <td key={location.id} className="border-brand-100 border px-2 py-2 align-top">
                      {slots.length === 0 ? (
                        <span className="text-ink-muted">—</span>
                      ) : (
                        <ul className="space-y-1">
                          {slots.map((slot) => (
                            <li key={slot.id}>
                              <span className="whitespace-nowrap">
                                {formatTime(slot.start_time)}〜{formatTime(slot.end_time)}
                              </span>
                              {slot.class_note && (
                                <span className="text-ink-muted block text-xs">
                                  {slot.class_note}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
