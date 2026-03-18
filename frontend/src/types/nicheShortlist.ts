export type NicheShortlistSortBy =
  | "overallTopicScore"
  | "growthPotential"
  | "monetizationPotential"
  | "contentEase"
  | "dataConfidence";

export interface NicheShortlistBucketInput {
  bucketId: string;
  label: string;
  description?: string;
  handles?: string[];
  targetUrls?: string[];
}

export interface NicheShortlistHandleDraft {
  handleId: string;
  value: string;
}

export interface NicheShortlistBucketDraft {
  editorId: string;
  bucketId: string;
  label: string;
  description: string;
  handles: NicheShortlistHandleDraft[];
}

export interface NicheShortlistBucketDraftValidation {
  label?: string;
  handles?: string;
}

export interface NicheShortlistFormState {
  buckets: NicheShortlistBucketDraft[];
  limit: string;
  topN: string;
  includeUncertain: boolean;
  treatQuoteAsUsable: boolean;
  sortBy: NicheShortlistSortBy;
  emphasizeGrowth: boolean;
  emphasizeMonetization: boolean;
  emphasizeEase: boolean;
}

export interface NicheShortlistFormSnapshot {
  buckets: Array<{
    bucketId: string;
    label: string;
    description: string;
    handles: string[];
  }>;
  limit: string;
  topN: string;
  includeUncertain: boolean;
  treatQuoteAsUsable: boolean;
  sortBy: NicheShortlistSortBy;
  emphasizeGrowth: boolean;
  emphasizeMonetization: boolean;
  emphasizeEase: boolean;
}

export interface NicheShortlistScenario {
  scenarioId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  formSnapshot: NicheShortlistFormSnapshot;
  lastRunAt?: string;
  lastRequestSnapshot?: NicheShortlistScenarioRequestSnapshot;
  lastResultSummary?: NicheShortlistScenarioResultSummary;
  lastRankedBuckets?: NicheShortlistScenarioRankedBucketSummary[];
}

export interface NicheShortlistRequest {
  buckets: NicheShortlistBucketInput[];
  limit?: number;
  topN?: number;
  includeUncertain?: boolean;
  treatQuoteAsUsable?: boolean;
  sortBy?: NicheShortlistSortBy;
  emphasizeGrowth?: boolean;
  emphasizeMonetization?: boolean;
  emphasizeEase?: boolean;
}

export interface NicheShortlistRequestedBucket {
  index: number;
  bucketId: string;
  label: string;
  description: string | null;
  handles: string[];
  targetUrls: string[];
  requestedAccountCount: number;
}

export interface NicheShortlistStrongestAccount {
  handle: string | null;
  displayName: string | null;
  profileUrl: string | null;
  metric: "overallAccountScore" | "engagementEfficiencyScore";
  value: number;
  usablePostCount: number;
  reason: string;
}

export interface NicheShortlistSupportingAccount {
  handle: string | null;
  displayName: string | null;
  profileUrl: string | null;
  relevanceNote: string;
  overallAccountScore: number;
  engagementEfficiencyScore: number;
  reachScore: number;
  consistencyScore: number;
  reason: string;
  recentTweetReferencesCount: number;
  recentTweetReferences: NicheShortlistSupportingTweetReference[];
  recentTweetReferencesNote: string | null;
}

export interface NicheShortlistSupportingTweetReference {
  tweetUrl: string | null;
  publishedAt: string | null;
  tweetTextSnippet: string | null;
  language: string | null;
  likeCount: {
    rawText: string | null;
    normalizedNumber: number | null;
    available: boolean;
  };
  repostCount: {
    rawText: string | null;
    normalizedNumber: number | null;
    available: boolean;
  };
  replyCount: {
    rawText: string | null;
    normalizedNumber: number | null;
    available: boolean;
  };
}

export interface NicheShortlistDecisionLabels {
  bestOverall: boolean;
  bestForGrowth: boolean;
  bestForMonetization: boolean;
  easiestToStart: boolean;
  bestBalancedOption: boolean;
}

export interface NicheShortlistBucketAggregates {
  requestedAccountCount: number;
  successfulAccountCount: number;
  failedAccountCount: number;
  usableAccountCount: number;
  avgOverallAccountScore: number | null;
  avgEngagementEfficiencyScore: number | null;
  avgConsistencyScore: number | null;
  avgReachScore: number | null;
  avgDataConfidenceScore: number | null;
  avgEngagementPerFollowerProxy: number | null;
  medianOverallAccountScore: number | null;
  medianEngagementEfficiencyScore: number | null;
}

export interface NicheShortlistTopicSignals {
  averageAccountQuality: number | null;
  averageEngagementEfficiency: number | null;
  averageReach: number | null;
  averageConsistency: number | null;
  averageDataConfidence: number | null;
  averageEngagementPerFollowerProxy: number | null;
  accountCoverageRatio: number;
  usableAccountDensity: number;
  accountCoverageSignal: number;
  usableAccountDensitySignal: number;
}

