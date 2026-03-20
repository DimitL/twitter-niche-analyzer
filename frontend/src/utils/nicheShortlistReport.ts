import type {
  NicheShortlistResponse,
  RankedNicheShortlistBucket
} from "../types/nicheShortlist.js";
import { buildNicheEvidencePack } from "./nicheEvidencePack.js";
import type { CrossNichePositioningRecommendations } from "./nicheCrossPositioning.js";
import { buildCrossNichePositioningRecommendations } from "./nicheCrossPositioning.js";
import type { CrossNicheContentCalendarAdaptation } from "./nicheContentCalendarAdaptation.js";
import { buildNicheContentCalendarAdaptation } from "./nicheContentCalendarAdaptation.js";
import type { CrossNichePositioningPlaybook } from "./nichePositioningPlaybook.js";
import { buildNichePositioningPlaybook } from "./nichePositioningPlaybook.js";
import type { CrossNicheContentCalendarStarter } from "./nicheContentCalendarStarter.js";
import { buildNicheContentCalendarStarter } from "./nicheContentCalendarStarter.js";
import type { CrossNicheRepeatableContentSeries } from "./nicheRepeatableContentSeries.js";
import { buildNicheRepeatableContentSeries } from "./nicheRepeatableContentSeries.js";
import type { CrossNicheWhitespaceComparison } from "./nicheCrossWhitespace.js";
import { buildCrossNicheWhitespaceComparison } from "./nicheCrossWhitespace.js";

export interface NicheShortlistReportModel {
  title: string;
  scenarioName: string | null;
  generatedAt: string | null;
  sourceKind: "live" | "pinned";
  sourceLabel: string;
  status: NicheShortlistResponse["status"];
  shortlistSummary: NicheShortlistResponse["shortlistSummary"];
  notes: string[];
  crossNicheWhitespace: CrossNicheWhitespaceComparison | null;
  crossNichePositioning: CrossNichePositioningRecommendations | null;
  crossNichePlaybook: CrossNichePositioningPlaybook | null;
  crossNicheRepeatableSeries: CrossNicheRepeatableContentSeries | null;
  crossNicheContentCalendar: CrossNicheContentCalendarStarter | null;
  crossNicheContentCalendarAdaptation: CrossNicheContentCalendarAdaptation | null;
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
  const crossNicheWhitespace = buildCrossNicheWhitespaceComparison(options.shortlist);
  const crossNichePositioning = buildCrossNichePositioningRecommendations(
    options.shortlist,
    crossNicheWhitespace
  );
  const crossNichePlaybook = buildNichePositioningPlaybook(
    options.shortlist,
    crossNichePositioning
  );
  const crossNicheRepeatableSeries = buildNicheRepeatableContentSeries(
    options.shortlist,
    crossNichePlaybook
  );
  const crossNicheContentCalendar = buildNicheContentCalendarStarter(
    options.shortlist,
    crossNichePlaybook,
    crossNicheRepeatableSeries
  );
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
    crossNicheWhitespace,
    crossNichePositioning,
    crossNichePlaybook,
    crossNicheRepeatableSeries,
    crossNicheContentCalendar,
    crossNicheContentCalendarAdaptation: buildNicheContentCalendarAdaptation(
      options.shortlist,
      crossNichePlaybook,
      crossNicheRepeatableSeries,
      crossNicheContentCalendar
    ),
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

  if (report.crossNicheWhitespace) {
    lines.push(
      "",
      "## Межнишевое сравнение whitespace-углов",
      "",
      report.crossNicheWhitespace.crossNicheWhitespaceSummary
    );

    if (report.crossNicheWhitespace.recurringWhitespaceAngles.length > 0) {
      lines.push("", "### Повторяющиеся whitespace-углы", "");
      report.crossNicheWhitespace.recurringWhitespaceAngles.forEach((angle) => {
        lines.push(
          `- ${angle.label}: повторяется в ${angle.count} нишах (${angle.bucketLabels.join(", ")})`
        );
      });
    }

    report.crossNicheWhitespace.comparativelyOpenAnglesByBucket.forEach((bucket) => {
      if (bucket.comparativelyOpenAngles.length === 0) {
        return;
      }

      lines.push("", `### Где ниша ${bucket.label} выглядит свободнее`, "");

      bucket.comparativelyOpenAngles.forEach((angle) => {
        lines.push(`- ${angle.label}`);
      });

      bucket.positioningIdeas.slice(0, 2).forEach((idea) => {
        lines.push(`- Идея позиционирования: ${idea}`);
      });
    });

    if (report.crossNicheWhitespace.crossNicheConfidenceNote) {
      lines.push(
        "",
        `- Ограничение уверенности: ${report.crossNicheWhitespace.crossNicheConfidenceNote}`
      );
    }
  }

