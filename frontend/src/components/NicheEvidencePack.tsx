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
            <span>Сильнейшие подтверждающие аккаунты</span>

            {evidencePack.strongestAccounts.length > 0 ? (
              <div className="evidence-pack__account-list">
                {evidencePack.strongestAccounts.map((account) => (
                  <div
                    key={`${bucket.bucketId}-${account.handle ?? "unknown"}-${account.metric}`}
                    className="strong-account-box"
                  >
                    <strong>{account.displayName ?? account.handle ?? "Без имени"}</strong>
                    <span>{account.handle ? `@${account.handle}` : "handle недоступен"}</span>
                    <p>{account.reason}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="section-copy">
                Для этой ниши пока нет достаточного summary по подтверждающим аккаунтам.
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
