import type {
  CrossNicheContentRepurposingHints,
  NicheContentRepurposingHintsBucket
} from "./nicheContentRepurposingHints.js";
import { buildNicheContentRepurposingHints } from "./nicheContentRepurposingHints.js";
import type {
  CrossNicheFormatExampleRewrites,
  FormatExampleRewrite,
  NicheFormatExampleRewritesBucket
} from "./nicheFormatExampleRewrites.js";
import { buildNicheFormatExampleRewrites } from "./nicheFormatExampleRewrites.js";
import type {
  CrossNicheFormatExecutionTemplates,
  FormatExecutionTemplate,
  NicheFormatExecutionTemplatesBucket
} from "./nicheFormatExecutionTemplates.js";
import { buildNicheFormatExecutionTemplates } from "./nicheFormatExecutionTemplates.js";
import type { NicheShortlistResponse } from "../types/nicheShortlist.js";
import type { NichePositioningPlaybookLeader } from "./nichePositioningPlaybook.js";

type PublishChecklistFormat = "thread" | "miniSeries" | "quoteFollowUp" | "recap";

export interface FormatPublishChecklist {
  checklistTitle: string;
  checks: string[];
  mustNotForget: string;
  avoidWarning: string | null;
  whenItMatters: string;
}

export interface NicheFormatPublishChecklistsBucket {
  bucketId: string;
  label: string;
  rank: number | null;
  bestEntryAngleLabel: string | null;
  formatPublishChecklists: {
    threadChecklist: FormatPublishChecklist;
    miniSeriesChecklist: FormatPublishChecklist;
    quoteFollowUpChecklist: FormatPublishChecklist;
    recapChecklist: FormatPublishChecklist;
  };
  checklistConfidenceNote: string | null;
}

export interface CrossNicheFormatPublishChecklistsSummary {
  nicheWithEasiestThreadPublishingDiscipline: NichePositioningPlaybookLeader | null;
  nicheWithEasiestRecapQualityControl: NichePositioningPlaybookLeader | null;
  nicheWhereQuoteFollowUpRequiresMostCaution: NichePositioningPlaybookLeader | null;
}

export interface CrossNicheFormatPublishChecklists {
  comparedBucketCount: number;
  comparableBucketCount: number;
  publishChecklistSummary: string;
  perBucketChecklists: NicheFormatPublishChecklistsBucket[];
  summary: CrossNicheFormatPublishChecklistsSummary;
  globalConfidenceNote: string | null;
}

interface PublishChecklistContext {
  repurposingBucket: NicheContentRepurposingHintsBucket;
  templatesBucket: NicheFormatExecutionTemplatesBucket;
  rewritesBucket: NicheFormatExampleRewritesBucket;
}

interface PublishChecklistBucketWithMeta {
  bucket: NicheFormatPublishChecklistsBucket;
  threadDisciplineScore: number;
  recapQualityScore: number;
  quoteCautionScore: number;
}

function dedupeItems<T>(items: T[]) {
  return Array.from(new Set(items));
}

function stripTrailingPunctuation(value: string) {
  return value.trim().replace(/[.!?…:]+$/u, "");
}

function toQuickCheck(item: string | undefined | null) {
  if (!item) {
    return null;
  }

  return `Проверьте шаг: ${stripTrailingPunctuation(item)}.`;
}

function isFallbackRewrite(rewrite: FormatExampleRewrite) {
  return rewrite.sourceCandidate.includes("Базовый угол");
}

function buildLeader(
  bucket: NicheFormatPublishChecklistsBucket,
  reason: string
): NichePositioningPlaybookLeader {
  return {
    bucketId: bucket.bucketId,
    bucketLabel: bucket.label,
    rank: bucket.rank,
    reason
  };
}

function findFormatWarning(
  repurposingBucket: NicheContentRepurposingHintsBucket,
  keyword: string
) {
  return (
    repurposingBucket.overuseWarnings.find((warning) =>
      warning.toLowerCase().includes(keyword)
    ) ?? null
  );
}

