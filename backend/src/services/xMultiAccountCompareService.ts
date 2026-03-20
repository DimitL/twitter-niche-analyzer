import type { FastifyBaseLogger } from "fastify";
import type { ExtractedXProfileFieldsData } from "./xProfileFieldsService.js";
import type {
  ScoredUsableXAccountTweet,
  XAccountScoreBreakdown,
  XAccountScoreDiagnostics,
  XAccountScoreFiltersApplied,
  XAccountScoreSignals
} from "./xAccountScoreService.js";
import type { RequestedXCompareAccountInput } from "../config/xMultiAccountCompareConfig.js";
import {
  getXMultiAccountCompareNotesSeed,
  resolveXMultiAccountCompareSortBy,
  resolveXMultiAccountRequestedAccounts,
  type XMultiAccountCompareSortBy
} from "../config/xMultiAccountCompareConfig.js";
import { runXAccountScoreDiagnostics } from "./xAccountScoreService.js";

interface XMultiAccountCompareOptions {
  handles?: string | string[];
  handle?: string | string[];
  targetUrls?: string | string[];
  targetUrl?: string | string[];
  waitStrategy?: string;
  limit?: string | number;
  includeUncertain?: string | boolean;
  treatQuoteAsUsable?: string | boolean;
  sortBy?: string;
}

interface XMultiAccountCompareErrorDetails {
  name: string;
  message: string;
}

interface XMultiAccountCompareTimings {
  accountScoringMs: number;
  sortingMs: number;
  perAccountMs: Array<{
    label: string;
    totalMs: number;
  }>;
  totalMs: number;
}

type ComparedXAccountContentPatternTag =
  | "strongHook"
  | "contrarianTake"
  | "productUpdate"
  | "benchmarkOrResult"
  | "educationalBreakdown"
  | "founderInsight"
  | "timelyNewsTieIn"
  | "audienceQuestion"
  | "narrativeStorytelling";

interface ComparedXAccountTweetReference {
  tweetUrl: string | null;
  publishedAt: string | null;
  tweetTextSnippet: string | null;
  language: string | null;
  likeCount: ScoredUsableXAccountTweet["likeCount"];
  repostCount: ScoredUsableXAccountTweet["repostCount"];
  replyCount: ScoredUsableXAccountTweet["replyCount"];
  contentPatternTags: ComparedXAccountContentPatternTag[];
  likelyStrengthReason: string | null;
  tagConfidenceNotes: string[];
}

export interface ComparedXAccountResult {
  request: RequestedXCompareAccountInput;
  status: "ok" | "partial" | "error";
  aggregationSucceeded: boolean;
  scoringSucceeded: boolean;
  profile: ExtractedXProfileFieldsData;
  filtersApplied: XAccountScoreFiltersApplied;
  accountSignals: XAccountScoreSignals;
  accountScores: XAccountScoreBreakdown;
  recentTweetReferencesCount: number;
  recentTweetReferences: ComparedXAccountTweetReference[];
  recentTweetReferencesNote: string | null;
  bestPerformingTweetReferencesCount: number;
  bestPerformingTweetReferences: ComparedXAccountTweetReference[];
  bestPerformingTweetReferencesNote: string | null;
  contentArchetypeLabel: string | null;
  dominantPatterns: ComparedXAccountContentPatternTag[];
  secondaryPatterns: ComparedXAccountContentPatternTag[];
  archetypeSummary: string | null;
  archetypeConfidenceNote: string | null;
  error: XMultiAccountCompareErrorDetails | null;
  notes: string[];
  totalMs: number;
}

interface SuccessfulXAccountComparisonSummary {
  request: RequestedXCompareAccountInput;
  profile: {
    handle: string | null;
    displayName: string | null;
    profileUrl: string | null;
  };
  status: "ok" | "partial";
  overallAccountScore: number;
  engagementEfficiencyScore: number;
  reachScore: number;
  consistencyScore: number;
  dataConfidenceScore: number;
  usablePostCount: number;
}

interface FailedXAccountComparisonSummary {
  request: RequestedXCompareAccountInput;
  status: "partial" | "error";
  aggregationSucceeded: boolean;
  scoringSucceeded: boolean;
  error: XMultiAccountCompareErrorDetails | null;
}

interface TopComparedAccountSummary {
  handle: string | null;
  displayName: string | null;
  profileUrl: string | null;
  metric: XMultiAccountCompareSortBy;
  value: number;
}

interface XMultiAccountComparisonSummary {
  totalRequestedAccounts: number;
  successfulAccounts: number;
  failedAccounts: number;
  sortBy: XMultiAccountCompareSortBy;
  topByOverall: TopComparedAccountSummary | null;
  topByEngagementEfficiency: TopComparedAccountSummary | null;
  topByReach: TopComparedAccountSummary | null;
  topByConsistency: TopComparedAccountSummary | null;
}

