import type {
  NicheShortlistContentPatternTag,
  RankedNicheShortlistBucket
} from "../types/nicheShortlist.js";

interface EvidenceComponentSummary {
  key: string;
  label: string;
  value: number;
  weight: number;
  contribution: number;
}

interface EvidenceMetricSummary {
  key: string;
  label: string;
  value: number;
}

export interface NicheEvidencePackViewModel {
  scoreBreakdownSummary: string;
  strongestAccounts: RankedNicheShortlistBucket["strongestAccounts"];
  topSupportingAccounts: RankedNicheShortlistBucket["topSupportingAccounts"];
  supportingAccountsCount: number;
  supportingAccountsAvailabilityNote: string;
  dominantNichePatterns: RankedNicheShortlistBucket["dominantNichePatterns"];
  secondaryNichePatterns: RankedNicheShortlistBucket["secondaryNichePatterns"];
  commonArchetypes: RankedNicheShortlistBucket["commonArchetypes"];
  nicheArchetypeSummary: string | null;
  nicheArchetypeConfidenceNote: string | null;
  archetypeCoverageCount: number;
  underrepresentedPatterns: NicheShortlistContentPatternTag[];
  whitespaceHints: string[];
  nichePositioningIdeas: string[];
  gapsConfidenceNote: string | null;
  patternCoverageBalanceSummary: string | null;
  strongestSignals: EvidenceComponentSummary[];
  weakestSignals: EvidenceMetricSummary[];
  coverageNotes: string[];
  cautionFlags: string[];
  promisingSummary: string;
  misleadingSummary: string;
  recommendedNextAction: string;
  breakdownNotes: string[];
}

const topicMetricLabelMap: Record<string, string> = {
  growthPotential: "Потенциал роста",
  monetizationPotential: "Потенциал монетизации",
  contentEase: "Простота контента",
  dataConfidence: "Надежность данных",
  overallTopicScore: "Итоговый score ниши"
};

const componentLabelMap: Record<string, string> = {
  averageEngagementEfficiency: "Средний engagement efficiency",
  averageConsistency: "Средняя стабильность",
  usableAccountDensitySignal: "Плотность usable аккаунтов",
  averageReach: "Средний reach",
  averageAccountQuality: "Среднее качество аккаунтов",
  averageDataConfidence: "Средняя надежность данных",
  accountCoverageSignal: "Покрытие аккаунтов",
  growthPotential: "Потенциал роста",
  monetizationPotential: "Потенциал монетизации",
  contentEase: "Простота контента",
  dataConfidence: "Надежность данных"
};

const allContentPatternTags: NicheShortlistContentPatternTag[] = [
  "strongHook",
  "contrarianTake",
  "productUpdate",
  "benchmarkOrResult",
  "educationalBreakdown",
  "founderInsight",
  "timelyNewsTieIn",
  "audienceQuestion",
  "narrativeStorytelling"
];

const contentPatternLabelMap: Record<NicheShortlistContentPatternTag, string> = {
  strongHook: "сильный hook",
  contrarianTake: "контрарный угол",
  productUpdate: "продуктовый апдейт",
  benchmarkOrResult: "результат или benchmark",
  educationalBreakdown: "обучающий breakdown",
  founderInsight: "founder insight",
  timelyNewsTieIn: "привязка к актуальной новости",
  audienceQuestion: "вопрос к аудитории",
  narrativeStorytelling: "нарративная подача"
};

