import type { NicheShortlistResponse, RankedNicheShortlistBucket } from "../types/nicheShortlist.js";
import type {
  CrossNichePositioningPlaybook,
  NichePositioningPlaybookBucket,
  NichePositioningPlaybookLeader
} from "./nichePositioningPlaybook.js";
import { buildNichePositioningPlaybook } from "./nichePositioningPlaybook.js";
import type {
  CrossNicheRepeatableContentSeries,
  NicheRepeatableContentSeriesBucket,
  RepeatableContentSeriesItem
} from "./nicheRepeatableContentSeries.js";
import { buildNicheRepeatableContentSeries } from "./nicheRepeatableContentSeries.js";

export interface ContentCalendarPlanEntry {
  slotLabel: string;
  seriesTitle: string;
  postAngle: string;
  postPurpose: string;
  cautionNote: string | null;
}

export interface NicheContentCalendarStarterBucket {
  bucketId: string;
  label: string;
  rank: number | null;
  calendarTitle: string;
  bestEntryAngleLabel: string | null;
  planEntries: ContentCalendarPlanEntry[];
  calendarConfidenceNote: string | null;
}

export interface CrossNicheContentCalendarStarterSummary {
  nicheWithEasiestTwoWeekLaunchPlan: NichePositioningPlaybookLeader | null;
  nicheWithStrongestContentCadenceFit: NichePositioningPlaybookLeader | null;
  nicheWithBestVarietyRepeatabilityBalance: NichePositioningPlaybookLeader | null;
}

export interface CrossNicheContentCalendarStarter {
  comparedBucketCount: number;
  comparableBucketCount: number;
  calendarSummary: string;
  perBucketCalendars: NicheContentCalendarStarterBucket[];
  summary: CrossNicheContentCalendarStarterSummary;
  globalConfidenceNote: string | null;
}

interface CalendarContext {
  bucket: RankedNicheShortlistBucket;
  playbookBucket: NichePositioningPlaybookBucket;
  repeatableBucket: NicheRepeatableContentSeriesBucket;
}

const calendarSlotLabels = [
  "День 1",
  "День 3",
  "День 5",
  "День 8",
  "День 10",
  "День 12",
  "День 14"
] as const;

function dedupeItems<T>(items: T[]) {
  return Array.from(new Set(items));
}

function buildCalendarTitle(
  bucket: RankedNicheShortlistBucket,
  playbookBucket: NichePositioningPlaybookBucket
) {
  if (playbookBucket.bestEntryAngle) {
    return `${bucket.label}: 2 недели старта через ${playbookBucket.bestEntryAngle.label.toLowerCase()}`;
  }

  return `${bucket.label}: 2 недели первого контент-ритма`;
}

function buildPlanPurpose(
  series: RepeatableContentSeriesItem,
  slotIndex: number,
  angle: string
) {
  if (slotIndex === 0) {
    return `Задать тон через ${angle.toLowerCase()} и сразу показать, чем ваш voice отличается от общего шума.`;
  }

  if (slotIndex === 1) {
    return `Подтвердить, что серия ${series.seriesTitle.toLowerCase()} может работать повторяемо, а не как одноразовый hit.`;
  }

  if (slotIndex >= 5) {
    return `Закрепить posting rhythm и показать, что серия ${series.seriesTitle.toLowerCase()} уже превращается в устойчивый формат.`;
  }

  return `Расширить серию ${series.seriesTitle.toLowerCase()} и проверить, какие углы внутри неё цепляют лучше всего.`;
}

function buildSlotCaution(
  playbookBucket: NichePositioningPlaybookBucket,
  series: RepeatableContentSeriesItem,
  slotIndex: number
) {
  if (slotIndex === 0) {
    return playbookBucket.weakAngleWarnings[0] ?? series.genericityWarning;
  }

  if (slotIndex % 3 === 2) {
    return series.genericityWarning;
  }

  return null;
}

