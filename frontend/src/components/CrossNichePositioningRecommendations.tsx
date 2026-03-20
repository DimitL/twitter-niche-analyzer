import type {
  CrossNichePositioningRecommendations as CrossNichePositioningRecommendationsModel,
  NichePositioningAngleLeader
} from "../utils/nicheCrossPositioning.js";

interface CrossNichePositioningRecommendationsProps {
  recommendations: CrossNichePositioningRecommendationsModel;
  variant?: "panel" | "embedded";
}

function buildSectionClassName(variant: "panel" | "embedded") {
  return variant === "panel"
    ? "panel cross-niche-positioning"
    : "cross-niche-positioning cross-niche-positioning--embedded";
}

function buildBucketMetaLabel(rank: number | null) {
  if (!rank) {
    return "Ниша вне shortlist";
  }

  return `Ниша #${rank}`;
}

function renderAngleLeader(
  label: string,
  leader: NichePositioningAngleLeader | null
) {
  return (
    <div className="summary-box">
      <span>{label}</span>
      <strong>{leader ? leader.bucketLabel : "н/д"}</strong>
    </div>
  );
}

export function CrossNichePositioningRecommendations({
  recommendations,
  variant = "panel"
}: CrossNichePositioningRecommendationsProps) {
  const sectionClassName = buildSectionClassName(variant);

  return (
    <section className={sectionClassName}>
      <div className="cross-niche-positioning__header">
        <div>
          <p className="eyebrow">Позиционирование по shortlist</p>
          <h2>Как лучше заходить в каждую нишу</h2>
          <p className="section-copy">
            Этот блок переводит whitespace и archetype-сигналы в более понятные
            рекомендации: через какой контентный угол проще и логичнее входить в shortlisted нишу.
          </p>
        </div>

        <div className="decision-chip-list">
          <span className="decision-chip">
            {recommendations.comparableBucketCount} ниши с рекомендациями
          </span>
        </div>
      </div>

      <div className="cross-niche-positioning__summary">
        <div className="insight-box">
          <span>Короткая сводка</span>
          <p>{recommendations.positioningSummary}</p>
        </div>

        {recommendations.globalConfidenceNote ? (
          <div className="insight-box">
            <span>Ограничение уверенности</span>
            <p>{recommendations.globalConfidenceNote}</p>
          </div>
        ) : null}
      </div>

      <div className="cross-niche-positioning__leaders">
        {renderAngleLeader(
          "Лучше всего для обучения",
          recommendations.summary.bestNicheForEducation
        )}
        {renderAngleLeader(
          "Лучше всего для контрарного угла",
          recommendations.summary.bestNicheForContrarian
        )}
        {renderAngleLeader(
          "Лучше всего для founder/operator",
          recommendations.summary.bestNicheForFounderOperator
        )}
        {renderAngleLeader(
          "Лучше всего для результатов",
          recommendations.summary.bestNicheForBenchmarkResults
        )}
        {renderAngleLeader(
          "Лучше всего для новостной реакции",
          recommendations.summary.bestNicheForNewsReactive
        )}
      </div>

      <div className="cross-niche-positioning__grid">
        {recommendations.perBucketRecommendations.map((bucket) => (
          <article
            key={`positioning-${bucket.bucketId}`}
            className="cross-niche-positioning__bucket-card"
          >
            <div className="cross-niche-positioning__bucket-header">
              <div>
                <p className="eyebrow">{buildBucketMetaLabel(bucket.rank)}</p>
                <h3>{bucket.label}</h3>
              </div>

              {bucket.strongestRecommendedAngle ? (
                <span className="decision-chip">
                  Лучший угол: {bucket.strongestRecommendedAngle.label}
                </span>
              ) : null}
            </div>

            {bucket.recommendedEntryAngles.length > 0 ? (
              <div className="cross-niche-positioning__bucket-section">
                <span>Рекомендуемые углы входа</span>
                <div className="decision-chip-list">
                  {bucket.recommendedEntryAngles.map((angle) => (
                    <span
                      key={`${bucket.bucketId}-${angle.angle}`}
                      className="decision-chip decision-chip--neutral"
                    >
                      {angle.label} · {angle.score.toFixed(1)}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="cross-niche-positioning__bucket-section">
              <span>Почему это подходит</span>
              <p>{bucket.positioningWhyItFits}</p>
            </div>

            {bucket.positioningRisks.length > 0 ? (
              <div className="cross-niche-positioning__bucket-section">
                <span>Что может помешать</span>
                <ul className="plain-list">
                  {bucket.positioningRisks.map((risk) => (
                    <li key={`${bucket.bucketId}-${risk}`}>{risk}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {bucket.positioningConfidenceNote ? (
              <p className="cross-niche-positioning__bucket-note">
                {bucket.positioningConfidenceNote}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