function buildChecks(
  items: Array<string | null | undefined>,
  minCount = 4,
  maxCount = 6
) {
  const uniqueItems = dedupeItems(
    items.map((item) => item?.trim()).filter((item): item is string => Boolean(item))
  );

  return uniqueItems.slice(0, Math.max(minCount, Math.min(maxCount, uniqueItems.length)));
}

function buildThreadChecklist(context: PublishChecklistContext): FormatPublishChecklist {
  const template = context.templatesBucket.formatExecutionTemplates.threadTemplate;
  const rewrite = context.rewritesBucket.formatExampleRewrites.threadExample;
  const sourceLabel = rewrite.sourceCandidate;

  return {
    checklistTitle: "Thread: финальный pre-publish pass",
    checks: buildChecks([
      "Хук в первой строке обещает ровно тот разбор, который thread реально раскрывает.",
      `Source candidate "${sourceLabel}" действительно тянет на 3-5 коротких шагов, а не на один длинный абзац.`,
      toQuickCheck(rewrite.structureBullets[0]),
      toQuickCheck(rewrite.structureBullets[1]),
      toQuickCheck(template.structureBlocks[template.structureBlocks.length - 1]),
      "Каждый блок двигает один тезис или один signal, без скачка на новую подтему."
    ]),
    mustNotForget:
      "Финальный takeaway должен закрывать thread одним practical выводом, а не просто обрывать разбор на последнем наблюдении.",
    avoidWarning:
      rewrite.caution ??
      template.caution ??
      findFormatWarning(context.repurposingBucket, "thread"),
    whenItMatters: template.whenToUse
  };
}

function buildMiniSeriesChecklist(context: PublishChecklistContext): FormatPublishChecklist {
  const template = context.templatesBucket.formatExecutionTemplates.miniSeriesTemplate;
  const rewrite = context.rewritesBucket.formatExampleRewrites.miniSeriesExample;
  const sourceLabel = rewrite.sourceCandidate;

  return {
    checklistTitle: "Mini-series continuation: не перезапускайте тему заново",
    checks: buildChecks([
      "Первая строка сразу связывает post с предыдущим эпизодом серии.",
      `Source candidate "${sourceLabel}" раскрывает один следующий слой темы, а не весь цикл заново.`,
      toQuickCheck(rewrite.structureBullets[0]),
      toQuickCheck(rewrite.structureBullets[1]),
      toQuickCheck(template.structureBlocks[template.structureBlocks.length - 1]),
      "Внутри continuation есть только один узкий sub-angle, чтобы серия сохраняла ритм."
    ]),
    mustNotForget:
      "У continuation должен быть bridge к следующему эпизоду, иначе серия быстро теряет ощущение связного цикла.",
    avoidWarning:
      rewrite.caution ??
      template.caution ??
      context.repurposingBucket.overuseWarnings[0] ??
      null,
    whenItMatters: template.whenToUse
  };
}

function buildQuoteFollowUpChecklist(
  context: PublishChecklistContext
): FormatPublishChecklist {
  const template = context.templatesBucket.formatExecutionTemplates.quoteFollowUpTemplate;
  const rewrite = context.rewritesBucket.formatExampleRewrites.quoteFollowUpExample;
  const sourceLabel = rewrite.sourceCandidate;

  return {
    checklistTitle: "Quote-follow-up: собственная рамка важнее реакции",
    checks: buildChecks([
      "Внешний trigger понятен сразу, даже если читатель не открывает исходный пост.",
      `Source candidate "${sourceLabel}" помогает дать новый frame, а не просто повторить чужой тезис.`,
      "Собственная рамка появляется в первых двух строках.",
      toQuickCheck(rewrite.structureBullets[1]),
      toQuickCheck(rewrite.structureBullets[2]),
      "В конце есть one-line implication: что аудитории теперь реально отслеживать."
    ]),
    mustNotForget:
      "Если ваш frame не появился сразу, quote-follow-up почти неизбежно превращается в реакцию ради реакции.",
    avoidWarning:
      rewrite.caution ??
      template.caution ??
      findFormatWarning(context.repurposingBucket, "quote"),
    whenItMatters: template.whenToUse
  };
}

