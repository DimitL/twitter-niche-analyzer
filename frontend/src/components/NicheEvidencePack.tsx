import { useState } from "react";
import { buildNicheEvidencePack } from "../utils/nicheEvidencePack.js";
import type {
  NicheShortlistSupportingAccount,
  NicheShortlistSupportingTweetReference,
  RankedNicheShortlistBucket
} from "../types/nicheShortlist.js";

interface NicheEvidencePackProps {
  bucket: RankedNicheShortlistBucket;
}

type SupportingAccountSnippetMode = "recent" | "bestPerforming";

function formatPublishedAt(value: string | null) {
  if (!value) {
    return "Дата недоступна";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium"
  }).format(parsedDate);
}

function formatMetricChip(
  label: string,
  metric: NicheShortlistSupportingTweetReference["likeCount"]
) {
  if (!metric.available) {
    return null;
  }

  const value =
    metric.rawText ??
    (metric.normalizedNumber !== null
      ? metric.normalizedNumber.toLocaleString("ru-RU")
      : "н/д");

  return `${label} ${value}`;
}

function getSnippetModeLabel(mode: SupportingAccountSnippetMode) {
  return mode === "recent" ? "Свежие" : "Лучшие по реакции";
}

function getContentPatternLabel(
  tag: NicheShortlistSupportingTweetReference["contentPatternTags"][number]
) {
  switch (tag) {
    case "strongHook":
      return "Сильный hook";
    case "contrarianTake":
      return "Контрарный угол";
    case "productUpdate":
      return "Продуктовый апдейт";
    case "benchmarkOrResult":
      return "Результат / benchmark";
    case "educationalBreakdown":
      return "Обучающий breakdown";
    case "founderInsight":
      return "Founder insight";
    case "timelyNewsTieIn":
      return "Привязка к новости";
    case "audienceQuestion":
      return "Вопрос к аудитории";
    case "narrativeStorytelling":
      return "Storytelling";
    default:
      return tag;
  }
}

function getTweetReferencesByMode(
  account: NicheShortlistSupportingAccount,
  mode: SupportingAccountSnippetMode
) {
  if (mode === "bestPerforming") {
    return {
      count: account.bestPerformingTweetReferencesCount,
      references: account.bestPerformingTweetReferences,
      note: account.bestPerformingTweetReferencesNote
    };
  }

  return {
    count: account.recentTweetReferencesCount,
    references: account.recentTweetReferences,
    note: account.recentTweetReferencesNote
  };
}

