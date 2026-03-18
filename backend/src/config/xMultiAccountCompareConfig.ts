import { xNavigationConfig } from "./xNavigationConfig.js";

export type XMultiAccountCompareSortBy =
  | "overallAccountScore"
  | "engagementEfficiencyScore"
  | "reachScore"
  | "consistencyScore";

export interface RequestedXCompareAccountInput {
  index: number;
  source: "handle" | "targetUrl";
  handle: string | null;
  targetUrl: string | null;
  label: string;
}

export class XMultiAccountCompareConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "XMultiAccountCompareConfigError";
  }
}

export const xMultiAccountCompareConfig = {
  defaultSortBy: "overallAccountScore" as XMultiAccountCompareSortBy,
  maxRequestedAccounts: 8
} as const;

function normalizeListInput(input?: string | string[]) {
  const rawValues = Array.isArray(input) ? input : input ? [input] : [];

  return rawValues
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

function buildHandleLabel(handle: string) {
  return handle.startsWith("@") ? handle : `@${handle}`;
}

export function resolveXMultiAccountCompareSortBy(
  input?: string
): XMultiAccountCompareSortBy {
  const candidate = input?.trim() as XMultiAccountCompareSortBy | undefined;

  if (
    candidate === "overallAccountScore" ||
    candidate === "engagementEfficiencyScore" ||
    candidate === "reachScore" ||
    candidate === "consistencyScore"
  ) {
    return candidate;
  }

  return xMultiAccountCompareConfig.defaultSortBy;
}

export function resolveXMultiAccountRequestedAccounts(input: {
  handles?: string | string[];
  handle?: string | string[];
  targetUrls?: string | string[];
  targetUrl?: string | string[];
}) {
  const handleInputs = [
    ...normalizeListInput(input.handles),
    ...normalizeListInput(input.handle)
  ];
  const targetUrlInputs = [
    ...normalizeListInput(input.targetUrls),
    ...normalizeListInput(input.targetUrl)
  ];
  const requestedAccounts: RequestedXCompareAccountInput[] = [];
  const seenEntries = new Set<string>();
  let duplicateCount = 0;

  for (const handle of handleInputs) {
    const dedupeKey = `handle:${handle.toLowerCase().replace(/^@+/, "")}`;

    if (seenEntries.has(dedupeKey)) {
      duplicateCount += 1;
      continue;
    }

    seenEntries.add(dedupeKey);
    requestedAccounts.push({
      index: requestedAccounts.length,
      source: "handle",
      handle,
      targetUrl: null,
      label: buildHandleLabel(handle.replace(/^@+/, ""))
    });
  }

  for (const targetUrl of targetUrlInputs) {
    const dedupeKey = `targetUrl:${targetUrl.toLowerCase()}`;

    if (seenEntries.has(dedupeKey)) {
      duplicateCount += 1;
      continue;
    }

    seenEntries.add(dedupeKey);
    requestedAccounts.push({
      index: requestedAccounts.length,
      source: "targetUrl",
      handle: null,
      targetUrl,
      label: targetUrl
    });
  }

  if (requestedAccounts.length === 0) {
    throw new XMultiAccountCompareConfigError(
      "Нужен хотя бы один публичный X-аккаунт через `handles` или `targetUrls`."
    );
  }

  const truncatedAccounts = requestedAccounts.slice(
    0,
    xMultiAccountCompareConfig.maxRequestedAccounts
  );

  return {
    requestedAccounts: truncatedAccounts.map((account, index) => ({
      ...account,
      index
    })),
    duplicateCount,
    truncatedCount: Math.max(
      requestedAccounts.length - xMultiAccountCompareConfig.maxRequestedAccounts,
      0
    )
  };
}

export function getXMultiAccountCompareNotesSeed() {
  return [
    "Сравнение ограничивается небольшим ручным списком публичных X-аккаунтов.",
    "Каждый аккаунт сравнивается через уже существующий single-account scoring layer.",
    "Partial failures не останавливают весь comparison run и возвращаются как failed comparison items.",
    xNavigationConfig.auth.sessionEnabled
      ? "Auth-сессия настроена, но текущий comparison route всё равно не выполняет login automation."
      : "Сравнение работает без авторизации и использует только публичные profile/tweet данные из текущих bootstrap и extraction слоёв."
  ];
}