const whitespaceHintMap: Record<NicheShortlistContentPatternTag, string> = {
  strongHook:
    "В нише мало явно цепляющих входов в пост. Это окно для более сильных первых строк и sharper framing.",
  contrarianTake:
    "Контрарный угол встречается редко. На этом фоне можно выделиться аккуратными disagreement-постами без ухода в дешёвую провокацию.",
  productUpdate:
    "Продуктовые апдейты представлены слабо. Это даёт шанс занять более практичную позицию через shipping-based контент.",
  benchmarkOrResult:
    "Результатов и benchmark-сигналов пока немного. Ниша может выиграть от более доказательной подачи с цифрами и исходами.",
  educationalBreakdown:
    "Обучающие breakdown-посты выглядят недопокрытыми. Это шанс занять роль понятного объяснителя в нише.",
  founderInsight:
    "Founder/operator perspective проявляется слабо. Личный operational angle может добавить нише более редкий голос.",
  timelyNewsTieIn:
    "Связка с актуальными новостями пока не доминирует. Можно занять более быстрый реактивный угол без полной смены темы.",
  audienceQuestion:
    "Постов с прямым вовлечением аудитории немного. Это пространство для диалоговых форматов и question-led hooks.",
  narrativeStorytelling:
    "Storytelling почти не поддержан. Через короткие истории и behind-the-scenes можно добавить более человечный слой."
};

const positioningIdeaMap: Record<NicheShortlistContentPatternTag, string> = {
  strongHook:
    "Протестируйте позиционирование через более смелые opening hooks, но оставьте текущую тему и глубину ниши.",
  contrarianTake:
    "Попробуйте занять позицию спокойного contrarian-автора: спорить не ради спора, а ради более ясной рамки для аудитории.",
  productUpdate:
    "Сместите акцент в сторону регулярных product / shipping updates, чтобы ниша выглядела практичнее и ближе к действию.",
  benchmarkOrResult:
    "Сделайте ставку на формат «что сработало / что не сработало» с цифрами и outcomes, чтобы усилить доверие к контенту.",
  educationalBreakdown:
    "Позиционируйтесь как объясняющий слой ниши: короткие разборы, frameworks и step-by-step посты могут закрыть пробел.",
  founderInsight:
    "Добавьте более личный operator/founder angle, чтобы ниша получила редкую практическую перспективу изнутри.",
  timelyNewsTieIn:
    "Можно занять роль быстрого интерпретатора новостей: брать свежий повод и связывать его с уже работающим ядром ниши.",
  audienceQuestion:
    "Усильте question-led формат, чтобы собирать реакции аудитории и быстрее проверять, какие углы цепляют лучше всего.",
  narrativeStorytelling:
    "Попробуйте более narrative подачу: истории, ошибки, before/after и short journeys могут стать заметным отличителем."
};

function roundNumber(value: number, fractionDigits = 1) {
  return Number(value.toFixed(fractionDigits));
}

function joinHumanList(items: string[]) {
  if (items.length === 0) {
    return "";
  }

  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} и ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")} и ${items[items.length - 1]}`;
}

function dedupeItems<T>(items: T[]) {
  return Array.from(new Set(items));
}

function formatLabel(key: string, fallbackLabel: string) {
  return componentLabelMap[key] ?? fallbackLabel;
}

function formatMetricLabel(key: string) {
  return topicMetricLabelMap[key] ?? key;
}

function buildComponentSummaries(
  breakdown: {
    components: Array<{
      key: string;
      label: string;
      value: number;
      weight: number;
    }>;
  }
): EvidenceComponentSummary[] {
  return breakdown.components.map((component) => ({
    key: component.key,
    label: formatLabel(component.key, component.label),
    value: component.value,
    weight: component.weight,
    contribution: roundNumber(component.value * component.weight, 1)
  }));
}

function buildWeakestSignals(bucket: RankedNicheShortlistBucket): EvidenceMetricSummary[] {
  const metrics = [
    {
      key: "growthPotential",
      label: formatMetricLabel("growthPotential"),
      value: bucket.topicScores.growthPotential
    },
    {
      key: "monetizationPotential",
      label: formatMetricLabel("monetizationPotential"),
      value: bucket.topicScores.monetizationPotential
    },
    {
      key: "contentEase",
      label: formatMetricLabel("contentEase"),
      value: bucket.topicScores.contentEase
    },
    {
      key: "dataConfidence",
      label: formatMetricLabel("dataConfidence"),
      value: bucket.topicScores.dataConfidence
    }
  ];

  return metrics.sort((left, right) => left.value - right.value).slice(0, 2);
}