export function NicheEvidencePack({ bucket }: NicheEvidencePackProps) {
  const evidencePack = buildNicheEvidencePack(bucket);
  const [snippetMode, setSnippetMode] =
    useState<SupportingAccountSnippetMode>("recent");

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

            {evidencePack.nicheArchetypeSummary ||
            evidencePack.dominantNichePatterns.length > 0 ||
            evidencePack.commonArchetypes.length > 0 ? (
              <div className="niche-archetype-rollup">
                <div className="niche-archetype-rollup__header">
                  <div>
                    <span className="niche-archetype-rollup__eyebrow">
                      Общий контентный паттерн ниши
                    </span>
                    {evidencePack.nicheArchetypeSummary ? (
                      <p className="niche-archetype-rollup__summary">
                        {evidencePack.nicheArchetypeSummary}
                      </p>
                    ) : null}
                  </div>

                  {evidencePack.archetypeCoverageCount > 0 ? (
                    <span className="decision-chip decision-chip--neutral">
                      {evidencePack.archetypeCoverageCount} аккаунта в rollup
                    </span>
                  ) : null}
                </div>

                {evidencePack.dominantNichePatterns.length > 0 ? (
                  <div className="niche-archetype-rollup__patterns">
                    {evidencePack.dominantNichePatterns.map((tag) => (
                      <span
                        key={`${bucket.bucketId}-niche-dominant-${tag}`}
                        className="pattern-chip"
                      >
                        {getContentPatternLabel(tag)}
                      </span>
                    ))}
                  </div>
                ) : null}

                {evidencePack.secondaryNichePatterns.length > 0 ? (
                  <p className="niche-archetype-rollup__secondary">
                    Вторичные паттерны:{" "}
                    {evidencePack.secondaryNichePatterns
                      .map((tag) => getContentPatternLabel(tag))
                      .join(", ")}
                  </p>
                ) : null}

                {evidencePack.commonArchetypes.length > 0 ? (
                  <div className="niche-archetype-rollup__archetypes">
                    {evidencePack.commonArchetypes.map((archetype) => (
                      <span
                        key={`${bucket.bucketId}-common-archetype-${archetype.label}`}
                        className="decision-chip decision-chip--neutral"
                      >
                        {archetype.label} · {archetype.accountCount}
                      </span>
                    ))}
                  </div>
                ) : null}

                {evidencePack.nicheArchetypeConfidenceNote ? (
                  <p className="niche-archetype-rollup__note">
                    {evidencePack.nicheArchetypeConfidenceNote}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="snippet-mode-switch" aria-label="Режим твитов">
              {([
                "recent",
                "bestPerforming"
              ] as SupportingAccountSnippetMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`snippet-mode-button ${snippetMode === mode ? "snippet-mode-button--active" : ""}`}
                  aria-pressed={snippetMode === mode}
                  onClick={() => setSnippetMode(mode)}
                >
                  {getSnippetModeLabel(mode)}
                </button>
              ))}
            </div>

            {evidencePack.topSupportingAccounts.length > 0 ? (
              <div className="evidence-pack__supporting-list">
                {evidencePack.topSupportingAccounts.map((account, index) => {
                  const selectedReferences = getTweetReferencesByMode(
                    account,
                    snippetMode
                  );

                  return (
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
                      {account.contentArchetypeLabel ||
                      account.archetypeSummary ||
                      account.archetypeConfidenceNote ? (
                        <div className="supporting-account-card__archetype">
                          <div className="supporting-account-card__archetype-header">
                            <span className="supporting-account-card__archetype-eyebrow">
                              Контентный архетип по сильным твитам
                            </span>

                            {account.contentArchetypeLabel ? (
                              <span className="decision-chip decision-chip--neutral">
                                {account.contentArchetypeLabel}
                              </span>
                            ) : null}
                          </div>

                          {account.dominantPatterns.length > 0 ? (
                            <div className="supporting-account-card__archetype-patterns">
                              {account.dominantPatterns.map((tag) => (
                                <span
                                  key={`${bucket.bucketId}-${account.handle ?? "unknown"}-dominant-${tag}`}
                                  className="pattern-chip"
                                >
                                  {getContentPatternLabel(tag)}
                                </span>
                              ))}
                            </div>
                          ) : null}

                          {account.secondaryPatterns.length > 0 ? (
                            <p className="supporting-account-card__archetype-secondary">
                              Вторичные паттерны:{" "}
                              {account.secondaryPatterns
                                .map((tag) => getContentPatternLabel(tag))
                                .join(", ")}
                            </p>
                          ) : null}

                          {account.archetypeSummary ? (
                            <p className="supporting-account-card__archetype-summary">
                              {account.archetypeSummary}
                            </p>
                          ) : null}

                          {account.archetypeConfidenceNote ? (
                            <p className="supporting-account-card__archetype-note">
                              {account.archetypeConfidenceNote}
                            </p>
                          ) : null}
                        </div>
                      ) : null}

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

                      {selectedReferences.references.length > 0 ? (
                        <details className="supporting-account-card__tweets">
                          <summary className="supporting-account-card__tweets-summary">
                            {getSnippetModeLabel(snippetMode)} твиты ({selectedReferences.count})
                          </summary>

                          <div className="supporting-account-card__tweet-list">
                            {selectedReferences.references.map(
                              (tweetReference, tweetIndex) => {
                                const metricChips = [
                                  formatMetricChip("Лайки", tweetReference.likeCount),
                                  formatMetricChip("Репосты", tweetReference.repostCount),
                                  formatMetricChip("Ответы", tweetReference.replyCount)
                                ].filter((value): value is string => Boolean(value));

                                return (
                                  <div
                                    key={`${bucket.bucketId}-${account.handle ?? "unknown"}-${snippetMode}-tweet-${tweetIndex}`}
                                    className="supporting-tweet-card"
                                  >
                                    <div className="supporting-tweet-card__meta">
                                      <span>{formatPublishedAt(tweetReference.publishedAt)}</span>
                                      {tweetReference.language ? (
                                        <span>Язык: {tweetReference.language}</span>
                                      ) : null}
                                    </div>

                                    <p>
                                      {tweetReference.tweetTextSnippet ??
                                        "Короткий текстовый snippet для этого твита пока недоступен."}
                                    </p>

                                    {snippetMode === "bestPerforming" &&
                                    tweetReference.contentPatternTags.length > 0 ? (
                                      <div className="supporting-tweet-card__patterns">
                                        {tweetReference.contentPatternTags.map((tag) => (
                                          <span
                                            key={`${bucket.bucketId}-${account.handle ?? "unknown"}-${tag}-${tweetIndex}`}
                                            className="pattern-chip"
                                          >
                                            {getContentPatternLabel(tag)}
                                          </span>
                                        ))}
                                      </div>
                                    ) : null}

                                    {snippetMode === "bestPerforming" &&
                                    tweetReference.likelyStrengthReason ? (
                                      <p className="supporting-tweet-card__reason">
                                        {tweetReference.likelyStrengthReason}
                                      </p>
                                    ) : null}

                                    {metricChips.length > 0 ? (
                                      <div className="supporting-tweet-card__metrics">
                                        {metricChips.map((metricChip) => (
                                          <span key={metricChip} className="score-chip">
                                            {metricChip}
                                          </span>
                                        ))}
                                      </div>
                                    ) : null}

                                    {snippetMode === "bestPerforming" &&
                                    tweetReference.tagConfidenceNotes.length > 0 ? (
                                      <ul className="plain-list supporting-tweet-card__notes">
                                        {tweetReference.tagConfidenceNotes.map((note) => (
                                          <li
                                            key={`${bucket.bucketId}-${account.handle ?? "unknown"}-${tweetIndex}-${note}`}
                                          >
                                            {note}
                                          </li>
                                        ))}
                                      </ul>
                                    ) : null}

                                    {tweetReference.tweetUrl ? (
                                      <a
                                        className="supporting-account-card__link"
                                        href={tweetReference.tweetUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        Открыть твит
                                      </a>
                                    ) : null}
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </details>
                      ) : selectedReferences.note ? (
                        <p className="supporting-account-card__note">
                          {selectedReferences.note}
                        </p>
                      ) : null}

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
                  );
                })}
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