export interface XMultiAccountCompareDiagnostics {
  status: "ok" | "partial" | "error";
  comparisonSucceeded: boolean;
  requestedAccounts: RequestedXCompareAccountInput[];
  successfulComparisons: SuccessfulXAccountComparisonSummary[];
  failedComparisons: FailedXAccountComparisonSummary[];
  comparedAccounts: ComparedXAccountResult[];
  comparisonSummary: XMultiAccountComparisonSummary;
  timings: XMultiAccountCompareTimings;
  error: XMultiAccountCompareErrorDetails | null;
  notes: string[];
}

function serializeError(error: unknown): XMultiAccountCompareErrorDetails {
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

function createEmptyProfile(): ExtractedXProfileFieldsData {
  return {
    profileUrl: null,
    handle: null,
    displayName: null,
    bio: null,
    location: null,
    websiteUrl: null,
    joinedAt: null,
    followerCount: {
      rawText: null,
      normalizedNumber: null,
      available: false
    },
    followingCount: {
      rawText: null,
      normalizedNumber: null,
      available: false
    },
    postCount: {
      rawText: null,
      normalizedNumber: null,
      available: false
    },
    verifiedOrNotable: {
      available: false,
      hasVerifiedBadge: false,
      hasProfessionalCategory: false,
      professionalCategoryLabel: null,
      hasAffiliatesTab: false
    }
  };
}

function createEmptyFiltersApplied(): XAccountScoreFiltersApplied {
  return {
    includeUncertain: false,
    treatQuoteAsUsable: false,
    excludeFailedHydration: true,
    excludeReplies: true,
    excludeReposts: true,
    excludeQuotePosts: true,
    excludeUncertain: true,
    excludeClassificationUnavailable: true,
    discoveredCount: 0,
    hydratedCount: 0,
    usablePostCount: 0,
    excludedUncertainCount: 0,
    excludedFailedCount: 0,
    excludedReplyCount: 0,
    excludedRepostCount: 0,
    excludedQuotePostCount: 0,
    excludedClassificationUnavailableCount: 0
  };
}

function createEmptySignals(): XAccountScoreSignals {
  return {
    discoveredCount: 0,
    hydratedCount: 0,
    usablePostCount: 0,
    excludedUncertainCount: 0,
    excludedFailedCount: 0,
    avgLikeCount: null,
    avgRepostCount: null,
    avgReplyCount: null,
    avgViewCount: null,
    medianLikeCount: null,
    medianViewCount: null,
    followerCount: null,
    avgEngagementProxy: null,
    avgEngagementPerFollowerProxy: null,
    postingDensityProxy: null,
    dataQualityScore: 0
  };
}

function createEmptyScores(): XAccountScoreBreakdown {
  return {
    engagementEfficiencyScore: 0,
    consistencyScore: 0,
    reachScore: 0,
    dataConfidenceScore: 0,
    overallAccountScore: 0
  };
}

function buildTweetTextSnippet(tweetText: string | null, maxLength = 180) {
  if (!tweetText) {
    return null;
  }

  const normalizedText = tweetText.replace(/\s+/g, " ").trim();

  if (normalizedText.length <= maxLength) {
    return normalizedText;
  }

  return `${normalizedText.slice(0, maxLength - 1).trimEnd()}…`;
}

function getRecentTweetPublishedTimestamp(tweet: ScoredUsableXAccountTweet) {
  if (!tweet.publishedAt) {
    return Number.NEGATIVE_INFINITY;
  }

  const parsedTimestamp = Date.parse(tweet.publishedAt);

  if (!Number.isFinite(parsedTimestamp)) {
    return Number.NEGATIVE_INFINITY;
  }

  return parsedTimestamp;
}

function getMetricNumber(
  metric: ScoredUsableXAccountTweet["likeCount"]
) {
  return metric.normalizedNumber ?? 0;
}

function getTweetEngagementProxy(tweet: ScoredUsableXAccountTweet) {
  const metricValues = [
    tweet.likeCount.normalizedNumber,
    tweet.repostCount.normalizedNumber,
    tweet.replyCount.normalizedNumber
  ].filter((value): value is number => value !== null);

  if (metricValues.length === 0) {
    return null;
  }

  return metricValues.reduce((sum, value) => sum + value, 0);
}

function containsAny(text: string, patterns: string[]) {
  return patterns.some((pattern) => text.includes(pattern));
}

function getContentPatternLabel(tag: ComparedXAccountContentPatternTag) {
  switch (tag) {
    case "strongHook":
      return "сильный hook";
    case "contrarianTake":
      return "контрарный угол";
    case "productUpdate":
      return "продуктовый апдейт";
    case "benchmarkOrResult":
      return "результат или benchmark";
    case "educationalBreakdown":
      return "обучающий breakdown";
    case "founderInsight":
      return "founder insight";
    case "timelyNewsTieIn":
      return "привязка к актуальной новости";
    case "audienceQuestion":
      return "вопрос к аудитории";
    case "narrativeStorytelling":
      return "нарративная подача";
    default:
      return tag;
  }
}

function joinHumanList(items: string[]) {
  if (items.length === 0) {
    return "";
  }

  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} и ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")} и ${items[items.length - 1]}`;
}

