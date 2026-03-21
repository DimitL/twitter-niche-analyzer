import { useMemo, useState } from "react";
import type { NicheShortlistResponse } from "../types/nicheShortlist.js";
import { CrossNicheContentCalendarAdaptation } from "./CrossNicheContentCalendarAdaptation.js";
import { CrossNicheContentCalendarStarter } from "./CrossNicheContentCalendarStarter.js";
import { CrossNicheContentRepurposingHints } from "./CrossNicheContentRepurposingHints.js";
import { CrossNicheFormatExampleRewrites } from "./CrossNicheFormatExampleRewrites.js";
import { CrossNicheFormatExecutionTemplates } from "./CrossNicheFormatExecutionTemplates.js";
import { CrossNichePositioningPlaybook } from "./CrossNichePositioningPlaybook.js";
import { CrossNichePositioningRecommendations } from "./CrossNichePositioningRecommendations.js";
import { CrossNicheRepeatableContentSeries } from "./CrossNicheRepeatableContentSeries.js";
import { CrossNicheWhitespaceComparison } from "./CrossNicheWhitespaceComparison.js";
import {
  buildNicheShortlistJsonExport,
  buildNicheShortlistMarkdownReport,
  buildNicheShortlistReportModel
} from "../utils/nicheShortlistReport.js";

interface ShortlistReportPanelProps {
  shortlist: NicheShortlistResponse | null;
  scenarioName: string | null;
  generatedAt: string | null;
  sourceKind: "live" | "pinned" | null;
}

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Время ещё не зафиксировано";
  }

  const parsedValue = Date.parse(value);

  if (!Number.isFinite(parsedValue)) {
    return value;
  }

  return new Date(parsedValue).toLocaleString("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function formatScore(value: number) {
  return value.toFixed(1);
}

function buildFileName(scenarioName: string | null, extension: "md" | "json") {
  const baseName = (scenarioName ?? "shortlist-report")
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return `${baseName || "shortlist-report"}.${extension}`;
}

async function copyTextToClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "true");
  textArea.style.position = "absolute";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
}

function downloadJsonFile(fileName: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json"
  });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

