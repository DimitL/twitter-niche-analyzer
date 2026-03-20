import type { NicheShortlistResponse } from "../types/nicheShortlist.js";
import type {
  CrossNichePositioningPlaybook,
  NichePositioningPlaybookLeader
} from "./nichePositioningPlaybook.js";
import { buildNichePositioningPlaybook } from "./nichePositioningPlaybook.js";
import type {
  ContentCalendarPlanEntry,
  CrossNicheContentCalendarStarter,
  NicheContentCalendarStarterBucket
} from "./nicheContentCalendarStarter.js";
import { buildNicheContentCalendarStarter } from "./nicheContentCalendarStarter.js";
import type {
  CrossNicheRepeatableContentSeries,
  NicheRepeatableContentSeriesBucket
} from "./nicheRepeatableContentSeries.js";
import { buildNicheRepeatableContentSeries } from "./nicheRepeatableContentSeries.js";

export interface ContentCalendarLowTimeMode {
  recommendedWeeklyVolume: string;
  prioritizeSeries: string[];
  slotsToCutFirst: string[];
  lowTimeCaution: string | null;
}

export interface ContentCalendarMediumTimeMode {
  recommendedWeeklyVolume: string;
  balancedMixGuidance: string[];
  mediumTimeCaution: string | null;
}

export interface ContentCalendarHighTimeMode {
  recommendedWeeklyVolume: string;
  whereToExpand: string[];
  varietyToAdd: string[];
  highTimeCaution: string | null;
}

export interface NicheContentCalendarAdaptationBucket {
  bucketId: string;
  label: string;
  rank: number | null;
  calendarTitle: string;
  bestEntryAngleLabel: string | null;
  whatToKeepWhenTimeIsLimited: string[];
  whatToExpandWhenMoreTimeIsAvailable: string[];
  whatToAvoidOverdoingInHighFrequency: string[];
  lowTimeMode: ContentCalendarLowTimeMode;
  mediumTimeMode: ContentCalendarMediumTimeMode;
  highTimeMode: ContentCalendarHighTimeMode;
  adaptationConfidenceNote: string | null;
}

export interface CrossNicheContentCalendarAdaptationSummary {
  easiestNicheForLowTimePosting: NichePositioningPlaybookLeader | null;
  bestNicheForMediumTimeConsistency: NichePositioningPlaybookLeader | null;
  bestNicheForHighTimeExpansion: NichePositioningPlaybookLeader | null;
}

export interface CrossNicheContentCalendarAdaptation {
  comparedBucketCount: number;
  comparableBucketCount: number;
  adaptationSummary: string;
  perBucketAdaptations: NicheContentCalendarAdaptationBucket[];
  summary: CrossNicheContentCalendarAdaptationSummary;
  globalConfidenceNote: string | null;
}

interface AdaptationContext {
  calendarBucket: NicheContentCalendarStarterBucket;
  repeatableBucket: NicheRepeatableContentSeriesBucket;
}

function dedupeItems<T>(items: T[]) {
  return Array.from(new Set(items));
}

function buildLeader(
  bucket: NicheContentCalendarAdaptationBucket,
  reason: string
): NichePositioningPlaybookLeader {
  return {
    bucketId: bucket.bucketId,
    bucketLabel: bucket.label,
    rank: bucket.rank,
    reason
  };
}

function buildSeriesTitles(entries: ContentCalendarPlanEntry[], count: number) {
  return dedupeItems(entries.map((entry) => entry.seriesTitle)).slice(0, count);
}