function buildContentArchetypeLabel(
  dominantPatterns: ComparedXAccountContentPatternTag[],
  secondaryPatterns: ComparedXAccountContentPatternTag[]
) {
  const hasPattern = (tag: ComparedXAccountContentPatternTag) =>
    dominantPatterns.includes(tag) || secondaryPatterns.includes(tag);

  if (
    hasPattern("educationalBreakdown") &&
    hasPattern("benchmarkOrResult")
  ) {
    return "Практичный аналитик";
  }

  if (hasPattern("strongHook") && hasPattern("contrarianTake")) {
    return "Контрарный attention-driver";
  }

  if (hasPattern("productUpdate") && hasPattern("benchmarkOrResult")) {
    return "Продуктовый доказательщик";
  }

  if (hasPattern("founderInsight") && hasPattern("narrativeStorytelling")) {
    return "Founder-рассказчик";
  }

  if (hasPattern("timelyNewsTieIn") && hasPattern("productUpdate")) {
    return "Новостной продуктовый комментатор";
  }

  if (hasPattern("audienceQuestion") && hasPattern("strongHook")) {
    return "Диалоговый hook-builder";
  }

  switch (dominantPatterns[0]) {
    case "strongHook":
      return "Hook-driven автор";
    case "contrarianTake":
      return "Контрарный комментатор";
    case "productUpdate":
      return "Продуктовый апдейтер";
    case "benchmarkOrResult":
      return "Результат-аналитик";
    case "educationalBreakdown":
      return "Обучающий разборщик";
    case "founderInsight":
      return "Founder-оператор";
    case "timelyNewsTieIn":
      return "Новостной интерпретатор";
    case "audienceQuestion":
      return "Диалоговый вовлекатель";
    case "narrativeStorytelling":
      return "Нарративный рассказчик";
    default:
      return null;
  }
}

function inferTweetContentPatterns(tweet: ScoredUsableXAccountTweet) {
  const tweetText = tweet.tweetText?.replace(/\s+/g, " ").trim() ?? "";
  const normalizedText = tweetText.toLowerCase();
  const engagementProxy = getTweetEngagementProxy(tweet);
  const patternScores = new Map<ComparedXAccountContentPatternTag, number>();
  const confidenceNotes: string[] = [];

  if (!normalizedText) {
    return {
      contentPatternTags: [] as ComparedXAccountContentPatternTag[],
      likelyStrengthReason:
        engagementProxy !== null
          ? "Твит выглядит сильным по реакции аудитории, но без текстового snippet трудно объяснить его content pattern."
          : null,
      tagConfidenceNotes:
        engagementProxy !== null
          ? ["Паттерны не определены: текстовый snippet для этого твита недоступен."]
          : []
    };
  }

  const addScore = (
    tag: ComparedXAccountContentPatternTag,
    score: number
  ) => {
    patternScores.set(tag, (patternScores.get(tag) ?? 0) + score);
  };

  if (
    /^(hot take|stop |why |how |what |the .*:|[0-9]+\b)/i.test(tweetText) ||
    containsAny(normalizedText, ["here's", "nobody talks about", "the truth", "most people"])
  ) {
    addScore("strongHook", 3);
  }

  if (
    containsAny(normalizedText, [
      "hot take",
      "unpopular opinion",
      "most people",
      "everyone says",
      "you're wrong",
      "you are wrong",
      "myth",
      "stop doing"
    ])
  ) {
    addScore("contrarianTake", 3);
  }

  if (
    containsAny(normalizedText, [
      "introducing",
      "launched",
      "launching",
      "shipping",
      "shipped",
      "new feature",
      "release",
      "released",
      "rollout",
      "now available",
      "beta",
      "update:"
    ])
  ) {
    addScore("productUpdate", 3);
  }

  if (
    containsAny(normalizedText, [
      "benchmark",
      "benchmarks",
      "result",
      "results",
      "grew",
      "growth",
      "improved",
      "lift",
      "revenue",
      "latency",
      "faster",
      "slower",
      "performance"
    ]) ||
    /(\d+(\.\d+)?%|\d+(\.\d+)?x)/i.test(tweetText)
  ) {
    addScore("benchmarkOrResult", 3);
  }

  if (
    containsAny(normalizedText, [
      "how to",
      "breakdown",
      "guide",
      "framework",
      "playbook",
      "step-by-step",
      "lessons",
      "tutorial",
      "explained"
    ]) ||
    /^\d+\//.test(tweetText)
  ) {
    addScore("educationalBreakdown", 3);
  }

  if (
    containsAny(normalizedText, [
      "founder",
      "startup",
      "operator",
      "company",
      "customer",
      "customers",
      "team",
      "we learned",
      "i learned",
      "from building",
      "building this"
    ])
  ) {
    addScore("founderInsight", 2);
  }

  if (
    containsAny(normalizedText, [
      "today",
      "just announced",
      "just launched",
      "this week",
      "breaking",
      "news",
      "latest",
      "yesterday",
      "announced"
    ])
  ) {
    addScore("timelyNewsTieIn", 2);
  }

  if (
    tweetText.includes("?") &&
    /^(what|why|how|should|would|are|is|can|do|does)\b/i.test(tweetText)
  ) {
    addScore("audienceQuestion", 3);
  }

  if (
    containsAny(normalizedText, [
      "when i",
      "when we",
      "last year",
      "story",
      "journey",
      "mistake",
      "behind the scenes",
      "i learned",
      "we learned"
    ])
  ) {
    addScore("narrativeStorytelling", 2);
  }

  const contentPatternTags = [...patternScores.entries()]
    .filter(([, score]) => score >= 2)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([tag]) => tag);

  if (contentPatternTags.length === 0) {
    return {
      contentPatternTags,
      likelyStrengthReason:
        engagementProxy !== null
          ? "Твит выглядит сильным по реакции аудитории, но по короткому snippet трудно уверенно определить content pattern."
          : null,
      tagConfidenceNotes:
        engagementProxy !== null
          ? ["Паттерны не размечены: текст слишком общий для надёжной rule-based классификации."]
          : []
    };
  }

  if (tweetText.length < 90) {
    confidenceNotes.push(
      "Теги выведены по короткому snippet, поэтому их стоит читать как подсказку, а не как строгую классификацию."
    );
  }

  if (contentPatternTags.length === 1) {
    confidenceNotes.push(
      "У этого твита определился только один уверенный паттерн, поэтому объяснение силы остаётся предварительным."
    );
  }

  const likelyStrengthReason =
    contentPatternTags.length > 0
      ? `Похоже, твит зацепил аудиторию через ${contentPatternTags
          .slice(0, 2)
          .map((tag) => getContentPatternLabel(tag))
          .join(" и ")}.`
      : null;

  return {
    contentPatternTags,
    likelyStrengthReason,
    tagConfidenceNotes: confidenceNotes
  };
}

