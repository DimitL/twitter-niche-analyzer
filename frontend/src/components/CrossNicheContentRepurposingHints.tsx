import type {
  ContentRepurposingCandidate,
  CrossNicheContentRepurposingHints as CrossNicheContentRepurposingHintsModel
} from "../utils/nicheContentRepurposingHints.js";

interface CrossNicheContentRepurposingHintsProps {
  hints: CrossNicheContentRepurposingHintsModel;
  variant?: "panel" | "embedded";
}

function buildSectionClassName(variant: "panel" | "embedded") {
  return variant === "panel"
    ? "panel content-repurposing"
    : "content-repurposing content-repurposing--embedded";
}

function buildBucketMetaLabel(rank: number | null) {
  if (!rank) {
    return "Ниша вне shortlist";
  }

  return `Ниша #${rank}`;
}

function renderLeader(
  label: string,
  leader: CrossNicheContentRepurposingHintsModel["summary"][keyof CrossNicheContentRepurposingHintsModel["summary"]]
) {
  return (
    <div className="summary-box">
      <span>{label}</span>
      <strong>{leader ? leader.bucketLabel : "н/д"}</strong>
      <p>{leader?.reason ?? "Пока нет достаточно сильного сигнала для уверенного вывода."}</p>
    </div>
  );
}

function renderCandidates(
  bucketId: string,
  candidates: ContentRepurposingCandidate[],
  emptyLabel: string
) {
  if (candidates.length === 0) {
    return (
      <ul className="plain-list">
        <li>{emptyLabel}</li>
      </ul>
    );
  }

  return (
    <ul className="plain-list">
      {candidates.map((candidate) => (
        <li
          key={`${bucketId}-${candidate.slotLabel}-${candidate.seriesTitle}-${candidate.postAngle}`}
        >
          <strong>
            {candidate.slotLabel} · {candidate.seriesTitle}
          </strong>
          <p className="content-repurposing__candidate-angle">{candidate.postAngle}</p>
          <p className="content-repurposing__candidate-reason">{candidate.fitReason}</p>
          {candidate.cautionNote ? (
            <p className="content-repurposing__candidate-note">
              Не переусердствовать так: {candidate.cautionNote}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function CrossNicheContentRepurposingHints({
  hints,
  variant = "panel"
}: CrossNicheContentRepurposingHintsProps) {
  const sectionClassName = buildSectionClassName(variant);

  return (
    <section className={sectionClassName}>
      <div className="content-repurposing__header">
        <div>
          <p className="eyebrow">Repurposing workflow</p>
          <h2>Какие слоты лучше разворачивать, а не писать с нуля заново</h2>
          <p className="section-copy">
            Этот блок показывает, какие элементы 2-недельного плана лучше всего
            докручивать в thread, mini-series continuation, quote-follow-up или recap,
            чтобы ускорить ритм без потери содержания.
          </p>
        </div>

        <div className="decision-chip-list">
          <span className="decision-chip">
            {hints.comparableBucketCount} ниш с repurposing hints
          </span>
        </div>
      </div>

      <div className="content-repurposing__summary">
        <div className="insight-box">
          <span>Короткая сводка</span>
          <p>{hints.repurposingSummary}</p>
        </div>

        {hints.globalConfidenceNote ? (
          <div className="insight-box">
            <span>Ограничение уверенности</span>
            <p>{hints.globalConfidenceNote}</p>
          </div>
        ) : null}
      </div>

      <div className="content-repurposing__leaders">
        {renderLeader(
          "Где strongest thread potential",
          hints.summary.nicheWithStrongestThreadPotential
        )}
        {renderLeader(
          "Где mini-series собирается проще",
          hints.summary.nicheWithStrongestMiniSeriesPotential
        )}
        {renderLeader(
          "Где recap loop выглядит легче",
          hints.summary.nicheWithEasiestRecapLoop
        )}
      </div>

      <div className="content-repurposing__grid">
        {hints.perBucketHints.map((bucket) => (
          <article
            key={`content-repurposing-${bucket.bucketId}`}
            className="content-repurposing__bucket-card"
          >
            <div className="content-repurposing__bucket-header">
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

            <div className="content-repurposing__format-grid">
              <article className="content-repurposing__format-card">
                <strong>Thread-кандидаты</strong>
                {renderCandidates(
                  bucket.bucketId,
                  bucket.threadCandidates,
                  "Пока нет слотов, которые уверенно тянут thread expansion."
                )}
              </article>

              <article className="content-repurposing__format-card">
                <strong>Mini-series continuation</strong>
                {renderCandidates(
                  bucket.bucketId,
                  bucket.miniSeriesCandidates,
                  "Пока нет сильных continuation-кандидатов."
                )}
              </article>

              <article className="content-repurposing__format-card">
                <strong>Quote-follow-up</strong>
                {renderCandidates(
                  bucket.bucketId,
                  bucket.quoteFollowUpCandidates,
                  "Пока нет слотов, которые уверенно просятся в quote-follow-up."
                )}
              </article>

              <article className="content-repurposing__format-card">
                <strong>Recap-посты</strong>
                {renderCandidates(
                  bucket.bucketId,
                  bucket.recapCandidates,
                  "Пока нет явных recap-кандидатов."
                )}
              </article>
            </div>

            {bucket.whyTheseFormatsFit.length > 0 ? (
              <div className="content-repurposing__bucket-section">
                <span>Почему эти форматы здесь подходят</span>
                <ul className="plain-list">
                  {bucket.whyTheseFormatsFit.map((item) => (
                    <li key={`${bucket.bucketId}-fit-${item}`}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {bucket.overuseWarnings.length > 0 ? (
              <div className="content-repurposing__bucket-section">
                <span>Что не стоит переиспользовать слишком агрессивно</span>
                <ul className="plain-list">
                  {bucket.overuseWarnings.map((item) => (
                    <li key={`${bucket.bucketId}-warning-${item}`}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {bucket.repurposingConfidenceNote ? (
              <p className="content-repurposing__bucket-note">
                {bucket.repurposingConfidenceNote}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