function buildCoverageNotes(bucket: RankedNicheShortlistBucket) {
  const notes: string[] = [];
  const requestedAccountCount = bucket.bucketAggregates.requestedAccountCount;
  const successfulAccountCount = bucket.bucketAggregates.successfulAccountCount;
  const usableAccountCount = bucket.bucketAggregates.usableAccountCount;

  notes.push(
    `Успешно обработано ${successfulAccountCount} из ${requestedAccountCount} аккаунтов (${bucket.topicSignals.accountCoverageSignal.toFixed(1)}% покрытия).`
  );
  notes.push(
    `Для scoring пригодны ${usableAccountCount} аккаунтов (${bucket.topicSignals.usableAccountDensitySignal.toFixed(1)}% доли usable аккаунтов).`
  );

  if (bucket.topicSignals.averageDataConfidence !== null) {
    notes.push(
      `Средний сигнал надежности данных по аккаунтам: ${bucket.topicSignals.averageDataConfidence.toFixed(1)}.`
    );
  } else {
    notes.push("Средний сигнал надежности данных пока недоступен, поэтому доказательную сводку стоит читать осторожно.");
  }

  return notes;
}

function buildCautionFlags(bucket: RankedNicheShortlistBucket, weakestSignals: EvidenceMetricSummary[]) {
  const flags = [...bucket.cons];

  if (bucket.status !== "ok") {
    flags.push("Часть bucket-а отработала частично, поэтому shortlist-позиция может быть менее устойчивой.");
  }

  if (bucket.topicSignals.accountCoverageRatio < 0.75) {
    flags.push("Покрытие аккаунтов пока неполное, так что ниша может выглядеть сильнее или слабее реального состояния.");
  }

  if (bucket.strongestAccounts.length === 0) {
    flags.push("Пока нет явных подтверждающих аккаунтов для ручной проверки этой ниши.");
  }

  if (weakestSignals.length > 0 && weakestSignals[0].value < 55) {
    flags.push(
      `${weakestSignals[0].label} пока выглядит слабее желаемого порога, поэтому вывод не стоит считать окончательным.`
    );
  }

  return Array.from(new Set(flags)).slice(0, 4);
}

function buildScoreBreakdownSummary(
  bucket: RankedNicheShortlistBucket,
  strongestSignals: EvidenceComponentSummary[]
) {
  if (strongestSignals.length === 0) {
    return `Итоговый score ниши ${bucket.topicScores.overallTopicScore.toFixed(1)} пока опирается на ограниченный набор сигналов.`;
  }

  const signalSummary = strongestSignals
    .slice(0, 2)
    .map(
      (signal) =>
        `${signal.label} ${signal.value.toFixed(1)} (вклад ${signal.contribution.toFixed(1)})`
    )
    .join(" и ");

  return `Итоговый score ниши ${bucket.topicScores.overallTopicScore.toFixed(1)} сильнее всего поддержан через ${signalSummary}.`;
}

function buildPromisingSummary(
  bucket: RankedNicheShortlistBucket,
  strongestSignals: EvidenceComponentSummary[]
) {
  const signalLabels = strongestSignals
    .slice(0, 2)
    .map((signal) => signal.label.toLowerCase())
    .join(" и ");
  const supportingAccounts = bucket.topSupportingAccounts
    .slice(0, 3)
    .map((account) => account.displayName ?? account.handle ?? "без имени")
    .join(", ");

  const signalSuffix = signalLabels
    ? ` Дополнительно нишу поддерживают ${signalLabels}.`
    : "";
  const accountSuffix = supportingAccounts
    ? ` В роли ближайших ориентиров уже видны аккаунты ${supportingAccounts}.`
    : "";

  return `${bucket.rankingReason}${signalSuffix}${accountSuffix}`;
}

