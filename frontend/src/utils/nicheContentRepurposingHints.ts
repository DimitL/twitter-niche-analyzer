import type { NicheShortlistResponse } from "../types/nicheShortlist.js";
import type {
  CrossNicheContentCalendarAdaptation,
  NicheContentCalendarAdaptationBucket
} from "./nicheContentCalendarAdaptation.js";
import { buildNicheContentCalendarAdaptation } from "./nicheContentCalendarAdaptation.js";
import type {
  ContentCalendarPlanEntry,
  CrossNicheContentCalendarStarter,
  NicheContentCalendarStarterBucket
} from "./nicheContentCalendarStarter.js";
import { buildNicheContentCalendarStarter } from "./nicheContentCalendarStarter.js";
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

export interface ContentRepurposingCandidate {
  slotLabel: string;
  seriesTitle: string;
  postAngle: string;
  fitReason: string;
  cautionNote: string | null;
}

export interface NicheContentRepurposingHintsBucket {
  bucketId: string;
  label: string;
  rank: number | null;
  calendarTitle: string;
  bestEntryAngleLabel: string | null;
  threadCandidates: ContentRepurposingCandidate[];
  miniSeriesCandidates: ContentRepurposingCandidate[];
  quoteFollowUpCandidates: ContentRepurposingCandidate[];
  recapCandidates: ContentRepurposingCandidate[];
  whyTheseFormatsFit: string[];
  overuseWarnings: string[];
  repurposingConfidenceNote: string | null;
}

export interface CrossNicheContentRepurposingHintsSummary {
  nicheWithStrongestThreadPotential: NichePositioningPlaybookLeader | null;
  nicheWithStrongestMiniSeriesPotential: NichePositioningPlaybookLeader | null;
  nicheWithEasiestRecapLoop: NichePositioningPlaybookLeader | null;
}

export interface CrossNicheContentRepurposingHints {
  comparedBucketCount: number;
  comparableBucketCount: number;
  repurposingSummary: string;
  perBucketHints: NicheContentRepurposingHintsBucket[];
  summary: CrossNicheContentRepurposingHintsSummary;
  globalConfidenceNote: string | null;
}

interface RepurposingContext {
  playbookBucket: NichePositioningPlaybookBucket;
  repeatableBucket: NicheRepeatableContentSeriesBucket;
  calendarBucket: NicheContentCalendarStarterBucket;
  adaptationBucket: NicheContentCalendarAdaptationBucket;
}

interface RepurposingBucketWithMeta {
  bucket: NicheContentRepurposingHintsBucket;
  threadScore: number;
  miniSeriesScore: number;
  recapScore: number;
}

function dedupeItems<T>(items: T[]) {
  return Array.from(new Set(items));
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "").toLowerCase();
}

function countMatches(value: string, keywords: string[]) {
  return keywords.reduce(
    (count, keyword) => (value.includes(keyword) ? count + 1 : count),
    0
  );
}

function buildEntryText(entry: ContentCalendarPlanEntry) {
  return normalizeText(
    [entry.seriesTitle, entry.postAngle, entry.postPurpose, entry.cautionNote]
      .filter(Boolean)
      .join(" ")
  );
}

function buildFormatCandidate(
  entry: ContentCalendarPlanEntry,
  fitReason: string
): ContentRepurposingCandidate {
  return {
    slotLabel: entry.slotLabel,
    seriesTitle: entry.seriesTitle,
    postAngle: entry.postAngle,
    fitReason,
    cautionNote: entry.cautionNote
  };
}

function scoreThreadCandidate(
  entry: ContentCalendarPlanEntry,
  context: RepurposingContext
) {
  const text = buildEntryText(entry);
  let score = 0;

  if (
    context.playbookBucket.bestEntryAngle?.angle === "education" ||
    context.playbookBucket.bestEntryAngle?.angle === "benchmarkResults" ||
    context.playbookBucket.bestEntryAngle?.angle === "founderOperator"
  ) {
    score += 2;
  }

  score +=
    countMatches(text, [
      "разбор",
      "framework",
      "сравн",
      "benchmark",
      "trade-off",
      "ошиб",
      "почему",
      "как ",
      "signal",
      "memo",
      "вывод"
    ]) * 0.9;

  if (
    entry.slotLabel === "День 1" ||
    entry.slotLabel === "День 3" ||
    entry.slotLabel === "День 8"
  ) {
    score += 1.1;
  }

  if (
    normalizeText(entry.seriesTitle).includes("разбира") ||
    normalizeText(entry.seriesTitle).includes("memo") ||
    normalizeText(entry.seriesTitle).includes("что реально")
  ) {
    score += 1.2;
  }

  return score;
}

