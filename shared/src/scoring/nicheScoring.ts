import type { NicheInsight, NicheScoreBreakdown, NicheSeed } from "../types/analysis.js";

export const defaultScoringWeights = {
  engagementEfficiency: 0.35,
  growthPotential: 0.25,
  monetizationPotential: 0.25,
  contentEase: 0.15
} as const;

export function buildNicheScore(
  input: Omit<NicheScoreBreakdown, "composite">
): NicheScoreBreakdown {
  const composite =
    input.engagementEfficiency * defaultScoringWeights.engagementEfficiency +
    input.growthPotential * defaultScoringWeights.growthPotential +
    input.monetizationPotential * defaultScoringWeights.monetizationPotential +
    input.contentEase * defaultScoringWeights.contentEase;

  return {
    ...input,
    composite: Number(composite.toFixed(1))
  };
}

export function buildNicheInsight(seed: NicheSeed): NicheInsight {
  return {
    id: seed.id,
    title: seed.title,
    summary: seed.summary,
    audienceSignal: seed.audienceSignal,
    contentAngle: seed.contentAngle,
    score: buildNicheScore(seed.scoreInput),
    influencerAccounts: seed.influencerAccounts
  };
}