function buildEmptyContentArchetypeSummary() {
  return {
    contentArchetypeLabel: null,
    dominantPatterns: [] as ComparedXAccountContentPatternTag[],
    secondaryPatterns: [] as ComparedXAccountContentPatternTag[],
    archetypeSummary: null,
    archetypeConfidenceNote: null
  };
}

function inferAccountContentArchetype(
  references: ComparedXAccountTweetReference[]
) {
  if (references.length === 0) {
    return {
      ...buildEmptyContentArchetypeSummary(),
      archetypeConfidenceNote:
        "Архетип пока не определён: у аккаунта не хватило usable best-performing референсов."
    };
  }

  const patternWeights = new Map<ComparedXAccountContentPatternTag, number>();
  const confidenceNotes = new Set<string>();
  const strongestReason = references.find((reference) => reference.likelyStrengthReason)
    ?.likelyStrengthReason;
  let taggedReferenceCount = 0;

  references.forEach((reference, referenceIndex) => {
    const referenceWeight = referenceIndex === 0 ? 2 : 1;

    if (reference.contentPatternTags.length > 0) {
      taggedReferenceCount += 1;
    }

    reference.contentPatternTags.forEach((tag, tagIndex) => {
      const tagWeight = Math.max(referenceWeight - tagIndex * 0.4, 0.5);
      patternWeights.set(tag, (patternWeights.get(tag) ?? 0) + tagWeight);
    });

    reference.tagConfidenceNotes.forEach((note) => confidenceNotes.add(note));
  });

  if (patternWeights.size === 0) {
    return {
      ...buildEmptyContentArchetypeSummary(),
      archetypeSummary: strongestReason
        ? `Пока видно только общий strength signal: ${strongestReason}`
        : null,
      archetypeConfidenceNote:
        "Архетип пока не определён уверенно: у лучших твит-референсов не нашлось явных pattern tags."
    };
  }

  const sortedPatterns = [...patternWeights.entries()].sort(
    (left, right) => right[1] - left[1]
  );
  const topScore = sortedPatterns[0][1];
  const dominantPatterns = sortedPatterns
    .filter(
      ([, score], index) =>
        index === 0 || (index === 1 && score >= topScore * 0.75)
    )
    .slice(0, 2)
    .map(([tag]) => tag);
  const dominantPatternSet = new Set(dominantPatterns);
  const secondaryPatterns = sortedPatterns
    .filter(([tag]) => !dominantPatternSet.has(tag))
    .slice(0, 2)
    .map(([tag]) => tag);
  const contentArchetypeLabel = buildContentArchetypeLabel(
    dominantPatterns,
    secondaryPatterns
  );
  const dominantLabels = dominantPatterns.map((tag) => getContentPatternLabel(tag));
  const secondaryLabels = secondaryPatterns.map((tag) => getContentPatternLabel(tag));
  let archetypeSummary = `Похоже, у аккаунта лучше всего повторяются ${joinHumanList(
    dominantLabels
  )}.`;

  if (secondaryLabels.length > 0) {
    archetypeSummary += ` Вторым слоем дополнительно проявляются ${joinHumanList(
      secondaryLabels
    )}.`;
  }

  if (strongestReason) {
    archetypeSummary += ` Один из сильнейших твитов подсказывает: ${strongestReason}`;
  }

  let archetypeConfidenceNote: string | null = null;

  if (taggedReferenceCount <= 1) {
    archetypeConfidenceNote =
      "Архетип собран только по одному размеченному сильному твиту, поэтому confidence пока ограничен.";
  } else if (dominantPatterns.length === 1 && sortedPatterns.length === 1) {
    archetypeConfidenceNote =
      "Пока повторяется только один явный паттерн, поэтому архетип может быть уже, чем кажется.";
  } else if (confidenceNotes.size > 0) {
    archetypeConfidenceNote = [...confidenceNotes][0];
  }

  return {
    contentArchetypeLabel,
    dominantPatterns,
    secondaryPatterns,
    archetypeSummary,
    archetypeConfidenceNote
  };
}