  if (report.crossNichePositioning) {
    lines.push(
      "",
      "## Рекомендации по входу в нишу",
      "",
      report.crossNichePositioning.positioningSummary
    );

    if (report.crossNichePositioning.summary.bestNicheForEducation) {
      lines.push(
        `- Лучший вариант для обучения: ${report.crossNichePositioning.summary.bestNicheForEducation.bucketLabel}`
      );
    }

    if (report.crossNichePositioning.summary.bestNicheForContrarian) {
      lines.push(
        `- Лучший вариант для контрарного угла: ${report.crossNichePositioning.summary.bestNicheForContrarian.bucketLabel}`
      );
    }

    if (report.crossNichePositioning.summary.bestNicheForFounderOperator) {
      lines.push(
        `- Лучший вариант для founder/operator: ${report.crossNichePositioning.summary.bestNicheForFounderOperator.bucketLabel}`
      );
    }

    if (report.crossNichePositioning.summary.bestNicheForBenchmarkResults) {
      lines.push(
        `- Лучший вариант для результатов и benchmarks: ${report.crossNichePositioning.summary.bestNicheForBenchmarkResults.bucketLabel}`
      );
    }

    if (report.crossNichePositioning.summary.bestNicheForNewsReactive) {
      lines.push(
        `- Лучший вариант для новостной реакции: ${report.crossNichePositioning.summary.bestNicheForNewsReactive.bucketLabel}`
      );
    }
  }

  if (report.crossNichePlaybook) {
    lines.push(
      "",
      "## Практический playbook старта",
      "",
      report.crossNichePlaybook.playbookSummary
    );

    if (report.crossNichePlaybook.summary.easiestNicheToStartPostingIn) {
      lines.push(
        `- Где проще всего начать: ${report.crossNichePlaybook.summary.easiestNicheToStartPostingIn.bucketLabel}`
      );
    }

    if (report.crossNichePlaybook.summary.nicheWithClearestPositioningAngle) {
      lines.push(
        `- Где угол входа читается яснее всего: ${report.crossNichePlaybook.summary.nicheWithClearestPositioningAngle.bucketLabel}`
      );
    }

    if (report.crossNichePlaybook.summary.nicheWithStrongestContentRepeatability) {
      lines.push(
        `- Где сильнее повторяемость контента: ${report.crossNichePlaybook.summary.nicheWithStrongestContentRepeatability.bucketLabel}`
      );
    }

    if (report.crossNichePlaybook.globalConfidenceNote) {
      lines.push(
        `- Ограничение уверенности: ${report.crossNichePlaybook.globalConfidenceNote}`
      );
    }
  }

  if (report.crossNicheRepeatableSeries) {
    lines.push(
      "",
      "## Повторяемые контент-серии",
      "",
      report.crossNicheRepeatableSeries.seriesSummary
    );

    if (report.crossNicheRepeatableSeries.summary.nicheWithStrongestRepeatableSeriesPotential) {
      lines.push(
        `- Самый сильный repeatable potential: ${report.crossNicheRepeatableSeries.summary.nicheWithStrongestRepeatableSeriesPotential.bucketLabel}`
      );
    }

    if (report.crossNicheRepeatableSeries.summary.nicheWithEasiestConsistentPostingCadence) {
      lines.push(
        `- Где легче держать cadence: ${report.crossNicheRepeatableSeries.summary.nicheWithEasiestConsistentPostingCadence.bucketLabel}`
      );
    }

    if (report.crossNicheRepeatableSeries.summary.nicheWithMostDifferentiatedSeriesIdeas) {
      lines.push(
        `- Где серии выглядят разнообразнее: ${report.crossNicheRepeatableSeries.summary.nicheWithMostDifferentiatedSeriesIdeas.bucketLabel}`
      );
    }

    if (report.crossNicheRepeatableSeries.globalConfidenceNote) {
      lines.push(
        `- Ограничение уверенности: ${report.crossNicheRepeatableSeries.globalConfidenceNote}`
      );
    }
  }

