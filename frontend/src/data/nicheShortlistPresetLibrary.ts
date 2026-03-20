import type {
  NicheShortlistBucketInput,
  NicheShortlistSortBy
} from "../types/nicheShortlist.js";

export interface NicheShortlistPresetPack {
  presetId: string;
  title: string;
  description: string;
  category?: string;
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

export const nicheShortlistPresetLibrary: NicheShortlistPresetPack[] = [
  {
    presetId: "frontier-ai-labs",
    title: "Frontier AI Labs",
    description:
      "Быстрый стартовый pack для сравнения frontier-лабораторий, research platforms и AI builders.",
    category: "AI",
    limit: "1",
    topN: "3",
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
        description: "Research ecosystems и платформы вокруг моделей",
        handles: ["GoogleDeepMind", "huggingface"]
      },
      {
        bucketId: "ai-builders",
        label: "AI Builders",
        description: "Builder-oriented AI платформы и dev tooling",
        handles: ["vercel", "Replit"]
      }
    ]
  },
  {
    presetId: "ai-tools-builders",
    title: "AI Tools / Builders",
    description:
      "Preset для более прикладного AI-среза: инструменты, open tooling и платформы для builders.",
    category: "AI Builders",
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
        bucketId: "ai-dev-tools",
        label: "AI Dev Tools",
        description: "Инструменты и платформы для AI builders",
        handles: ["vercel", "Replit"]
      },
      {
        bucketId: "open-model-tooling",
        label: "Open Model Tooling",
        description: "Открытые платформы и tooling вокруг моделей",
        handles: ["huggingface", "MistralAI"]
      },
      {
        bucketId: "workflow-builders",
        label: "Workflow Builders",
        description: "Продукты на стыке AI и knowledge/workflow tooling",
        handles: ["NotionHQ", "Canva"]
      }
    ]
  },
  {
    presetId: "research-platforms",
    title: "Research Platforms",
    description:
      "Pack для более research-heavy угла: labs, open research и model communities.",
    category: "Research",
    limit: "1",
    topN: "3",
    sortBy: "dataConfidence",
    includeUncertain: false,
    treatQuoteAsUsable: false,
    emphasizeGrowth: false,
    emphasizeMonetization: false,
    emphasizeEase: false,
    buckets: [
      {
        bucketId: "research-ecosystems",
        label: "Research Ecosystems",
        description: "Открытые сообщества и model-research platforms",
        handles: ["huggingface", "allen_ai"]
      },
      {
        bucketId: "frontier-research-labs",
        label: "Frontier Research Labs",
        description: "Лаборатории с сильной research-коммуникацией",
        handles: ["GoogleDeepMind", "MistralAI"]
      },
      {
        bucketId: "model-labs",
        label: "Model Labs",
        description: "Аккаунты модельных лабораторий с публичным narrative",
        handles: ["OpenAI", "AnthropicAI"]
      }
    ]
  },
  {
    presetId: "solo-builders-operators",
    title: "Solo Builders / Operators",
    description:
      "Более персональный pack для niches вокруг founder/operator контента и solo-builder narratives.",
    category: "Builders",
    limit: "1",
    topN: "3",
    sortBy: "contentEase",
    includeUncertain: false,
    treatQuoteAsUsable: false,
    emphasizeGrowth: true,
    emphasizeMonetization: false,
    emphasizeEase: true,
    buckets: [
      {
        bucketId: "solo-builders",
        label: "Solo Builders",
        description: "Инди-билдеры и solo creator-operators",
        handles: ["levelsio", "tibo_maker"]
      },
      {
        bucketId: "operators",
        label: "Operators",
        description: "Product/operator voices с сильным практическим углом",
        handles: ["naval", "dhh"]
      },
      {
        bucketId: "creator-systems",
        label: "Creator Systems",
        description: "Системный creator/operator контент",
        handles: ["dickiebush", "KieranDrew"]
      }
    ]
  },
  {
    presetId: "crypto-researchers",
    title: "Crypto Researchers",
    description:
      "Preset для анализа research-heavy crypto/X niches с акцентом на interpretation и signal quality.",
    category: "Crypto",
    limit: "1",
    topN: "3",
    sortBy: "overallTopicScore",
    includeUncertain: false,
    treatQuoteAsUsable: false,
    emphasizeGrowth: false,
    emphasizeMonetization: true,
    emphasizeEase: false,
    buckets: [
      {
        bucketId: "crypto-research",
        label: "Crypto Research",
        description: "Исследовательские и interpretive crypto-аккаунты",
        handles: ["VitalikButerin", "DefiIgnas"]
      },
      {
        bucketId: "crypto-commentary",
        label: "Crypto Commentary",
        description: "Макро- и narrative-комментарии по рынку",
        handles: ["APompliano", "milesdeutscher"]
      },
      {
        bucketId: "protocol-analysis",
        label: "Protocol Analysis",
        description: "Протокольный и ecosystem-level анализ",
        handles: ["BanklessHQ", "aeyakovenko"]
      }
    ]
  },
  {
    presetId: "web3-builders",
    title: "Web3 Builders",
    description:
      "Builder-heavy Web3 pack для сравнения protocol voices, ecosystems и builder education.",
    category: "Web3 Builders",
    limit: "1",
    topN: "3",
    sortBy: "growthPotential",
    includeUncertain: false,
    treatQuoteAsUsable: false,
    emphasizeGrowth: true,
    emphasizeMonetization: true,
    emphasizeEase: false,
    buckets: [
      {
        bucketId: "protocol-builders",
        label: "Protocol Builders",
        description: "Основатели и core builder-голоса протоколов",
        handles: ["aeyakovenko", "VitalikButerin"]
      },
      {
        bucketId: "ecosystem-builders",
        label: "Ecosystem Builders",
        description: "Ecosystem accounts с builder/community narrative",
        handles: ["solana", "BuildOnBase"]
      },
      {
        bucketId: "web3-education",
        label: "Web3 Education",
        description: "Образовательные и interpretive builder-аккаунты",
        handles: ["BanklessHQ", "variantfund"]
      }
    ]
  },
  {
    presetId: "productivity-systems",
    title: "Productivity / Systems",
    description:
      "Preset для niches вокруг systems thinking, creator productivity и repeatable personal workflows.",
    category: "Productivity",
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
        bucketId: "productivity-educators",
        label: "Productivity Educators",
        description: "Creator-образование и productivity breakdowns",
        handles: ["AliAbdaal", "fortelabs"]
      },
      {
        bucketId: "systems-builders",
        label: "Systems Builders",
        description: "Системный и habit-driven контент",
        handles: ["AugustBradley", "dickiebush"]
      },
      {
        bucketId: "creator-operators",
        label: "Creator Operators",
        description: "Creator-operators с emphasis на repeatable processes",
        handles: ["KieranDrew", "Nicolascole77"]
      }
    ]
  },
  {
    presetId: "contrarian-tech-commentary",
    title: "Contrarian Tech Commentary",
    description:
      "Комментарий и interpretation-heavy pack для niches, где работает opinionated tech analysis.",
    category: "Commentary",
    limit: "1",
    topN: "3",
    sortBy: "growthPotential",
    includeUncertain: false,
    treatQuoteAsUsable: false,
    emphasizeGrowth: true,
    emphasizeMonetization: false,
    emphasizeEase: true,
    buckets: [
      {
        bucketId: "contrarian-tech",
        label: "Contrarian Tech",
        description: "Opinionated и contrarian tech-voices",
        handles: ["dhh", "patio11"]
      },
      {
        bucketId: "strategy-commentary",
        label: "Strategy Commentary",
        description: "Стратегические и macro-tech наблюдения",
        handles: ["BenedictEvans", "paulg"]
      },
      {
        bucketId: "builder-commentary",
        label: "Builder Commentary",
        description: "Комментарий от людей, которые сами строят продукты",
        handles: ["naval", "levelsio"]
      }
    ]
  }
];