function createTweetReference(
  tweet: ScoredUsableXAccountTweet,
  mode: "recent" | "bestPerforming"
): ComparedXAccountTweetReference {
  const contentPatternData =
    mode === "bestPerforming"
      ? inferTweetContentPatterns(tweet)
      : {
          contentPatternTags: [] as ComparedXAccountTweetReference["contentPatternTags"],
          likelyStrengthReason: null,
          tagConfidenceNotes: [] as string[]
        };

  return {
    tweetUrl: tweet.tweetUrl,
    publishedAt: tweet.publishedAt,
    tweetTextSnippet: buildTweetTextSnippet(tweet.tweetText),
    language: tweet.language,
    likeCount: tweet.likeCount,
    repostCount: tweet.repostCount,
    replyCount: tweet.replyCount,
    contentPatternTags: contentPatternData.contentPatternTags,
    likelyStrengthReason: contentPatternData.likelyStrengthReason,
    tagConfidenceNotes: contentPatternData.tagConfidenceNotes
  };
}

function buildRecentTweetReferences(
  usableTweets: ScoredUsableXAccountTweet[]
): ComparedXAccountTweetReference[] {
  return [...usableTweets]
    .sort((left, right) => {
      const timestampDifference =
        getRecentTweetPublishedTimestamp(right) - getRecentTweetPublishedTimestamp(left);

      if (timestampDifference !== 0) {
        return timestampDifference;
      }

      return left.sortIndex - right.sortIndex;
    })
    .slice(0, 2)
    .map((tweet) => createTweetReference(tweet, "recent"));
}

function buildRecentTweetReferencesNote(recentTweetReferencesCount: number) {
  if (recentTweetReferencesCount >= 2) {
    return null;
  }

  if (recentTweetReferencesCount === 1) {
    return "Для режима recent доступен только один подходящий usable tweet reference.";
  }

  return "Подходящие recent tweet references пока недоступны: usable sample для этого аккаунта слишком мал или неполон.";
}

function sortTweetsByBestPerforming(
  left: ScoredUsableXAccountTweet,
  right: ScoredUsableXAccountTweet
) {
  const engagementDifference =
    (getTweetEngagementProxy(right) ?? Number.NEGATIVE_INFINITY) -
    (getTweetEngagementProxy(left) ?? Number.NEGATIVE_INFINITY);

  if (engagementDifference !== 0) {
    return engagementDifference;
  }

  const likeDifference = getMetricNumber(right.likeCount) - getMetricNumber(left.likeCount);

  if (likeDifference !== 0) {
    return likeDifference;
  }

  const repostDifference =
    getMetricNumber(right.repostCount) - getMetricNumber(left.repostCount);

  if (repostDifference !== 0) {
    return repostDifference;
  }

  const replyDifference = getMetricNumber(right.replyCount) - getMetricNumber(left.replyCount);

  if (replyDifference !== 0) {
    return replyDifference;
  }

  const timestampDifference =
    getRecentTweetPublishedTimestamp(right) - getRecentTweetPublishedTimestamp(left);

  if (timestampDifference !== 0) {
    return timestampDifference;
  }

  return left.sortIndex - right.sortIndex;
}

