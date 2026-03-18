import type {
  NicheShortlistFormSnapshot,
  NicheShortlistFormState,
  NicheShortlistRequest,
  NicheShortlistResponse,
  NicheShortlistScenario,
  NicheShortlistScenarioRankedBucketSummary,
  NicheShortlistScenarioRequestSnapshot,
  NicheShortlistScenarioResultSummary,
  NicheShortlistSummaryEntry,
  NicheShortlistSortBy
} from "../types/nicheShortlist.js";
import {
  buildBucketDraftsFromInputs,
  createEmptyBucketDraft
} from "./nicheShortlistBucketEditor.js";

const STORAGE_KEY = "twitter-niche-analyzer:niche-shortlist-scenarios";
const STORAGE_VERSION = 1;

interface ScenarioStorageEnvelope {
  version: number;
  activeScenarioId: string;
  scenarios: NicheShortlistScenario[];
}

export interface ScenarioBootstrapState {
  scenarios: NicheShortlistScenario[];
  activeScenarioId: string;
  formState: NicheShortlistFormState;
  storageNotice: string | null;
}

const validSortValues: NicheShortlistSortBy[] = [
  "overallTopicScore",
  "growthPotential",
  "monetizationPotential",
  "contentEase",
  "dataConfidence"
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidSortValue(value: unknown): value is NicheShortlistSortBy {
  return typeof value === "string" && validSortValues.includes(value as NicheShortlistSortBy);
}

function parseSummaryEntry(value: unknown): NicheShortlistSummaryEntry | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.bucketId !== "string" ||
    typeof value.label !== "string" ||
    typeof value.score !== "number"
  ) {
    return null;
  }

  return {
    bucketId: value.bucketId,
    label: value.label,
    score: value.score
  };
}

function parseRequestSnapshot(value: unknown): NicheShortlistScenarioRequestSnapshot | null {
  if (!isRecord(value) || !isValidSortValue(value.sortBy) || !Array.isArray(value.buckets)) {
    return null;
  }

  const buckets = value.buckets
    .filter((bucket) => isRecord(bucket))
    .map((bucket) => ({
      bucketId: typeof bucket.bucketId === "string" ? bucket.bucketId : "",
      label: typeof bucket.label === "string" ? bucket.label : "",
      handleCount: typeof bucket.handleCount === "number" ? bucket.handleCount : 0
    }));

  return {
    limit: typeof value.limit === "number" ? value.limit : undefined,
    topN: typeof value.topN === "number" ? value.topN : undefined,
    includeUncertain: Boolean(value.includeUncertain),
    treatQuoteAsUsable: Boolean(value.treatQuoteAsUsable),
    sortBy: value.sortBy,
    emphasizeGrowth: Boolean(value.emphasizeGrowth),
    emphasizeMonetization: Boolean(value.emphasizeMonetization),
    emphasizeEase: Boolean(value.emphasizeEase),
    bucketCount: typeof value.bucketCount === "number" ? value.bucketCount : buckets.length,
    buckets
  };
}

function parseResultSummary(value: unknown): NicheShortlistScenarioResultSummary | null {
  if (
    !isRecord(value) ||
    typeof value.status !== "string" ||
    !["ok", "partial", "error"].includes(value.status) ||
    !isValidSortValue(value.rankingSortBy)
  ) {
    return null;
  }

  return {
    status: value.status as "ok" | "partial" | "error",
    totalRequestedBuckets:
      typeof value.totalRequestedBuckets === "number" ? value.totalRequestedBuckets : 0,
    successfullyRankedBuckets:
      typeof value.successfullyRankedBuckets === "number" ? value.successfullyRankedBuckets : 0,
    shortlistSize: typeof value.shortlistSize === "number" ? value.shortlistSize : 0,
    rankingSortBy: value.rankingSortBy,
    bestOverall: parseSummaryEntry(value.bestOverall),
    bestForGrowth: parseSummaryEntry(value.bestForGrowth),
    bestForMonetization: parseSummaryEntry(value.bestForMonetization),
    easiestToStart: parseSummaryEntry(value.easiestToStart),
    bestBalanced: parseSummaryEntry(value.bestBalanced),
    totalMs: typeof value.totalMs === "number" ? value.totalMs : 0
  };
}

