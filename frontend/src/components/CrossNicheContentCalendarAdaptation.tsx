import type { CrossNicheContentCalendarAdaptation as CrossNicheContentCalendarAdaptationModel } from "../utils/nicheContentCalendarAdaptation.js";

interface CrossNicheContentCalendarAdaptationProps {
  adaptation: CrossNicheContentCalendarAdaptationModel;
  variant?: "panel" | "embedded";
}

function buildSectionClassName(variant: "panel" | "embedded") {
  return variant === "panel"
    ? "panel content-calendar-adaptation"
    : "content-calendar-adaptation content-calendar-adaptation--embedded";
}

function buildBucketMetaLabel(rank: number | null) {
  if (!rank) {
    return "Ниша вне shortlist";
  }

  return `Ниша #${rank}`;
}

function renderLeader(
  label: string,
  leader: CrossNicheContentCalendarAdaptationModel["summary"][keyof CrossNicheContentCalendarAdaptationModel["summary"]]
) {
  return (
    <div className="summary-box">
      <span>{label}</span>
      <strong>{leader ? leader.bucketLabel : "н/д"}</strong>
      <p>{leader?.reason ?? "Пока нет достаточно сильного сигнала для уверенного вывода."}</p>
    </div>
  );
}

export function CrossNicheContentCalendarAdaptation({
  adaptation,
  variant = "panel"
}: CrossNicheContentCalendarAdaptationProps) {
  const sectionClassName = buildSectionClassName(variant);

  return (
    <section className={sectionClassName}>
      <div className="content-calendar-adaptation__header">
        <div>
          <p className="eyebrow">Адаптация под бюджет времени</p>
          <h2>Как упростить или расширить календарь под ваш реальный ритм</h2>
          <p className="section-copy">
            Этот блок показывает, как тот же 2-недельный стартовый план ведёт себя при
            low-time, medium-time и high-time режиме: что обязательно сохранить,
            что можно срезать первым и куда расширяться, если времени становится больше.
          </p>
        </div>

        <div className="decision-chip-list">
          <span className="decision-chip">
            {adaptation.comparableBucketCount} ниш с adaptation hints
          </span>
        </div>
      </div>

      <div className="content-calendar-adaptation__summary">
        <div className="insight-box">
          <span>Короткая сводка</span>
          <p>{adaptation.adaptationSummary}</p>
        </div>

        {adaptation.globalConfidenceNote ? (
          <div className="insight-box">
            <span>Ограничение уверенности</span>
            <p>{adaptation.globalConfidenceNote}</p>
          </div>
        ) : null}
      </div>

      <div className="content-calendar-adaptation__leaders">
        {renderLeader(
          "Где проще low-time режим",
          adaptation.summary.easiestNicheForLowTimePosting
        )}
        {renderLeader(
          "Где medium-time держится ровнее",
          adaptation.summary.bestNicheForMediumTimeConsistency
        )}
        {renderLeader(
          "Где high-time расширять проще",
          adaptation.summary.bestNicheForHighTimeExpansion
        )}
      </div>

      <div className="content-calendar-adaptation__grid">
        {adaptation.perBucketAdaptations.map((bucket) => (
          <article
            key={`content-calendar-adaptation-${bucket.bucketId}`}
            className="content-calendar-adaptation__bucket-card"
          >
            <div className="content-calendar-adaptation__bucket-header">
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

            <div className="content-calendar-adaptation__mode-grid">
              <article className="content-calendar-adaptation__mode-card">
                <strong>Low-time</strong>
                <p>{bucket.lowTimeMode.recommendedWeeklyVolume}</p>
                <div className="content-calendar-adaptation__mode-section">
                  <span>Что оставить</span>
                  <ul className="plain-list">
                    {bucket.whatToKeepWhenTimeIsLimited.map((item) => (
                      <li key={`${bucket.bucketId}-keep-${item}`}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="content-calendar-adaptation__mode-section">
                  <span>Что резать первым</span>
                  <ul className="plain-list">
                    {bucket.lowTimeMode.slotsToCutFirst.map((slot) => (
                      <li key={`${bucket.bucketId}-cut-${slot}`}>{slot}</li>
                    ))}
                  </ul>
                </div>
                {bucket.lowTimeMode.lowTimeCaution ? (
                  <p className="content-calendar-adaptation__mode-note">
                    {bucket.lowTimeMode.lowTimeCaution}
                  </p>
                ) : null}
              </article>

              <article className="content-calendar-adaptation__mode-card">
                <strong>Medium-time</strong>
                <p>{bucket.mediumTimeMode.recommendedWeeklyVolume}</p>
                <div className="content-calendar-adaptation__mode-section">
                  <span>Как держать баланс</span>
                  <ul className="plain-list">
                    {bucket.mediumTimeMode.balancedMixGuidance.map((item) => (
                      <li key={`${bucket.bucketId}-medium-${item}`}>{item}</li>
                    ))}
                  </ul>
                </div>
                {bucket.mediumTimeMode.mediumTimeCaution ? (
                  <p className="content-calendar-adaptation__mode-note">
                    {bucket.mediumTimeMode.mediumTimeCaution}
                  </p>
                ) : null}
              </article>

              <article className="content-calendar-adaptation__mode-card">
                <strong>High-time</strong>
                <p>{bucket.highTimeMode.recommendedWeeklyVolume}</p>
                <div className="content-calendar-adaptation__mode-section">
                  <span>Где расширять</span>
                  <ul className="plain-list">
                    {bucket.whatToExpandWhenMoreTimeIsAvailable.map((item) => (
                      <li key={`${bucket.bucketId}-expand-${item}`}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="content-calendar-adaptation__mode-section">
                  <span>Чем добавлять variety</span>
                  <ul className="plain-list">
                    {bucket.highTimeMode.varietyToAdd.map((item) => (
                      <li key={`${bucket.bucketId}-variety-${item}`}>{item}</li>
                    ))}
                  </ul>
                </div>
                {bucket.highTimeMode.highTimeCaution ? (
                  <p className="content-calendar-adaptation__mode-note">
                    {bucket.highTimeMode.highTimeCaution}
                  </p>
                ) : null}
              </article>
            </div>

            {bucket.whatToAvoidOverdoingInHighFrequency.length > 0 ? (
              <div className="content-calendar-adaptation__bucket-section">
                <span>Что не стоит передавливать на высокой частоте</span>
                <ul className="plain-list">
                  {bucket.whatToAvoidOverdoingInHighFrequency.map((item) => (
                    <li key={`${bucket.bucketId}-avoid-${item}`}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {bucket.adaptationConfidenceNote ? (
              <p className="content-calendar-adaptation__bucket-note">
                {bucket.adaptationConfidenceNote}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
