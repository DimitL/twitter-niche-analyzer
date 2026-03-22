import type { NicheShortlistPresetPack } from "../data/nicheShortlistPresetLibrary.js";

export type PresetSignalBadgeId =
  | "growth-heavy"
  | "monetization-heavy"
  | "content-easy"
  | "research-heavy"
  | "builder-heavy"
  | "commentary-heavy";

export interface PresetSignalBadge {
  id: PresetSignalBadgeId;
  label: string;
  tone: "positive" | "neutral" | "accent";
}

export interface PresetSignalBadgeSummary extends PresetSignalBadge {
  count: number;
}

export const presetSignalBadgeOrder: PresetSignalBadgeId[] = [
  "growth-heavy",
  "monetization-heavy",
  "content-easy",
  "research-heavy",
  "builder-heavy",
  "commentary-heavy"
];

function buildPresetKeywordText(preset: NicheShortlistPresetPack) {
  return [
    preset.title,
    preset.description,
    preset.category ?? "",
    ...preset.buckets.flatMap((bucket) => [
      bucket.label,
      bucket.description ?? ""
    ])
  ]
    .join(" ")
    .toLowerCase();
}

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function pushBadge(
  target: PresetSignalBadge[],
  badge: PresetSignalBadge | null
) {
  if (!badge) {
    return;
  }

  if (target.some((item) => item.id === badge.id)) {
    return;
  }

  target.push(badge);
}

export function findPresetSignalBadgeById(
  preset: NicheShortlistPresetPack,
  badgeId: PresetSignalBadgeId
) {
  return buildPresetSignalBadges(preset).find((badge) => badge.id === badgeId) ?? null;
}

export function doesPresetMatchSignalBadge(
  preset: NicheShortlistPresetPack,
  badgeId: PresetSignalBadgeId
) {
  return buildPresetSignalBadges(preset).some((badge) => badge.id === badgeId);
}

export function buildPresetSignalBadgeSummary(
  presets: NicheShortlistPresetPack[]
): PresetSignalBadgeSummary[] {
  const summaryMap = new Map<PresetSignalBadgeId, PresetSignalBadgeSummary>();

  for (const preset of presets) {
    for (const badge of buildPresetSignalBadges(preset)) {
      const existing = summaryMap.get(badge.id);

      if (existing) {
        existing.count += 1;
        continue;
      }

      summaryMap.set(badge.id, {
        ...badge,
        count: 1
      });
    }
  }

  return presetSignalBadgeOrder
    .map((badgeId) => summaryMap.get(badgeId))
    .filter((badge): badge is PresetSignalBadgeSummary => Boolean(badge));
}

export function buildPresetSignalBadges(
  preset: NicheShortlistPresetPack
): PresetSignalBadge[] {
  const keywordText = buildPresetKeywordText(preset);
  const badges: PresetSignalBadge[] = [];

  if (preset.emphasizeGrowth || preset.sortBy === "growthPotential") {
    pushBadge(badges, {
      id: "growth-heavy",
      label: "Ростовый фокус",
      tone: "positive"
    });
  }

  if (preset.emphasizeMonetization || preset.sortBy === "monetizationPotential") {
    pushBadge(badges, {
      id: "monetization-heavy",
      label: "Монетизация",
      tone: "accent"
    });
  }

  if (preset.emphasizeEase || preset.sortBy === "contentEase") {
    pushBadge(badges, {
      id: "content-easy",
      label: "Лёгкий контент",
      tone: "positive"
    });
  }

  if (
    preset.sortBy === "dataConfidence" ||
    includesAny(keywordText, [
      "research",
      "исслед",
      "analysis",
      "analyst",
      "protocol",
      "model",
      "лаборат",
      "community"
    ])
  ) {
    pushBadge(badges, {
      id: "research-heavy",
      label: "Исследовательский фокус",
      tone: "neutral"
    });
  }

  if (
    includesAny(keywordText, [
      "builder",
      "build",
      "operator",
      "founder",
      "tooling",
      "workflow",
      "creator operators",
      "builders"
    ])
  ) {
    pushBadge(badges, {
      id: "builder-heavy",
      label: "Builder / operator фокус",
      tone: "neutral"
    });
  }

  if (
    includesAny(keywordText, [
      "commentary",
      "contrarian",
      "opinionated",
      "macro-tech",
      "strategy commentary",
      "narrative"
    ])
  ) {
    pushBadge(badges, {
      id: "commentary-heavy",
      label: "Фокус на мнениях",
      tone: "accent"
    });
  }

  return badges.slice(0, 4);
}
