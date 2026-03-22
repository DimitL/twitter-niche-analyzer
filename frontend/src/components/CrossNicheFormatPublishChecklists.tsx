import type {
  CrossNicheFormatPublishChecklists as CrossNicheFormatPublishChecklistsModel,
  FormatPublishChecklist
} from "../utils/nicheFormatPublishChecklists.js";

interface CrossNicheFormatPublishChecklistsProps {
  checklists: CrossNicheFormatPublishChecklistsModel;
  variant?: "panel" | "embedded";
}

function buildSectionClassName(variant: "panel" | "embedded") {
  return variant === "panel"
    ? "panel format-publish-checklists"
    : "format-publish-checklists format-publish-checklists--embedded";
}

function buildBucketMetaLabel(rank: number | null) {
  if (!rank) {
    return "Ниша вне shortlist";
  }

  return `Ниша #${rank}`;
}

function renderLeader(
  label: string,
  leader: CrossNicheFormatPublishChecklistsModel["summary"][keyof CrossNicheFormatPublishChecklistsModel["summary"]]
) {
  return (
    <div className="summary-box">
      <span>{label}</span>
      <strong>{leader ? leader.bucketLabel : "н/д"}</strong>
      <p>{leader?.reason ?? "Пока нет достаточно сильного сигнала для уверенного вывода."}</p>
    </div>
  );
}

function renderChecklistCard(
  bucketId: string,
  title: string,
  checklist: FormatPublishChecklist
) {
  return (
    <article className="format-publish-checklists__checklist-card">
      <strong>{title}</strong>
      <p className="format-publish-checklists__checklist-title">
        {checklist.checklistTitle}
      </p>

      <div className="format-publish-checklists__checklist-section">
        <span>Быстрый checklist</span>
        <ul className="plain-list">
          {checklist.checks.map((item) => (
            <li key={`${bucketId}-${title}-${item}`}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="format-publish-checklists__checklist-section">
        <span>Не забыть перед публикацией</span>
        <p>{checklist.mustNotForget}</p>
      </div>

      <div className="format-publish-checklists__checklist-section">
        <span>Когда важнее всего</span>
        <p>{checklist.whenItMatters}</p>
      </div>

      {checklist.avoidWarning ? (
        <p className="format-publish-checklists__checklist-note">
          Не переусердствовать так: {checklist.avoidWarning}
        </p>
      ) : null}
    </article>
  );
}

export function CrossNicheFormatPublishChecklists({
  checklists,
  variant = "panel"
}: CrossNicheFormatPublishChecklistsProps) {
  const sectionClassName = buildSectionClassName(variant);

  return (
    <section className={sectionClassName}>
      <div className="format-publish-checklists__header">
        <div>
          <p className="eyebrow">Проверка перед публикацией</p>
          <h2>Что проверить в посте прямо перед публикацией</h2>
          <p className="section-copy">
            Этот блок переводит execution templates и rewrite skeletons в короткий
            финальный pass: что быстро проверить в thread, continuation, quote-follow-up
            или recap, чтобы пост не развалился на последнем шаге.
          </p>
        </div>

        <div className="decision-chip-list">
          <span className="decision-chip">
            {checklists.comparableBucketCount} ниш с publish-checklists
          </span>
        </div>
      </div>

      <div className="format-publish-checklists__summary">
        <div className="insight-box">
          <span>Короткая сводка</span>
          <p>{checklists.publishChecklistSummary}</p>
        </div>

        {checklists.globalConfidenceNote ? (
          <div className="insight-box">
            <span>Ограничение уверенности</span>
            <p>{checklists.globalConfidenceNote}</p>
          </div>
        ) : null}
      </div>

      <div className="format-publish-checklists__leaders">
        {renderLeader(
          "Где thread легче довести до publish-ready",
          checklists.summary.nicheWithEasiestThreadPublishingDiscipline
        )}
        {renderLeader(
          "Где recap проще держать чистым",
          checklists.summary.nicheWithEasiestRecapQualityControl
        )}
        {renderLeader(
          "Где quote-follow-up требует большей осторожности",
          checklists.summary.nicheWhereQuoteFollowUpRequiresMostCaution
        )}
      </div>

      <div className="format-publish-checklists__grid">
        {checklists.perBucketChecklists.map((bucket) => (
          <article
            key={`format-publish-checklists-${bucket.bucketId}`}
            className="format-publish-checklists__bucket-card"
          >
            <div className="format-publish-checklists__bucket-header">
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

            <div className="format-publish-checklists__checklist-grid">
              {renderChecklistCard(
                bucket.bucketId,
                "Checklist для thread",
                bucket.formatPublishChecklists.threadChecklist
              )}
              {renderChecklistCard(
                bucket.bucketId,
                "Checklist для mini-series",
                bucket.formatPublishChecklists.miniSeriesChecklist
              )}
              {renderChecklistCard(
                bucket.bucketId,
                "Checklist для quote-follow-up",
                bucket.formatPublishChecklists.quoteFollowUpChecklist
              )}
              {renderChecklistCard(
                bucket.bucketId,
                "Checklist для recap",
                bucket.formatPublishChecklists.recapChecklist
              )}
            </div>

            {bucket.checklistConfidenceNote ? (
              <p className="format-publish-checklists__bucket-note">
                {bucket.checklistConfidenceNote}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
