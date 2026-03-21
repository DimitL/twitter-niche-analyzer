import type {
  CrossNicheContentCalendarAdaptation,
  NicheContentCalendarAdaptationBucket
} from "./nicheContentCalendarAdaptation.js";
import { buildNicheContentCalendarAdaptation } from "./nicheContentCalendarAdaptation.js";
import type {
  ContentRepurposingCandidate,
  CrossNicheContentRepurposingHints,
  NicheContentRepurposingHintsBucket
} from "./nicheContentRepurposingHints.js";
import { buildNicheContentRepurposingHints } from "./nicheContentRepurposingHints.js";
import type {
  ContentCalendarPlanEntry,
  CrossNicheContentCalendarStarter,
  NicheContentCalendarStarterBucket
} from "./nicheContentCalendarStarter.js";
import { buildNicheContentCalendarStarter } from "./nicheContentCalendarStarter.js";
import type {
  CrossNicheFormatExecutionTemplates,
  FormatExecutionTemplate,
  NicheFormatExecutionTemplatesBucket
} from "./nicheFormatExecutionTemplates.js";
import { buildNicheFormatExecutionTemplates } from "./nicheFormatExecutionTemplates.js";
import type { NicheShortlistResponse } from "../types/nicheShortlist.js";
import type {
  CrossNichePositioningPlaybook,
  NichePositioningPlaybookBucket,
  NichePositioningPlaybookLeader
} from "./nichePositioningPlaybook.js";
import { buildNichePositioningPlaybook } from "./nichePositioningPlaybook.js";
import type {
  CrossNicheRepeatableContentSeries,
  NicheRepeatableContentSeriesBucket
} from "./nicheRepeatableContentSeries.js";
import { buildNicheRepeatableContentSeries } from "./nicheRepeatableContentSeries.js";

type RewriteFormat = "thread" | "miniSeries" | "quoteFollowUp" | "recap";

export interface FormatExampleRewrite {
  sourceCandidate: string;
  rewrittenOpening: string;
  structureBullets: string[];
  closingHint: string;
  whyItFits: string;
  caution: string | null;
}

export interface NicheFormatExampleRewritesBucket {
  bucketId: string;
  label: string;
  rank: number | null;
  bestEntryAngleLabel: string | null;
  formatExampleRewrites: {
    threadExample: FormatExampleRewrite;
    miniSeriesExample: FormatExampleRewrite;
    quoteFollowUpExample: FormatExampleRewrite;
    recapExample: FormatExampleRewrite;
  };
  exampleRewriteConfidenceNote: string | null;
}

export interface CrossNicheFormatExampleRewritesSummary {
  nicheWithClearestThreadExample: NichePositioningPlaybookLeader | null;
  nicheWithEasiestQuoteFollowUpConversion: NichePositioningPlaybookLeader | null;
  nicheWithStrongestRecapExample: NichePositioningPlaybookLeader | null;
}

export interface CrossNicheFormatExampleRewrites {
  comparedBucketCount: number;
  comparableBucketCount: number;
  rewritesSummary: string;
  perBucketRewrites: NicheFormatExampleRewritesBucket[];
  summary: CrossNicheFormatExampleRewritesSummary;
  globalConfidenceNote: string | null;
}

interface RewriteContext {
  playbookBucket: NichePositioningPlaybookBucket;
  repeatableBucket: NicheRepeatableContentSeriesBucket;
  calendarBucket: NicheContentCalendarStarterBucket;
  adaptationBucket: NicheContentCalendarAdaptationBucket;
  repurposingBucket: NicheContentRepurposingHintsBucket;
  templatesBucket: NicheFormatExecutionTemplatesBucket;
}

interface RewriteBucketWithMeta {
  bucket: NicheFormatExampleRewritesBucket;
  threadScore: number;
  quoteScore: number;
  recapScore: number;
}