function buildSlotAngle(
  playbookBucket: NichePositioningPlaybookBucket,
  series: RepeatableContentSeriesItem,
  slotIndex: number
) {
  const starterIdea = playbookBucket.firstPostIdeas[slotIndex];

  if (starterIdea) {
    return starterIdea;
  }

  const seriesAngle = series.examplePostAngles[slotIndex % series.examplePostAngles.length];

  if (seriesAngle) {
    return seriesAngle;
  }

  return series.repeatedAngle;
}

function buildPlanEntries(context: CalendarContext): ContentCalendarPlanEntry[] {
  const seriesItems = context.repeatableBucket.repeatableContentSeries.slice(0, 5);

  if (seriesItems.length === 0) {
    return [];
  }

  return calendarSlotLabels.map((slotLabel, slotIndex) => {
    const series = seriesItems[slotIndex % seriesItems.length];
    const postAngle = buildSlotAngle(context.playbookBucket, series, slotIndex);

    return {
      slotLabel,
      seriesTitle: series.seriesTitle,
      postAngle,
      postPurpose: buildPlanPurpose(
        series,
        slotIndex,
        context.playbookBucket.bestEntryAngle?.label ?? "рабочий первый угол"
      ),
      cautionNote: buildSlotCaution(context.playbookBucket, series, slotIndex)
    };
  });
}

function buildBucketCalendar(
  bucket: RankedNicheShortlistBucket,
  playbookBucket: NichePositioningPlaybookBucket,
  repeatableBucket: NicheRepeatableContentSeriesBucket
): NicheContentCalendarStarterBucket {
  const confidenceNotes = [
    repeatableBucket.seriesConfidenceNote,
    playbookBucket.playbookConfidenceNote
  ].filter((value): value is string => Boolean(value));

  return {
    bucketId: bucket.bucketId,
    label: bucket.label,
    rank: bucket.rank,
    calendarTitle: buildCalendarTitle(bucket, playbookBucket),
    bestEntryAngleLabel: playbookBucket.bestEntryAngle?.label ?? null,
    planEntries: buildPlanEntries({
      bucket,
      playbookBucket,
      repeatableBucket
    }),
    calendarConfidenceNote: confidenceNotes[0] ?? null
  };
}

function buildLeader(
  bucket: NicheContentCalendarStarterBucket,
  reason: string
): NichePositioningPlaybookLeader {
  return {
    bucketId: bucket.bucketId,
    bucketLabel: bucket.label,
    rank: bucket.rank,
    reason
  };
}

function buildVarietyLeader(
  calendars: NicheContentCalendarStarterBucket[],
  repeatableSeries: CrossNicheRepeatableContentSeries
) {
  return calendars
    .slice()
    .sort((left, right) => {
      const leftSeries =
        repeatableSeries.perBucketSeries.find((item) => item.bucketId === left.bucketId)
          ?.repeatableContentSeries.length ?? 0;
      const rightSeries =
        repeatableSeries.perBucketSeries.find((item) => item.bucketId === right.bucketId)
          ?.repeatableContentSeries.length ?? 0;

      return rightSeries - leftSeries;
    })[0] ?? null;
}