function scoreMiniSeriesCandidate(
  entry: ContentCalendarPlanEntry,
  context: RepurposingContext
) {
  const text = buildEntryText(entry);
  let score = 1;

  if (
    context.playbookBucket.bestEntryAngle?.angle === "education" ||
    context.playbookBucket.bestEntryAngle?.angle === "founderOperator" ||
    context.playbookBucket.bestEntryAngle?.angle === "narrativeStorytelling" ||
    context.playbookBucket.bestEntryAngle?.angle === "benchmarkResults"
  ) {
    score += 1.5;
  }

  if (
    entry.slotLabel === "День 3" ||
    entry.slotLabel === "День 5" ||
    entry.slotLabel === "День 8" ||
    entry.slotLabel === "День 10"
  ) {
    score += 1;
  }

  score +=
    countMatches(text, [
      "серия",
      "ритм",
      "повтор",
      "регуляр",
      "weekly",
      "повторяем"
    ]) * 0.8;

  if (context.repeatableBucket.repeatableContentSeries.length >= 3) {
    score += 0.7;
  }

  if (
    context.repeatableBucket.repeatableContentSeries.some(
      (series) => series.seriesTitle === entry.seriesTitle && series.cadenceHint
    )
  ) {
    score += 0.9;
  }

  return score;
}

function scoreQuoteFollowUpCandidate(
  entry: ContentCalendarPlanEntry,
  context: RepurposingContext
) {
  const text = buildEntryText(entry);
  let score = 0;

  if (context.playbookBucket.bestEntryAngle?.angle === "contrarian") {
    score += 2.4;
  }

  if (context.playbookBucket.bestEntryAngle?.angle === "timelyNewsReactive") {
    score += 2.6;
  }

  if (context.playbookBucket.bestEntryAngle?.angle === "benchmarkResults") {
    score += 0.8;
  }

  score +=
    countMatches(text, [
      "новост",
      "повод",
      "сегодня",
      "claim",
      "спор",
      "тезис",
      "непопуляр",
      "апдейт",
      "реакц",
      "почему"
    ]) * 0.95;

  if (
    entry.slotLabel === "День 1" ||
    entry.slotLabel === "День 3" ||
    entry.slotLabel === "День 5"
  ) {
    score += 0.9;
  }

  return score;
}

function scoreRecapCandidate(
  entry: ContentCalendarPlanEntry,
  context: RepurposingContext
) {
  const text = buildEntryText(entry);
  let score = 0;

  if (entry.slotLabel === "День 12" || entry.slotLabel === "День 14") {
    score += 2.4;
  } else if (entry.slotLabel === "День 10") {
    score += 1.3;
  }

  if (
    context.playbookBucket.bestEntryAngle?.angle === "education" ||
    context.playbookBucket.bestEntryAngle?.angle === "benchmarkResults" ||
    context.playbookBucket.bestEntryAngle?.angle === "narrativeStorytelling"
  ) {
    score += 1.2;
  }

  score +=
    countMatches(text, [
      "итог",
      "результат",
      "вывод",
      "что сработало",
      "baseline",
      "урок",
      "summary",
      "закрепить",
      "ритм"
    ]) * 0.9;

  return score;
}

function buildThreadFitReason(
  entry: ContentCalendarPlanEntry,
  context: RepurposingContext
) {
  const reasons: string[] = [];
  const text = buildEntryText(entry);

  if (
    countMatches(text, ["разбор", "сравн", "framework", "benchmark", "trade-off"]) > 0
  ) {
    reasons.push("внутри слота уже есть разборный или сравнительный материал, который естественно раскрывается в несколько шагов");
  }

  if (entry.slotLabel === "День 1" || entry.slotLabel === "День 3") {
    reasons.push("этот слот стоит достаточно рано в цикле и может задать более глубокий thread-тон на несколько следующих публикаций");
  }

  if (
    context.playbookBucket.bestEntryAngle?.angle === "education" ||
    context.playbookBucket.bestEntryAngle?.angle === "founderOperator"
  ) {
    reasons.push("базовый угол уже поддерживает длинный формат без потери voice и пользы");
  }

  return (
    reasons[0] ??
    "этот слот лучше обычного переносит расширение в thread, потому что в нём уже есть понятная логика раскрытия по шагам."
  );
}

