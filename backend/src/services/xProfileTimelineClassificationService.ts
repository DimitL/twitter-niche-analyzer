import type { FastifyBaseLogger } from "fastify";
import type { ExtractedXProfileFieldsData } from "./xProfileFieldsService.js";
import type {
  DiscoveredXProfileTimelineTweetRef,
  ExtractedXProfileTimelineUrlsData
} from "./xProfileTimelineUrlsService.js";
import type { XTweetFieldsDiagnostics } from "./xTweetFieldsService.js";
import {
  getXProfileTimelineClassificationNotesSeed,
  resolveXProfileTimelineClassificationTreatQuoteAsUsable
} from "../config/xProfileTimelineClassificationConfig.js";
import { runXProfileFieldsDiagnostics } from "./xProfileFieldsService.js";
import { runXProfileTimelineUrlsDiagnostics } from "./xProfileTimelineUrlsService.js";
import { runXTweetFieldsDiagnostics } from "./xTweetFieldsService.js";

interface XProfileTimelineClassificationOptions {
  handle?: string;
  targetUrl?: string;
  waitStrategy?: string;
  limit?: string | number;
  treatQuoteAsUsable?: string | boolean;
}

interface XProfileTimelineItemClassificationOptions {
  discoveredItems: DiscoveredXProfileTimelineTweetRef[];
  profileHandle: string | null;
  waitStrategy?: string;
  treatQuoteAsUsable?: string | boolean;
}

export type XTimelinePostClassification =
  | "originalPost"
  | "reply"
  | "repost"
  | "quotePost"
  | "uncertain";

export type XTimelineClassificationConfidence = "high" | "medium" | "low";

interface XProfileTimelineClassificationErrorDetails {
  name: string;
  message: string;
}

interface XProfileTimelineClassificationTimings {
  profileFieldsMs: number;
  timelineDiscoveryMs: number;
  tweetFieldHydrationMs: number;
  perItemMs: Array<{
    tweetUrl: string | null;
    tweetId: string | null;
    totalMs: number;
  }>;
  classificationMs: number;
  totalMs: number;
}

interface XProfileTimelineClassificationProfile {
  profileUrl: string | null;
  handle: string | null;
  displayName: string | null;
}

export interface ClassifiedXProfileTimelineItem extends DiscoveredXProfileTimelineTweetRef {
  classification: XTimelinePostClassification;
  confidence: XTimelineClassificationConfidence;
  usableForScoring: boolean;
  reasons: string[];
  tweetFieldStatus: "ok" | "partial" | "error" | "notAvailable";
  tweetAuthorHandle: string | null;
  tweetPublishedAt: string | null;
  tweetTextAvailable: boolean;
}

export interface XProfileTimelineClassificationSummary {
  discoveredCount: number;
  originalPostCount: number;
  replyCount: number;
  repostCount: number;
  quotePostCount: number;
  uncertainCount: number;
  usableForScoringCount: number;
}

export interface XProfileTimelineClassifiedItemSupport {
  classifiedItem: ClassifiedXProfileTimelineItem;
  tweetFieldResult: XTweetFieldsDiagnostics | null;
  totalMs: number;
}

export interface XProfileTimelineItemClassificationSupport {
  classifiedItems: ClassifiedXProfileTimelineItem[];
  classifiedItemSupport: XProfileTimelineClassifiedItemSupport[];
  classificationSummary: XProfileTimelineClassificationSummary;
  notes: string[];
  timings: {
    tweetFieldHydrationMs: number;
    perItemMs: XProfileTimelineClassificationTimings["perItemMs"];
    classificationMs: number;
    totalMs: number;
  };
}

export interface XProfileTimelineClassificationDiagnostics {
  status: "ok" | "partial" | "error";
  navigationSucceeded: boolean;
  classificationSucceeded: boolean;
  profile: XProfileTimelineClassificationProfile;
  discoveredItems: DiscoveredXProfileTimelineTweetRef[];
  classifiedItems: ClassifiedXProfileTimelineItem[];
  classificationSummary: XProfileTimelineClassificationSummary;
  timings: XProfileTimelineClassificationTimings;
  error: XProfileTimelineClassificationErrorDetails | null;
  notes: string[];
}

function serializeError(error: unknown): XProfileTimelineClassificationErrorDetails {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message
    };
  }

  return {
    name: "UnknownError",
    message: String(error)
  };
}

