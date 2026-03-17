import type { NicheInsight } from "@twitter-niche-analyzer/shared";

interface NicheCardProps {
  niche: NicheInsight;
  rank: number;
}

const metricLabels = [
  { key: "engagementEfficiency", label: "Относительный engagement" },
  { key: "growthPotential", label: "Потенциал роста" },
  { key: "monetizationPotential", label: "Потенциал монетизации" },
  { key: "contentEase", label: "Лёгкость производства контента" }
] as const;

export function NicheCard({ niche, rank }: NicheCardProps) {
  return (
    <article className="niche-card">
      <div className="niche-card__header">
        <div>
          <p className="eyebrow">Ниша #{rank}</p>
          <h3>{niche.title}</h3>
        </div>
        <div className="score-badge">
          <span>Итоговый score</span>
          <strong>{niche.score.composite}</strong>
        </div>
      </div>

      <p className="niche-card__summary">{niche.summary}</p>

      <div className="insight-grid">
        <div className="insight-box">
          <span>Почему это видно сейчас</span>
          <p>{niche.audienceSignal}</p>
        </div>
        <div className="insight-box">
          <span>Какой контент можно делать</span>
          <p>{niche.contentAngle}</p>
        </div>
      </div>

      <div className="metric-list">
        {metricLabels.map((metric) => (
          <div key={metric.key} className="metric-row">
            <div className="metric-row__label">
              <span>{metric.label}</span>
              <strong>{niche.score[metric.key]}</strong>
            </div>
            <div className="metric-bar">
              <div
                className="metric-bar__fill"
                style={{ width: `${niche.score[metric.key]}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <details className="influencer-list">
        <summary>Показать 10 mock influencer accounts</summary>
        <div className="influencer-list__grid">
          {niche.influencerAccounts.map((account) => (
            <div key={account.handle} className="influencer-item">
              <div>
                <strong>{account.displayName}</strong>
                <span>{account.handle}</span>
              </div>
              <p>{account.reason}</p>
              <div className="influencer-item__meta">
                <span>{account.followers.toLocaleString("ru-RU")} подписчиков</span>
                <span>{account.avgEngagementRate}% ER</span>
              </div>
            </div>
          ))}
        </div>
      </details>
    </article>
  );
}