function buildSummary(
  calendars: NicheContentCalendarStarterBucket[],
  playbook: CrossNichePositioningPlaybook,
  repeatableSeries: CrossNicheRepeatableContentSeries
): CrossNicheContentCalendarStarterSummary {
  const easiestTwoWeekLaunchSource =
    playbook.summary.easiestNicheToStartPostingIn ??
    repeatableSeries.summary.nicheWithEasiestConsistentPostingCadence;
  const strongestCadenceSource =
    repeatableSeries.summary.nicheWithEasiestConsistentPostingCadence ??
    playbook.summary.nicheWithStrongestContentRepeatability;
  const varietySource =
    buildVarietyLeader(calendars, repeatableSeries);

  return {
    nicheWithEasiestTwoWeekLaunchPlan: easiestTwoWeekLaunchSource
      ? buildLeader(
          calendars.find((bucket) => bucket.bucketId === easiestTwoWeekLaunchSource.bucketId) ?? {
            bucketId: easiestTwoWeekLaunchSource.bucketId,
            label: easiestTwoWeekLaunchSource.bucketLabel,
            rank: easiestTwoWeekLaunchSource.rank,
            calendarTitle: "",
            bestEntryAngleLabel: null,
            planEntries: [],
            calendarConfidenceNote: null
          },
          "в этой нише проще всего собрать понятный двухнедельный запуск без ощущения, что каждая публикация требует нового формата с нуля."
        )
      : null,
    nicheWithStrongestContentCadenceFit: strongestCadenceSource
      ? buildLeader(
          calendars.find((bucket) => bucket.bucketId === strongestCadenceSource.bucketId) ?? {
            bucketId: strongestCadenceSource.bucketId,
            label: strongestCadenceSource.bucketLabel,
            rank: strongestCadenceSource.rank,
            calendarTitle: "",
            bestEntryAngleLabel: null,
            planEntries: [],
            calendarConfidenceNote: null
          },
          "эта ниша лучше остальных поддерживает ровный posting cadence и даёт меньше поводов срываться в хаотичный контент."
        )
      : null,
    nicheWithBestVarietyRepeatabilityBalance: varietySource
      ? buildLeader(
          varietySource,
          "здесь календарь сочетает повторяемость и разнообразие лучше всего: серии не слишком однотипны, но и не распадаются на случайный набор идей."
        )
      : null
  };
}

function buildSummaryText(summary: CrossNicheContentCalendarStarterSummary) {
  const parts: string[] = [];

  if (summary.nicheWithEasiestTwoWeekLaunchPlan) {
    parts.push(
      `проще всего запустить двухнедельный план в ${summary.nicheWithEasiestTwoWeekLaunchPlan.bucketLabel}`
    );
  }

  if (summary.nicheWithStrongestContentCadenceFit) {
    parts.push(
      `самый ровный cadence сейчас читается в ${summary.nicheWithStrongestContentCadenceFit.bucketLabel}`
    );
  }

  if (summary.nicheWithBestVarietyRepeatabilityBalance) {
    parts.push(
      `лучший баланс между разнообразием и повторяемостью даёт ${summary.nicheWithBestVarietyRepeatabilityBalance.bucketLabel}`
    );
  }

  if (parts.length === 0) {
    return "Пока content calendar лучше читать как стартовый шаблон на 2 недели, а не как жёсткое расписание публикаций.";
  }

  return `Если превращать shortlist в конкретный posting plan на ближайшие 2 недели, то сейчас ${parts.join("; ")}.`;
}

export function buildNicheContentCalendarStarter(
  shortlist: NicheShortlistResponse,
  existingPlaybook?: CrossNichePositioningPlaybook | null,
  existingRepeatableSeries?: CrossNicheRepeatableContentSeries | null
): CrossNicheContentCalendarStarter {
  const playbook = existingPlaybook ?? buildNichePositioningPlaybook(shortlist);
  const repeatableSeries =
    existingRepeatableSeries ?? buildNicheRepeatableContentSeries(shortlist, playbook);
  const shortlistedBuckets = shortlist.rankedBuckets.filter(
    (bucket) => bucket.shortlistIncluded && bucket.status !== "error"
  );
  const perBucketCalendars = shortlistedBuckets
    .map((bucket) => {
      const playbookBucket = playbook.perBucketPlaybooks.find(
        (item) => item.bucketId === bucket.bucketId
      );
      const repeatableBucket = repeatableSeries.perBucketSeries.find(
        (item) => item.bucketId === bucket.bucketId
      );

      if (!playbookBucket || !repeatableBucket) {
        return null;
      }

      return buildBucketCalendar(bucket, playbookBucket, repeatableBucket);
    })
    .filter((item): item is NicheContentCalendarStarterBucket => Boolean(item));
  const summary = buildSummary(perBucketCalendars, playbook, repeatableSeries);

  return {
    comparedBucketCount: shortlist.rankedBuckets.length,
    comparableBucketCount: perBucketCalendars.length,
    calendarSummary: buildSummaryText(summary),
    perBucketCalendars,
    summary,
    globalConfidenceNote:
      repeatableSeries.globalConfidenceNote ?? playbook.globalConfidenceNote ?? null
  };
}