function dedupeNotes(notes: string[]) {
  return Array.from(new Set(notes.map((note) => note.trim()).filter(Boolean)));
}

function prefixNotes(prefix: string, notes: string[]) {
  return notes.map((note) => `${prefix}: ${note}`);
}

function createEmptyProfile(): XProfileTimelineClassificationProfile {
  return {
    profileUrl: null,
    handle: null,
    displayName: null
  };
}

function createEmptySummary(): XProfileTimelineClassificationSummary {
  return {
    discoveredCount: 0,
    originalPostCount: 0,
    replyCount: 0,
    repostCount: 0,
    quotePostCount: 0,
    uncertainCount: 0,
    usableForScoringCount: 0
  };
}

function createEmptyClassificationSupport(): XProfileTimelineItemClassificationSupport {
  return {
    classifiedItems: [],
    classifiedItemSupport: [],
    classificationSummary: createEmptySummary(),
    notes: [],
    timings: {
      tweetFieldHydrationMs: 0,
      perItemMs: [],
      classificationMs: 0,
      totalMs: 0
    }
  };
}

function pickProfileHandle(profile: ExtractedXProfileFieldsData, fallbackHandle?: string | null) {
  return profile.handle || fallbackHandle || null;
}

function buildProfileView(profile: ExtractedXProfileFieldsData) {
  return {
    profileUrl: profile.profileUrl,
    handle: profile.handle,
    displayName: profile.displayName
  };
}

function normalizeCase(value: string | null | undefined) {
  return value?.trim().toLowerCase() || null;
}

function buildClassificationSummary(
  classifiedItems: ClassifiedXProfileTimelineItem[]
): XProfileTimelineClassificationSummary {
  return {
    discoveredCount: classifiedItems.length,
    originalPostCount: classifiedItems.filter(
      (item) => item.classification === "originalPost"
    ).length,
    replyCount: classifiedItems.filter((item) => item.classification === "reply").length,
    repostCount: classifiedItems.filter((item) => item.classification === "repost").length,
    quotePostCount: classifiedItems.filter(
      (item) => item.classification === "quotePost"
    ).length,
    uncertainCount: classifiedItems.filter(
      (item) => item.classification === "uncertain"
    ).length,
    usableForScoringCount: classifiedItems.filter((item) => item.usableForScoring).length
  };
}

function buildTweetFieldEvidenceMarkers(
  tweetFieldResult: XTweetFieldsDiagnostics | null,
  profileHandle: string | null
) {
  const evidenceMarkers: string[] = [];
  const normalizedProfileHandle = normalizeCase(profileHandle);
  const normalizedTweetAuthorHandle = normalizeCase(
    tweetFieldResult?.extractedData.authorHandle
  );

  if (normalizedTweetAuthorHandle && normalizedProfileHandle) {
    if (normalizedTweetAuthorHandle === normalizedProfileHandle) {
      evidenceMarkers.push("tweetAuthorMatchesProfile");
    } else {
      evidenceMarkers.push("tweetAuthorDiffersFromProfile");
    }
  }

  if (tweetFieldResult?.extractedData.tweetText) {
    evidenceMarkers.push("tweetTextAvailable");
  }

  if (tweetFieldResult?.extractedData.publishedAt) {
    evidenceMarkers.push("tweetTimestampAvailable");
  }

  return evidenceMarkers;
}

