import type {
  CrossNicheFormatExecutionTemplates as CrossNicheFormatExecutionTemplatesModel,
  FormatExecutionTemplate
} from "../utils/nicheFormatExecutionTemplates.js";

interface CrossNicheFormatExecutionTemplatesProps {
  templates: CrossNicheFormatExecutionTemplatesModel;
  variant?: "panel" | "embedded";
}

function buildSectionClassName(variant: "panel" | "embedded") {
  return variant === "panel"
    ? "panel format-templates"
    : "format-templates format-templates--embedded";
}

function buildBucketMetaLabel(rank: number | null) {
  if (!rank) {
    return "Ниша вне shortlist";
  }

  return `Ниша #${rank}`;
}

function renderLeader(
  label: string,
  leader: CrossNicheFormatExecutionTemplatesModel["summary"][keyof CrossNicheFormatExecutionTemplatesModel["summary"]]
) {
  return (
    <div className="summary-box">
      <span>{label}</span>
      <strong>{leader ? leader.bucketLabel : "н/д"}</strong>
      <p>{leader?.reason ?? "Пока нет достаточно сильного сигнала для уверенного вывода."}</p>
    </div>
  );
}

function renderTemplateCard(
  bucketId: string,
  title: string,
  template: FormatExecutionTemplate
) {
  return (
    <article className="format-templates__template-card">
      <strong>{title}</strong>
      <p className="format-templates__template-title">{template.templateTitle}</p>

      <div className="format-templates__template-section">
        <span>Когда использовать</span>
        <p>{template.whenToUse}</p>
      </div>

      <div className="format-templates__template-section">
        <span>Структура</span>
        <ul className="plain-list">
          {template.structureBlocks.map((block) => (
            <li key={`${bucketId}-${title}-${block}`}>{block}</li>
          ))}
        </ul>
      </div>

      <div className="format-templates__template-section">
        <span>Opening pattern</span>
        <p>{template.openingPattern}</p>
      </div>

      <div className="format-templates__template-section">
        <span>Почему это подходит</span>
        <p>{template.whyItFits}</p>
      </div>

      {template.caution ? (
        <p className="format-templates__template-note">
          Не переусердствовать так: {template.caution}
        </p>
      ) : null}
    </article>
  );
}

export function CrossNicheFormatExecutionTemplates({
  templates,
  variant = "panel"
}: CrossNicheFormatExecutionTemplatesProps) {
  const sectionClassName = buildSectionClassName(variant);

  return (
    <section className={sectionClassName}>
      <div className="format-templates__header">
        <div>
          <p className="eyebrow">Format execution templates</p>
          <h2>Как именно структурировать post под каждый repurpose-формат</h2>
          <p className="section-copy">
            Здесь repurposing hints превращаются в короткие рабочие шаблоны:
            когда запускать формат, из каких блоков он состоит, с какой opening
            line его начинать и где он чаще всего ломается.
          </p>
        </div>

        <div className="decision-chip-list">
          <span className="decision-chip">
            {templates.comparableBucketCount} ниш с execution templates
          </span>
        </div>
      </div>

      <div className="format-templates__summary">
        <div className="insight-box">
          <span>Короткая сводка</span>
          <p>{templates.templatesSummary}</p>
        </div>

        {templates.globalConfidenceNote ? (
          <div className="insight-box">
            <span>Ограничение уверенности</span>
            <p>{templates.globalConfidenceNote}</p>
          </div>
        ) : null}
      </div>

      <div className="format-templates__leaders">
        {renderLeader(
          "Где яснее всего thread-format",
          templates.summary.nicheWithClearestThreadFormat
        )}
        {renderLeader(
          "Где легче всего quote-follow-up loop",
          templates.summary.nicheWithEasiestQuoteFollowUpLoop
        )}
        {renderLeader(
          "Где сильнее recap potential",
          templates.summary.nicheWithStrongestRecapPotential
        )}
      </div>

      <div className="format-templates__grid">
        {templates.perBucketTemplates.map((bucket) => (
          <article
            key={`format-templates-${bucket.bucketId}`}
            className="format-templates__bucket-card"
          >
            <div className="format-templates__bucket-header">
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

            <div className="format-templates__template-grid">
              {renderTemplateCard(
                bucket.bucketId,
                "Thread",
                bucket.formatExecutionTemplates.threadTemplate
              )}
              {renderTemplateCard(
                bucket.bucketId,
                "Mini-series continuation",
                bucket.formatExecutionTemplates.miniSeriesTemplate
              )}
              {renderTemplateCard(
                bucket.bucketId,
                "Quote-follow-up",
                bucket.formatExecutionTemplates.quoteFollowUpTemplate
              )}
              {renderTemplateCard(
                bucket.bucketId,
                "Recap / summary",
                bucket.formatExecutionTemplates.recapTemplate
              )}
            </div>

            {bucket.templateConfidenceNote ? (
              <p className="format-templates__bucket-note">
                {bucket.templateConfidenceNote}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