export interface NicheShortlistTopicScores {
  growthPotential: number;
  monetizationPotential: number;
  contentEase: number;
  dataConfidence: number;
  overallTopicScore: number;
}

export interface NicheShortlistScoreBreakdown {
  score: number;
  formula: string;
  components: Array<{
    key: string;
    label: string;
    value: number;
    weight: number;
  }>;
  notes: string[];
}

export interface NicheShortlistRankingBreakdown {
  sortBy: NicheShortlistSortBy;
  formula: string;
  rankingScore: number;
  components: Array<{
    key: string;
    label: string;
    value: number;
    weight: number;
  }>;
  emphasisFlags: {
    emphasizeGrowth: boolean;
    emphasizeMonetization: boolean;
    emphasizeEase: boolean;
  };
}

export interface RankedNicheShortlistBucket {
  bucketId: string;
  label: string;
  description: string | null;
  status: "ok" | "partial" | "error";
  shortlistIncluded: boolean;
  rank: number | null;
  rankingReason: string;
  pros: string[];
  cons: string[];
  recommendedUseCase: string;
  strongestAccounts: NicheShortlistStrongestAccount[];
  supportingAccountsCount: number;
  topSupportingAccounts: NicheShortlistSupportingAccount[];
  decisionLabels: NicheShortlistDecisionLabels;
  bucketAggregates: NicheShortlistBucketAggregates;
  topicSignals: NicheShortlistTopicSignals;
  topicScores: NicheShortlistTopicScores;
  scoreBreakdown: Record<string, NicheShortlistScoreBreakdown>;
  rankingBreakdown: NicheShortlistRankingBreakdown | null;
  error: {
    name: string;
    message: string;
  } | null;
}

export interface NicheShortlistSummaryEntry {
  bucketId: string;
  label: string;
  score: number;
}

export interface NicheShortlistScenarioRequestBucketSummary {
  bucketId: string;
  label: string;
  handleCount: number;
}

export interface NicheShortlistScenarioRequestSnapshot {
  limit?: number;
  topN?: number;
  includeUncertain: boolean;
  treatQuoteAsUsable: boolean;
  sortBy: NicheShortlistSortBy;
  emphasizeGrowth: boolean;
  emphasizeMonetization: boolean;
  emphasizeEase: boolean;
  bucketCount: number;
  buckets: NicheShortlistScenarioRequestBucketSummary[];
}

export interface NicheShortlistScenarioResultSummary {
  status: "ok" | "partial" | "error";
  totalRequestedBuckets: number;
  successfullyRankedBuckets: number;
  shortlistSize: number;
  rankingSortBy: NicheShortlistSortBy;
  bestOverall: NicheShortlistSummaryEntry | null;
  bestForGrowth: NicheShortlistSummaryEntry | null;
  bestForMonetization: NicheShortlistSummaryEntry | null;
  easiestToStart: NicheShortlistSummaryEntry | null;
  bestBalanced: NicheShortlistSummaryEntry | null;
  totalMs: number;
}

export interface NicheShortlistScenarioRankedBucketSummary {
  bucketId: string;
  label: string;
  rank: number | null;
  shortlistIncluded: boolean;
  status: "ok" | "partial" | "error";
  overallTopicScore: number;
  growthPotential: number;
  monetizationPotential: number;
  contentEase: number;
  dataConfidence: number;
}

export interface NicheShortlistSummary {
  totalRequestedBuckets: number;
  successfullyRankedBuckets: number;
  shortlistSize: number;
  rankingSortBy: NicheShortlistSortBy;
  topN: number;
  emphasisFlags: {
    emphasizeGrowth: boolean;
    emphasizeMonetization: boolean;
    emphasizeEase: boolean;
  };
  bestOverall: NicheShortlistSummaryEntry | null;
  bestForGrowth: NicheShortlistSummaryEntry | null;
  bestForMonetization: NicheShortlistSummaryEntry | null;
  easiestToStart: NicheShortlistSummaryEntry | null;
  bestBalanced: NicheShortlistSummaryEntry | null;
}

export interface NicheShortlistResponse {
  message: string;
  status: "ok" | "partial" | "error";
  shortlistSucceeded: boolean;
  requestedBuckets: NicheShortlistRequestedBucket[];
  rankedBuckets: RankedNicheShortlistBucket[];
  shortlistSummary: NicheShortlistSummary;
  timings: {
    topicScoringMs: number;
    rankingMs: number;
    summaryMs: number;
    totalMs: number;
  };
  error: {
    name: string;
    message: string;
  } | null;
  notes: string[];
}
