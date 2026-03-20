import type { RankedNicheShortlistBucket } from "../types/nicheShortlist.js";

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

function roundNumber(value: number, fractionDigits = 1) {
  return Number(value.toFixed(fractionDigits));
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
