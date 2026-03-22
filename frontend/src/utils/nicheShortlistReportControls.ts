export type NicheShortlistReportPresetId =
  | "executive"
  | "balanced"
  | "evidence-heavy";

export interface NicheShortlistReportScope {
  includeShortlistSummary: boolean;
  includeNicheEvidence: boolean;
  includeSupportingAccounts: boolean;
  includeCrossNicheWhitespace: boolean;
  includePositioningRecommendations: boolean;
  includePlaybook: boolean;
  includeRepeatableContentSeries: boolean;
  includeContentCalendarStarter: boolean;
  includeAdaptationHints: boolean;
  includeRepurposingHints: boolean;
  includeExecutionTemplates: boolean;
  includeExampleRewrites: boolean;
  includePublishChecklists: boolean;
  includeOpeningClosingVariants: boolean;
}

export type NicheShortlistReportScopeKey = keyof NicheShortlistReportScope;

export interface NicheShortlistReportPresetDefinition {
  id: NicheShortlistReportPresetId;
  label: string;
  description: string;
  scope: NicheShortlistReportScope;
}

export interface NicheShortlistReportScopeToggleDefinition {
  key: NicheShortlistReportScopeKey;
  label: string;
  description: string;
}

const executiveScope: NicheShortlistReportScope = {
  includeShortlistSummary: true,
  includeNicheEvidence: true,
  includeSupportingAccounts: false,
  includeCrossNicheWhitespace: false,
  includePositioningRecommendations: true,
  includePlaybook: false,
  includeRepeatableContentSeries: false,
  includeContentCalendarStarter: false,
  includeAdaptationHints: false,
  includeRepurposingHints: false,
  includeExecutionTemplates: false,
  includeExampleRewrites: false,
  includePublishChecklists: false,
  includeOpeningClosingVariants: false
};

const balancedScope: NicheShortlistReportScope = {
  includeShortlistSummary: true,
  includeNicheEvidence: true,
  includeSupportingAccounts: true,
  includeCrossNicheWhitespace: true,
  includePositioningRecommendations: true,
  includePlaybook: true,
  includeRepeatableContentSeries: true,
  includeContentCalendarStarter: true,
  includeAdaptationHints: true,
  includeRepurposingHints: true,
  includeExecutionTemplates: false,
  includeExampleRewrites: false,
  includePublishChecklists: false,
  includeOpeningClosingVariants: false
};

const evidenceHeavyScope: NicheShortlistReportScope = {
  includeShortlistSummary: true,
  includeNicheEvidence: true,
  includeSupportingAccounts: true,
  includeCrossNicheWhitespace: true,
  includePositioningRecommendations: true,
  includePlaybook: true,
  includeRepeatableContentSeries: true,
  includeContentCalendarStarter: true,
  includeAdaptationHints: true,
  includeRepurposingHints: true,
  includeExecutionTemplates: true,
  includeExampleRewrites: true,
  includePublishChecklists: true,
  includeOpeningClosingVariants: true
};

export const nicheShortlistReportPresets: NicheShortlistReportPresetDefinition[] = [
  {
    id: "executive",
    label: "Короткий",
    description:
      "Короткий управленческий срез: сводка, ranked niches, strongest accounts и короткие рекомендации.",
    scope: executiveScope
  },
  {
    id: "balanced",
    label: "Сбалансированный",
    description:
      "Сбалансированный экспорт с evidence, whitespace, positioning и content planning без самых глубоких execution-блоков.",
    scope: balancedScope
  },
  {
    id: "evidence-heavy",
    label: "С доказательствами",
    description:
      "Максимально насыщенный вариант с archetypes, whitespace, planning и execution layers для глубокого review.",
    scope: evidenceHeavyScope
  }
];

export const nicheShortlistReportScopeToggleDefinitions: NicheShortlistReportScopeToggleDefinition[] =
  [
    {
      key: "includeShortlistSummary",
      label: "Сводка shortlist",
      description: "Итоговая summary card и верхние ranking highlights."
    },
    {
      key: "includeNicheEvidence",
      label: "Доказательства по нише",
      description: "Почему ниша попала в shortlist, key evidence и whitespace внутри ниши."
    },
    {
      key: "includeSupportingAccounts",
      label: "Поддерживающие аккаунты",
      description: "Дополнительные supporting accounts рядом с strongest accounts."
    },
    {
      key: "includeCrossNicheWhitespace",
      label: "Сравнение whitespace между нишами",
      description: "Сравнение свободных и перегретых углов между shortlisted niches."
    },
    {
      key: "includePositioningRecommendations",
      label: "Рекомендации по входу",
      description: "Рекомендуемые углы входа и risks по нишам."
    },
    {
      key: "includePlaybook",
      label: "Стартовый playbook",
      description: "Стартовые content directions и first-post ideas."
    },
    {
      key: "includeRepeatableContentSeries",
      label: "Повторяемые серии",
      description: "Повторяемые контент-серии по каждой shortlisted niche."
    },
    {
      key: "includeContentCalendarStarter",
      label: "Контент-календарь",
      description: "2-недельный стартовый posting plan."
    },
    {
      key: "includeAdaptationHints",
      label: "Адаптация под время",
      description: "Low-time, medium-time и high-time режимы публикации."
    },
    {
      key: "includeRepurposingHints",
      label: "Идеи для repurposing",
      description: "Где лучше разворачивать пост в thread, mini-series, quote-follow-up и recap."
    },
    {
      key: "includeExecutionTemplates",
      label: "Шаблоны форматов",
      description: "Структурные шаблоны под thread, recap и другие форматы."
    },
    {
      key: "includeExampleRewrites",
      label: "Примеры rewrites",
      description: "Короткие rewrite-skeletons под конкретные слоты."
    },
    {
      key: "includePublishChecklists",
      label: "Чеклисты перед публикацией",
      description: "Чеклисты проверки перед публикацией."
    },
    {
      key: "includeOpeningClosingVariants",
      label: "Варианты hook / CTA",
      description: "Opening hooks и closing variants для ручной сборки поста."
    }
  ];

export function buildReportScopeFromPreset(
  presetId: NicheShortlistReportPresetId
): NicheShortlistReportScope {
  const preset = nicheShortlistReportPresets.find((item) => item.id === presetId);

  return {
    ...(preset?.scope ?? balancedScope)
  };
}

export function getReportPresetDefinition(
  presetId: NicheShortlistReportPresetId
) {
  return (
    nicheShortlistReportPresets.find((preset) => preset.id === presetId) ??
    nicheShortlistReportPresets[1]
  );
}

export function countEnabledReportSections(scope: NicheShortlistReportScope) {
  return Object.values(scope).filter(Boolean).length;
}

export function areReportScopesEqual(
  left: NicheShortlistReportScope,
  right: NicheShortlistReportScope
) {
  return (Object.keys(left) as NicheShortlistReportScopeKey[]).every(
    (key) => left[key] === right[key]
  );
}
