import { xNavigationConfig } from "./xNavigationConfig.js";

function readBooleanEnv(value: string | undefined, fallback: boolean) {
  if (!value) {
    return fallback;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalizedValue)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalizedValue)) {
    return false;
  }

  return fallback;
}

export const xProfileTimelineClassificationConfig = {
  defaultTreatQuoteAsUsable: readBooleanEnv(
    process.env.X_PROFILE_TIMELINE_CLASSIFICATION_TREAT_QUOTE_AS_USABLE,
    false
  )
} as const;

export function resolveXProfileTimelineClassificationTreatQuoteAsUsable(
  input?: string | boolean
) {
  if (typeof input === "boolean") {
    return input;
  }

  if (!input) {
    return xProfileTimelineClassificationConfig.defaultTreatQuoteAsUsable;
  }

  return readBooleanEnv(
    input,
    xProfileTimelineClassificationConfig.defaultTreatQuoteAsUsable
  );
}

export function getXProfileTimelineClassificationNotesSeed() {
  return [
    "Классификация ограничивается recent timeline items публичного профиля X.",
    "Первая версия использует rule-based signals для original posts, replies, reposts, quote posts и uncertain items.",
    "Если тип поста нельзя определить надёжно, элемент помечается как `uncertain` вместо догадки.",
    xNavigationConfig.auth.sessionEnabled
      ? "Auth-сессия настроена, но текущий classification route всё равно не выполняет login automation."
      : "Классификация работает без авторизации и использует только публичный профиль и публичные страницы твитов."
  ];
}