function parseRankedBucketSummary(value: unknown): NicheShortlistScenarioRankedBucketSummary | null {
  if (
    !isRecord(value) ||
    typeof value.bucketId !== "string" ||
    typeof value.label !== "string" ||
    typeof value.shortlistIncluded !== "boolean" ||
    typeof value.status !== "string" ||
    !["ok", "partial", "error"].includes(value.status) ||
    typeof value.overallTopicScore !== "number" ||
    typeof value.growthPotential !== "number" ||
    typeof value.monetizationPotential !== "number" ||
    typeof value.contentEase !== "number" ||
    typeof value.dataConfidence !== "number"
  ) {
    return null;
  }

  return {
    bucketId: value.bucketId,
    label: value.label,
    rank: typeof value.rank === "number" ? value.rank : null,
    shortlistIncluded: value.shortlistIncluded,
    status: value.status as "ok" | "partial" | "error",
    overallTopicScore: value.overallTopicScore,
    growthPotential: value.growthPotential,
    monetizationPotential: value.monetizationPotential,
    contentEase: value.contentEase,
    dataConfidence: value.dataConfidence
  };
}

function createScenarioId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `scenario-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sanitizeScenarioName(value: string, fallback: string) {
  return value.trim() || fallback;
}

function cloneSnapshot(snapshot: NicheShortlistFormSnapshot): NicheShortlistFormSnapshot {
  return {
    buckets: snapshot.buckets.map((bucket) => ({
      bucketId: bucket.bucketId,
      label: bucket.label,
      description: bucket.description,
      handles: [...bucket.handles]
    })),
    limit: snapshot.limit,
    topN: snapshot.topN,
    includeUncertain: snapshot.includeUncertain,
    treatQuoteAsUsable: snapshot.treatQuoteAsUsable,
    sortBy: snapshot.sortBy,
    emphasizeGrowth: snapshot.emphasizeGrowth,
    emphasizeMonetization: snapshot.emphasizeMonetization,
    emphasizeEase: snapshot.emphasizeEase
  };
}

export function buildDefaultShortlistFormState(): NicheShortlistFormState {
  return {
    buckets: [createEmptyBucketDraft()],
    limit: "1",
    topN: "2",
    includeUncertain: false,
    treatQuoteAsUsable: false,
    sortBy: "overallTopicScore",
    emphasizeGrowth: false,
    emphasizeMonetization: false,
    emphasizeEase: false
  };
}

export function createFormSnapshotFromState(
  formState: NicheShortlistFormState
): NicheShortlistFormSnapshot {
  return {
    buckets: formState.buckets.map((bucket) => ({
      bucketId: bucket.bucketId,
      label: bucket.label,
      description: bucket.description,
      handles: bucket.handles.map((handle) => handle.value)
    })),
    limit: formState.limit,
    topN: formState.topN,
    includeUncertain: formState.includeUncertain,
    treatQuoteAsUsable: formState.treatQuoteAsUsable,
    sortBy: formState.sortBy,
    emphasizeGrowth: formState.emphasizeGrowth,
    emphasizeMonetization: formState.emphasizeMonetization,
    emphasizeEase: formState.emphasizeEase
  };
}

export function restoreFormStateFromSnapshot(
  snapshot: NicheShortlistFormSnapshot
): NicheShortlistFormState {
  const buckets = snapshot.buckets
    .filter((bucket) => isRecord(bucket))
    .map((bucket) => ({
      bucketId: typeof bucket.bucketId === "string" ? bucket.bucketId : "",
      label: typeof bucket.label === "string" ? bucket.label : "",
      description: typeof bucket.description === "string" ? bucket.description : "",
      handles: Array.isArray(bucket.handles)
        ? bucket.handles.filter((handle) => typeof handle === "string")
        : []
    }));

  return {
    buckets: buildBucketDraftsFromInputs(buckets),
    limit: typeof snapshot.limit === "string" ? snapshot.limit : "1",
    topN: typeof snapshot.topN === "string" ? snapshot.topN : "2",
    includeUncertain: Boolean(snapshot.includeUncertain),
    treatQuoteAsUsable: Boolean(snapshot.treatQuoteAsUsable),
    sortBy: isValidSortValue(snapshot.sortBy) ? snapshot.sortBy : "overallTopicScore",
    emphasizeGrowth: Boolean(snapshot.emphasizeGrowth),
    emphasizeMonetization: Boolean(snapshot.emphasizeMonetization),
    emphasizeEase: Boolean(snapshot.emphasizeEase)
  };
}

function parseScenarioSnapshot(value: unknown): NicheShortlistFormSnapshot | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    buckets: Array.isArray(value.buckets)
      ? value.buckets
          .filter((bucket) => isRecord(bucket))
          .map((bucket) => ({
            bucketId: typeof bucket.bucketId === "string" ? bucket.bucketId : "",
            label: typeof bucket.label === "string" ? bucket.label : "",
            description: typeof bucket.description === "string" ? bucket.description : "",
            handles: Array.isArray(bucket.handles)
              ? bucket.handles.filter((handle) => typeof handle === "string")
              : []
          }))
      : [],
    limit: typeof value.limit === "string" ? value.limit : "1",
    topN: typeof value.topN === "string" ? value.topN : "2",
    includeUncertain: Boolean(value.includeUncertain),
    treatQuoteAsUsable: Boolean(value.treatQuoteAsUsable),
    sortBy: isValidSortValue(value.sortBy) ? value.sortBy : "overallTopicScore",
    emphasizeGrowth: Boolean(value.emphasizeGrowth),
    emphasizeMonetization: Boolean(value.emphasizeMonetization),
    emphasizeEase: Boolean(value.emphasizeEase)
  };
}

function parseScenario(value: unknown): NicheShortlistScenario | null {
  if (!isRecord(value)) {
    return null;
  }

  const formSnapshot = parseScenarioSnapshot(value.formSnapshot);

  if (
    typeof value.scenarioId !== "string" ||
    typeof value.name !== "string" ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string" ||
    !formSnapshot
  ) {
    return null;
  }

  return {
    scenarioId: value.scenarioId,
    name: value.name,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    formSnapshot,
    lastRunAt: typeof value.lastRunAt === "string" ? value.lastRunAt : undefined,
    lastRequestSnapshot: parseRequestSnapshot(value.lastRequestSnapshot) ?? undefined,
    lastResultSummary: parseResultSummary(value.lastResultSummary) ?? undefined,
    lastRankedBuckets: Array.isArray(value.lastRankedBuckets)
      ? value.lastRankedBuckets
          .map(parseRankedBucketSummary)
          .filter((bucket): bucket is NicheShortlistScenarioRankedBucketSummary => Boolean(bucket))
      : undefined
  };
}

export function buildNextScenarioName(scenarios: NicheShortlistScenario[]) {
  return `Сценарий ${scenarios.length + 1}`;
}

export function createScenarioFromFormState(
  formState: NicheShortlistFormState,
  name: string
): NicheShortlistScenario {
  const now = new Date().toISOString();

  return {
    scenarioId: createScenarioId(),
    name: sanitizeScenarioName(name, "Новый сценарий"),
    createdAt: now,
    updatedAt: now,
    formSnapshot: createFormSnapshotFromState(formState)
  };
}

export function updateScenarioFromFormState(
  scenario: NicheShortlistScenario,
  formState: NicheShortlistFormState
): NicheShortlistScenario {
  return {
    ...scenario,
    updatedAt: new Date().toISOString(),
    formSnapshot: createFormSnapshotFromState(formState)
  };
}

export function buildScenarioRequestSnapshot(
  request: NicheShortlistRequest
): NicheShortlistScenarioRequestSnapshot {
  return {
    limit: request.limit,
    topN: request.topN,
    includeUncertain: Boolean(request.includeUncertain),
    treatQuoteAsUsable: Boolean(request.treatQuoteAsUsable),
    sortBy: request.sortBy ?? "overallTopicScore",
    emphasizeGrowth: Boolean(request.emphasizeGrowth),
    emphasizeMonetization: Boolean(request.emphasizeMonetization),
    emphasizeEase: Boolean(request.emphasizeEase),
    bucketCount: request.buckets.length,
    buckets: request.buckets.map((bucket) => ({
      bucketId: bucket.bucketId,
      label: bucket.label,
      handleCount: bucket.handles?.length ?? 0
    }))
  };
}

export function buildScenarioResultSummary(
  response: NicheShortlistResponse
): NicheShortlistScenarioResultSummary {
  return {
    status: response.status,
    totalRequestedBuckets: response.shortlistSummary.totalRequestedBuckets,
    successfullyRankedBuckets: response.shortlistSummary.successfullyRankedBuckets,
    shortlistSize: response.shortlistSummary.shortlistSize,
    rankingSortBy: response.shortlistSummary.rankingSortBy,
    bestOverall: response.shortlistSummary.bestOverall,
    bestForGrowth: response.shortlistSummary.bestForGrowth,
    bestForMonetization: response.shortlistSummary.bestForMonetization,
    easiestToStart: response.shortlistSummary.easiestToStart,
    bestBalanced: response.shortlistSummary.bestBalanced,
    totalMs: response.timings.totalMs
  };
}

export function buildScenarioRankedBuckets(
  response: NicheShortlistResponse
): NicheShortlistScenarioRankedBucketSummary[] {
  return response.rankedBuckets.slice(0, 5).map((bucket) => ({
    bucketId: bucket.bucketId,
    label: bucket.label,
    rank: bucket.rank,
    shortlistIncluded: bucket.shortlistIncluded,
    status: bucket.status,
    overallTopicScore: bucket.topicScores.overallTopicScore,
    growthPotential: bucket.topicScores.growthPotential,
    monetizationPotential: bucket.topicScores.monetizationPotential,
    contentEase: bucket.topicScores.contentEase,
    dataConfidence: bucket.topicScores.dataConfidence
  }));
}

export function pinScenarioResult(
  scenario: NicheShortlistScenario,
  formState: NicheShortlistFormState,
  request: NicheShortlistRequest,
  response: NicheShortlistResponse
): NicheShortlistScenario {
  const now = new Date().toISOString();

  return {
    ...scenario,
    updatedAt: now,
    lastRunAt: now,
    formSnapshot: createFormSnapshotFromState(formState),
    lastRequestSnapshot: buildScenarioRequestSnapshot(request),
    lastResultSummary: buildScenarioResultSummary(response),
    lastRankedBuckets: buildScenarioRankedBuckets(response)
  };
}

export function renameScenario(
  scenario: NicheShortlistScenario,
  name: string
): NicheShortlistScenario {
  return {
    ...scenario,
    name: sanitizeScenarioName(name, scenario.name),
    updatedAt: new Date().toISOString()
  };
}

export function duplicateScenario(
  scenario: NicheShortlistScenario,
  name?: string
): NicheShortlistScenario {
  const now = new Date().toISOString();

  return {
    scenarioId: createScenarioId(),
    name: sanitizeScenarioName(name ?? `${scenario.name} копия`, `${scenario.name} копия`),
    createdAt: now,
    updatedAt: now,
    formSnapshot: cloneSnapshot(scenario.formSnapshot)
  };
}

export function areFormStateAndScenarioEqual(
  formState: NicheShortlistFormState,
  scenario: NicheShortlistScenario | null
) {
  if (!scenario) {
    return false;
  }

  return JSON.stringify(createFormSnapshotFromState(formState)) === JSON.stringify(scenario.formSnapshot);
}

function buildDefaultBootstrapState(
  formState?: NicheShortlistFormState,
  notice?: string | null
): ScenarioBootstrapState {
  const fallbackFormState = formState ?? buildDefaultShortlistFormState();
  const defaultScenario = createScenarioFromFormState(fallbackFormState, "Сценарий 1");

  return {
    scenarios: [defaultScenario],
    activeScenarioId: defaultScenario.scenarioId,
    formState: restoreFormStateFromSnapshot(defaultScenario.formSnapshot),
    storageNotice: notice ?? null
  };
}

export function loadScenarioBootstrapState(): ScenarioBootstrapState {
  if (typeof window === "undefined") {
    return buildDefaultBootstrapState();
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return buildDefaultBootstrapState();
  }

  try {
    const parsedValue = JSON.parse(rawValue) as unknown;

    if (!isRecord(parsedValue) || parsedValue.version !== STORAGE_VERSION) {
      return buildDefaultBootstrapState(
        undefined,
        "Не удалось прочитать локальные сценарии. Создан новый сценарий по умолчанию."
      );
    }

    const scenarios = Array.isArray(parsedValue.scenarios)
      ? parsedValue.scenarios.map(parseScenario).filter((scenario): scenario is NicheShortlistScenario => Boolean(scenario))
      : [];

    if (scenarios.length === 0) {
      return buildDefaultBootstrapState(
        undefined,
        "В локальном хранилище не оказалось валидных сценариев. Создан новый сценарий."
      );
    }

    const activeScenarioId =
      typeof parsedValue.activeScenarioId === "string" &&
      scenarios.some((scenario) => scenario.scenarioId === parsedValue.activeScenarioId)
        ? parsedValue.activeScenarioId
        : scenarios[0].scenarioId;
    const activeScenario =
      scenarios.find((scenario) => scenario.scenarioId === activeScenarioId) ?? scenarios[0];

    return {
      scenarios,
      activeScenarioId: activeScenario.scenarioId,
      formState: restoreFormStateFromSnapshot(activeScenario.formSnapshot),
      storageNotice: null
    };
  } catch {
    return buildDefaultBootstrapState(
      undefined,
      "Локальная история сценариев повреждена. Создан новый сценарий по умолчанию."
    );
  }
}

export function persistScenarioCollection(
  scenarios: NicheShortlistScenario[],
  activeScenarioId: string
) {
  if (typeof window === "undefined") {
    return;
  }

  const envelope: ScenarioStorageEnvelope = {
    version: STORAGE_VERSION,
    activeScenarioId,
    scenarios
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
}

export function formatScenarioTimestamp(value: string) {
  const parsedValue = Date.parse(value);

  if (!Number.isFinite(parsedValue)) {
    return "время неизвестно";
  }

  return new Date(parsedValue).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}