function buildMiniSeriesFitReason(
  entry: ContentCalendarPlanEntry,
  context: RepurposingContext
) {
  const reasons: string[] = [];

  if (
    context.repeatableBucket.repeatableContentSeries.some(
      (series) => series.seriesTitle === entry.seriesTitle
    )
  ) {
    reasons.push("слот уже сидит внутри repeatable series, поэтому его легко превратить в следующий эпизод без смены голоса");
  }

  if (entry.slotLabel === "День 3" || entry.slotLabel === "День 5" || entry.slotLabel === "День 8") {
    reasons.push("он стоит в середине раннего цикла, где проще всего показать continuation, а не случайный разовый пост");
  }

  if (context.repeatableBucket.repeatableContentSeries.length >= 3) {
    reasons.push("в нише уже хватает рабочих серий, чтобы строить продолжение, а не изобретать новый формат под каждый слот");
  }

  return (
    reasons[0] ??
    "этот слот хорошо подходит для mini-series continuation, потому что опирается на уже повторяемый формат."
  );
}

function buildQuoteFitReason(
  entry: ContentCalendarPlanEntry,
  context: RepurposingContext
) {
  const reasons: string[] = [];
  const text = buildEntryText(entry);

  if (
    context.playbookBucket.bestEntryAngle?.angle === "contrarian" ||
    context.playbookBucket.bestEntryAngle?.angle === "timelyNewsReactive"
  ) {
    reasons.push("базовый угол уже предполагает реакцию на тезисы, новости или спорные claims, поэтому quote-follow-up здесь выглядит естественно");
  }

  if (
    countMatches(text, ["новост", "непопуляр", "спор", "тезис", "апдейт", "реакц"]) > 0
  ) {
    reasons.push("внутри слота читается реактивный или полемический крючок, который легче развить через quote-пост, чем через новый отдельный пост");
  }

  return (
    reasons[0] ??
    "этот слот выглядит хорошим кандидатом для quote-follow-up, потому что в нём уже есть точка реакции или disagreement."
  );
}

function buildRecapFitReason(entry: ContentCalendarPlanEntry) {
  if (entry.slotLabel === "День 12" || entry.slotLabel === "День 14") {
    return "слот уже стоит в конце 2-недельного цикла и лучше других подходит для сводки, выводов и следующего шага.";
  }

  return "этот слот хорошо переводится в recap, потому что уже собирает наблюдения, выводы или результат по серии.";
}

function buildCandidates(
  entries: ContentCalendarPlanEntry[],
  context: RepurposingContext,
  format: "thread" | "miniSeries" | "quoteFollowUp" | "recap"
) {
  const scoredCandidates = entries
    .map((entry) => {
      switch (format) {
        case "thread":
          return {
            candidate: buildFormatCandidate(entry, buildThreadFitReason(entry, context)),
            score: scoreThreadCandidate(entry, context)
          };
        case "miniSeries":
          return {
            candidate: buildFormatCandidate(entry, buildMiniSeriesFitReason(entry, context)),
            score: scoreMiniSeriesCandidate(entry, context)
          };
        case "quoteFollowUp":
          return {
            candidate: buildFormatCandidate(entry, buildQuoteFitReason(entry, context)),
            score: scoreQuoteFollowUpCandidate(entry, context)
          };
        case "recap":
          return {
            candidate: buildFormatCandidate(entry, buildRecapFitReason(entry)),
            score: scoreRecapCandidate(entry, context)
          };
      }
    })
    .sort((left, right) => right.score - left.score);

  const threshold =
    format === "thread"
      ? 3
      : format === "miniSeries"
        ? 3
        : format === "quoteFollowUp"
          ? 2.6
          : 2.4;

  const selected = scoredCandidates
    .filter((item) => item.score >= threshold)
    .slice(0, 3);

  const deduped = selected.filter((item, index, all) => {
    const key = `${item.candidate.slotLabel}-${item.candidate.seriesTitle}`;
    return all.findIndex((entry) => `${entry.candidate.slotLabel}-${entry.candidate.seriesTitle}` === key) === index;
  });

  return {
    candidates: deduped.map((item) => item.candidate),
    totalScore: deduped.reduce((sum, item) => sum + item.score, 0)
  };
}