export function ShortlistReportPanel({
  shortlist,
  scenarioName,
  generatedAt,
  sourceKind
}: ShortlistReportPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "success" | "error">("idle");
  const report =
    shortlist && sourceKind
      ? buildNicheShortlistReportModel({
          shortlist,
          scenarioName,
          generatedAt,
          sourceKind
        })
      : null;
  const markdownExport = useMemo(
    () => (report ? buildNicheShortlistMarkdownReport(report) : ""),
    [report]
  );

  async function handleCopyMarkdown() {
    if (!markdownExport) {
      return;
    }

    try {
      await copyTextToClipboard(markdownExport);
      setCopyState("success");
      window.setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("error");
      window.setTimeout(() => setCopyState("idle"), 2500);
    }
  }

  function handleDownloadJson() {
    if (!report || !shortlist) {
      return;
    }

    downloadJsonFile(
      buildFileName(scenarioName, "json"),
      buildNicheShortlistJsonExport({
        report,
        shortlist
      })
    );
  }

  return (
    <section className="panel report-panel">
      <div className="report-panel__header">
        <div>
          <p className="eyebrow">Экспорт и отчёт</p>
          <h2>Сохранить shortlist вне live UI</h2>
          <p className="section-copy">
            Здесь можно открыть чистый report view, скопировать Markdown и выгрузить
            JSON по текущему shortlist или закреплённому результату сценария.
          </p>
        </div>

        {report ? (
          <div className="report-panel__meta">
            <span className="status-pill status-pill--neutral">
              Источник: {report.sourceLabel}
            </span>
            <span className="status-pill status-pill--neutral">
              Сценарий: {report.scenarioName ?? "Без имени"}
            </span>
            <span className="status-pill status-pill--neutral">
              Время: {formatTimestamp(report.generatedAt)}
            </span>
          </div>
        ) : null}
      </div>

      {report ? (
        <>
          <div className="report-panel__actions">
            <button type="button" onClick={() => setIsOpen((current) => !current)}>
              {isOpen ? "Скрыть отчёт" : "Открыть отчёт"}
            </button>
            <button type="button" onClick={() => void handleCopyMarkdown()}>
              {copyState === "success"
                ? "Markdown скопирован"
                : copyState === "error"
                  ? "Не удалось скопировать"
                  : "Скопировать Markdown"}
            </button>
            <button type="button" onClick={handleDownloadJson}>
              Скачать JSON
            </button>
          </div>

          {isOpen ? (
            <div className="report-view">
              <div className="report-view__hero">
                <div>
                  <p className="eyebrow">Отчёт</p>
                  <h3>{report.title}</h3>
                  <p className="section-copy">
                    Сценарий: {report.scenarioName ?? "Без имени"} · Сгенерировано:{" "}
                    {formatTimestamp(report.generatedAt)}
                  </p>
                </div>

                <div className="report-view__summary-grid">
                  <div className="state-box">
                    <span>Bucket-ов запрошено</span>
                    <strong>{report.shortlistSummary.totalRequestedBuckets}</strong>
                  </div>
                  <div className="state-box">
                    <span>Успешно ранжировано</span>
                    <strong>{report.shortlistSummary.successfullyRankedBuckets}</strong>
                  </div>
                  <div className="state-box">
                    <span>Shortlist size</span>
                    <strong>{report.shortlistSummary.shortlistSize}</strong>
                  </div>
                  <div className="state-box">
                    <span>Best overall</span>
                    <strong>{report.shortlistSummary.bestOverall?.label ?? "н/д"}</strong>
                  </div>
                </div>
              </div>

              <div className="report-view__niches">
                {report.crossNicheWhitespace ? (
                  <CrossNicheWhitespaceComparison
                    comparison={report.crossNicheWhitespace}
                    variant="embedded"
                  />
                ) : null}

                {report.crossNichePositioning ? (
                  <CrossNichePositioningRecommendations
                    recommendations={report.crossNichePositioning}
                    variant="embedded"
                  />
                ) : null}

                {report.crossNichePlaybook ? (
                  <CrossNichePositioningPlaybook
                    playbook={report.crossNichePlaybook}
                    variant="embedded"
                  />
                ) : null}

                {report.crossNicheRepeatableSeries ? (
                  <CrossNicheRepeatableContentSeries
                    series={report.crossNicheRepeatableSeries}
                    variant="embedded"
                  />
                ) : null}

                {report.crossNicheContentCalendar ? (
                  <CrossNicheContentCalendarStarter
                    calendar={report.crossNicheContentCalendar}
                    variant="embedded"
                  />
                ) : null}

                {report.crossNicheContentCalendarAdaptation ? (
                  <CrossNicheContentCalendarAdaptation
                    adaptation={report.crossNicheContentCalendarAdaptation}
                    variant="embedded"
                  />
                ) : null}

                {report.crossNicheContentRepurposingHints ? (
                  <CrossNicheContentRepurposingHints
                    hints={report.crossNicheContentRepurposingHints}
                    variant="embedded"
                  />
                ) : null}

                {report.crossNicheFormatExecutionTemplates ? (
                  <CrossNicheFormatExecutionTemplates
                    templates={report.crossNicheFormatExecutionTemplates}
                    variant="embedded"
                  />
                ) : null}

                {report.crossNicheFormatExampleRewrites ? (
                  <CrossNicheFormatExampleRewrites
                    rewrites={report.crossNicheFormatExampleRewrites}
                    variant="embedded"
                  />
                ) : null}

                {report.niches.map((niche) => (
                  <article
                    key={`${niche.bucketId}-report`}
                    className="report-niche-card"
                  >
                    <div className="report-niche-card__header">
                      <div>
                        <p className="eyebrow">
                          {niche.rank ? `Ниша #${niche.rank}` : "Ниша вне shortlist"}
                        </p>
                        <h4>{niche.label}</h4>
                        <p className="section-copy">
                          {niche.description ?? "Описание пока недоступно."}
                        </p>
                      </div>

                      <div className="decision-chip-list">
                        <span className="decision-chip">
                          Итог {formatScore(niche.topicScores.overallTopicScore)}
                        </span>
                        <span className="decision-chip decision-chip--neutral">
                          Рост {formatScore(niche.topicScores.growthPotential)}
                        </span>
                        <span className="decision-chip decision-chip--neutral">
                          Монетизация {formatScore(niche.topicScores.monetizationPotential)}
                        </span>
                        <span className="decision-chip decision-chip--neutral">
                          Простота {formatScore(niche.topicScores.contentEase)}
                        </span>
                      </div>
                    </div>

                    <div className="report-niche-card__grid">
                      <div className="insight-box">
                        <span>Почему ниша в shortlist</span>
                        <p>{niche.rankingReason}</p>
                        <p>{niche.evidenceHighlights.promisingSummary}</p>
                      </div>

                      <div className="insight-box">
                        <span>Что стоит проверить вручную</span>
                        <p>{niche.evidenceHighlights.misleadingSummary}</p>
                        <p>{niche.evidenceHighlights.recommendedNextAction}</p>
                      </div>
                    </div>

                    <div className="report-niche-card__grid">
                      <div className="insight-box">
                        <span>Контентные архетипы ниши</span>
                        <p>
                          {niche.evidenceHighlights.nicheArchetypeSummary ??
                            "Нишевой archetype summary пока недоступен."}
                        </p>
                        <div className="decision-chip-list">
                          {niche.evidenceHighlights.commonArchetypes.map((archetype) => (
                            <span
                              key={`${niche.bucketId}-${archetype.label}`}
                              className="decision-chip decision-chip--neutral"
                            >
                              {archetype.label} · {archetype.accountCount}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="insight-box">
                        <span>Whitespace и идеи позиционирования</span>
                        <p>
                          {niche.evidenceHighlights.patternCoverageBalanceSummary ??
                            "Явной сводки по балансу паттернов пока нет."}
                        </p>
                        <ul className="plain-list">
                          {niche.evidenceHighlights.nichePositioningIdeas
                            .slice(0, 3)
                            .map((idea) => (
                              <li key={`${niche.bucketId}-${idea}`}>{idea}</li>
                            ))}
                        </ul>
                      </div>
                    </div>

                    <div className="report-niche-card__grid">
                      <div className="insight-box">
                        <span>Сильнейшие аккаунты</span>
                        <ul className="plain-list">
                          {niche.strongestAccounts.slice(0, 4).map((account) => (
                            <li
                              key={`${niche.bucketId}-${account.handle ?? account.displayName ?? account.reason}`}
                            >
                              {(account.displayName ?? account.handle ?? "Без имени").trim()}:
                              {" "}
                              {account.reason}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="insight-box">
                        <span>Поддерживающие аккаунты</span>
                        <ul className="plain-list">
                          {niche.supportingAccounts.slice(0, 5).map((account) => (
                            <li
                              key={`${niche.bucketId}-${account.handle ?? account.displayName ?? account.reason}`}
                            >
                              {account.displayName ?? account.handle ?? "Без имени"}:{" "}
                              итог {formatScore(account.overallAccountScore)}, engagement efficiency{" "}
                              {formatScore(account.engagementEfficiencyScore)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div className="state-box">
          <span>Пока нечего экспортировать</span>
          <p>
            Запустите shortlist или загрузите сценарий с закреплённым результатом,
            чтобы открыть report view, скопировать Markdown или скачать JSON.
          </p>
        </div>
      )}
    </section>
  );
}