function buildLowTimeMode(context: AdaptationContext): ContentCalendarLowTimeMode {
  const firstFourEntries = context.calendarBucket.planEntries.slice(0, 4);
  const lateEntries = context.calendarBucket.planEntries.slice(4);
  const prioritizeSeries = buildSeriesTitles(firstFourEntries, 2);
  const slotsToCutFirst = lateEntries.map((entry) => entry.slotLabel).slice(0, 3);
  const lowTimeCaution =
    context.calendarBucket.planEntries.find((entry) => entry.cautionNote)?.cautionNote ??
    context.repeatableBucket.repeatableContentSeries[0]?.genericityWarning ??
    null;

  return {
    recommendedWeeklyVolume: "2 поста в неделю",
    prioritizeSeries,
    slotsToCutFirst,
    lowTimeCaution:
      lowTimeCaution ??
      "Если времени мало, не распыляйтесь на все серии сразу: держите только самые узнаваемые форматы."
  };
}

function buildMediumTimeMode(context: AdaptationContext): ContentCalendarMediumTimeMode {
  const topSeries = context.repeatableBucket.repeatableContentSeries.slice(0, 3);
  const balancedMixGuidance = topSeries.map((series, index) => {
    if (index === 0) {
      return `${series.seriesTitle} держите как anchor-серию, чтобы voice оставался узнаваемым.`;
    }

    if (index === 1) {
      return `${series.seriesTitle} используйте как второй рабочий формат, чтобы не зацикливаться на одном угле.`;
    }

    return `${series.seriesTitle} подключайте как третий слот для variety, но не чаще одного раза в неделю.`;
  });

  return {
    recommendedWeeklyVolume: "3-4 поста в неделю",
    balancedMixGuidance,
    mediumTimeCaution:
      "Не добавляйте слишком много новых форматов в первые 2 недели: medium mode работает лучше всего на 2-3 повторяемых сериях."
  };
}

function buildHighTimeMode(context: AdaptationContext): ContentCalendarHighTimeMode {
  const whereToExpand = context.repeatableBucket.repeatableContentSeries
    .slice(0, 4)
    .map(
      (series) =>
        `${series.seriesTitle}: расширяйте её, если готовы держать более плотный rhythm без потери качества.`
    );
  const varietyToAdd = context.repeatableBucket.repeatableContentSeries
    .slice(1, 5)
    .map(
      (series) =>
        `Добавляйте ${series.seriesTitle.toLowerCase()} как variation layer, а не как полный replacement базового угла.`
    )
    .slice(0, 3);
  const overdoNote =
    context.repeatableBucket.repeatableContentSeries.find(
      (series) => series.genericityWarning
    )?.genericityWarning ?? null;

  return {
    recommendedWeeklyVolume: "5-6 постов в неделю",
    whereToExpand,
    varietyToAdd,
    highTimeCaution:
      overdoNote ??
      "При высокой частоте не разгоняйте один и тот же паттерн подряд: лучше чередовать anchor-серию, variation slot и более лёгкий reactive формат."
  };
}

function buildAdaptationBucket(
  calendarBucket: NicheContentCalendarStarterBucket,
  repeatableBucket: NicheRepeatableContentSeriesBucket
): NicheContentCalendarAdaptationBucket {
  const context = { calendarBucket, repeatableBucket };
  const lowTimeMode = buildLowTimeMode(context);
  const mediumTimeMode = buildMediumTimeMode(context);
  const highTimeMode = buildHighTimeMode(context);
  const whatToKeepWhenTimeIsLimited = lowTimeMode.prioritizeSeries.map(
    (seriesTitle) =>
      `${seriesTitle}: оставляйте именно её, если нужно сократить план до минимального, но узнаваемого ритма.`
  );
  const whatToExpandWhenMoreTimeIsAvailable = highTimeMode.whereToExpand.slice(0, 3);
  const whatToAvoidOverdoingInHighFrequency = [
    highTimeMode.highTimeCaution,
    ...context.calendarBucket.planEntries
      .map((entry) => entry.cautionNote)
      .filter((entry): entry is string => Boolean(entry))
  ]
    .filter((entry): entry is string => Boolean(entry))
    .slice(0, 3);

  return {
    bucketId: calendarBucket.bucketId,
    label: calendarBucket.label,
    rank: calendarBucket.rank,
    calendarTitle: calendarBucket.calendarTitle,
    bestEntryAngleLabel: calendarBucket.bestEntryAngleLabel,
    whatToKeepWhenTimeIsLimited,
    whatToExpandWhenMoreTimeIsAvailable,
    whatToAvoidOverdoingInHighFrequency,
    lowTimeMode,
    mediumTimeMode,
    highTimeMode,
    adaptationConfidenceNote:
      calendarBucket.calendarConfidenceNote ?? repeatableBucket.seriesConfidenceNote ?? null
  };
}