function classifyTimelineItem(input: {
  discoveredItem: DiscoveredXProfileTimelineTweetRef;
  profileHandle: string | null;
  treatQuoteAsUsable: boolean;
  tweetFieldResult: XTweetFieldsDiagnostics | null;
}): ClassifiedXProfileTimelineItem {
  const { discoveredItem, profileHandle, treatQuoteAsUsable, tweetFieldResult } = input;
  const profileHandleNormalized = normalizeCase(profileHandle);
  const discoveredAuthorNormalized = normalizeCase(discoveredItem.authorHandle);
  const tweetAuthorNormalized = normalizeCase(tweetFieldResult?.extractedData.authorHandle);
  const evidenceMarkers = Array.from(
    new Set([
      ...discoveredItem.evidenceMarkers,
      ...buildTweetFieldEvidenceMarkers(tweetFieldResult, profileHandle)
    ])
  );
  const reasons: string[] = [];
  let classification: XTimelinePostClassification = "uncertain";
  let confidence: XTimelineClassificationConfidence = "low";

  const authorMatchesProfile = Boolean(
    profileHandleNormalized &&
      (discoveredAuthorNormalized === profileHandleNormalized ||
        tweetAuthorNormalized === profileHandleNormalized)
  );
  const authorDiffersFromProfile = Boolean(
    profileHandleNormalized &&
      ((discoveredAuthorNormalized &&
        discoveredAuthorNormalized !== profileHandleNormalized) ||
        (tweetAuthorNormalized && tweetAuthorNormalized !== profileHandleNormalized))
  );

  if (evidenceMarkers.includes("replyingContextVisible")) {
    classification = "reply";
    confidence = "high";
    reasons.push("replyingContextVisible");
  } else if (
    evidenceMarkers.includes("authorHandleMismatch") ||
    evidenceMarkers.includes("tweetAuthorDiffersFromProfile") ||
    authorDiffersFromProfile
  ) {
    classification = "repost";
    confidence = evidenceMarkers.includes("socialContextPresent") ? "high" : "medium";
    reasons.push(
      evidenceMarkers.includes("authorHandleMismatch")
        ? "authorHandleMismatch"
        : "tweetAuthorDiffersFromProfile"
    );

    if (evidenceMarkers.includes("socialContextPresent")) {
      reasons.push("socialContextPresent");
    }
  } else if (
    evidenceMarkers.includes("additionalStatusLinkVisible") &&
    authorMatchesProfile &&
    !evidenceMarkers.includes("socialContextPresent")
  ) {
    classification = "quotePost";
    confidence = "medium";
    reasons.push("additionalStatusLinkVisible");
  } else if (evidenceMarkers.includes("socialContextPresent")) {
    classification = "uncertain";
    confidence = "low";
    reasons.push("socialContextPresent");
  } else if (authorMatchesProfile && !discoveredItem.isReplyOrRepostUncertain) {
    classification = "originalPost";
    confidence = "high";
    reasons.push("authorMatchesProfile");
  } else {
    classification = "uncertain";
    confidence = "low";
    reasons.push("insufficientExplicitSignals");
  }

  if (discoveredItem.isPinned) {
    reasons.push("pinnedItem");
  }

  const usableForScoring =
    classification === "originalPost" ||
    (classification === "quotePost" && treatQuoteAsUsable);

  return {
    ...discoveredItem,
    evidenceMarkers,
    classification,
    confidence,
    usableForScoring,
    reasons,
    tweetFieldStatus: tweetFieldResult?.status || "notAvailable",
    tweetAuthorHandle: tweetFieldResult?.extractedData.authorHandle || null,
    tweetPublishedAt: tweetFieldResult?.extractedData.publishedAt || null,
    tweetTextAvailable: Boolean(tweetFieldResult?.extractedData.tweetText)
  };
}

async function hydrateTweetFieldClassificationSupport(
  discoveredItem: DiscoveredXProfileTimelineTweetRef,
  waitStrategy: string | undefined,
  logger: FastifyBaseLogger
) {
  const startedAt = Date.now();

  if (!discoveredItem.tweetUrl) {
    return {
      tweetFieldResult: null,
      notes: [
        `Tweet field extraction пропущен для элемента #${discoveredItem.sortIndex}: отсутствует tweet URL.`
      ],
      totalMs: Date.now() - startedAt
    };
  }

  try {
    const tweetFieldResult = await runXTweetFieldsDiagnostics(
      {
        targetUrl: discoveredItem.tweetUrl,
        waitStrategy
      },
      logger
    );

    return {
      tweetFieldResult,
      notes: prefixNotes(
        `tweet-fields ${discoveredItem.tweetId || discoveredItem.sortIndex}`,
        tweetFieldResult.notes
      ),
      totalMs: Date.now() - startedAt
    };
  } catch (error) {
    logger.error(
      { err: serializeError(error), tweetUrl: discoveredItem.tweetUrl },
      "Timeline classification tweet field hydration failed."
    );

    return {
      tweetFieldResult: null,
      notes: [
        `Tweet field extraction завершился исключением для ${discoveredItem.tweetUrl}.`
      ],
      totalMs: Date.now() - startedAt
    };
  }
}