function buildRecapChecklist(context: PublishChecklistContext): FormatPublishChecklist {
  const template = context.templatesBucket.formatExecutionTemplates.recapTemplate;
  const rewrite = context.rewritesBucket.formatExampleRewrites.recapExample;
  const sourceLabel = rewrite.sourceCandidate;

  return {
    checklistTitle: "Recap: соберите цикл в одну рамку",
    checks: buildChecks([
      "В recap есть 2-3 ключевых сигнала, а не длинный список ссылок и наблюдений.",
      `Source candidate "${sourceLabel}" действительно помогает свести цикл в одну общую рамку.`,
      toQuickCheck(rewrite.structureBullets[0]),
      toQuickCheck(rewrite.structureBullets[1]),
      toQuickCheck(rewrite.structureBullets[3] ?? template.structureBlocks[3]),
      "Из recap ясно, что стоит продолжать в следующем цикле, а что пора убрать."
    ]),
    mustNotForget:
      "Главная задача recap не перечислить материалы, а отделить рабочий pattern от шума и закрыть цикл одним выводом.",
    avoidWarning:
      rewrite.caution ??
      template.caution ??
      findFormatWarning(context.repurposingBucket, "recap"),
    whenItMatters: template.whenToUse
  };
}

function buildBucketChecklists(
  context: PublishChecklistContext
): PublishChecklistBucketWithMeta {
  const threadChecklist = buildThreadChecklist(context);
  const miniSeriesChecklist = buildMiniSeriesChecklist(context);
  const quoteFollowUpChecklist = buildQuoteFollowUpChecklist(context);
  const recapChecklist = buildRecapChecklist(context);
  const threadFallback = isFallbackRewrite(
    context.rewritesBucket.formatExampleRewrites.threadExample
  );
  const quoteFallback = isFallbackRewrite(
    context.rewritesBucket.formatExampleRewrites.quoteFollowUpExample
  );
  const recapFallback = isFallbackRewrite(
    context.rewritesBucket.formatExampleRewrites.recapExample
  );

  const threadDisciplineScore =
    context.repurposingBucket.threadCandidates.length * 3 +
    (threadFallback ? 0 : 2) +
    (threadChecklist.avoidWarning ? 0 : 1);
  const recapQualityScore =
    context.repurposingBucket.recapCandidates.length * 3 +
    (recapFallback ? 0 : 2) +
    (recapChecklist.avoidWarning ? 0 : 1);
  const quoteCautionScore =
    context.repurposingBucket.quoteFollowUpCandidates.length * 3 +
    (quoteFallback ? 1 : 3) +
    (quoteFollowUpChecklist.avoidWarning ? 2 : 0);

  return {
    bucket: {
      bucketId: context.templatesBucket.bucketId,
      label: context.templatesBucket.label,
      rank: context.templatesBucket.rank,
      bestEntryAngleLabel: context.templatesBucket.bestEntryAngleLabel,
      formatPublishChecklists: {
        threadChecklist,
        miniSeriesChecklist,
        quoteFollowUpChecklist,
        recapChecklist
      },
      checklistConfidenceNote:
        context.rewritesBucket.exampleRewriteConfidenceNote ??
        context.templatesBucket.templateConfidenceNote ??
        context.repurposingBucket.repurposingConfidenceNote ??
        null
    },
    threadDisciplineScore,
    recapQualityScore,
    quoteCautionScore
  };
}

function buildSummary(
  buckets: PublishChecklistBucketWithMeta[]
): CrossNicheFormatPublishChecklistsSummary {
  const threadLeader = buckets
    .slice()
    .sort((left, right) => right.threadDisciplineScore - left.threadDisciplineScore)[0];
  const recapLeader = buckets
    .slice()
    .sort((left, right) => right.recapQualityScore - left.recapQualityScore)[0];
  const quoteLeader = buckets
    .slice()
    .sort((left, right) => right.quoteCautionScore - left.quoteCautionScore)[0];

  return {
    nicheWithEasiestThreadPublishingDiscipline:
      threadLeader && threadLeader.threadDisciplineScore > 0
        ? buildLeader(
            threadLeader.bucket,
            "здесь сильные thread-слоты уже достаточно структурны, поэтому финальный pass перед публикацией проще превращается в дисциплину, а не в спасение сырого черновика."
          )
        : null,
    nicheWithEasiestRecapQualityControl:
      recapLeader && recapLeader.recapQualityScore > 0
        ? buildLeader(
            recapLeader.bucket,
            "здесь recap легче держать чистым: уже есть сигналы для одной рамки и меньше риска скатиться в список ссылок."
          )
        : null,
    nicheWhereQuoteFollowUpRequiresMostCaution:
      quoteLeader && quoteLeader.quoteCautionScore > 0
        ? buildLeader(
            quoteLeader.bucket,
            "здесь quote-follow-up выглядит сильным, но именно поэтому особенно важно быстро показать собственную рамку и не застрять в чистой реакции."
          )
        : null
  };
}