function buildSummary(
  adaptations: NicheContentCalendarAdaptationBucket[],
  playbook: CrossNichePositioningPlaybook,
  repeatableSeries: CrossNicheRepeatableContentSeries
): CrossNicheContentCalendarAdaptationSummary {
  const lowTimeSource =
    playbook.summary.easiestNicheToStartPostingIn ??
    repeatableSeries.summary.nicheWithEasiestConsistentPostingCadence;
  const mediumTimeSource =
    repeatableSeries.summary.nicheWithEasiestConsistentPostingCadence ??
    playbook.summary.nicheWithStrongestContentRepeatability;
  const highTimeSource =
    repeatableSeries.summary.nicheWithMostDifferentiatedSeriesIdeas ??
    playbook.summary.nicheWithStrongestContentRepeatability;

  return {
    easiestNicheForLowTimePosting: lowTimeSource
      ? buildLeader(
          adaptations.find((bucket) => bucket.bucketId === lowTimeSource.bucketId) ?? {
            bucketId: lowTimeSource.bucketId,
            label: lowTimeSource.bucketLabel,
            rank: lowTimeSource.rank,
            calendarTitle: "",
            bestEntryAngleLabel: null,
            whatToKeepWhenTimeIsLimited: [],
            whatToExpandWhenMoreTimeIsAvailable: [],
            whatToAvoidOverdoingInHighFrequency: [],
            lowTimeMode: {
              recommendedWeeklyVolume: "",
              prioritizeSeries: [],
              slotsToCutFirst: [],
              lowTimeCaution: null
            },
            mediumTimeMode: {
              recommendedWeeklyVolume: "",
              balancedMixGuidance: [],
              mediumTimeCaution: null
            },
            highTimeMode: {
              recommendedWeeklyVolume: "",
              whereToExpand: [],
              varietyToAdd: [],
              highTimeCaution: null
            },
            adaptationConfidenceNote: null
          },
          "эта ниша проще всего переживает ограниченный time budget: здесь легче урезать календарь до минимума без потери узнаваемого угла."
        )
      : null,
    bestNicheForMediumTimeConsistency: mediumTimeSource
      ? buildLeader(
          adaptations.find((bucket) => bucket.bucketId === mediumTimeSource.bucketId) ?? {
            bucketId: mediumTimeSource.bucketId,
            label: mediumTimeSource.bucketLabel,
            rank: mediumTimeSource.rank,
            calendarTitle: "",
            bestEntryAngleLabel: null,
            whatToKeepWhenTimeIsLimited: [],
            whatToExpandWhenMoreTimeIsAvailable: [],
            whatToAvoidOverdoingInHighFrequency: [],
            lowTimeMode: {
              recommendedWeeklyVolume: "",
              prioritizeSeries: [],
              slotsToCutFirst: [],
              lowTimeCaution: null
            },
            mediumTimeMode: {
              recommendedWeeklyVolume: "",
              balancedMixGuidance: [],
              mediumTimeCaution: null
            },
            highTimeMode: {
              recommendedWeeklyVolume: "",
              whereToExpand: [],
              varietyToAdd: [],
              highTimeCaution: null
            },
            adaptationConfidenceNote: null
          },
          "здесь medium mode выглядит наиболее естественно: 3-4 поста в неделю уже дают стабильность, но ещё не требуют перегруженного расписания."
        )
      : null,
    bestNicheForHighTimeExpansion: highTimeSource
      ? buildLeader(
          adaptations.find((bucket) => bucket.bucketId === highTimeSource.bucketId) ?? {
            bucketId: highTimeSource.bucketId,
            label: highTimeSource.bucketLabel,
            rank: highTimeSource.rank,
            calendarTitle: "",
            bestEntryAngleLabel: null,
            whatToKeepWhenTimeIsLimited: [],
            whatToExpandWhenMoreTimeIsAvailable: [],
            whatToAvoidOverdoingInHighFrequency: [],
            lowTimeMode: {
              recommendedWeeklyVolume: "",
              prioritizeSeries: [],
              slotsToCutFirst: [],
              lowTimeCaution: null
            },
            mediumTimeMode: {
              recommendedWeeklyVolume: "",
              balancedMixGuidance: [],
              mediumTimeCaution: null
            },
            highTimeMode: {
              recommendedWeeklyVolume: "",
              whereToExpand: [],
              varietyToAdd: [],
              highTimeCaution: null
            },
            adaptationConfidenceNote: null
          },
          "эта ниша лучше других переносит high-time expansion: можно наращивать частоту без мгновенного схлопывания в один и тот же формат."
        )
      : null
  };
}

