import type {
  CrossNicheFormatExampleRewrites as CrossNicheFormatExampleRewritesModel,
  FormatExampleRewrite
} from "../utils/nicheFormatExampleRewrites.js";

interface CrossNicheFormatExampleRewritesProps {
  rewrites: CrossNicheFormatExampleRewritesModel;
  variant?: "panel" | "embedded";
}

function buildSectionClassName(variant: "panel" | "embedded") {
  return variant === "panel"
    ? "panel format-rewrites"
    : "format-rewrites format-rewrites--embedded";
}

function buildBucketMetaLabel(rank: number | null) {
  if (!rank) {
    return "Ниша вне shortlist";
  }

  return `Ниша #${rank}`;
}

function renderLeader(
  label: string,
  leader: CrossNicheFormatExampleRewritesModel["summary"][keyof CrossNicheFormatExampleRewritesModel["summary"]]
) {
  return (
    <div className="summary-box">
      <span>{label}</span>
      <strong>{leader ? leader.bucketLabel : "н/д"}</strong>
      <p>{leader?.reason ?? "Пока нет достаточно сильного сигнала для уверенного вывода."}</p>
    </div>
  );
}

function renderRewriteCard(
  bucketId: string,
  title: string,
  rewrite: FormatExampleRewrite
) {
  return (
    <article className="format-rewrites__rewrite-card">
      <strong>{title}</strong>

      <div className="format-rewrites__rewrite-section">
        <span>Source candidate</span>
        <p>{rewrite.sourceCandidate}</p>
      </div>

      <div className="format-rewrites__rewrite-section">
        <span>Rewritten opening</span>
        <p>{rewrite.rewrittenOpening}</p>
      </div>

      <div className="format-rewrites__rewrite-section">
        <span>Structure bullets</span>
        <ul className="plain-list">
          {rewrite.structureBullets.map((item) => (
            <li key={`${bucketId}-${title}-${item}`}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="format-rewrites__rewrite-section">
        <span>Closing hint</span>
        <p>{rewrite.closingHint}</p>
      </div>

      <div className="format-rewrites__rewrite-section">
        <span>Почему это fits</span>
        <p>{rewrite.whyItFits}</p>
      </div>

      {rewrite.caution ? (
        <p className="format-rewrites__rewrite-note">
          Не переусердствовать так: {rewrite.caution}
        </p>
      ) : null}
    </article>
  );
}

export function CrossNicheFormatExampleRewrites({
  rewrites,
  variant = "panel"
}: CrossNicheFormatExampleRewritesProps) {
  const sectionClassName = buildSectionClassName(variant);

  return (
    <section className={sectionClassName}>
      <div className="format-rewrites__header">
        <div>
          <p className="eyebrow">Example rewrite skeletons</p>
          <h2>Как это выглядело бы уже как черновой skeleton поста</h2>
          <p className="section-copy">
            Этот блок берёт strongest candidate slot и показывает короткий пример,
            как тот же материал переложить в thread, mini-series continuation,
            quote-follow-up или recap без полного переписывания с нуля.
          </p>
        </div>

        <div className="decision-chip-list">
          <span className="decision-chip">
            {rewrites.comparableBucketCount} ниш с example rewrites
          </span>
        </div>
      </div>

      <div className="format-rewrites__summary">
        <div className="insight-box">
          <span>Короткая сводка</span>
          <p>{rewrites.rewritesSummary}</p>
        </div>

        {rewrites.globalConfidenceNote ? (
          <div className="insight-box">
            <span>Ограничение уверенности</span>
            <p>{rewrites.globalConfidenceNote}</p>
          </div>
        ) : null}
      </div>

      <div className="format-rewrites__leaders">
        {renderLeader(
          "Где thread skeleton читается яснее",
          rewrites.summary.nicheWithClearestThreadExample
        )}
        {renderLeader(
          "Где quote-follow-up переводится легче",
          rewrites.summary.nicheWithEasiestQuoteFollowUpConversion
        )}
        {renderLeader(
          "Где recap skeleton сильнее",
          rewrites.summary.nicheWithStrongestRecapExample
        )}
      </div>

      <div className="format-rewrites__grid">
        {rewrites.perBucketRewrites.map((bucket) => (
          <article
            key={`format-rewrites-${bucket.bucketId}`}
            className="format-rewrites__bucket-card"
          >
            <div className="format-rewrites__bucket-header">
              <div>
                <p className="eyebrow">{buildBucketMetaLabel(bucket.rank)}</p>
                <h3>{bucket.label}</h3>
              </div>

              {bucket.bestEntryAngleLabel ? (
                <span className="decision-chip">
                  Базовый угол: {bucket.bestEntryAngleLabel}
                </span>
              ) : null}
            </div>

            <div className="format-rewrites__rewrite-grid">
              {renderRewriteCard(
                bucket.bucketId,
                "Thread example",
                bucket.formatExampleRewrites.threadExample
              )}
              {renderRewriteCard(
                bucket.bucketId,
                "Mini-series example",
                bucket.formatExampleRewrites.miniSeriesExample
              )}
              {renderRewriteCard(
                bucket.bucketId,
                "Quote-follow-up example",
                bucket.formatExampleRewrites.quoteFollowUpExample
              )}
              {renderRewriteCard(
                bucket.bucketId,
                "Recap example",
                bucket.formatExampleRewrites.recapExample
              )}
            </div>

            {bucket.exampleRewriteConfidenceNote ? (
              <p className="format-rewrites__bucket-note">
                {bucket.exampleRewriteConfidenceNote}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
