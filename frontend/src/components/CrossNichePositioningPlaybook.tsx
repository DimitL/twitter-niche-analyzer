import type {
  CrossNichePositioningPlaybook as CrossNichePositioningPlaybookModel,
  NichePositioningPlaybookLeader
} from "../utils/nichePositioningPlaybook.js";

interface CrossNichePositioningPlaybookProps {
  playbook: CrossNichePositioningPlaybookModel;
  variant?: "panel" | "embedded";
}

function buildSectionClassName(variant: "panel" | "embedded") {
  return variant === "panel"
    ? "panel positioning-playbook"
    : "positioning-playbook positioning-playbook--embedded";
}

function buildBucketMetaLabel(rank: number | null) {
  if (!rank) {
    return "Ниша вне shortlist";
  }

  return `Ниша #${rank}`;
}

function renderLeader(label: string, leader: NichePositioningPlaybookLeader | null) {
  return (
    <div className="summary-box">
      <span>{label}</span>
      <strong>{leader ? leader.bucketLabel : "н/д"}</strong>
      <p>{leader?.reason ?? "Пока нет достаточно сильного сигнала для уверенного вывода."}</p>
    </div>
  );
}

export function CrossNichePositioningPlaybook({
  playbook,
  variant = "panel"
}: CrossNichePositioningPlaybookProps) {
  const sectionClassName = buildSectionClassName(variant);

  return (
    <section className={sectionClassName}>
      <div className="positioning-playbook__header">
        <div>
          <p className="eyebrow">Практический playbook</p>
          <h2>Что постить первым в каждой shortlisted нише</h2>
          <p className="section-copy">
            Этот блок превращает positioning-рекомендации в более прикладной старт:
            какой угол брать первым, какие серии тестировать и с каких постов удобнее
            всего начать ручную проверку ниши.
          </p>
        </div>

        <div className="decision-chip-list">
          <span className="decision-chip">
            {playbook.comparableBucketCount} ниш с playbook
          </span>
        </div>
      </div>

      <div className="positioning-playbook__summary">
        <div className="insight-box">
          <span>Короткая сводка</span>
          <p>{playbook.playbookSummary}</p>
        </div>

        {playbook.globalConfidenceNote ? (
          <div className="insight-box">
            <span>Ограничение уверенности</span>
            <p>{playbook.globalConfidenceNote}</p>
          </div>
        ) : null}
      </div>

      <div className="positioning-playbook__leaders">
        {renderLeader(
          "Где проще всего начать",
          playbook.summary.easiestNicheToStartPostingIn
        )}
        {renderLeader(
          "Где угол читается яснее всего",
          playbook.summary.nicheWithClearestPositioningAngle
        )}
        {renderLeader(
          "Где проще повторять контент",
          playbook.summary.nicheWithStrongestContentRepeatability
        )}
      </div>

      <div className="positioning-playbook__grid">
        {playbook.perBucketPlaybooks.map((bucket) => (
          <article
            key={`positioning-playbook-${bucket.bucketId}`}
            className="positioning-playbook__bucket-card"
          >
            <div className="positioning-playbook__bucket-header">
              <div>
                <p className="eyebrow">{buildBucketMetaLabel(bucket.rank)}</p>
                <h3>{bucket.label}</h3>
                <p className="section-copy">{bucket.playbookTitle}</p>
              </div>

              {bucket.bestEntryAngle ? (
                <span className="decision-chip">
                  Лучший угол: {bucket.bestEntryAngle.label}
                </span>
              ) : null}
            </div>

            <div className="positioning-playbook__bucket-section">
              <span>С чего лучше заходить</span>
              <p>
                {bucket.bestEntryAngle
                  ? `${bucket.bestEntryAngle.label} выглядит самым логичным входом для первой серии постов.`
                  : "Пока нет достаточно сильного сигнала, поэтому playbook лучше читать как набор первых гипотез."}
              </p>
            </div>

            <div className="positioning-playbook__bucket-section">
              <span>Стартовые направления</span>
              <ul className="plain-list">
                {bucket.starterContentDirections.map((direction) => (
                  <li key={`${bucket.bucketId}-${direction}`}>{direction}</li>
                ))}
              </ul>
            </div>

            <div className="positioning-playbook__bucket-section">
              <span>Идеи для первых постов</span>
              <ul className="plain-list">
                {bucket.firstPostIdeas.map((idea) => (
                  <li key={`${bucket.bucketId}-${idea}`}>{idea}</li>
                ))}
              </ul>
            </div>

            {bucket.weakAngleWarnings.length > 0 ? (
              <div className="positioning-playbook__bucket-section">
                <span>Какие слабые углы лучше не переигрывать</span>
                <ul className="plain-list">
                  {bucket.weakAngleWarnings.map((warning) => (
                    <li key={`${bucket.bucketId}-${warning}`}>{warning}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {bucket.playbookConfidenceNote ? (
              <p className="positioning-playbook__bucket-note">
                {bucket.playbookConfidenceNote}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