function buildWhyTheseFormatsFit(context: RepurposingContext) {
  const reasons = [
    context.playbookBucket.bestEntryAngle
      ? `Базовый угол "${context.playbookBucket.bestEntryAngle.label}" уже тянет часть плана в более глубокие follow-up форматы, а не только в одиночные посты.`
      : null,
    context.repeatableBucket.repeatableContentSeries.length > 0
      ? `В календаре уже повторяются серии ${context.repeatableBucket.repeatableContentSeries
          .slice(0, 2)
          .map((series) => `"${series.seriesTitle}"`)
          .join(" и ")}, поэтому лучшие слоты легче продолжать сериями и recap-петлями.`
      : null,
    context.adaptationBucket.whatToKeepWhenTimeIsLimited.length > 0
      ? "Даже low-time режим оставляет anchor-слоты, которые логичнее repurpose-ить, чем каждый раз собирать новый формат с нуля."
      : null,
    context.adaptationBucket.whatToExpandWhenMoreTimeIsAvailable.length > 0
      ? "High-time hints уже показывают, где расширять цикл, а значит часть сильных постов можно безопасно докручивать в thread или continuation."
      : null
  ].filter((item): item is string => Boolean(item));

  return dedupeItems(reasons).slice(0, 4);
}

function buildOveruseWarnings(context: RepurposingContext) {
  const warnings = [
    ...context.adaptationBucket.whatToAvoidOverdoingInHighFrequency,
    ...context.playbookBucket.weakAngleWarnings
  ].filter((item): item is string => Boolean(item));

  if (context.playbookBucket.bestEntryAngle?.angle === "timelyNewsReactive") {
    warnings.push("Не превращайте каждый сильный слот в quote-follow-up подряд: без собственной рамки это быстро скатывается в реакцию ради реакции.");
  }

  if (context.playbookBucket.bestEntryAngle?.angle === "education") {
    warnings.push("Не расширяйте каждый разбор в thread автоматически: если в слоте нет одного ясного вопроса и ответа, длинный формат только размоет сигнал.");
  }

  if (context.playbookBucket.bestEntryAngle?.angle === "contrarian") {
    warnings.push("Не стройте весь repurposing вокруг disagreement: часть цикла должна замыкаться в recap и synthesis, иначе voice станет слишком однотонным.");
  }

  return dedupeItems(warnings).slice(0, 4);
}

function buildRepurposingConfidenceNote(context: RepurposingContext) {
  return (
    context.adaptationBucket.adaptationConfidenceNote ??
    context.calendarBucket.calendarConfidenceNote ??
    context.repeatableBucket.seriesConfidenceNote ??
    context.playbookBucket.playbookConfidenceNote ??
    null
  );
}

function buildLeader(
  bucket: NicheContentRepurposingHintsBucket,
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
  buckets: RepurposingBucketWithMeta[]
): CrossNicheContentRepurposingHintsSummary {
  const threadLeader = buckets.slice().sort((left, right) => right.threadScore - left.threadScore)[0];
  const miniLeader = buckets
    .slice()
    .sort((left, right) => right.miniSeriesScore - left.miniSeriesScore)[0];
  const recapLeader = buckets.slice().sort((left, right) => right.recapScore - left.recapScore)[0];

  return {
    nicheWithStrongestThreadPotential:
      threadLeader && threadLeader.threadScore > 0
        ? buildLeader(
            threadLeader.bucket,
            "здесь больше всего слотов, которые уже сами просятся в развернутый thread вместо одного короткого поста."
          )
        : null,
    nicheWithStrongestMiniSeriesPotential:
      miniLeader && miniLeader.miniSeriesScore > 0
        ? buildLeader(
            miniLeader.bucket,
            "эта ниша лучше других держит continuation logic: сильные слоты уже легко собираются в мини-серию."
          )
        : null,
    nicheWithEasiestRecapLoop:
      recapLeader && recapLeader.recapScore > 0
        ? buildLeader(
            recapLeader.bucket,
            "здесь проще всего замыкать цикл через recap: поздние слоты естественно собирают выводы, а не выглядят повтором ради частоты."
          )
        : null
  };
}

