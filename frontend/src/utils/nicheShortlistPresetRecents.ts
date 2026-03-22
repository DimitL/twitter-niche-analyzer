const STORAGE_KEY = "twitter-niche-analyzer:niche-shortlist-preset-recents";
const STORAGE_VERSION = 1;
const MAX_RECENT_PRESETS = 6;

interface PresetRecentsStorageEnvelope {
  version: number;
  recentPresetIds: string[];
}

export interface PresetRecentsBootstrapState {
  recentPresetIds: string[];
  storageNotice: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function sanitizeRecentPresetIds(
  value: unknown,
  validPresetIds: string[]
) {
  const validPresetIdSet = new Set(validPresetIds);

  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value.filter(
        (item): item is string =>
          typeof item === "string" && validPresetIdSet.has(item)
      )
    )
  ).slice(0, MAX_RECENT_PRESETS);
}

export function loadPresetRecentsState(
  validPresetIds: string[]
): PresetRecentsBootstrapState {
  if (typeof window === "undefined") {
    return {
      recentPresetIds: [],
      storageNotice: null
    };
  }

  let notice: string | null = null;

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);

    if (!rawValue) {
      return {
        recentPresetIds: [],
        storageNotice: null
      };
    }

    const parsedValue = JSON.parse(rawValue) as unknown;

    if (!isRecord(parsedValue) || parsedValue.version !== STORAGE_VERSION) {
      notice =
        "История недавно использованных preset-ов была сброшена из-за несовместимого формата localStorage.";
      return {
        recentPresetIds: [],
        storageNotice: notice
      };
    }

    return {
      recentPresetIds: sanitizeRecentPresetIds(
        parsedValue.recentPresetIds,
        validPresetIds
      ),
      storageNotice: null
    };
  } catch {
    notice =
      "Не удалось прочитать историю недавно использованных preset-ов. Секция recent будет пересоздана заново.";

    return {
      recentPresetIds: [],
      storageNotice: notice
    };
  }
}

export function persistRecentPresetIds(recentPresetIds: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  const envelope: PresetRecentsStorageEnvelope = {
    version: STORAGE_VERSION,
    recentPresetIds: recentPresetIds.slice(0, MAX_RECENT_PRESETS)
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
}

export function markPresetAsRecentlyUsed(
  currentPresetIds: string[],
  presetId: string
) {
  return [presetId, ...currentPresetIds.filter((item) => item !== presetId)].slice(
    0,
    MAX_RECENT_PRESETS
  );
}