function buildBestPerformingTweetReferenceData(
  usableTweets: ScoredUsableXAccountTweet[]
) {
  const metricRichTweets = usableTweets.filter(
    (tweet) => getTweetEngagementProxy(tweet) !== null
  );
  const selectedTweets = [...metricRichTweets]
    .sort(sortTweetsByBestPerforming)
    .slice(0, 2);

  if (selectedTweets.length >= 2) {
    return {
      count: selectedTweets.length,
      references: selectedTweets.map((tweet) =>
        createTweetReference(tweet, "bestPerforming")
      ),
      note: null
    };
  }

  const selectedTweetUrls = new Set(
    selectedTweets.map((tweet) => tweet.tweetUrl ?? `${tweet.tweetId ?? "unknown"}-${tweet.sortIndex}`)
  );
  const fallbackTweets = [...usableTweets]
    .sort((left, right) => {
      const timestampDifference =
        getRecentTweetPublishedTimestamp(right) - getRecentTweetPublishedTimestamp(left);

      if (timestampDifference !== 0) {
        return timestampDifference;
      }

      return left.sortIndex - right.sortIndex;
    })
    .filter(
      (tweet) =>
        !selectedTweetUrls.has(
          tweet.tweetUrl ?? `${tweet.tweetId ?? "unknown"}-${tweet.sortIndex}`
        )
    )
    .slice(0, Math.max(2 - selectedTweets.length, 0));

  const finalTweets = [...selectedTweets, ...fallbackTweets].slice(0, 2);

  if (finalTweets.length === 0) {
    return {
      count: 0,
      references: [] as ComparedXAccountTweetReference[],
      note:
        "Для режима best-performing пока не хватает usable tweet references с metric data."
    };
  }

  if (selectedTweets.length === 0) {
    return {
      count: finalTweets.length,
      references: finalTweets.map((tweet) =>
        createTweetReference(tweet, "bestPerforming")
      ),
      note:
        "Для режима best-performing метрик оказалось недостаточно, поэтому показаны ближайшие recent references."
    };
  }

  if (finalTweets.length < 2) {
    return {
      count: finalTweets.length,
      references: finalTweets.map((tweet) =>
        createTweetReference(tweet, "bestPerforming")
      ),
      note:
        "Для режима best-performing найден только один надёжный tweet reference."
    };
  }

  return {
    count: finalTweets.length,
    references: finalTweets.map((tweet) =>
      createTweetReference(tweet, "bestPerforming")
    ),
    note:
      "Режим best-performing частично дополнен recent references, потому что metric-rich tweets доступны не для всех usable posts."
  };
}

function getSortableMetricValue(
  account: ComparedXAccountResult,
  sortBy: XMultiAccountCompareSortBy
) {
  return account.accountScores[sortBy];
}

function buildSuccessfulSummary(
  account: ComparedXAccountResult
): SuccessfulXAccountComparisonSummary {
  return {
    request: account.request,
    profile: {
      handle: account.profile.handle,
      displayName: account.profile.displayName,
      profileUrl: account.profile.profileUrl
    },
    status: account.status === "error" ? "partial" : account.status,
    overallAccountScore: account.accountScores.overallAccountScore,
    engagementEfficiencyScore: account.accountScores.engagementEfficiencyScore,
    reachScore: account.accountScores.reachScore,
    consistencyScore: account.accountScores.consistencyScore,
    dataConfidenceScore: account.accountScores.dataConfidenceScore,
    usablePostCount: account.filtersApplied.usablePostCount
  };
}

function buildFailedSummary(
  account: ComparedXAccountResult
): FailedXAccountComparisonSummary {
  return {
    request: account.request,
    status: account.status === "ok" ? "partial" : account.status,
    aggregationSucceeded: account.aggregationSucceeded,
    scoringSucceeded: account.scoringSucceeded,
    error: account.error
  };
}

function buildTopSummary(
  accounts: ComparedXAccountResult[],
  metric: XMultiAccountCompareSortBy
): TopComparedAccountSummary | null {
  if (accounts.length === 0) {
    return null;
  }

  const [topAccount] = [...accounts].sort((left, right) => {
    const scoreDifference = right.accountScores[metric] - left.accountScores[metric];

    if (scoreDifference !== 0) {
      return scoreDifference;
    }

    return left.request.index - right.request.index;
  });

  return {
    handle: topAccount.profile.handle,
    displayName: topAccount.profile.displayName,
    profileUrl: topAccount.profile.profileUrl,
    metric,
    value: topAccount.accountScores[metric]
  };
}

function buildEmptyComparisonSummary(
  requestedAccounts: RequestedXCompareAccountInput[],
  sortBy: XMultiAccountCompareSortBy
): XMultiAccountComparisonSummary {
  return {
    totalRequestedAccounts: requestedAccounts.length,
    successfulAccounts: 0,
    failedAccounts: requestedAccounts.length,
    sortBy,
    topByOverall: null,
    topByEngagementEfficiency: null,
    topByReach: null,
    topByConsistency: null
  };
}

