import type {
  NicheShortlistResponse,
  RankedNicheShortlistBucket
} from "../types/nicheShortlist.js";
import { buildNicheEvidencePack } from "./nicheEvidencePack.js";

export interface NicheShortlistReportModel {
  title: string;
  scenarioName: string | null;
  generatedAt: string | null;
  sourceKind: "live" | "pinned";
  sourceLabel: string;
  status: NicheShortlistResponse["status"];
  shortlistSummary: NicheShortlistResponse["shortlistSummary"];
  notes: string[];
  niches: NicheShortlistReportNiche[];
}

export interface NicheShortlistReportNiche {
  bucketId: string;
  rank: number | null;
  label: string;
  description: string | null;
  status: RankedNicheShortlistBucket["status"];
  rankingReason: string;
  recommendedUseCase: string;
  topicScores: RankedNicheShortlistBucket["topicScores"];
  strongestAccounts: RankedNicheShortlistBucket["strongestAccounts"];
  supportingAccounts: RankedNicheShortlistBucket["topSupportingAccounts"];
  evidenceHighlights: ReturnType<typeof buildNicheEvidencePack>;
}

function formatGeneratedAt(value: string | null) {
  if (!value) {
    return "Время не зафиксировано";
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

function formatScore(value: number | null) {
  if (value === null) {
    return "н/д";
  }

  return value.toFixed(1);
}

function formatAccountMetricLabel(
  metric: "overallAccountScore" | "engagementEfficiencyScore"
) {
  return metric === "overallAccountScore"
    ? "итоговый score"
    : "engagement efficiency";
}

function formatPatternLabel(value: string) {
  const labelMap: Record<string, string> = {
    strongHook: "сильный hook",
    contrarianTake: "контрарный угол",
    productUpdate: "продуктовый апдейт",
    benchmarkOrResult: "результат или benchmark",
    educationalBreakdown: "обучающий breakdown",
    founderInsight: "founder insight",
    timelyNewsTieIn: "привязка к актуальной новости",
    audienceQuestion: "вопрос к аудитории",
    narrativeStorytelling: "нарративная подача"
  };

  return labelMap[value] ?? value;
}

export function buildNicheShortlistReportModel(options: {
  shortlist: NicheShortlistResponse;
  scenarioName: string | null;
  generatedAt: string | null;
  sourceKind: "live" | "pinned";
}): NicheShortlistReportModel {
  const niches = options.shortlist.rankedBuckets.map((bucket) => ({
    bucketId: bucket.bucketId,
    rank: bucket.rank,
    label: bucket.label,
    description: bucket.description,
    status: bucket.status,
    rankingReason: bucket.rankingReason,
    recommendedUseCase: bucket.recommendedUseCase,
    topicScores: bucket.topicScores,
    strongestAccounts: bucket.strongestAccounts,
    supportingAccounts: bucket.topSupportingAccounts.slice(0, 5),
    evidenceHighlights: buildNicheEvidencePack(bucket)
  }));

  return {
    title: "Отчёт по shortlist ниш",
    scenarioName: options.scenarioName,
    generatedAt: options.generatedAt,
    sourceKind: options.sourceKind,
    sourceLabel:
      options.sourceKind === "live"
        ? "Текущий shortlist из UI"
        : "Закреплённый результат сценария",
    status: options.shortlist.status,
    shortlistSummary: options.shortlist.shortlistSummary,
    notes: options.shortlist.notes,
    niches
  };
}

export function buildNicheShortlistMarkdownReport(
  report: NicheShortlistReportModel
) {
  const lines: string[] = [
    `# ${report.title}`,
    "",
    `- Сценарий: ${report.scenarioName ?? "Без имени"}`,
    `- Сгенерировано: ${formatGeneratedAt(report.generatedAt)}`,
    `- Источник: ${report.sourceLabel}`,
    `- Статус: ${report.status}`,
    "",
    "## Сводка",
    "",
    `- Запрошено bucket-ов: ${report.shortlistSummary.totalRequestedBuckets}`,
    `- Успешно ранжировано: ${report.shortlistSummary.successfullyRankedBuckets}`,
    `- Размер shortlist: ${report.shortlistSummary.shortlistSize}`,
    `- Лучшая ниша overall: ${report.shortlistSummary.bestOverall?.label ?? "н/д"}`,
    `- Лучшая ниша для роста: ${report.shortlistSummary.bestForGrowth?.label ?? "н/д"}`,
    `- Лучшая ниша для монетизации: ${report.shortlistSummary.bestForMonetization?.label ?? "н/д"}`,
    `- Самый простой старт: ${report.shortlistSummary.easiestToStart?.label ?? "н/д"}`,
    `- Самый сбалансированный вариант: ${report.shortlistSummary.bestBalanced?.label ?? "н/д"}`
  ];

  report.niches.forEach((niche, index) => {
    lines.push(
      "",
      `## ${index + 1}. ${niche.label}`,
      "",
      niche.description ? niche.description : "_Описание пока недоступно_",
      "",
      `- Место: ${niche.rank ?? "вне shortlist"}`,
      `- Итоговый score ниши: ${formatScore(niche.topicScores.overallTopicScore)}`,
      `- Потенциал роста: ${formatScore(niche.topicScores.growthPotential)}`,
      `- Потенциал монетизации: ${formatScore(niche.topicScores.monetizationPotential)}`,
      `- Простота контента: ${formatScore(niche.topicScores.contentEase)}`,
      `- Надёжность данных: ${formatScore(niche.topicScores.dataConfidence)}`,
      "",
      "### Почему ниша в shortlist",
      "",
      niche.rankingReason,
      "",
      "### Ключевые доказательства",
      "",
      `- Почему перспективно: ${niche.evidenceHighlights.promisingSummary}`,
      `- Что может исказить вывод: ${niche.evidenceHighlights.misleadingSummary}`,
      `- Рекомендуемый следующий шаг: ${niche.evidenceHighlights.recommendedNextAction}`,
      "",
      "### Сводка по контентным архетипам",
      "",
      `- Сводка: ${niche.evidenceHighlights.nicheArchetypeSummary ?? "Пока недоступно"}`,
      `- Доминирующие паттерны: ${
        niche.evidenceHighlights.dominantNichePatterns.length > 0
          ? niche.evidenceHighlights.dominantNichePatterns
              .map((pattern) => formatPatternLabel(pattern))
              .join(", ")
          : "н/д"
      }`,
      `- Повторяющиеся архетипы: ${
        niche.evidenceHighlights.commonArchetypes.length > 0
          ? niche.evidenceHighlights.commonArchetypes
              .map((archetype) => `${archetype.label} (${archetype.accountCount})`)
              .join(", ")
          : "н/д"
      }`,
      `- Уровень уверенности: ${niche.evidenceHighlights.nicheArchetypeConfidenceNote ?? "н/д"}`,
      "",
      "### Whitespace и gaps",
      "",
      `- Баланс покрытия: ${niche.evidenceHighlights.patternCoverageBalanceSummary ?? "н/д"}`,
      `- Недопокрытые паттерны: ${
        niche.evidenceHighlights.underrepresentedPatterns.length > 0
          ? niche.evidenceHighlights.underrepresentedPatterns
              .map((pattern) => formatPatternLabel(pattern))
              .join(", ")
          : "н/д"
      }`,
      `- Уровень уверенности: ${niche.evidenceHighlights.gapsConfidenceNote ?? "н/д"}`
    );

    if (niche.evidenceHighlights.whitespaceHints.length > 0) {
      lines.push("", "### Что выглядит недопокрытым", "");
      niche.evidenceHighlights.whitespaceHints.forEach((hint) => {
        lines.push(`- ${hint}`);
      });
    }

    if (niche.evidenceHighlights.nichePositioningIdeas.length > 0) {
      lines.push("", "### Идеи для позиционирования", "");
      niche.evidenceHighlights.nichePositioningIdeas.forEach((idea) => {
        lines.push(`- ${idea}`);
      });
    }

    if (niche.strongestAccounts.length > 0) {
      lines.push("", "### Сильнейшие аккаунты", "");
      niche.strongestAccounts.slice(0, 3).forEach((account) => {
        const displayName = account.displayName ?? account.handle ?? "Без имени";
        const handle = account.handle ? ` (@${account.handle})` : "";
        lines.push(
          `- ${displayName}${handle}: ${account.reason} [${formatAccountMetricLabel(
            account.metric
          )} ${account.value.toFixed(1)}]`
        );
      });
    }

    if (niche.supportingAccounts.length > 0) {
      lines.push("", "### Поддерживающие аккаунты", "");
      niche.supportingAccounts.slice(0, 5).forEach((account) => {
        const displayName = account.displayName ?? account.handle ?? "Без имени";
        const handle = account.handle ? ` (@${account.handle})` : "";
        lines.push(
          `- ${displayName}${handle}: итог ${account.overallAccountScore.toFixed(
            1
          )}, engagement efficiency ${account.engagementEfficiencyScore.toFixed(
            1
          )}. ${account.reason}`
        );
      });
    }
  });

  if (report.notes.length > 0) {
    lines.push("", "## Технические заметки", "");
    report.notes.slice(0, 8).forEach((note) => {
      lines.push(`- ${note}`);
    });
  }

  return lines.join("\n");
}

export function buildNicheShortlistJsonExport(options: {
  report: NicheShortlistReportModel;
  shortlist: NicheShortlistResponse;
}) {
  return {
    exportedAt: new Date().toISOString(),
    report: options.report,
    shortlistResult: options.shortlist
  };
}