function buildSupportingAccountsAvailabilityNote(bucket: RankedNicheShortlistBucket) {
  if (bucket.supportingAccountsCount === 0) {
    return "По этой нише пока нет поддерживающих аккаунтов, которые можно уверенно использовать как evidence pack.";
  }

  if (bucket.supportingAccountsCount < 10) {
    return `Сейчас доступно ${bucket.supportingAccountsCount} поддерживающих аккаунтов из желаемых 10. Этого уже достаточно для первого manual review, но не для финального насыщенного набора.`;
  }

  if (bucket.supportingAccountsCount === bucket.topSupportingAccounts.length) {
    return `Показываем все ${bucket.supportingAccountsCount} поддерживающих аккаунтов, доступных по этой нише.`;
  }

  return `Показываем топ-${bucket.topSupportingAccounts.length} из ${bucket.supportingAccountsCount} поддерживающих аккаунтов по явному правилу сортировки через overall score и engagement efficiency.`;
}

function buildMisleadingSummary(
  weakestSignals: EvidenceMetricSummary[],
  cautionFlags: string[]
) {
  const primaryFlag =
    cautionFlags[0] ??
    "вывод все еще опирается на ограниченный ручной набор данных и требует ручной проверки.";
  const weakestSignalSummary = weakestSignals
    .map((signal) => `${signal.label.toLowerCase()} ${signal.value.toFixed(1)}`)
    .join(" и ");

  if (!weakestSignalSummary && cautionFlags.length === 0) {
    return "Сильных красных флагов немного, но shortlist все равно основан на ограниченном ручном наборе данных.";
  }

  if (!weakestSignalSummary) {
    return `Главный риск в том, что ${primaryFlag.charAt(0).toLowerCase()}${primaryFlag.slice(1)}`;
  }

  return `Картина может быть обманчивой, если переоценить ${weakestSignalSummary}. Также важно помнить: ${primaryFlag.charAt(0).toLowerCase()}${primaryFlag.slice(1)}`;
}

function buildRecommendedNextAction(bucket: RankedNicheShortlistBucket) {
  if (
    bucket.topicScores.dataConfidence < 65 ||
    bucket.topicSignals.accountCoverageRatio < 0.75
  ) {
    return "Следующим шагом вручную проверьте 3-5 последних постов сильнейших аккаунтов и подтвердите, что сигнал устойчив и не держится на одном удачном наборе данных.";
  }

  if (bucket.topicScores.growthPotential >= 70) {
    return "Разберите 5-10 самых сильных hooks у лидеров bucket-а и соберите из них первый контентный тест-план под growth.";
  }

  if (bucket.topicScores.monetizationPotential >= 70) {
    return "Проверьте, какие офферы, CTA и продуктовые углы используют лидеры bucket-а, чтобы подтвердить monetization proxy не только на score, но и вручную.";
  }

  if (bucket.topicScores.contentEase >= 70) {
    return "Соберите из strongest accounts 10 тем для быстрых постов и проверьте, насколько легко поддерживать ритм публикаций в этой нише.";
  }

  return "Используйте strongest accounts как ручной reference pack и решите, стоит ли брать нишу в следующий shortlist-раунд с более глубоким account review.";
}

function buildPatternScoreMap(bucket: RankedNicheShortlistBucket) {
  const patternScores = new Map<NicheShortlistContentPatternTag, number>();

  allContentPatternTags.forEach((tag) => patternScores.set(tag, 0));

  bucket.topSupportingAccounts.forEach((account) => {
    account.dominantPatterns.forEach((pattern, index) => {
      patternScores.set(
        pattern,
        (patternScores.get(pattern) ?? 0) + Math.max(2 - index * 0.35, 1.2)
      );
    });

    account.secondaryPatterns.forEach((pattern, index) => {
      patternScores.set(
        pattern,
        (patternScores.get(pattern) ?? 0) + Math.max(1 - index * 0.25, 0.4)
      );
    });

    account.bestPerformingTweetReferences.forEach((reference) => {
      reference.contentPatternTags.forEach((pattern, index) => {
        patternScores.set(
          pattern,
          (patternScores.get(pattern) ?? 0) + Math.max(0.7 - index * 0.1, 0.3)
        );
      });
    });
  });

  return patternScores;
}

