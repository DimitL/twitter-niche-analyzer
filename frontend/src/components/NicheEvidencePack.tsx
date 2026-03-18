import { buildNicheEvidencePack } from "../utils/nicheEvidencePack.js";
import type { RankedNicheShortlistBucket } from "../types/nicheShortlist.js";

interface NicheEvidencePackProps {
  bucket: RankedNicheShortlistBucket;
}

export function NicheEvidencePack({ bucket }: NicheEvidencePackProps) {
  const evidencePack = buildNicheEvidencePack(bucket);

  return (
    <details className="evidence-pack">
      <summary className="evidence-pack__summary">
        <div>
          <p className="eyebrow">Пакет доказательств</p>
          <strong>Почему эта ниша держится в shortlist</strong>
          <p>
            Откройте блок, чтобы увидеть подтверждающие аккаунты, ключевые score
            drivers, зоны риска и следующий ручной шаг по валидации.
          </p>
        </div>
        <div className="decision-chip-list">
          <span className="decision-chip">
            {evidencePack.strongestSignals.length} сильных сигнала
          </span>
          <span className="decision-chip decision-chip--neutral">
            {evidencePack.topSupportingAccounts.length} поддерживающих аккаунтов
          </span>
          <span className="decision-chip decision-chip--neutral">
            {evidencePack.cautionFlags.length} зоны риска
          </span>
        </div>
      </summary>

      <div className="evidence-pack__content">
        <div className="evidence-pack__intro">
          <div className="insight-box">
            <span>Почему ниша выглядит перспективной</span>
            <p>{evidencePack.promisingSummary}</p>
          </div>
          <div className="insight-box">
            <span>Что может исказить вывод</span>
            <p>{evidencePack.misleadingSummary}</p>
          </div>
          <div className="insight-box">
            <span>Рекомендуемый следующий шаг</span>
            <p>{evidencePack.recommendedNextAction}</p>
          </div>
        </div>

        <div className="evidence-pack__grid">
          <div className="insight-box">
            <span>Как сложился score</span>
            <p>{evidencePack.scoreBreakdownSummary}</p>

            <ul className="plain-list">
              {evidencePack.strongestSignals.map((signal) => (
                <li key={`${bucket.bucketId}-${signal.key}`}>
                  {signal.label}: {signal.value.toFixed(1)} при весе{" "}
                  {(signal.weight * 100).toFixed(0)}%, вклад {signal.contribution.toFixed(1)}
                </li>
              ))}
            </ul>
          </div>

          <div className="insight-box">
            <span>Что ослабляет уверенность</span>
            <ul className="plain-list">
              {evidencePack.weakestSignals.map((signal) => (
                <li key={`${bucket.bucketId}-${signal.key}`}>
                  {signal.label}: {signal.value.toFixed(1)}
                </li>
              ))}
            </ul>

            <div className="decision-chip-list evidence-pack__flags">
              {evidencePack.cautionFlags.map((flag) => (
                <span
                  key={`${bucket.bucketId}-${flag}`}
                  className="decision-chip decision-chip--neutral"
                >
                  {flag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="evidence-pack__grid">
          <div className="insight-box">
            <span>Топ поддерживающих аккаунтов</span>
            <p className="section-copy">{evidencePack.supportingAccountsAvailabilityNote}</p>

            {evidencePack.topSupportingAccounts.length > 0 ? (
              <div className="evidence-pack__supporting-list">
                {evidencePack.topSupportingAccounts.map((account, index) => (
                  <div
                    key={`${bucket.bucketId}-${account.handle ?? "unknown"}-${index}`}
                    className="supporting-account-card"
                  >
                    <div className="supporting-account-card__header">
                      <div>
                        <strong>
                          {account.displayName ?? account.handle ?? "Без имени"}
                        </strong>
                        <span className="supporting-account-card__handle">
                          {account.handle ? `@${account.handle}` : "handle недоступен"}
                        </span>
                      </div>

                      <span className="decision-chip decision-chip--neutral">
                        #{index + 1}
                      </span>
                    </div>

                    <p className="supporting-account-card__role">{account.relevanceNote}</p>
                    <p>{account.reason}</p>

                    <div className="supporting-account-card__scores">
                      <span className="score-chip">
                        Overall {account.overallAccountScore.toFixed(1)}
                      </span>
                      <span className="score-chip">
                        Engagement {account.engagementEfficiencyScore.toFixed(1)}
                      </span>
                      <span className="score-chip">
                        Reach {account.reachScore.toFixed(1)}
                      </span>
                      <span className="score-chip">
                        Consistency {account.consistencyScore.toFixed(1)}
                      </span>
                    </div>

                    {account.profileUrl ? (
                      <a
                        className="supporting-account-card__link"
                        href={account.profileUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Открыть профиль
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="section-copy">
                Для этой ниши пока нет достаточного набора поддерживающих аккаунтов.
              </p>
            )}
          </div>

          <div className="insight-box">
            <span>Покрытие и заметки по качеству данных</span>
            <ul className="plain-list">
              {evidencePack.coverageNotes.map((note) => (
                <li key={`${bucket.bucketId}-${note}`}>{note}</li>
              ))}
            </ul>

            {evidencePack.breakdownNotes.length > 0 ? (
              <>
                <span className="evidence-pack__subheading">Дополнительные замечания</span>
                <ul className="plain-list">
                  {evidencePack.breakdownNotes.map((note) => (
                    <li key={`${bucket.bucketId}-${note}`}>{note}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </details>
  );
}