function buildSummaryText(summary: CrossNicheFormatPublishChecklistsSummary) {
  const parts: string[] = [];

  if (summary.nicheWithEasiestThreadPublishingDiscipline) {
    parts.push(
      `самая простая дисциплина публикации для thread сейчас у ${summary.nicheWithEasiestThreadPublishingDiscipline.bucketLabel}`
    );
  }

  if (summary.nicheWithEasiestRecapQualityControl) {
    parts.push(
      `проще всего удерживать чистый recap quality control в ${summary.nicheWithEasiestRecapQualityControl.bucketLabel}`
    );
  }

  if (summary.nicheWhereQuoteFollowUpRequiresMostCaution) {
    parts.push(
      `а максимальная осторожность в quote-follow-up сейчас нужна в ${summary.nicheWhereQuoteFollowUpRequiresMostCaution.bucketLabel}`
    );
  }

  if (parts.length === 0) {
    return "Pre-publish checklist слой пока слишком слаб, чтобы уверенно сравнить shortlisted niches между собой.";
  }

  return `${parts.join(", ")}.`;
}

export function buildNicheFormatPublishChecklists(
  shortlist: NicheShortlistResponse,
  existingRepurposing?: CrossNicheContentRepurposingHints | null,
  existingTemplates?: CrossNicheFormatExecutionTemplates | null,
  existingExampleRewrites?: CrossNicheFormatExampleRewrites | null
): CrossNicheFormatPublishChecklists {
  const repurposing =
    existingRepurposing ?? buildNicheContentRepurposingHints(shortlist);
  const templates =
    existingTemplates ?? buildNicheFormatExecutionTemplates(shortlist, undefined, undefined, undefined, undefined, repurposing);
  const exampleRewrites =
    existingExampleRewrites ??
    buildNicheFormatExampleRewrites(
      shortlist,
      undefined,
      undefined,
      undefined,
      undefined,
      repurposing,
      templates
    );

  const perBucketChecklistsWithMeta = templates.perBucketTemplates
    .map((templatesBucket) => {
      const repurposingBucket = repurposing.perBucketHints.find(
        (item) => item.bucketId === templatesBucket.bucketId
      );
      const rewritesBucket = exampleRewrites.perBucketRewrites.find(
        (item) => item.bucketId === templatesBucket.bucketId
      );

      if (!repurposingBucket || !rewritesBucket) {
        return null;
      }

      return buildBucketChecklists({
        repurposingBucket,
        templatesBucket,
        rewritesBucket
      });
    })
    .filter((item): item is PublishChecklistBucketWithMeta => item !== null);

  const summary = buildSummary(perBucketChecklistsWithMeta);
  const notesCount = perBucketChecklistsWithMeta.filter(
    (item) => item.bucket.checklistConfidenceNote
  ).length;

  return {
    comparedBucketCount: shortlist.rankedBuckets.length,
    comparableBucketCount: perBucketChecklistsWithMeta.length,
    publishChecklistSummary: buildSummaryText(summary),
    perBucketChecklists: perBucketChecklistsWithMeta.map((item) => item.bucket),
    summary,
    globalConfidenceNote:
      notesCount > 0
        ? "Часть checklist-ов собрана поверх rule-based templates и rewrite skeletons, поэтому перед публикацией полезно вручную сверить их с конкретным source slot и текущим контекстом ленты."
        : null
  };
}
