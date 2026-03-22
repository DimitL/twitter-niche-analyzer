import type { PresetSignalBadgeId } from "./nicheShortlistPresetSignals.js";
import { presetSignalBadgeOrder } from "./nicheShortlistPresetSignals.js";

const STORAGE_KEY = "twitter-niche-analyzer:niche-shortlist-preset-quick-fit";
const STORAGE_VERSION = 1;

interface PresetQuickFitStorageEnvelope {
  version: number;
  selectedQuickFit: PresetSignalBadgeId | null;
}

export interface PresetQuickFitBootstrapState {
  selectedQuickFit: PresetSignalBadgeId | null;
  storageNotice: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function sanitizeSelectedQuickFit(value: unknown): PresetSignalBadgeId | null {
  if (typeof value !== "string") {
    return null;
  }

  return presetSignalBadgeOrder.includes(value as PresetSignalBadgeId)
    ? (value as PresetSignalBadgeId)
    : null;
}

export function loadPresetQuickFitState(): PresetQuickFitBootstrapState {
  if (typeof window === "undefined") {
    return {
      selectedQuickFit: null,
      storageNotice: null
    };
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);

    if (!rawValue) {
      return {
        selectedQuickFit: null,
        storageNotice: null
      };
    }

    const parsedValue = JSON.parse(rawValue) as unknown;

    if (!isRecord(parsedValue) || parsedValue.version !== STORAGE_VERSION) {
      return {
        selectedQuickFit: null,
        storageNotice:
          "Сохранённый quick-fit фильтр был сброшен из-за несовместимого формата localStorage."
      };
    }

    return {
      selectedQuickFit: sanitizeSelectedQuickFit(parsedValue.selectedQuickFit),
      storageNotice: null
    };
  } catch {
    return {
      selectedQuickFit: null,
      storageNotice:
        "Не удалось прочитать сохранённый quick-fit фильтр. Он будет пересоздан заново."
    };
  }
}

export function persistPresetQuickFit(
  selectedQuickFit: PresetSignalBadgeId | null
) {
  if (typeof window === "undefined") {
    return;
  }

  const envelope: PresetQuickFitStorageEnvelope = {
    version: STORAGE_VERSION,
    selectedQuickFit
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
}
