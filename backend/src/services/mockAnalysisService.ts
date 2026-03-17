import {
  appConfig,
  buildNicheInsight,
  mockNicheSeeds,
  type AnalysisRequest,
  type AnalysisResponse
} from "@twitter-niche-analyzer/shared";

export function runMockAnalysis(query: AnalysisRequest): AnalysisResponse {
  const topNiches = mockNicheSeeds
    .map(buildNicheInsight)
    .sort((left, right) => right.score.composite - left.score.composite)
    .slice(0, appConfig.analysis.defaultTopNiches);

  return {
    generatedAt: new Date().toISOString(),
    source: "mock",
    query,
    topNiches,
    notes: [
      "Сейчас используются демонстрационные данные вместо реального сбора из X.",
      "Следующий слой развития: Playwright-коллектор, стабилизация селекторов и реальный scoring."
    ]
  };
}
