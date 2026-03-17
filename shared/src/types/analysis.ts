import { z } from "zod";

export const analysisRequestSchema = z.object({
  marketHint: z.string().trim().min(1).optional(),
  creatorGoal: z.string().trim().min(1).optional()
});

export const influencerAccountSchema = z.object({
  handle: z.string(),
  displayName: z.string(),
  followers: z.number(),
  avgEngagementRate: z.number(),
  reason: z.string()
});

export const nicheScoreBreakdownSchema = z.object({
  engagementEfficiency: z.number(),
  growthPotential: z.number(),
  monetizationPotential: z.number(),
  contentEase: z.number(),
  composite: z.number()
});

export const nicheInsightSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  audienceSignal: z.string(),
  contentAngle: z.string(),
  score: nicheScoreBreakdownSchema,
  influencerAccounts: z.array(influencerAccountSchema)
});

export const analysisResponseSchema = z.object({
  generatedAt: z.string(),
  source: z.literal("mock"),
  query: analysisRequestSchema,
  topNiches: z.array(nicheInsightSchema),
  notes: z.array(z.string())
});

export type AnalysisRequest = z.infer<typeof analysisRequestSchema>;
export type InfluencerAccount = z.infer<typeof influencerAccountSchema>;
export type NicheScoreBreakdown = z.infer<typeof nicheScoreBreakdownSchema>;
export type NicheInsight = z.infer<typeof nicheInsightSchema>;
export type AnalysisResponse = z.infer<typeof analysisResponseSchema>;

export interface NicheSeed {
  id: string;
  title: string;
  summary: string;
  audienceSignal: string;
  contentAngle: string;
  scoreInput: Omit<NicheScoreBreakdown, "composite">;
  influencerAccounts: InfluencerAccount[];
}
