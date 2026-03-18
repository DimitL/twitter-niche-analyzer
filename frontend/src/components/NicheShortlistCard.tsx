import type { RankedNicheShortlistBucket } from "../types/nicheShortlist.js";
import { NicheEvidencePack } from "./NicheEvidencePack.js";

interface NicheShortlistCardProps {
  bucket: RankedNicheShortlistBucket;
}

const decisionLabelMap = [
  { key: "bestOverall", label: "Лучший по общему score" },
  { key: "bestForGrowth", label: "Лучший для роста" },
  { key: "bestForMonetization", label: "Лучший для монетизации" },
  { key: "easiestToStart", label: "Самый лёгкий старт" },
  { key: "bestBalancedOption", label: "Самый сбалансированный" }
] as const;

const scoreMetricLabels = [
  { key: "overallTopicScore", label: "Итоговый score ниши" },
  { key: "growthPotential", label: "Потенциал роста" },
  { key: "monetizationPotential", label: "Потенциал монетизации" },
  { key: "contentEase", label: "Простота контента" },
  { key: "dataConfidence", label: "Надёжность данных" }
] as const;

const signalLabels = [
  { key: "averageAccountQuality", label: "Среднее качество аккаунтов" },
  { key: "averageEngagementEfficiency", label: "Средний engagement efficiency" },
  { key: "averageReach", label: "Средний reach" },
  { key: "averageDataConfidence", label: "Средняя надёжность данных" },
  { key: "accountCoverageSignal", label: "Покрытие аккаунтов" },
  { key: "usableAccountDensitySignal", label: "Плотность usable аккаунтов" }
] as const;

function formatSignalValue(value: number | null) {
  if (value === null) {
    return "н/д";
  }

  return value.toFixed(1);
}

export function NicheShortlistCard({ bucket }: NicheShortlistCardProps) {
  const activeDecisionLabels = decisionLabelMap.filter(
    (decisionLabel) => bucket.decisionLabels[decisionLabel.key]
  );

  return (
    <article
      className={`shortlist-card ${bucket.shortlistIncluded ? "" : "shortlist-card--muted"} ${bucket.status !== "ok" ? "shortlist-card--partial" : ""}`}
    >
      <div className="shortlist-card__header">
        <div>
          <p className="eyebrow">
            {bucket.rank ? `Ниша #${bucket.rank}` : "Вне shortlist"}
          </p>
          <h3>{bucket.label}</h3>
          <p className="niche-card__summary">
            {bucket.description ?? "Описание не задано, поэтому ориентируемся только на bucket label и score signals."}
          </p>
        </div>

        <div className="score-badge">
          <span>Итоговый score ниши</span>
          <strong>{bucket.topicScores.overallTopicScore.toFixed(1)}</strong>
        </div>
      </div>

      <div className="decision-chip-list">
        {activeDecisionLabels.length > 0 ? (
          activeDecisionLabels.map((decisionLabel) => (
            <span key={decisionLabel.key} className="decision-chip">
              {decisionLabel.label}
            </span>
          ))
        ) : (
          <span className="decision-chip decision-chip--neutral">Без специальной метки</span>
        )}

        {!bucket.shortlistIncluded ? (
          <span className="decision-chip decision-chip--neutral">Вне итогового shortlist</span>
        ) : null}
      </div>

      <div className="shortlist-card__insight">
        <div className="insight-box">
          <span>Почему bucket оказался на этом месте</span>
          <p>{bucket.rankingReason}</p>
        </div>
        <div className="insight-box">
          <span>Рекомендуемый сценарий использования</span>
          <p>{bucket.recommendedUseCase}</p>
        </div>
      </div>

      <div className="shortlist-score-grid">
        {scoreMetricLabels.map((metric) => (
          <div key={metric.key} className="shortlist-score-box">
            <span>{metric.label}</span>
            <strong>{bucket.topicScores[metric.key].toFixed(1)}</strong>
            <div className="metric-bar">
              <div
                className="metric-bar__fill"
                style={{ width: `${bucket.topicScores[metric.key]}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="signal-grid">
        {signalLabels.map((signal) => (
          <div key={signal.key} className="signal-box">
            <span>{signal.label}</span>
            <strong>{formatSignalValue(bucket.topicSignals[signal.key])}</strong>
          </div>
        ))}
      </div>

      <div className="pros-cons-grid">
        <div className="insight-box">
          <span>Плюсы</span>
          <ul className="plain-list">
            {bucket.pros.map((pro) => (
              <li key={pro}>{pro}</li>
            ))}
          </ul>
        </div>
        <div className="insight-box">
          <span>Риски / ограничения</span>
          <ul className="plain-list">
            {bucket.cons.map((con) => (
              <li key={con}>{con}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="shortlist-card__footer">
        <div>
          <p className="eyebrow">Сильнейшие аккаунты bucket-а</p>
          <div className="strong-account-grid">
            {bucket.strongestAccounts.length > 0 ? (
              bucket.strongestAccounts.map((account) => (
                <div
                  key={`${account.handle ?? "unknown"}-${account.metric}`}
                  className="strong-account-box"
                >
                  <strong>{account.displayName ?? account.handle ?? "Без имени"}</strong>
                  <span>{account.handle ?? "handle недоступен"}</span>
                  <p>{account.reason}</p>
                </div>
              ))
            ) : (
              <div className="strong-account-box">
                <strong>Пока нет лидеров</strong>
                <p>Для этого bucket пока не удалось получить usable top account summary.</p>
              </div>
            )}
          </div>
        </div>

        {bucket.rankingBreakdown ? (
          <div className="ranking-breakdown-box">
            <p className="eyebrow">Правило ранжирования</p>
            <strong>{bucket.rankingBreakdown.rankingScore.toFixed(1)}</strong>
            <p>{bucket.rankingBreakdown.formula}</p>
          </div>
        ) : null}
      </div>

      {bucket.shortlistIncluded ? <NicheEvidencePack bucket={bucket} /> : null}
    </article>
  );
}
