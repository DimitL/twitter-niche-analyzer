import type {
  CrossNicheRepeatableContentSeries as CrossNicheRepeatableContentSeriesModel,
  NicheRepeatableContentSeriesBucket
} from "../utils/nicheRepeatableContentSeries.js";

interface CrossNicheRepeatableContentSeriesProps {
  series: CrossNicheRepeatableContentSeriesModel;
  variant?: "panel" | "embedded";
}

function buildSectionClassName(variant: "panel" | "embedded") {
  return variant === "panel"
    ? "panel repeatable-series"
    : "repeatable-series repeatable-series--embedded";
}

function buildBucketMetaLabel(rank: number | null) {
  if (!rank) {
    return "Ниша вне shortlist";
  }

  return `Ниша #${rank}`;
}

function renderLeader(
  label: string,
  leader: CrossNicheRepeatableContentSeriesModel["summary"][keyof CrossNicheRepeatableContentSeriesModel["summary"]]
) {
  return (
    <div className="summary-box">
      <span>{label}</span>
      <strong>{leader ? leader.bucketLabel : "н/д"}</strong>
      <p>{leader?.reason ?? "Пока нет достаточно сильного сигнала для уверенного вывода."}</p>
    </div>
  );
}

function renderSeriesCard(
  bucket: NicheRepeatableContentSeriesBucket,
  seriesIndex: number
) {
  const series = bucket.repeatableContentSeries[seriesIndex];

  return (
    <article
      key={`${bucket.bucketId}-${series.seriesTitle}`}
      className="repeatable-series__series-card"
    >
      <div className="repeatable-series__series-meta">
        <strong>{series.seriesTitle}</strong>
        {series.cadenceHint ? (
          <span className="decision-chip decision-chip--neutral">
            {series.cadenceHint}
          </span>
        ) : null}
      </div>

      <p>{series.seriesPurpose}</p>
      <p className="repeatable-series__series-angle">{series.repeatedAngle}</p>

      <div className="repeatable-series__series-section">
        <span>Примеры углов</span>
        <ul className="plain-list">
          {series.examplePostAngles.map((angle) => (
            <li key={`${bucket.bucketId}-${series.seriesTitle}-${angle}`}>{angle}</li>
          ))}
        </ul>
      </div>

      {series.genericityWarning ? (
        <p className="repeatable-series__series-note">
          Не размывать так: {series.genericityWarning}
        </p>
      ) : null}
    </article>
  );
}

export function CrossNicheRepeatableContentSeries({
  series,
  variant = "panel"
}: CrossNicheRepeatableContentSeriesProps) {
  const sectionClassName = buildSectionClassName(variant);

  return (
    <section className={sectionClassName}>
      <div className="repeatable-series__header">
        <div>
          <p className="eyebrow">Повторяемые контент-серии</p>
          <h2>Как превратить первый угол входа в устойчивый posting rhythm</h2>
          <p className="section-copy">
            Здесь playbook превращается в более практичные серии: не только что
            постить первым, но и какие повторяемые форматы можно держать 2-4 недели
            без ощущения, что вы каждый раз начинаете с нуля.
          </p>
        </div>

        <div className="decision-chip-list">
          <span className="decision-chip">
            {series.comparableBucketCount} ниш с repeatable series
          </span>
        </div>
      </div>

      <div className="repeatable-series__summary">
        <div className="insight-box">
          <span>Короткая сводка</span>
          <p>{series.seriesSummary}</p>
        </div>

        {series.globalConfidenceNote ? (
          <div className="insight-box">
            <span>Ограничение уверенности</span>
            <p>{series.globalConfidenceNote}</p>
          </div>
        ) : null}
      </div>

      <div className="repeatable-series__leaders">
        {renderLeader(
          "Где strongest repeatability",
          series.summary.nicheWithStrongestRepeatableSeriesPotential
        )}
        {renderLeader(
          "Где легче держать cadence",
          series.summary.nicheWithEasiestConsistentPostingCadence
        )}
        {renderLeader(
          "Где идеи различаются сильнее",
          series.summary.nicheWithMostDifferentiatedSeriesIdeas
        )}
      </div>

      <div className="repeatable-series__grid">
        {series.perBucketSeries.map((bucket) => (
          <article
            key={`repeatable-series-${bucket.bucketId}`}
            className="repeatable-series__bucket-card"
          >
            <div className="repeatable-series__bucket-header">
              <div>
                <p className="eyebrow">{buildBucketMetaLabel(bucket.rank)}</p>
                <h3>{bucket.label}</h3>
                <p className="section-copy">{bucket.playbookTitle}</p>
              </div>

              {bucket.bestEntryAngleLabel ? (
                <span className="decision-chip">
                  Базовый угол: {bucket.bestEntryAngleLabel}
                </span>
              ) : null}
            </div>

            <div className="repeatable-series__series-list">
              {bucket.repeatableContentSeries.map((_, index) =>
                renderSeriesCard(bucket, index)
              )}
            </div>

            {bucket.seriesConfidenceNote ? (
              <p className="repeatable-series__bucket-note">
                {bucket.seriesConfidenceNote}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