  if (report.crossNicheContentCalendar) {
    lines.push(
      "",
      "## 2-недельный content calendar",
      "",
      report.crossNicheContentCalendar.calendarSummary
    );

    if (report.crossNicheContentCalendar.summary.nicheWithEasiestTwoWeekLaunchPlan) {
      lines.push(
        `- Где проще всего запустить 2 недели: ${report.crossNicheContentCalendar.summary.nicheWithEasiestTwoWeekLaunchPlan.bucketLabel}`
      );
    }

    if (report.crossNicheContentCalendar.summary.nicheWithStrongestContentCadenceFit) {
      lines.push(
        `- Где cadence выглядит сильнее: ${report.crossNicheContentCalendar.summary.nicheWithStrongestContentCadenceFit.bucketLabel}`
      );
    }

    if (report.crossNicheContentCalendar.summary.nicheWithBestVarietyRepeatabilityBalance) {
      lines.push(
        `- Где лучший баланс variety и repeatability: ${report.crossNicheContentCalendar.summary.nicheWithBestVarietyRepeatabilityBalance.bucketLabel}`
      );
    }

    if (report.crossNicheContentCalendar.globalConfidenceNote) {
      lines.push(
        `- Ограничение уверенности: ${report.crossNicheContentCalendar.globalConfidenceNote}`
      );
    }
  }

  if (report.crossNicheContentCalendarAdaptation) {
    lines.push(
      "",
      "## Адаптация под budget времени",
      "",
      report.crossNicheContentCalendarAdaptation.adaptationSummary
    );

    if (report.crossNicheContentCalendarAdaptation.summary.easiestNicheForLowTimePosting) {
      lines.push(
        `- Самая удобная ниша для low-time режима: ${report.crossNicheContentCalendarAdaptation.summary.easiestNicheForLowTimePosting.bucketLabel}`
      );
    }

    if (report.crossNicheContentCalendarAdaptation.summary.bestNicheForMediumTimeConsistency) {
      lines.push(
        `- Самая ровная ниша для medium-time режима: ${report.crossNicheContentCalendarAdaptation.summary.bestNicheForMediumTimeConsistency.bucketLabel}`
      );
    }

    if (report.crossNicheContentCalendarAdaptation.summary.bestNicheForHighTimeExpansion) {
      lines.push(
        `- Лучшая ниша для high-time expansion: ${report.crossNicheContentCalendarAdaptation.summary.bestNicheForHighTimeExpansion.bucketLabel}`
      );
    }

    if (report.crossNicheContentCalendarAdaptation.globalConfidenceNote) {
      lines.push(
        `- Ограничение уверенности: ${report.crossNicheContentCalendarAdaptation.globalConfidenceNote}`
      );
    }
  }

