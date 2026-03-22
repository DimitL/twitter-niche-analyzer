import type {
  CrossNicheFormatOpeningClosingVariants as CrossNicheFormatOpeningClosingVariantsModel,
  FormatOpeningClosingVariantSet,
  FormatVariantOption
} from "../utils/nicheFormatOpeningClosingVariants.js";

interface CrossNicheFormatOpeningClosingVariantsProps {
  variants: CrossNicheFormatOpeningClosingVariantsModel;
  variant?: "panel" | "embedded";
}

function buildSectionClassName(variant: "panel" | "embedded") {
  return variant === "panel"
    ? "panel format-opening-closing-variants"
    : "format-opening-closing-variants format-opening-closing-variants--embedded";
}

function buildBucketMetaLabel(rank: number | null) {
  if (!rank) {
    return "Ниша вне shortlist";
  }

  return `Ниша #${rank}`;
}

function renderLeader(
  label: string,
  leader: CrossNicheFormatOpeningClosingVariantsModel["summary"][keyof CrossNicheFormatOpeningClosingVariantsModel["summary"]]
) {
  return (
    <div className="summary-box">
      <span>{label}</span>
      <strong>{leader ? leader.bucketLabel : "н/д"}</strong>
      <p>{leader?.reason ?? "Пока нет достаточно сильного сигнала для уверенного вывода."}</p>
    </div>
  );
}

function renderVariantList(
  items: FormatVariantOption[],
  emptyLabel: string
) {
  if (items.length === 0) {
    return <p>{emptyLabel}</p>;
  }

  return (
    <ul className="plain-list format-opening-closing-variants__variant-list">
      {items.map((item) => (
        <li key={`${item.text}-${item.fitBestWhen}`}>
          <strong>{item.text}</strong>
          <p>{item.fitBestWhen}</p>
        </li>
      ))}
    </ul>
  );
}

function renderVariantCard(
  bucketId: string,
  title: string,
  variantSet: FormatOpeningClosingVariantSet
) {
  return (
    <article className="format-opening-closing-variants__format-card">
      <strong>{title}</strong>

      <div className="format-opening-closing-variants__format-section">
        <span>Варианты первого хука</span>
        {renderVariantList(
          variantSet.openingVariants,
          "Пока нет достаточно уверенного варианта для первого хука."
        )}
      </div>

      <div className="format-opening-closing-variants__format-section">
        <span>Варианты closing / CTA</span>
        {renderVariantList(
          variantSet.closingVariants,
          "Пока нет достаточно уверенного варианта для closing."
        )}
      </div>

      <div className="format-opening-closing-variants__format-section">
        <span>Когда лучше использовать</span>
        <ul className="plain-list">
          {variantSet.usageNotes.map((note) => (
            <li key={`${bucketId}-${title}-${note}`}>{note}</li>
          ))}
        </ul>
      </div>

      {variantSet.overuseWarning ? (
        <p className="format-opening-closing-variants__format-note">
          Не переусердствовать так: {variantSet.overuseWarning}
        </p>
      ) : null}
    </article>
  );
}

export function CrossNicheFormatOpeningClosingVariants({
  variants,
  variant = "panel"
}: CrossNicheFormatOpeningClosingVariantsProps) {
  const sectionClassName = buildSectionClassName(variant);

  return (
    <section className={sectionClassName}>
      <div className="format-opening-closing-variants__header">
        <div>
          <p className="eyebrow">Варианты hook и closing</p>
          <h2>Какими hook и closing вариантами безопаснее собирать пост</h2>
          <p className="section-copy">
            Этот блок собирает 2-3 безопасных opening hooks и 2-3 closing / CTA
            варианта под каждый формат, чтобы после templates, rewrite skeletons и
            checklist был ещё один практический слой для финальной ручной сборки.
          </p>
        </div>

        <div className="decision-chip-list">
          <span className="decision-chip">
            {variants.comparableBucketCount} ниш с hook / CTA вариантами
          </span>
        </div>
      </div>

      <div className="format-opening-closing-variants__summary">
        <div className="insight-box">
          <span>Короткая сводка</span>
          <p>{variants.variantsSummary}</p>
        </div>

        {variants.globalConfidenceNote ? (
          <div className="insight-box">
            <span>Ограничение уверенности</span>
            <p>{variants.globalConfidenceNote}</p>
          </div>
        ) : null}
      </div>

      <div className="format-opening-closing-variants__leaders">
        {renderLeader(
          "Где безопасные hooks читаются яснее",
          variants.summary.nicheWithClearestSafeHooks
        )}
        {renderLeader(
          "Где сильнее CTA и follow-up потенциал",
          variants.summary.nicheWithStrongestCtaReplyLoopPotential
        )}
        {renderLeader(
          "Где hooks важнее сильнее сдерживать",
          variants.summary.nicheWhereHooksNeedMostRestraint
        )}
      </div>

      <div className="format-opening-closing-variants__grid">
        {variants.perBucketVariants.map((bucket) => (
          <article
            key={`format-opening-closing-variants-${bucket.bucketId}`}
            className="format-opening-closing-variants__bucket-card"
          >
            <div className="format-opening-closing-variants__bucket-header">
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

            <div className="format-opening-closing-variants__format-grid">
              {renderVariantCard(
                bucket.bucketId,
                "Варианты для thread",
                bucket.formatOpeningClosingVariants.threadVariants
              )}
              {renderVariantCard(
                bucket.bucketId,
                "Варианты для mini-series",
                bucket.formatOpeningClosingVariants.miniSeriesVariants
              )}
              {renderVariantCard(
                bucket.bucketId,
                "Варианты для quote-follow-up",
                bucket.formatOpeningClosingVariants.quoteFollowUpVariants
              )}
              {renderVariantCard(
                bucket.bucketId,
                "Варианты для recap",
                bucket.formatOpeningClosingVariants.recapVariants
              )}
            </div>

            {bucket.variantsConfidenceNote ? (
              <p className="format-opening-closing-variants__bucket-note">
                {bucket.variantsConfidenceNote}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
