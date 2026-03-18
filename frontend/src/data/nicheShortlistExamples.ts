import type {
  NicheShortlistBucketInput,
  NicheShortlistRequest,
  NicheShortlistSortBy
} from "../types/nicheShortlist.js";

export interface NicheShortlistExample {
  id: string;
  label: string;
  description: string;
  buckets: NicheShortlistBucketInput[];
  limit: string;
  topN: string;
  sortBy: NicheShortlistSortBy;
  includeUncertain: boolean;
  treatQuoteAsUsable: boolean;
  emphasizeGrowth: boolean;
  emphasizeMonetization: boolean;
  emphasizeEase: boolean;
}

export const nicheShortlistExamples: NicheShortlistExample[] = [
  {
    id: "frontier-ai",
    label: "Frontier AI",
    description:
      "Сравнение frontier labs, research platforms и builder-oriented AI buckets.",
    limit: "1",
    topN: "2",
    sortBy: "overallTopicScore",
    includeUncertain: false,
    treatQuoteAsUsable: false,
    emphasizeGrowth: true,
    emphasizeMonetization: false,
    emphasizeEase: false,
    buckets: [
      {
        bucketId: "frontier-labs",
        label: "Frontier Labs",
        description: "Публичные аккаунты frontier-model лабораторий",
        handles: ["OpenAI", "AnthropicAI"]
      },
      {
        bucketId: "research-platforms",
        label: "Research Platforms",
        description: "Платформы и исследовательские экосистемы",
        handles: ["GoogleDeepMind", "huggingface"]
      },
      {
        bucketId: "ai-builders",
        label: "AI Builders",
        description: "Builder-oriented AI платформы и инструменты",
        handles: ["vercel", "Replit"]
      }
    ]
  },
  {
    id: "balanced-builders",
    label: "Builders vs Labs",
    description:
      "Более прагматичный preset для сравнения builder-платформ против model labs.",
    limit: "1",
    topN: "3",
    sortBy: "contentEase",
    includeUncertain: false,
    treatQuoteAsUsable: false,
    emphasizeGrowth: false,
    emphasizeMonetization: true,
    emphasizeEase: true,
    buckets: [
      {
        bucketId: "builder-platforms",
        label: "Builder Platforms",
        description: "Публичные платформы для AI builders и dev workflows",
        handles: ["vercel", "Replit"]
      },
      {
        bucketId: "model-labs",
        label: "Model Labs",
        description: "Аккаунты модельных лабораторий",
        handles: ["OpenAI", "AnthropicAI"]
      },
      {
        bucketId: "research-communities",
        label: "Research Communities",
        description: "Сообщества и платформы вокруг AI research",
        handles: ["huggingface", "GoogleDeepMind"]
      }
    ]
  }
];

export const defaultNicheShortlistExampleId = nicheShortlistExamples[0].id;

export function serializeBucketsForTextarea(buckets: NicheShortlistBucketInput[]) {
  return JSON.stringify(buckets, null, 2);
}

export function buildRequestFromExample(
  example: NicheShortlistExample
): NicheShortlistRequest {
  return {
    buckets: example.buckets,
    limit: Number.parseInt(example.limit, 10),
    topN: Number.parseInt(example.topN, 10),
    includeUncertain: example.includeUncertain,
    treatQuoteAsUsable: example.treatQuoteAsUsable,
    sortBy: example.sortBy,
    emphasizeGrowth: example.emphasizeGrowth,
    emphasizeMonetization: example.emphasizeMonetization,
    emphasizeEase: example.emphasizeEase
  };
}