async function compareSingleAccount(
  request: RequestedXCompareAccountInput,
  options: XMultiAccountCompareOptions,
  logger: FastifyBaseLogger
): Promise<ComparedXAccountResult> {
  const startedAt = Date.now();

  try {
    const result = await runXAccountScoreDiagnostics(
      {
        handle: request.source === "handle" ? request.handle || undefined : undefined,
        targetUrl:
          request.source === "targetUrl" ? request.targetUrl || undefined : undefined,
        waitStrategy: options.waitStrategy,
        limit: options.limit,
        includeUncertain: options.includeUncertain,
        treatQuoteAsUsable: options.treatQuoteAsUsable
      },
      logger
    );
    const recentTweetReferences = buildRecentTweetReferences(result.usableTweets);
    const bestPerformingTweetReferences = buildBestPerformingTweetReferenceData(
      result.usableTweets
    );
    const contentArchetype = inferAccountContentArchetype(
      bestPerformingTweetReferences.references
    );

    return {
      request,
      status: result.status,
      aggregationSucceeded: result.aggregationSucceeded,
      scoringSucceeded: result.scoringSucceeded,
      profile: result.profile,
      filtersApplied: result.filtersApplied,
      accountSignals: result.accountSignals,
      accountScores: result.accountScores,
      recentTweetReferencesCount: recentTweetReferences.length,
      recentTweetReferences,
      recentTweetReferencesNote: buildRecentTweetReferencesNote(
        recentTweetReferences.length
      ),
      bestPerformingTweetReferencesCount: bestPerformingTweetReferences.count,
      bestPerformingTweetReferences: bestPerformingTweetReferences.references,
      bestPerformingTweetReferencesNote: bestPerformingTweetReferences.note,
      contentArchetypeLabel: contentArchetype.contentArchetypeLabel,
      dominantPatterns: contentArchetype.dominantPatterns,
      secondaryPatterns: contentArchetype.secondaryPatterns,
      archetypeSummary: contentArchetype.archetypeSummary,
      archetypeConfidenceNote: contentArchetype.archetypeConfidenceNote,
      error: result.error,
      notes: result.notes,
      totalMs: result.timings.totalMs
    };
  } catch (error) {
    return {
      request,
      status: "error",
      aggregationSucceeded: false,
      scoringSucceeded: false,
      profile: createEmptyProfile(),
      filtersApplied: createEmptyFiltersApplied(),
      accountSignals: createEmptySignals(),
      accountScores: createEmptyScores(),
      recentTweetReferencesCount: 0,
      recentTweetReferences: [],
      recentTweetReferencesNote:
        "Подходящие recent tweet references не удалось собрать из-за ошибки account scoring.",
      bestPerformingTweetReferencesCount: 0,
      bestPerformingTweetReferences: [],
      bestPerformingTweetReferencesNote:
        "Подходящие best-performing references не удалось собрать из-за ошибки account scoring.",
      contentArchetypeLabel: null,
      dominantPatterns: [],
      secondaryPatterns: [],
      archetypeSummary: null,
      archetypeConfidenceNote: null,
      error: serializeError(error),
      notes: [
        `Comparison для ${request.label} завершился исключением до возврата scoring result.`
      ],
      totalMs: Date.now() - startedAt
    };
  }
}