function normalizeSentence(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function stripTrailingPunctuation(value: string) {
  return value.trim().replace(/[.!?…:]+$/u, "");
}

function buildSourceLabel(candidate: ContentRepurposingCandidate | null, fallbackLabel: string) {
  if (!candidate) {
    return fallbackLabel;
  }

  return `${candidate.slotLabel} · ${candidate.seriesTitle}: ${candidate.postAngle}`;
}

function buildFallbackEntry(
  calendarBucket: NicheContentCalendarStarterBucket,
  format: RewriteFormat
) {
  if (calendarBucket.planEntries.length === 0) {
    return null;
  }

  if (format === "recap") {
    return calendarBucket.planEntries[calendarBucket.planEntries.length - 1] ?? null;
  }

  if (format === "miniSeries") {
    return calendarBucket.planEntries[1] ?? calendarBucket.planEntries[0] ?? null;
  }

  if (format === "quoteFollowUp") {
    return calendarBucket.planEntries.slice(0, 3)[1] ?? calendarBucket.planEntries[0] ?? null;
  }

  return calendarBucket.planEntries[0] ?? null;
}

function buildFallbackCandidate(
  entry: ContentCalendarPlanEntry | null,
  bestEntryAngleLabel: string | null
) {
  if (!entry) {
    return null;
  }

  return {
    slotLabel: entry.slotLabel,
    seriesTitle: entry.seriesTitle,
    postAngle: entry.postAngle,
    fitReason:
      bestEntryAngleLabel
        ? `Явного strongest candidate пока нет, поэтому пример строится от базового угла "${bestEntryAngleLabel}" и ближайшего подходящего slot.`
        : "Явного strongest candidate пока нет, поэтому пример строится от ближайшего подходящего slot из текущего календаря.",
    cautionNote: entry.cautionNote
  } satisfies ContentRepurposingCandidate;
}

function selectCandidate(context: RewriteContext, format: RewriteFormat) {
  const candidateList =
    format === "thread"
      ? context.repurposingBucket.threadCandidates
      : format === "miniSeries"
        ? context.repurposingBucket.miniSeriesCandidates
        : format === "quoteFollowUp"
          ? context.repurposingBucket.quoteFollowUpCandidates
          : context.repurposingBucket.recapCandidates;

  if (candidateList.length > 0) {
    return {
      candidate: candidateList[0],
      fallbackUsed: false
    };
  }

  return {
    candidate: buildFallbackCandidate(
      buildFallbackEntry(context.calendarBucket, format),
      context.calendarBucket.bestEntryAngleLabel
    ),
    fallbackUsed: true
  };
}

function buildOpeningFromTemplate(
  template: FormatExecutionTemplate,
  candidate: ContentRepurposingCandidate | null
) {
  if (!candidate) {
    return template.openingPattern;
  }

  const sourceText = stripTrailingPunctuation(candidate.postAngle);

  if (template.openingPattern.trim().endsWith(":")) {
    return `${template.openingPattern} ${sourceText}.`;
  }

  return `${stripTrailingPunctuation(template.openingPattern)}: ${sourceText}.`;
}

function buildThreadStructureBullets(
  template: FormatExecutionTemplate,
  candidate: ContentRepurposingCandidate | null
) {
  return [
    candidate
      ? `Откройте тем же центральным тезисом, что и в слоте "${candidate.postAngle}", но сразу обещайте 3 коротких шага разбора.`
      : "Откройте thread одним центральным тезисом и сразу обещайте 3 коротких шага разбора.",
    template.structureBlocks[1] ??
      "Разбейте аргумент на 2-3 коротких шага: один сигнал или один trade-off на один блок.",
    "Добавьте один контрпример, ограничение или edge-case, чтобы thread не выглядел слишком линейным.",
    template.structureBlocks[template.structureBlocks.length - 1] ??
      "Закройте thread одним practical takeaway, который переводит разбор в следующий шаг для читателя."
  ].filter((item): item is string => Boolean(item));
}

function buildMiniSeriesStructureBullets(
  template: FormatExecutionTemplate,
  candidate: ContentRepurposingCandidate | null
) {
  return [
    candidate
      ? `Начните с одной строки-связки с предыдущим эпизодом серии и обозначьте, что слот "${candidate.postAngle}" раскрывает следующий слой темы.`
      : "Начните с одной строки-связки с предыдущим эпизодом серии и обозначьте следующий слой темы.",
    template.structureBlocks[1] ??
      "Выберите только один узкий под-вопрос, а не повторяйте весь прошлый пост заново.",
    template.structureBlocks[2] ??
      "Дайте один пример, кейс или mini-breakdown, который двигает серию вперёд.",
    template.structureBlocks[template.structureBlocks.length - 1] ??
      "Закройте post bridge-фразой: какой следующий эпизод логично продолжит серию."
  ].filter((item): item is string => Boolean(item));
}

function buildQuoteStructureBullets(
  template: FormatExecutionTemplate,
  candidate: ContentRepurposingCandidate | null
) {
  return [
    candidate
      ? `Зацепитесь за внешний тезис или новость, которую слот "${candidate.postAngle}" помогает переоценить.`
      : "Зацепитесь за внешний тезис, новость или claim, который требует вашей рамки.",
    template.structureBlocks[1] ??
      "Одной строкой обозначьте, что именно в исходном тезисе упущено.",
    template.structureBlocks[2] ??
      "Дайте свою рамку или one-line practical implication поверх исходного сигнала.",
    template.structureBlocks[template.structureBlocks.length - 1] ??
      "Закройте пост одним выводом: что аудитории теперь важнее отслеживать."
  ].filter((item): item is string => Boolean(item));
}

function buildRecapStructureBullets(
  template: FormatExecutionTemplate,
  candidate: ContentRepurposingCandidate | null
) {
  return [
    candidate
      ? `Возьмите слот "${candidate.postAngle}" как главный повод собрать 2-3 сигнала из всего цикла в одну рамку.`
      : "Возьмите финальный слот как повод собрать 2-3 сигнала из всего цикла в одну рамку.",
    template.structureBlocks[1] ??
      "Сведите наблюдения в одну общую мысль: что реально повторяется, а что оказалось шумом.",
    template.structureBlocks[2] ??
      "Отделите, что стоит продолжать, от того, что лучше убрать в следующем цикле.",
    template.structureBlocks[template.structureBlocks.length - 1] ??
      "Закройте recap следующим экспериментом или направлением следующего 2-week цикла."
  ].filter((item): item is string => Boolean(item));
}

function buildClosingHint(format: RewriteFormat, candidate: ContentRepurposingCandidate | null) {
  switch (format) {
    case "thread":
      return candidate
        ? `Закройте вопросом или takeaway: что меняет разбор слота "${candidate.slotLabel}" для читателя уже сейчас.`
        : "Закройте thread одним takeaway: что читателю делать с этим разбором прямо сейчас.";
    case "miniSeries":
      return "Завершите short bridge-фразой, какой под-вопрос логично станет следующим эпизодом серии.";
    case "quoteFollowUp":
      return "Закройте одной строкой: какой сигнал теперь важнее отслеживать вместо исходного шума.";
    case "recap":
      return "Завершите выводом, что переносите в следующий 2-week цикл и что сознательно вырезаете.";
  }
}

function buildWhyItFits(
  template: FormatExecutionTemplate,
  candidate: ContentRepurposingCandidate | null,
  fallbackUsed: boolean
) {
  if (candidate && !fallbackUsed) {
    return normalizeSentence(`${candidate.fitReason} Это хорошо совпадает с template-логикой: ${template.whyItFits.toLowerCase()}`);
  }

  return normalizeSentence(
    `${template.whyItFits} Сейчас это скорее scaffold от базового угла и ближайшего слота, чем fully grounded strongest candidate.`
  );
}

function buildThreadExample(
  context: RewriteContext
): FormatExampleRewrite {
  const template = context.templatesBucket.formatExecutionTemplates.threadTemplate;
  const selection = selectCandidate(context, "thread");

  return {
    sourceCandidate: buildSourceLabel(
      selection.candidate,
      `Базовый угол: ${context.calendarBucket.bestEntryAngleLabel ?? "thread через общий рабочий тезис"}`
    ),
    rewrittenOpening: buildOpeningFromTemplate(template, selection.candidate),
    structureBullets: buildThreadStructureBullets(template, selection.candidate),
    closingHint: buildClosingHint("thread", selection.candidate),
    whyItFits: buildWhyItFits(template, selection.candidate, selection.fallbackUsed),
    caution:
      selection.candidate?.cautionNote ??
      template.caution ??
      context.repurposingBucket.overuseWarnings[0] ??
      null
  };
}

function buildMiniSeriesExample(
  context: RewriteContext
): FormatExampleRewrite {
  const template = context.templatesBucket.formatExecutionTemplates.miniSeriesTemplate;
  const selection = selectCandidate(context, "miniSeries");

  return {
    sourceCandidate: buildSourceLabel(
      selection.candidate,
      `Базовый угол: ${context.calendarBucket.bestEntryAngleLabel ?? "mini-series continuation через рабочую anchor-серию"}`
    ),
    rewrittenOpening: buildOpeningFromTemplate(template, selection.candidate),
    structureBullets: buildMiniSeriesStructureBullets(template, selection.candidate),
    closingHint: buildClosingHint("miniSeries", selection.candidate),
    whyItFits: buildWhyItFits(template, selection.candidate, selection.fallbackUsed),
    caution:
      selection.candidate?.cautionNote ??
      template.caution ??
      context.repeatableBucket.repeatableContentSeries[0]?.genericityWarning ??
      null
  };
}

function buildQuoteExample(
  context: RewriteContext
): FormatExampleRewrite {
  const template = context.templatesBucket.formatExecutionTemplates.quoteFollowUpTemplate;
  const selection = selectCandidate(context, "quoteFollowUp");

  return {
    sourceCandidate: buildSourceLabel(
      selection.candidate,
      `Базовый угол: ${context.calendarBucket.bestEntryAngleLabel ?? "quote-follow-up через внешний тезис"}`
    ),
    rewrittenOpening: buildOpeningFromTemplate(template, selection.candidate),
    structureBullets: buildQuoteStructureBullets(template, selection.candidate),
    closingHint: buildClosingHint("quoteFollowUp", selection.candidate),
    whyItFits: buildWhyItFits(template, selection.candidate, selection.fallbackUsed),
    caution:
      selection.candidate?.cautionNote ??
      template.caution ??
      context.repurposingBucket.overuseWarnings.find((warning) =>
        warning.toLowerCase().includes("quote")
      ) ??
      null
  };
}

function buildRecapExample(
  context: RewriteContext
): FormatExampleRewrite {
  const template = context.templatesBucket.formatExecutionTemplates.recapTemplate;
  const selection = selectCandidate(context, "recap");

  return {
    sourceCandidate: buildSourceLabel(
      selection.candidate,
      `Базовый угол: ${context.calendarBucket.bestEntryAngleLabel ?? "recap через итог цикла"}`
    ),
    rewrittenOpening: buildOpeningFromTemplate(template, selection.candidate),
    structureBullets: buildRecapStructureBullets(template, selection.candidate),
    closingHint: buildClosingHint("recap", selection.candidate),
    whyItFits: buildWhyItFits(template, selection.candidate, selection.fallbackUsed),
    caution:
      selection.candidate?.cautionNote ??
      template.caution ??
      context.repurposingBucket.overuseWarnings.find((warning) =>
        warning.toLowerCase().includes("recap")
      ) ??
      null
  };
}

function buildBucketRewrites(context: RewriteContext): RewriteBucketWithMeta {
  const threadExample = buildThreadExample(context);
  const miniSeriesExample = buildMiniSeriesExample(context);
  const quoteFollowUpExample = buildQuoteExample(context);
  const recapExample = buildRecapExample(context);
  const threadScore = context.repurposingBucket.threadCandidates.length * 3 + (threadExample.sourceCandidate.includes("Базовый угол") ? 0 : 2);
  const quoteScore = context.repurposingBucket.quoteFollowUpCandidates.length * 3 + (quoteFollowUpExample.sourceCandidate.includes("Базовый угол") ? 0 : 2);
  const recapScore = context.repurposingBucket.recapCandidates.length * 3 + (recapExample.sourceCandidate.includes("Базовый угол") ? 0 : 2);

  return {
    bucket: {
      bucketId: context.calendarBucket.bucketId,
      label: context.calendarBucket.label,
      rank: context.calendarBucket.rank,
      bestEntryAngleLabel: context.calendarBucket.bestEntryAngleLabel,
      formatExampleRewrites: {
        threadExample,
        miniSeriesExample,
        quoteFollowUpExample,
        recapExample
      },
      exampleRewriteConfidenceNote:
        context.templatesBucket.templateConfidenceNote ??
        context.repurposingBucket.repurposingConfidenceNote ??
        context.adaptationBucket.adaptationConfidenceNote ??
        context.calendarBucket.calendarConfidenceNote ??
        null
    },
    threadScore,
    quoteScore,
    recapScore
  };
}

function buildLeader(
  bucket: NicheFormatExampleRewritesBucket,
  reason: string
): NichePositioningPlaybookLeader {
  return {
    bucketId: bucket.bucketId,
    bucketLabel: bucket.label,
    rank: bucket.rank,
    reason
  };
}

function buildSummary(
  buckets: RewriteBucketWithMeta[]
): CrossNicheFormatExampleRewritesSummary {
  const threadLeader = buckets.slice().sort((left, right) => right.threadScore - left.threadScore)[0];
  const quoteLeader = buckets.slice().sort((left, right) => right.quoteScore - left.quoteScore)[0];
  const recapLeader = buckets.slice().sort((left, right) => right.recapScore - left.recapScore)[0];

  return {
    nicheWithClearestThreadExample:
      threadLeader && threadLeader.threadScore > 0
        ? buildLeader(
            threadLeader.bucket,
            "здесь проще всего увидеть, как strongest candidate slot превращается в реальный thread skeleton, а не в абстрактный template."
          )
        : null,
    nicheWithEasiestQuoteFollowUpConversion:
      quoteLeader && quoteLeader.quoteScore > 0
        ? buildLeader(
            quoteLeader.bucket,
            "здесь quote-follow-up легче других превращается в concrete rewrite: уже есть понятный trigger и понятная собственная рамка."
          )
        : null,
    nicheWithStrongestRecapExample:
      recapLeader && recapLeader.recapScore > 0
        ? buildLeader(
            recapLeader.bucket,
            "здесь recap-example выглядит сильнее всего: поздние слоты уже дают материал для короткой сводки с выводом."
          )
        : null
  };
}

function buildSummaryText(summary: CrossNicheFormatExampleRewritesSummary) {
  const parts: string[] = [];

  if (summary.nicheWithClearestThreadExample) {
    parts.push(
      `самый ясный thread-example сейчас читается в ${summary.nicheWithClearestThreadExample.bucketLabel}`
    );
  }

  if (summary.nicheWithEasiestQuoteFollowUpConversion) {
    parts.push(
      `проще всего превратить strongest slot в quote-follow-up в ${summary.nicheWithEasiestQuoteFollowUpConversion.bucketLabel}`
    );
  }

  if (summary.nicheWithStrongestRecapExample) {
    parts.push(
      `самый сильный recap-example сейчас у ${summary.nicheWithStrongestRecapExample.bucketLabel}`
    );
  }

  if (parts.length === 0) {
    return "Example rewrites пока слишком слабы, чтобы уверенно сравнить shortlisted niches между собой.";
  }

  return `${parts[0]}${parts.length > 1 ? `, а ${parts.slice(1).join(", а ")}` : ""}.`;
}

export function buildNicheFormatExampleRewrites(
  shortlist: NicheShortlistResponse,
  existingPlaybook?: CrossNichePositioningPlaybook | null,
  existingRepeatableSeries?: CrossNicheRepeatableContentSeries | null,
  existingCalendar?: CrossNicheContentCalendarStarter | null,
  existingAdaptation?: CrossNicheContentCalendarAdaptation | null,
  existingRepurposing?: CrossNicheContentRepurposingHints | null,
  existingTemplates?: CrossNicheFormatExecutionTemplates | null
): CrossNicheFormatExampleRewrites {
  const playbook = existingPlaybook ?? buildNichePositioningPlaybook(shortlist);
  const repeatableSeries =
    existingRepeatableSeries ?? buildNicheRepeatableContentSeries(shortlist, playbook);
  const calendar =
    existingCalendar ??
    buildNicheContentCalendarStarter(shortlist, playbook, repeatableSeries);
  const adaptation =
    existingAdaptation ??
    buildNicheContentCalendarAdaptation(
      shortlist,
      playbook,
      repeatableSeries,
      calendar
    );
  const repurposing =
    existingRepurposing ??
    buildNicheContentRepurposingHints(
      shortlist,
      playbook,
      repeatableSeries,
      calendar,
      adaptation
    );
  const templates =
    existingTemplates ??
    buildNicheFormatExecutionTemplates(
      shortlist,
      playbook,
      repeatableSeries,
      calendar,
      adaptation,
      repurposing
    );

  const perBucketRewritesWithMeta = calendar.perBucketCalendars
    .map((calendarBucket) => {
      const playbookBucket = playbook.perBucketPlaybooks.find(
        (item) => item.bucketId === calendarBucket.bucketId
      );
      const repeatableBucket = repeatableSeries.perBucketSeries.find(
        (item) => item.bucketId === calendarBucket.bucketId
      );
      const adaptationBucket = adaptation.perBucketAdaptations.find(
        (item) => item.bucketId === calendarBucket.bucketId
      );
      const repurposingBucket = repurposing.perBucketHints.find(
        (item) => item.bucketId === calendarBucket.bucketId
      );
      const templatesBucket = templates.perBucketTemplates.find(
        (item) => item.bucketId === calendarBucket.bucketId
      );

      if (!playbookBucket || !repeatableBucket || !adaptationBucket || !repurposingBucket || !templatesBucket) {
        return null;
      }

      return buildBucketRewrites({
        playbookBucket,
        repeatableBucket,
        calendarBucket,
        adaptationBucket,
        repurposingBucket,
        templatesBucket
      });
    })
    .filter((item): item is RewriteBucketWithMeta => Boolean(item));
  const summary = buildSummary(perBucketRewritesWithMeta);

  return {
    comparedBucketCount: shortlist.rankedBuckets.length,
    comparableBucketCount: perBucketRewritesWithMeta.length,
    rewritesSummary: buildSummaryText(summary),
    perBucketRewrites: perBucketRewritesWithMeta.map((item) => item.bucket),
    summary,
    globalConfidenceNote:
      perBucketRewritesWithMeta.length < 2
        ? "Сейчас shortlist слишком маленький для уверенного сравнения example rewrites между нишами."
        : templates.globalConfidenceNote ??
          repurposing.globalConfidenceNote ??
          adaptation.globalConfidenceNote ??
          calendar.globalConfidenceNote ??
          repeatableSeries.globalConfidenceNote ??
          playbook.globalConfidenceNote ??
          null
  };
}