function buildSummaryText(summary: CrossNicheContentRepurposingHintsSummary) {
  const parts: string[] = [];

  if (summary.nicheWithStrongestThreadPotential) {
    parts.push(
      `самый сильный потенциал для thread expansion сейчас виден в ${summary.nicheWithStrongestThreadPotential.bucketLabel}`
    );
  }

  if (summary.nicheWithStrongestMiniSeriesPotential) {
    parts.push(
      `лучше всего в mini-series continuation раскладывается ${summary.nicheWithStrongestMiniSeriesPotential.bucketLabel}`
    );
  }

  if (summary.nicheWithEasiestRecapLoop) {
    parts.push(
      `самый лёгкий recap loop сейчас читается в ${summary.nicheWithEasiestRecapLoop.bucketLabel}`
    );
  }

  if (parts.length === 0) {
    return "Repurposing hints пока слишком слабы, чтобы уверенно сравнить shortlisted niches между собой.";
  }

  return `${parts[0]}${parts.length > 1 ? `, а ${parts.slice(1).join(", а ")}` : ""}.`;
}

function buildBucketHints(
  context: RepurposingContext
): RepurposingBucketWithMeta {
  const thread = buildCandidates(
    context.calendarBucket.planEntries,
    context,
    "thread"
  );
  const miniSeries = buildCandidates(
    context.calendarBucket.planEntries,
    context,
    "miniSeries"
  );
  const quoteFollowUp = buildCandidates(
    context.calendarBucket.planEntries,
    context,
    "quoteFollowUp"
  );
  const recap = buildCandidates(
    context.calendarBucket.planEntries,
    context,
    "recap"
  );

  return {
    bucket: {
      bucketId: context.calendarBucket.bucketId,
      label: context.calendarBucket.label,
      rank: context.calendarBucket.rank,
      calendarTitle: context.calendarBucket.calendarTitle,
      bestEntryAngleLabel: context.calendarBucket.bestEntryAngleLabel,
      threadCandidates: thread.candidates,
      miniSeriesCandidates: miniSeries.candidates,
      quoteFollowUpCandidates: quoteFollowUp.candidates,
      recapCandidates: recap.candidates,
      whyTheseFormatsFit: buildWhyTheseFormatsFit(context),
      overuseWarnings: buildOveruseWarnings(context),
      repurposingConfidenceNote: buildRepurposingConfidenceNote(context)
    },
    threadScore: thread.totalScore,
    miniSeriesScore: miniSeries.totalScore,
    recapScore: recap.totalScore
  };
}

export function buildNicheContentRepurposingHints(
  shortlist: NicheShortlistResponse,
  existingPlaybook?: CrossNichePositioningPlaybook | null,
  existingRepeatableSeries?: CrossNicheRepeatableContentSeries | null,
  existingCalendar?: CrossNicheContentCalendarStarter | null,
  existingAdaptation?: CrossNicheContentCalendarAdaptation | null
): CrossNicheContentRepurposingHints {
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
  const perBucketHintsWithMeta = calendar.perBucketCalendars
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

      if (!playbookBucket || !repeatableBucket || !adaptationBucket) {
        return null;
      }

      return buildBucketHints({
        playbookBucket,
        repeatableBucket,
        calendarBucket,
        adaptationBucket
      });
    })
    .filter((item): item is RepurposingBucketWithMeta => Boolean(item));
  const summary = buildSummary(perBucketHintsWithMeta);

  return {
    comparedBucketCount: shortlist.rankedBuckets.length,
    comparableBucketCount: perBucketHintsWithMeta.length,
    repurposingSummary: buildSummaryText(summary),
    perBucketHints: perBucketHintsWithMeta.map((item) => item.bucket),
    summary,
    globalConfidenceNote:
      perBucketHintsWithMeta.length < 2
        ? "Сейчас shortlist слишком маленький для уверенного сравнения repurposing-паттернов между нишами."
        : adaptation.globalConfidenceNote ??
          calendar.globalConfidenceNote ??
          repeatableSeries.globalConfidenceNote ??
          playbook.globalConfidenceNote ??
          null
  };
}