export async function runXMultiAccountCompareDiagnostics(
  options: XMultiAccountCompareOptions,
  logger: FastifyBaseLogger
): Promise<XMultiAccountCompareDiagnostics> {
  const startedAt = Date.now();
  const notes = getXMultiAccountCompareNotesSeed();
  let requestedAccounts: RequestedXCompareAccountInput[] = [];
  const comparedAccounts: ComparedXAccountResult[] = [];
  let accountScoringMs = 0;
  let sortingMs = 0;
  const perAccountMs: XMultiAccountCompareTimings["perAccountMs"] = [];

  try {
    const resolvedSortBy = resolveXMultiAccountCompareSortBy(options.sortBy);
    const requestedAccountsResolution = resolveXMultiAccountRequestedAccounts({
      handles: options.handles,
      handle: options.handle,
      targetUrls: options.targetUrls,
      targetUrl: options.targetUrl
    });
    requestedAccounts = requestedAccountsResolution.requestedAccounts;

    if (requestedAccountsResolution.duplicateCount > 0) {
      notes.push(
        `Удалены дублирующиеся account inputs: ${requestedAccountsResolution.duplicateCount}.`
      );
    }

    if (requestedAccountsResolution.truncatedCount > 0) {
      notes.push(
        `Список comparison inputs ограничен первыми ${requestedAccounts.length} аккаунтами; отброшено: ${requestedAccountsResolution.truncatedCount}.`
      );
    }

    logger.info(
      {
        requestedAccounts: requestedAccounts.map((account) => account.label),
        sortBy: resolvedSortBy,
        limit: options.limit
      },
      "Starting X multi-account comparison."
    );

    for (const requestedAccount of requestedAccounts) {
      const comparisonResult = await compareSingleAccount(requestedAccount, options, logger);
      comparedAccounts.push(comparisonResult);
      accountScoringMs += comparisonResult.totalMs;
      perAccountMs.push({
        label: requestedAccount.label,
        totalMs: comparisonResult.totalMs
      });
      notes.push(...prefixNotes(`account ${requestedAccount.label}`, comparisonResult.notes));
    }

    const sortingStartedAt = Date.now();
    const successfulAccounts = comparedAccounts
      .filter((account) => account.scoringSucceeded)
      .sort((left, right) => {
        const scoreDifference =
          getSortableMetricValue(right, resolvedSortBy) -
          getSortableMetricValue(left, resolvedSortBy);

        if (scoreDifference !== 0) {
          return scoreDifference;
        }

        return left.request.index - right.request.index;
      });
    const failedAccounts = comparedAccounts
      .filter((account) => !account.scoringSucceeded)
      .sort((left, right) => left.request.index - right.request.index);
    const sortedComparedAccounts = [...successfulAccounts, ...failedAccounts];
    sortingMs = Date.now() - sortingStartedAt;

    if (failedAccounts.length > 0) {
      notes.push(
        `Не все аккаунты удалось сравнить успешно: failed accounts = ${failedAccounts.length}.`
      );
    }

    notes.push(`Сортировка comparison results применена по полю \`${resolvedSortBy}\`.`);

    const comparisonSucceeded = successfulAccounts.length > 0;
    const comparisonSummary: XMultiAccountComparisonSummary = {
      totalRequestedAccounts: requestedAccounts.length,
      successfulAccounts: successfulAccounts.length,
      failedAccounts: failedAccounts.length,
      sortBy: resolvedSortBy,
      topByOverall: buildTopSummary(successfulAccounts, "overallAccountScore"),
      topByEngagementEfficiency: buildTopSummary(
        successfulAccounts,
        "engagementEfficiencyScore"
      ),
      topByReach: buildTopSummary(successfulAccounts, "reachScore"),
      topByConsistency: buildTopSummary(successfulAccounts, "consistencyScore")
    };

    const status =
      comparisonSucceeded && failedAccounts.length === 0
        ? "ok"
        : comparisonSucceeded
          ? "partial"
          : "error";

    logger.info(
      {
        requestedAccounts: requestedAccounts.length,
        successfulAccounts: successfulAccounts.length,
        failedAccounts: failedAccounts.length,
        sortBy: resolvedSortBy
      },
      "Finished X multi-account comparison."
    );

    return {
      status,
      comparisonSucceeded,
      requestedAccounts,
      successfulComparisons: successfulAccounts.map(buildSuccessfulSummary),
      failedComparisons: failedAccounts.map(buildFailedSummary),
      comparedAccounts: sortedComparedAccounts,
      comparisonSummary,
      timings: {
        accountScoringMs,
        sortingMs,
        perAccountMs,
        totalMs: Date.now() - startedAt
      },
      error:
        status === "ok"
          ? null
          : {
              name:
                status === "partial"
                  ? "XMultiAccountComparePartialResult"
                  : "XMultiAccountCompareError",
              message:
                status === "partial"
                  ? "Multi-account comparison завершён частично: часть аккаунтов не удалось скорить полностью."
                  : "Не удалось собрать даже частичный multi-account comparison result."
            },
      notes: dedupeNotes(notes)
    };
  } catch (error) {
    logger.error({ err: serializeError(error) }, "X multi-account comparison failed.");
    notes.push("Comparison завершился с ошибкой до полного завершения multi-account scoring orchestration.");
    const resolvedSortBy = resolveXMultiAccountCompareSortBy(options.sortBy);
    const successfulAccounts = comparedAccounts
      .filter((account) => account.scoringSucceeded)
      .sort((left, right) => {
        const scoreDifference =
          getSortableMetricValue(right, resolvedSortBy) -
          getSortableMetricValue(left, resolvedSortBy);

        if (scoreDifference !== 0) {
          return scoreDifference;
        }

        return left.request.index - right.request.index;
      });
    const failedAccounts = comparedAccounts
      .filter((account) => !account.scoringSucceeded)
      .sort((left, right) => left.request.index - right.request.index);

    return {
      status: "error",
      comparisonSucceeded: successfulAccounts.length > 0,
      requestedAccounts,
      successfulComparisons: successfulAccounts.map(buildSuccessfulSummary),
      failedComparisons: failedAccounts.map(buildFailedSummary),
      comparedAccounts: [...successfulAccounts, ...failedAccounts],
      comparisonSummary:
        comparedAccounts.length === 0
          ? buildEmptyComparisonSummary(requestedAccounts, resolvedSortBy)
          : {
              totalRequestedAccounts: requestedAccounts.length,
              successfulAccounts: successfulAccounts.length,
              failedAccounts: failedAccounts.length,
              sortBy: resolvedSortBy,
              topByOverall: buildTopSummary(successfulAccounts, "overallAccountScore"),
              topByEngagementEfficiency: buildTopSummary(
                successfulAccounts,
                "engagementEfficiencyScore"
              ),
              topByReach: buildTopSummary(successfulAccounts, "reachScore"),
              topByConsistency: buildTopSummary(successfulAccounts, "consistencyScore")
            },
      timings: {
        accountScoringMs,
        sortingMs,
        perAccountMs,
        totalMs: Date.now() - startedAt
      },
      error: serializeError(error),
      notes: dedupeNotes(notes)
    };
  }
}

// TODO: Add bounded batching or concurrency only after sequential multi-account compare is stable.
// TODO: Add automatic account discovery by topic only after manual comparison contracts are stable.
// TODO: Add niche-level aggregation only after multi-account scoring signals are validated.
// TODO: Improve reply/repost classification before using comparison outputs for ranking workflows.