  report.niches.forEach((niche, index) => {
    const positioning = report.crossNichePositioning?.perBucketRecommendations.find(
      (item) => item.bucketId === niche.bucketId
    );
    const playbook = report.crossNichePlaybook?.perBucketPlaybooks.find(
      (item) => item.bucketId === niche.bucketId
    );
    const repeatableSeries = report.crossNicheRepeatableSeries?.perBucketSeries.find(
      (item) => item.bucketId === niche.bucketId
    );
    const contentCalendar = report.crossNicheContentCalendar?.perBucketCalendars.find(
      (item) => item.bucketId === niche.bucketId
    );
    const calendarAdaptation = report.crossNicheContentCalendarAdaptation?.perBucketAdaptations.find(
      (item) => item.bucketId === niche.bucketId
    );

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
      positioning?.strongestRecommendedAngle
        ? `- Лучший угол входа: ${positioning.strongestRecommendedAngle.label} (${positioning.strongestRecommendedAngle.score.toFixed(1)})`
        : "- Лучший угол входа: н/д",
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
      "### Как лучше заходить в нишу",
      "",
      positioning?.positioningWhyItFits ?? "Позиционирование пока недоступно."
    );

    if (positioning?.recommendedEntryAngles.length) {
      lines.push(
        `- Альтернативные углы входа: ${positioning.recommendedEntryAngles
          .map((angle) => `${angle.label} (${angle.score.toFixed(1)})`)
          .join(", ")}`
      );
    }

    if (positioning?.positioningRisks.length) {
      positioning.positioningRisks.slice(0, 2).forEach((risk) => {
        lines.push(`- Риск: ${risk}`);
      });
    }

    if (positioning?.positioningConfidenceNote) {
      lines.push(`- Уровень уверенности: ${positioning.positioningConfidenceNote}`);
    }

    if (playbook) {
      lines.push(
        "",
        "### Практический playbook старта",
        "",
        `- Playbook: ${playbook.playbookTitle}`,
        `- Лучший угол входа: ${playbook.bestEntryAngle?.label ?? "н/д"}`
      );

      if (playbook.starterContentDirections.length > 0) {
        lines.push("", "#### Стартовые направления", "");
        playbook.starterContentDirections.forEach((direction) => {
          lines.push(`- ${direction}`);
        });
      }

      if (playbook.firstPostIdeas.length > 0) {
        lines.push("", "#### Первые посты", "");
        playbook.firstPostIdeas.forEach((idea) => {
          lines.push(`- ${idea}`);
        });
      }

      if (playbook.weakAngleWarnings.length > 0) {
        lines.push("", "#### Какие углы не стоит переигрывать", "");
        playbook.weakAngleWarnings.forEach((warning) => {
          lines.push(`- ${warning}`);
        });
      }

      if (playbook.playbookConfidenceNote) {
        lines.push(
          "",
          `- Ограничение уверенности playbook: ${playbook.playbookConfidenceNote}`
        );
      }
    }

    if (repeatableSeries) {
      lines.push("", "### Повторяемые контент-серии", "");

      repeatableSeries.repeatableContentSeries.forEach((series) => {
        lines.push(`- ${series.seriesTitle}: ${series.seriesPurpose}`);
        lines.push(`  Повторяющийся угол: ${series.repeatedAngle}`);
        lines.push(
          `  Примеры: ${
            series.examplePostAngles.length > 0
              ? series.examplePostAngles.join(" | ")
              : "н/д"
          }`
        );

        if (series.cadenceHint) {
          lines.push(`  Ритм: ${series.cadenceHint}`);
        }

        if (series.genericityWarning) {
          lines.push(`  Не размывать так: ${series.genericityWarning}`);
        }
      });

      if (repeatableSeries.seriesConfidenceNote) {
        lines.push(
          "",
          `- Ограничение уверенности по сериям: ${repeatableSeries.seriesConfidenceNote}`
        );
      }
    }

    if (contentCalendar) {
      lines.push(
        "",
        "### 2-недельный content calendar",
        "",
        `- Календарь: ${contentCalendar.calendarTitle}`,
        `- Базовый угол: ${contentCalendar.bestEntryAngleLabel ?? "н/д"}`
      );

      contentCalendar.planEntries.forEach((entry) => {
        lines.push(
          `- ${entry.slotLabel} · ${entry.seriesTitle}: ${entry.postAngle}`
        );
        lines.push(`  Зачем этот слот: ${entry.postPurpose}`);

        if (entry.cautionNote) {
          lines.push(`  Не переусердствовать так: ${entry.cautionNote}`);
        }
      });

      if (contentCalendar.calendarConfidenceNote) {
        lines.push(
          "",
          `- Ограничение уверенности по календарю: ${contentCalendar.calendarConfidenceNote}`
        );
      }
    }

    if (calendarAdaptation) {
      lines.push(
        "",
        "### Адаптация под low / medium / high time mode",
        "",
        `- Low-time: ${calendarAdaptation.lowTimeMode.recommendedWeeklyVolume}`,
        `- Что оставить: ${calendarAdaptation.whatToKeepWhenTimeIsLimited.join(" | ")}`,
        `- Что резать первым: ${
          calendarAdaptation.lowTimeMode.slotsToCutFirst.length > 0
            ? calendarAdaptation.lowTimeMode.slotsToCutFirst.join(", ")
            : "н/д"
        }`
      );

      if (calendarAdaptation.lowTimeMode.lowTimeCaution) {
        lines.push(`- Low-time caution: ${calendarAdaptation.lowTimeMode.lowTimeCaution}`);
      }

      lines.push(
        `- Medium-time: ${calendarAdaptation.mediumTimeMode.recommendedWeeklyVolume}`,
        `- Баланс: ${calendarAdaptation.mediumTimeMode.balancedMixGuidance.join(" | ")}`
      );

      if (calendarAdaptation.mediumTimeMode.mediumTimeCaution) {
        lines.push(`- Medium-time caution: ${calendarAdaptation.mediumTimeMode.mediumTimeCaution}`);
      }

      lines.push(
        `- High-time: ${calendarAdaptation.highTimeMode.recommendedWeeklyVolume}`,
        `- Где расширять: ${calendarAdaptation.whatToExpandWhenMoreTimeIsAvailable.join(" | ")}`,
        `- Как добавлять variety: ${calendarAdaptation.highTimeMode.varietyToAdd.join(" | ")}`
      );

      if (calendarAdaptation.highTimeMode.highTimeCaution) {
        lines.push(`- High-time caution: ${calendarAdaptation.highTimeMode.highTimeCaution}`);
      }

      if (calendarAdaptation.whatToAvoidOverdoingInHighFrequency.length > 0) {
        lines.push(
          `- Что не стоит передавливать: ${calendarAdaptation.whatToAvoidOverdoingInHighFrequency.join(
            " | "
          )}`
        );
      }

      if (calendarAdaptation.adaptationConfidenceNote) {
        lines.push(
          `- Ограничение уверенности по адаптации: ${calendarAdaptation.adaptationConfidenceNote}`
        );
      }
    }

    lines.push(
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
