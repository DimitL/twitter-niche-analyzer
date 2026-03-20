import type { CrossNicheWhitespaceComparison as CrossNicheWhitespaceComparisonModel } from "../utils/nicheCrossWhitespace.js";

interface CrossNicheWhitespaceComparisonProps {
  comparison: CrossNicheWhitespaceComparisonModel;
  variant?: "panel" | "embedded";
}

function buildSectionClassName(variant: "panel" | "embedded") {
  return variant === "panel"
    ? "panel cross-niche-whitespace"
    : "cross-niche-whitespace cross-niche-whitespace--embedded";
}

function buildBucketMetaLabel(rank: number | null) {
  if (!rank) {
    return "Ниша вне shortlist";
  }

  return `Ниша #${rank}`;
}

export function CrossNicheWhitespaceComparison({
  comparison,
  variant = "panel"
}: CrossNicheWhitespaceComparisonProps) {
  const sectionClassName = buildSectionClassName(variant);

  return (
    <section className={sectionClassName}>
      <div className="cross-niche-whitespace__header">
        <div>
          <p className="eyebrow">Межнишевое сравнение</p>
          <h2>Где в shortlist углы выглядят свободнее</h2>
          <p className="section-copy">
            Этот блок сравнивает ниши в текущем shortlist не только по score, но и по тому,
            какие контентные углы выглядят более открытыми или уже более перегретыми на фоне
            соседних ниш.
          </p>
        </div>

        <div className="decision-chip-list">
          <span className="decision-chip">
            {comparison.comparableBucketCount} ниши в сравнении
          </span>
          <span className="decision-chip decision-chip--neutral">
            {comparison.recurringWhitespaceAngles.length} общих whitespace-тем
          </span>
        </div>
      </div>

      <div className="cross-niche-whitespace__summary">
        <div className="insight-box">
          <span>Общая картина</span>
          <p>{comparison.crossNicheWhitespaceSummary}</p>
        </div>

        {comparison.crossNicheConfidenceNote ? (
          <div className="insight-box">
            <span>Ограничение уверенности</span>
            <p>{comparison.crossNicheConfidenceNote}</p>
          </div>
        ) : null}
      </div>

      <div className="cross-niche-whitespace__block">
        <span className="cross-niche-whitespace__eyebrow">
          Повторяющиеся whitespace-углы
        </span>

        {comparison.recurringWhitespaceAngles.length > 0 ? (
          <div className="cross-niche-whitespace__angles">
            {comparison.recurringWhitespaceAngles.map((angle) => (
              <div
                key={`recurring-${angle.tag}`}
                className="cross-niche-whitespace__angle-card"
              >
                <strong>{angle.label}</strong>
                <p>
                  Повторяется как недопокрытый угол в {angle.count} нишах:{" "}
                  {angle.bucketLabels.join(", ")}.
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="section-copy">
            Явных повторяющихся whitespace-тем пока немного: shortlist выглядит более
            разнонаправленным, чем однотипным.
          </p>
        )}
      </div>

      <div className="cross-niche-whitespace__grid">
        {comparison.comparativelyOpenAnglesByBucket.map((bucket) => (
          <article
            key={`open-${bucket.bucketId}`}
            className="cross-niche-whitespace__bucket-card"
          >
            <div className="cross-niche-whitespace__bucket-header">
              <div>
                <p className="eyebrow">{buildBucketMetaLabel(bucket.rank)}</p>
                <h3>{bucket.label}</h3>
              </div>
            </div>

            <div className="cross-niche-whitespace__bucket-section">
              <span>Где ниша выглядит более открытой</span>
              <div className="decision-chip-list">
                {bucket.comparativelyOpenAngles.map((angle) => (
                  <span
                    key={`${bucket.bucketId}-open-${angle.tag}`}
                    className="pattern-chip pattern-chip--muted"
                  >
                    {angle.label}
                  </span>
                ))}
              </div>
            </div>

            {bucket.nicheSpecificWhitespace.length > 0 ? (
              <div className="cross-niche-whitespace__bucket-section">
                <span>Более нишеспецифичные свободные углы</span>
                <div className="decision-chip-list">
                  {bucket.nicheSpecificWhitespace.map((angle) => (
                    <span
                      key={`${bucket.bucketId}-specific-${angle.tag}`}
                      className="decision-chip decision-chip--neutral"
                    >
                      {angle.label}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {bucket.crowdedAngles.length > 0 ? (
              <div className="cross-niche-whitespace__bucket-section">
                <span>Что уже выглядит перегретым</span>
                <ul className="plain-list">
                  {bucket.crowdedAngles.map((angle) => (
                    <li key={`${bucket.bucketId}-crowded-${angle.tag}`}>
                      {angle.label} уже повторяется как доминирующий угол в {angle.count} нишах.
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {bucket.whitespaceHints.length > 0 ? (
              <div className="cross-niche-whitespace__bucket-section">
                <span>Короткие подсказки по whitespace</span>
                <ul className="plain-list">
                  {bucket.whitespaceHints.map((hint) => (
                    <li key={`${bucket.bucketId}-hint-${hint}`}>{hint}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {bucket.positioningIdeas.length > 0 ? (
              <div className="cross-niche-whitespace__bucket-section">
                <span>Как можно занять угол</span>
                <ul className="plain-list">
                  {bucket.positioningIdeas.map((idea) => (
                    <li key={`${bucket.bucketId}-idea-${idea}`}>{idea}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
