import type { CrossNicheContentCalendarStarter as CrossNicheContentCalendarStarterModel } from "../utils/nicheContentCalendarStarter.js";

interface CrossNicheContentCalendarStarterProps {
  calendar: CrossNicheContentCalendarStarterModel;
  variant?: "panel" | "embedded";
}

function buildSectionClassName(variant: "panel" | "embedded") {
  return variant === "panel"
    ? "panel content-calendar-starter"
    : "content-calendar-starter content-calendar-starter--embedded";
}

function buildBucketMetaLabel(rank: number | null) {
  if (!rank) {
    return "Ниша вне shortlist";
  }

  return `Ниша #${rank}`;
}

function renderLeader(
  label: string,
  leader: CrossNicheContentCalendarStarterModel["summary"][keyof CrossNicheContentCalendarStarterModel["summary"]]
) {
  return (
    <div className="summary-box">
      <span>{label}</span>
      <strong>{leader ? leader.bucketLabel : "н/д"}</strong>
      <p>{leader?.reason ?? "Пока нет достаточно сильного сигнала для уверенного вывода."}</p>
    </div>
  );
}

export function CrossNicheContentCalendarStarter({
  calendar,
  variant = "panel"
}: CrossNicheContentCalendarStarterProps) {
  const sectionClassName = buildSectionClassName(variant);

  return (
    <section className={sectionClassName}>
      <div className="content-calendar-starter__header">
        <div>
          <p className="eyebrow">2-недельный content calendar</p>
          <h2>Как запустить posting plan на ближайшие 2 недели</h2>
          <p className="section-copy">
            Этот блок переводит repeatable content series в короткий стартовый план:
            что публиковать по порядку, какой серии посвящён слот и зачем именно он
            нужен в первые две недели запуска ниши.
          </p>
        </div>

        <div className="decision-chip-list">
          <span className="decision-chip">
            {calendar.comparableBucketCount} ниш с календарём
          </span>
        </div>
      </div>

      <div className="content-calendar-starter__summary">
        <div className="insight-box">
          <span>Короткая сводка</span>
          <p>{calendar.calendarSummary}</p>
        </div>

        {calendar.globalConfidenceNote ? (
          <div className="insight-box">
            <span>Ограничение уверенности</span>
            <p>{calendar.globalConfidenceNote}</p>
          </div>
        ) : null}
      </div>

      <div className="content-calendar-starter__leaders">
        {renderLeader(
          "Где проще всего стартовать",
          calendar.summary.nicheWithEasiestTwoWeekLaunchPlan
        )}
        {renderLeader(
          "Где cadence садится лучше",
          calendar.summary.nicheWithStrongestContentCadenceFit
        )}
        {renderLeader(
          "Где баланс variety и repeatability сильнее",
          calendar.summary.nicheWithBestVarietyRepeatabilityBalance
        )}
      </div>

      <div className="content-calendar-starter__grid">
        {calendar.perBucketCalendars.map((bucket) => (
          <article
            key={`content-calendar-${bucket.bucketId}`}
            className="content-calendar-starter__bucket-card"
          >
            <div className="content-calendar-starter__bucket-header">
              <div>
                <p className="eyebrow">{buildBucketMetaLabel(bucket.rank)}</p>
                <h3>{bucket.label}</h3>
                <p className="section-copy">{bucket.calendarTitle}</p>
              </div>

              {bucket.bestEntryAngleLabel ? (
                <span className="decision-chip">
                  Базовый угол: {bucket.bestEntryAngleLabel}
                </span>
              ) : null}
            </div>

            <div className="content-calendar-starter__plan-list">
              {bucket.planEntries.map((entry) => (
                <article
                  key={`${bucket.bucketId}-${entry.slotLabel}-${entry.seriesTitle}`}
                  className="content-calendar-starter__plan-card"
                >
                  <div className="content-calendar-starter__plan-meta">
                    <strong>{entry.slotLabel}</strong>
                    <span className="decision-chip decision-chip--neutral">
                      {entry.seriesTitle}
                    </span>
                  </div>

                  <p>{entry.postAngle}</p>
                  <p className="content-calendar-starter__plan-purpose">
                    {entry.postPurpose}
                  </p>

                  {entry.cautionNote ? (
                    <p className="content-calendar-starter__plan-note">
                      Не переусердствовать так: {entry.cautionNote}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>

            {bucket.calendarConfidenceNote ? (
              <p className="content-calendar-starter__bucket-note">
                {bucket.calendarConfidenceNote}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