function buildSummaryText(summary: CrossNicheContentCalendarAdaptationSummary) {
  const parts: string[] = [];

  if (summary.easiestNicheForLowTimePosting) {
    parts.push(
      `для low-time режима проще всего заходить в ${summary.easiestNicheForLowTimePosting.bucketLabel}`
    );
  }

  if (summary.bestNicheForMediumTimeConsistency) {
    parts.push(
      `самая естественная medium-time консистентность сейчас читается в ${summary.bestNicheForMediumTimeConsistency.bucketLabel}`
    );
  }

  if (summary.bestNicheForHighTimeExpansion) {
    parts.push(
      `лучший запас для high-time expansion сейчас виден в ${summary.bestNicheForHighTimeExpansion.bucketLabel}`
    );
  }

  if (parts.length === 0) {
    return "Пока adaptation hints лучше читать как практическую настройку стартового календаря под ваш time budget, а не как точный production schedule.";
  }

  return `Если смотреть на shortlist через реальный time budget, то сейчас ${parts.join("; ")}.`;
}

export function buildNicheContentCalendarAdaptation(
  shortlist: NicheShortlistResponse,
  existingPlaybook?: CrossNichePositioningPlaybook | null,
  existingRepeatableSeries?: CrossNicheRepeatableContentSeries | null,
  existingCalendar?: CrossNicheContentCalendarStarter | null
): CrossNicheContentCalendarAdaptation {
  const playbook = existingPlaybook ?? buildNichePositioningPlaybook(shortlist);
  const repeatableSeries =
    existingRepeatableSeries ?? buildNicheRepeatableContentSeries(shortlist, playbook);
  const calendar =
    existingCalendar ??
    buildNicheContentCalendarStarter(shortlist, playbook, repeatableSeries);
  const perBucketAdaptations = calendar.perBucketCalendars
    .map((calendarBucket) => {
      const repeatableBucket = repeatableSeries.perBucketSeries.find(
        (item) => item.bucketId === calendarBucket.bucketId
      );

      if (!repeatableBucket) {
        return null;
      }

      return buildAdaptationBucket(calendarBucket, repeatableBucket);
    })
    .filter((item): item is NicheContentCalendarAdaptationBucket => Boolean(item));
  const summary = buildSummary(perBucketAdaptations, playbook, repeatableSeries);

  return {
    comparedBucketCount: shortlist.rankedBuckets.length,
    comparableBucketCount: perBucketAdaptations.length,
    adaptationSummary: buildSummaryText(summary),
    perBucketAdaptations,
    summary,
    globalConfidenceNote:
      calendar.globalConfidenceNote ??
      repeatableSeries.globalConfidenceNote ??
      playbook.globalConfidenceNote ??
      null
  };
}