function buildGapCandidateOrder(bucket: RankedNicheShortlistBucket) {
  const dominantPatterns = bucket.dominantNichePatterns;
  const candidateTags: NicheShortlistContentPatternTag[] = [];
  const addCandidates = (patterns: NicheShortlistContentPatternTag[]) => {
    candidateTags.push(...patterns);
  };

  if (
    dominantPatterns.includes("productUpdate") ||
    dominantPatterns.includes("benchmarkOrResult")
  ) {
    addCandidates([
      "narrativeStorytelling",
      "audienceQuestion",
      "founderInsight"
    ]);
  }

  if (dominantPatterns.includes("educationalBreakdown")) {
    addCandidates([
      "timelyNewsTieIn",
      "contrarianTake",
      "narrativeStorytelling"
    ]);
  }

  if (
    dominantPatterns.includes("strongHook") ||
    dominantPatterns.includes("contrarianTake")
  ) {
    addCandidates([
      "benchmarkOrResult",
      "educationalBreakdown",
      "productUpdate"
    ]);
  }

  if (dominantPatterns.includes("founderInsight")) {
    addCandidates([
      "benchmarkOrResult",
      "educationalBreakdown",
      "audienceQuestion"
    ]);
  }

  if (dominantPatterns.includes("timelyNewsTieIn")) {
    addCandidates([
      "educationalBreakdown",
      "benchmarkOrResult",
      "narrativeStorytelling"
    ]);
  }

  return dedupeItems([...candidateTags, ...allContentPatternTags]);
}

function buildContentGapInsights(bucket: RankedNicheShortlistBucket) {
  const patternScores = buildPatternScoreMap(bucket);
  const sortedScores = [...patternScores.entries()].sort((left, right) => right[1] - left[1]);
  const topScore = sortedScores[0]?.[1] ?? 0;
  const dominantSet = new Set(bucket.dominantNichePatterns);
  const secondarySet = new Set(bucket.secondaryNichePatterns);
  const lowCoverageThreshold = topScore > 0 ? Math.max(topScore * 0.28, 1.1) : 1;
  const underrepresentedPatterns = buildGapCandidateOrder(bucket)
    .filter((pattern) => !dominantSet.has(pattern) && !secondarySet.has(pattern))
    .filter((pattern) => (patternScores.get(pattern) ?? 0) <= lowCoverageThreshold)
    .slice(0, 3);
  const whitespaceHints = underrepresentedPatterns
    .map((pattern) => whitespaceHintMap[pattern])
    .slice(0, 3);
  const nichePositioningIdeas = underrepresentedPatterns
    .map((pattern) => positioningIdeaMap[pattern])
    .slice(0, 3);
  const dominantLabels = bucket.dominantNichePatterns.map(
    (pattern) => contentPatternLabelMap[pattern]
  );
  const underrepresentedLabels = underrepresentedPatterns.map(
    (pattern) => contentPatternLabelMap[pattern]
  );
  let patternCoverageBalanceSummary: string | null = null;

  if (dominantLabels.length > 0 && underrepresentedLabels.length > 0) {
    patternCoverageBalanceSummary = `Сейчас ниша сильнее всего держится на ${joinHumanList(
      dominantLabels
    )}, а углы вроде ${joinHumanList(
      underrepresentedLabels
    )} пока заметно слабее представлены.`;
  } else if (dominantLabels.length > 0) {
    patternCoverageBalanceSummary = `Паттерн-карта ниши уже выглядит довольно плотной: ведущие сигналы строятся вокруг ${joinHumanList(
      dominantLabels
    )}.`;
  }

  let gapsConfidenceNote: string | null = null;
  const metricRichAccounts = bucket.topSupportingAccounts.filter(
    (account) => account.bestPerformingTweetReferencesCount > 0
  ).length;

  if (bucket.archetypeCoverageCount < 2 || metricRichAccounts < 2) {
    gapsConfidenceNote =
      "Whitespace hints пока предварительные: ниша опирается на небольшой набор supporting accounts и few best-performing snippets.";
  } else if (underrepresentedPatterns.length === 0) {
    gapsConfidenceNote =
      "Явных whitespace-сигналов пока немного: текущая ручная выборка уже покрывает несколько разных content-углов.";
  } else if (bucket.archetypeCoverageCount < Math.min(4, bucket.topSupportingAccounts.length)) {
    gapsConfidenceNote =
      "Whitespace hints собраны только по части supporting accounts, поэтому после расширения roster картина может немного сдвинуться.";
  }

  return {
    underrepresentedPatterns,
    whitespaceHints,
    nichePositioningIdeas,
    gapsConfidenceNote,
    patternCoverageBalanceSummary
  };
}