export async function classifyXProfileTimelineDiscoveredItems(
  options: XProfileTimelineItemClassificationOptions,
  logger: FastifyBaseLogger
): Promise<XProfileTimelineItemClassificationSupport> {
  const startedAt = Date.now();
  const notes: string[] = [];
  const classifiedItems: ClassifiedXProfileTimelineItem[] = [];
  const classifiedItemSupport: XProfileTimelineClassifiedItemSupport[] = [];
  const perItemMs: XProfileTimelineClassificationTimings["perItemMs"] = [];
  let tweetFieldHydrationMs = 0;
  const treatQuoteAsUsable = resolveXProfileTimelineClassificationTreatQuoteAsUsable(
    options.treatQuoteAsUsable
  );

  if (options.discoveredItems.length === 0) {
    notes.push("Timeline classification пропущен: discovery не вернул ни одного timeline item.");

    return {
      ...createEmptyClassificationSupport(),
      notes,
      timings: {
        tweetFieldHydrationMs: 0,
        perItemMs,
        classificationMs: 0,
        totalMs: Date.now() - startedAt
      }
    };
  }

  const classificationStartedAt = Date.now();

  for (const discoveredItem of options.discoveredItems) {
    const hydrationResult = await hydrateTweetFieldClassificationSupport(
      discoveredItem,
      options.waitStrategy,
      logger
    );
    tweetFieldHydrationMs += hydrationResult.totalMs;
    perItemMs.push({
      tweetUrl: discoveredItem.tweetUrl,
      tweetId: discoveredItem.tweetId,
      totalMs: hydrationResult.totalMs
    });
    notes.push(...hydrationResult.notes);

    const classifiedItem = classifyTimelineItem({
      discoveredItem,
      profileHandle: options.profileHandle,
      treatQuoteAsUsable,
      tweetFieldResult: hydrationResult.tweetFieldResult
    });

    classifiedItems.push(classifiedItem);
    classifiedItemSupport.push({
      classifiedItem,
      tweetFieldResult: hydrationResult.tweetFieldResult,
      totalMs: hydrationResult.totalMs
    });
  }

  return {
    classifiedItems,
    classifiedItemSupport,
    classificationSummary: buildClassificationSummary(classifiedItems),
    notes: dedupeNotes(notes),
    timings: {
      tweetFieldHydrationMs,
      perItemMs,
      classificationMs: Date.now() - classificationStartedAt,
      totalMs: Date.now() - startedAt
    }
  };
}