export function buildNicheEvidencePack(
  bucket: RankedNicheShortlistBucket
): NicheEvidencePackViewModel {
  const rankingBreakdown =
    bucket.rankingBreakdown ?? bucket.scoreBreakdown.overallTopicScore;
  const rankingComponents = buildComponentSummaries(rankingBreakdown)
    .sort((left, right) => right.contribution - left.contribution)
    .slice(0, 3);
  const weakestSignals = buildWeakestSignals(bucket);
  const coverageNotes = buildCoverageNotes(bucket);
  const cautionFlags = buildCautionFlags(bucket, weakestSignals);
  const contentGapInsights = buildContentGapInsights(bucket);
  const breakdownNotes = [
    ...bucket.scoreBreakdown.overallTopicScore.notes,
    ...(bucket.rankingBreakdown?.formula
      ? [`Правило ранжирования: ${bucket.rankingBreakdown.formula}`]
      : [])
  ].slice(0, 3);

  return {
    scoreBreakdownSummary: buildScoreBreakdownSummary(bucket, rankingComponents),
    strongestAccounts: bucket.strongestAccounts.slice(0, 5),
    topSupportingAccounts: bucket.topSupportingAccounts.slice(0, 10),
    supportingAccountsCount: bucket.supportingAccountsCount,
    supportingAccountsAvailabilityNote: buildSupportingAccountsAvailabilityNote(bucket),
    dominantNichePatterns: bucket.dominantNichePatterns,
    secondaryNichePatterns: bucket.secondaryNichePatterns,
    commonArchetypes: bucket.commonArchetypes,
    nicheArchetypeSummary: bucket.nicheArchetypeSummary,
    nicheArchetypeConfidenceNote: bucket.nicheArchetypeConfidenceNote,
    archetypeCoverageCount: bucket.archetypeCoverageCount,
    underrepresentedPatterns: contentGapInsights.underrepresentedPatterns,
    whitespaceHints: contentGapInsights.whitespaceHints,
    nichePositioningIdeas: contentGapInsights.nichePositioningIdeas,
    gapsConfidenceNote: contentGapInsights.gapsConfidenceNote,
    patternCoverageBalanceSummary:
      contentGapInsights.patternCoverageBalanceSummary,
    strongestSignals: rankingComponents,
    weakestSignals,
    coverageNotes,
    cautionFlags,
    promisingSummary: buildPromisingSummary(bucket, rankingComponents),
    misleadingSummary: buildMisleadingSummary(weakestSignals, cautionFlags),
    recommendedNextAction: buildRecommendedNextAction(bucket),
    breakdownNotes
  };
}