export async function runXProfileTimelineClassificationDiagnostics(
  options: XProfileTimelineClassificationOptions,
  logger: FastifyBaseLogger
): Promise<XProfileTimelineClassificationDiagnostics> {
  const startedAt = Date.now();
  const notes = getXProfileTimelineClassificationNotesSeed();
  const treatQuoteAsUsable = resolveXProfileTimelineClassificationTreatQuoteAsUsable(
    options.treatQuoteAsUsable
  );
  let profile = createEmptyProfile();
  let discoveredItems: DiscoveredXProfileTimelineTweetRef[] = [];
  let classifiedItems: ClassifiedXProfileTimelineItem[] = [];
  let classificationSummary = createEmptySummary();
  let profileFieldsMs = 0;
  let timelineDiscoveryMs = 0;
  let tweetFieldHydrationMs = 0;
  let classificationMs = 0;
  const perItemMs: XProfileTimelineClassificationTimings["perItemMs"] = [];

  try {
    logger.info(
      {
        handle: options.handle,
        targetUrl: options.targetUrl,
        limit: options.limit,
        treatQuoteAsUsable
      },
      "Starting X profile timeline classification."
    );

    const profileFieldsResult = await runXProfileFieldsDiagnostics(
      {
        handle: options.handle,
        targetUrl: options.targetUrl,
        waitStrategy: options.waitStrategy
      },
      logger
    );
    profileFieldsMs = profileFieldsResult.timings.totalMs;
    profile = buildProfileView(profileFieldsResult.extractedData);
    notes.push(...prefixNotes("profile-fields", profileFieldsResult.notes));

    const timelineResult = await runXProfileTimelineUrlsDiagnostics(
      {
        handle: options.handle,
        targetUrl: options.targetUrl,
        waitStrategy: options.waitStrategy,
        limit: options.limit
      },
      logger
    );
    timelineDiscoveryMs = timelineResult.timings.totalMs;
    discoveredItems = timelineResult.extractedData.items;
    notes.push(...prefixNotes("timeline-urls", timelineResult.notes));

    const profileHandle = pickProfileHandle(
      profileFieldsResult.extractedData,
      timelineResult.resolvedHandle
    );
    const classificationSupport = await classifyXProfileTimelineDiscoveredItems(
      {
        discoveredItems,
        profileHandle,
        waitStrategy: options.waitStrategy,
        treatQuoteAsUsable
      },
      logger
    );
    classifiedItems = classificationSupport.classifiedItems;
    classificationSummary = classificationSupport.classificationSummary;
    tweetFieldHydrationMs = classificationSupport.timings.tweetFieldHydrationMs;
    classificationMs = classificationSupport.timings.classificationMs;
    perItemMs.push(...classificationSupport.timings.perItemMs);
    notes.push(...classificationSupport.notes);
    const navigationSucceeded =
      profileFieldsResult.navigationSucceeded || timelineResult.navigationSucceeded;
    const classificationSucceeded =
      navigationSucceeded && classificationSummary.discoveredCount > 0;

    if (classificationSummary.uncertainCount > 0) {
      notes.push(
        `Часть timeline items осталась uncertain (${classificationSummary.uncertainCount}), потому что rule-based evidence оказалось недостаточно.`
      );
    }

    if (classificationSummary.quotePostCount === 0) {
      notes.push(
        "Quote-post detection пока срабатывает только на сильных signals; отсутствие quotePost не означает, что их точно не было."
      );
    }

    if (treatQuoteAsUsable) {
      notes.push("Quote posts помечаются usable-for-scoring по текущему route flag.");
    } else {
      notes.push("Quote posts помечаются not-usable-for-scoring по текущему route flag.");
    }

    const failedTweetFieldHydrations = classifiedItems.filter(
      (item) => item.tweetFieldStatus === "error"
    ).length;

    if (failedTweetFieldHydrations > 0) {
      notes.push(
        `Часть item-level tweet field hydration завершилась ошибкой: ${failedTweetFieldHydrations}. Классификация всё равно выполнена по timeline evidence.`
      );
    }

    const status =
      classificationSucceeded &&
      classificationSummary.uncertainCount === 0 &&
      failedTweetFieldHydrations === 0
        ? "ok"
        : classificationSucceeded
          ? "partial"
          : "error";

    logger.info(
      {
        handle: profile.handle,
        discoveredCount: classificationSummary.discoveredCount,
        usableForScoringCount: classificationSummary.usableForScoringCount,
        uncertainCount: classificationSummary.uncertainCount
      },
      "Finished X profile timeline classification."
    );

    return {
      status,
      navigationSucceeded,
      classificationSucceeded,
      profile,
      discoveredItems,
      classifiedItems,
      classificationSummary,
      timings: {
        profileFieldsMs,
        timelineDiscoveryMs,
        tweetFieldHydrationMs,
        perItemMs,
        classificationMs,
        totalMs: Date.now() - startedAt
      },
      error:
        status === "ok"
          ? null
          : {
              name:
                status === "partial"
                  ? "XProfileTimelineClassificationPartialResult"
                  : "XProfileTimelineClassificationError",
              message:
                status === "partial"
                  ? "Классификация timeline items завершена частично: часть элементов осталась ambiguous или гидратировалась неполно."
                  : "Не удалось собрать даже частичный classification result для публичной ленты профиля X."
            },
      notes: dedupeNotes(notes)
    };
  } catch (error) {
    logger.error({ err: serializeError(error) }, "X profile timeline classification failed.");
    notes.push("Классификация завершилась с ошибкой до полного завершения timeline item analysis.");

    return {
      status: "error",
      navigationSucceeded: false,
      classificationSucceeded: false,
      profile,
      discoveredItems,
      classifiedItems,
      classificationSummary: buildClassificationSummary(classifiedItems),
      timings: {
        profileFieldsMs,
        timelineDiscoveryMs,
        tweetFieldHydrationMs,
        perItemMs,
        classificationMs,
        totalMs: Date.now() - startedAt
      },
      error: serializeError(error),
      notes: dedupeNotes(notes)
    };
  }
}

// TODO: Strengthen quote-post detection with more explicit nested-quote signals.
// TODO: Improve repost/reply disambiguation before wiring classification into scoring and comparison.
// TODO: Add timeline text-level enrichment only after classification rules are stable.
// TODO: Integrate this classification layer into scoring/comparison pipelines in a separate step.
