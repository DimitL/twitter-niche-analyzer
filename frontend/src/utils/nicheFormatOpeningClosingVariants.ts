import type {
  CrossNicheContentRepurposingHints,
  NicheContentRepurposingHintsBucket
} from "./nicheContentRepurposingHints.js";
import { buildNicheContentRepurposingHints } from "./nicheContentRepurposingHints.js";
import type {
  CrossNicheFormatExampleRewrites,
  NicheFormatExampleRewritesBucket
} from "./nicheFormatExampleRewrites.js";
import { buildNicheFormatExampleRewrites } from "./nicheFormatExampleRewrites.js";
import type {
  CrossNicheFormatPublishChecklists,
  NicheFormatPublishChecklistsBucket
} from "./nicheFormatPublishChecklists.js";
import { buildNicheFormatPublishChecklists } from "./nicheFormatPublishChecklists.js";
import type {
  CrossNicheFormatExecutionTemplates,
  NicheFormatExecutionTemplatesBucket
} from "./nicheFormatExecutionTemplates.js";
import { buildNicheFormatExecutionTemplates } from "./nicheFormatExecutionTemplates.js";
import type { NicheShortlistResponse } from "../types/nicheShortlist.js";
import type { NichePositioningPlaybookLeader } from "./nichePositioningPlaybook.js";

type VariantAngle =
  | "education"
  | "contrarian"
  | "founderOperator"
  | "benchmarkResults"
  | "timelyNewsReactive"
  | "narrativeStorytelling"
  | "generic";

export interface FormatVariantOption {
  text: string;
  fitBestWhen: string;
}

export interface FormatOpeningClosingVariantSet {
  openingVariants: FormatVariantOption[];
  closingVariants: FormatVariantOption[];
  usageNotes: string[];
  overuseWarning: string | null;
}

export interface NicheFormatOpeningClosingVariantsBucket {
  bucketId: string;
  label: string;
  rank: number | null;
  bestEntryAngleLabel: string | null;
  formatOpeningClosingVariants: {
    threadVariants: FormatOpeningClosingVariantSet;
    miniSeriesVariants: FormatOpeningClosingVariantSet;
    quoteFollowUpVariants: FormatOpeningClosingVariantSet;
    recapVariants: FormatOpeningClosingVariantSet;
  };
  variantsConfidenceNote: string | null;
}

export interface CrossNicheFormatOpeningClosingVariantsSummary {
  nicheWithClearestSafeHooks: NichePositioningPlaybookLeader | null;
  nicheWithStrongestCtaReplyLoopPotential: NichePositioningPlaybookLeader | null;
  nicheWhereHooksNeedMostRestraint: NichePositioningPlaybookLeader | null;
}

export interface CrossNicheFormatOpeningClosingVariants {
  comparedBucketCount: number;
  comparableBucketCount: number;
  variantsSummary: string;
  perBucketVariants: NicheFormatOpeningClosingVariantsBucket[];
  summary: CrossNicheFormatOpeningClosingVariantsSummary;
  globalConfidenceNote: string | null;
}

interface VariantsContext {
  repurposingBucket: NicheContentRepurposingHintsBucket;
  templatesBucket: NicheFormatExecutionTemplatesBucket;
  rewritesBucket: NicheFormatExampleRewritesBucket;
  checklistsBucket: NicheFormatPublishChecklistsBucket;
}

interface VariantsBucketWithMeta {
  bucket: NicheFormatOpeningClosingVariantsBucket;
  hookClarityScore: number;
  ctaLoopScore: number;
  restraintScore: number;
}

function dedupeByText(items: FormatVariantOption[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = item.text.trim().toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function dedupeStrings(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

function stripTrailingPunctuation(value: string) {
  return value.trim().replace(/[.!?…:]+$/u, "");
}

function isFallbackSource(sourceCandidate: string) {
  return sourceCandidate.includes("Базовый угол");
}

function inferAngle(label: string | null): VariantAngle {
  const normalizedLabel = (label ?? "").toLowerCase();

  if (normalizedLabel.includes("обуч")) {
    return "education";
  }

  if (normalizedLabel.includes("контрар")) {
    return "contrarian";
  }

  if (
    normalizedLabel.includes("founder") ||
    normalizedLabel.includes("operator")
  ) {
    return "founderOperator";
  }

  if (
    normalizedLabel.includes("benchmark") ||
    normalizedLabel.includes("результ")
  ) {
    return "benchmarkResults";
  }

  if (
    normalizedLabel.includes("новост") ||
    normalizedLabel.includes("reactive")
  ) {
    return "timelyNewsReactive";
  }

  if (
    normalizedLabel.includes("нарратив") ||
    normalizedLabel.includes("story")
  ) {
    return "narrativeStorytelling";
  }

  return "generic";
}

function buildLeader(
  bucket: NicheFormatOpeningClosingVariantsBucket,
  reason: string
): NichePositioningPlaybookLeader {
  return {
    bucketId: bucket.bucketId,
    bucketLabel: bucket.label,
    rank: bucket.rank,
    reason
  };
}

function buildVariant(text: string, fitBestWhen: string): FormatVariantOption {
  return {
    text: text.trim(),
    fitBestWhen: fitBestWhen.trim()
  };
}

function buildUsageNotes(items: Array<string | null | undefined>) {
  return dedupeStrings(
    items.filter((item): item is string => Boolean(item)).map((item) => item.trim())
  ).slice(0, 3);
}

function buildAngleSpecificOpening(
  angle: VariantAngle,
  format: "thread" | "miniSeries" | "quoteFollowUp" | "recap"
) {
  switch (format) {
    case "thread":
      switch (angle) {
        case "education":
          return "Разложу этот тезис по шагам, чтобы стало видно, где здесь реальный signal.";
        case "contrarian":
          return "Непопулярный вывод здесь такой: спорят не о той части темы.";
        case "founderOperator":
          return "Если смотреть на это глазами operator, ключевой trade-off вот здесь.";
        case "benchmarkResults":
          return "Если убрать шум, у этого кейса остаются три реально полезных сигнала.";
        case "timelyNewsReactive":
          return "Повод громкий, но практический вывод для ниши на самом деле вот в чём.";
        case "narrativeStorytelling":
          return "Есть короткая история, которая объясняет этот сигнал лучше любого hot take.";
        default:
          return "Если собрать это в один понятный ход, главный разворот темы вот такой.";
      }
    case "miniSeries":
      switch (angle) {
        case "education":
          return "Продолжаю серию: сегодня разбираю только один следующий слой этой темы.";
        case "contrarian":
          return "Во второй части разберу один тезис, который обычно слишком быстро принимают на веру.";
        case "founderOperator":
          return "Продолжение operator-серии: сегодня один узкий decision point без лишнего шума.";
        case "benchmarkResults":
          return "В следующем эпизоде беру только один результат и проверяю, что он реально значит.";
        case "timelyNewsReactive":
          return "Продолжаю быстрый цикл: что изменилось после первой реакции на этот повод.";
        case "narrativeStorytelling":
          return "Продолжу историю одним следующим эпизодом, но уже с более прикладным выводом.";
        default:
          return "Продолжение серии: сегодня только один узкий под-угол, без перезапуска всей темы.";
      }
    case "quoteFollowUp":
      switch (angle) {
        case "contrarian":
          return "В этом тезисе теряют один важный слой, и без него вывод получается слишком удобным.";
        case "timelyNewsReactive":
          return "Новость громкая, но её useful implication для ниши выглядит немного иначе.";
        case "benchmarkResults":
          return "Из этого результата хочется сделать быстрый вывод, но я бы смотрел на другое.";
        default:
          return "Сильный claim, но рабочая рамка здесь чуть смещается, если посмотреть глубже.";
      }
    case "recap":
      switch (angle) {
        case "education":
          return "Если собрать последние 2 недели в один ясный breakdown, картина выглядит так.";
        case "contrarian":
          return "Соберу в одну рамку, какие disagreement-углы реально держались, а какие были шумом.";
        case "founderOperator":
          return "Короткий итог цикла: какие operator-углы оказались полезнее всего.";
        case "benchmarkResults":
          return "Если собрать все результаты в одну рамку, главный вывод получается таким.";
        case "timelyNewsReactive":
          return "Быстрый recap: какие новостные углы реально дали value, а какие только шум.";
        case "narrativeStorytelling":
          return "Соберу цикл в три коротких story-driven вывода, чтобы стало видно общий паттерн.";
        default:
          return "Короткий итог цикла: вот что действительно повторилось и что стоит забрать дальше.";
      }
  }
}

function buildAngleSpecificClosing(
  angle: VariantAngle,
  format: "thread" | "miniSeries" | "quoteFollowUp" | "recap"
) {
  switch (format) {
    case "thread":
      switch (angle) {
        case "education":
          return "Если унести из этого thread одну мысль, пусть это будет именно эта рабочая рамка.";
        case "contrarian":
          return "Если спорить дальше, то уже только с этим конкретным тезисом, а не со всем полем сразу.";
        case "founderOperator":
          return "Если бы я сводил это к одному operator-решению, я бы проверял именно этот trade-off.";
        case "benchmarkResults":
          return "Если сокращать всё до одного вывода, следить стоит за этим result-signal, а не за шумом вокруг него.";
        case "timelyNewsReactive":
          return "Если тема продолжится, важнее всего проверить не headline, а этот downstream effect.";
        case "narrativeStorytelling":
          return "Итог истории простой: полезен не сам сюжет, а вывод, который он заставляет увидеть.";
        default:
          return "Если оставить один takeaway, я бы держал в голове именно эту рамку.";
      }
    case "miniSeries":
      switch (angle) {
        case "education":
          return "Если эта часть была полезна, следующий эпизод логично посвятить самому спорному шагу внутри этой схемы.";
        case "contrarian":
          return "Следующим эпизодом стоит развернуть тот кусок, с которым аудитория чаще всего не согласится.";
        case "founderOperator":
          return "Продолжу серию там, где этот decision point начинает влиять на реальный execution.";
        case "benchmarkResults":
          return "Следующим постом логично проверить, повторяется ли этот результат на соседнем кейсе.";
        case "timelyNewsReactive":
          return "Если повод не затухнет, следующим шагом разберу уже вторичный эффект, а не headline.";
        case "narrativeStorytelling":
          return "Следующий эпизод лучше посвятить тому моменту истории, где появляется практический вывод.";
        default:
          return "Если серия идёт дальше, следующий эпизод должен раскрывать только один следующий слой темы.";
      }
    case "quoteFollowUp":
      switch (angle) {
        case "contrarian":
          return "Если коротко: value здесь не в споре ради спора, а в том, какой фрейм остаётся после него.";
        case "timelyNewsReactive":
          return "Следить теперь стоит не за шумом вокруг повода, а за тем, как он меняет практику в нише.";
        case "benchmarkResults":
          return "Если и брать отсюда один вывод, то только тот, который выдерживает проверку результатом.";
        default:
          return "Если оставить одну строку после реакции, она должна менять frame читателя, а не просто усиливать шум.";
      }
    case "recap":
      switch (angle) {
        case "education":
          return "В следующий цикл я бы забрал только те объясняющие углы, которые реально повторились и дали ясность.";
        case "contrarian":
          return "Дальше стоит оставить только те disagreement-углы, которые пережили проверку реальными наблюдениями.";
        case "founderOperator":
          return "В следующий цикл стоит перенести только те operator-рамки, которые реально помогали принимать решения.";
        case "benchmarkResults":
          return "Если и развивать этот цикл дальше, то только вокруг того result-pattern, который повторился сильнее всего.";
        case "timelyNewsReactive":
          return "Дальше имеет смысл брать только те news-углы, где был не шум, а полезный downstream insight.";
        case "narrativeStorytelling":
          return "В следующий цикл я бы забрал только те истории, у которых вывод переживает пересказ без потери смысла.";
        default:
          return "Если оставить один вывод после recap, он должен задавать следующий цикл, а не закрывать тему насовсем.";
      }
  }
}

function buildThreadVariants(
  context: VariantsContext,
  angle: VariantAngle
): FormatOpeningClosingVariantSet {
  const template = context.templatesBucket.formatExecutionTemplates.threadTemplate;
  const rewrite = context.rewritesBucket.formatExampleRewrites.threadExample;
  const checklist = context.checklistsBucket.formatPublishChecklists.threadChecklist;

  return {
    openingVariants: dedupeByText([
      buildVariant(
        rewrite.rewrittenOpening,
        "Лучше всего, когда strongest candidate slot уже даёт понятный claim и не требует заново искать hook."
      ),
      buildVariant(
        `${stripTrailingPunctuation(template.openingPattern)} и разложу это в 3 коротких шага.`,
        "Подходит, когда нужно безопасно собрать thread без лишней драматизации и сразу пообещать структуру."
      ),
      buildVariant(
        buildAngleSpecificOpening(angle, "thread"),
        "Лучше работает, когда хочется чуть сильнее подчеркнуть угол входа, но не скатиться в overly clever hook."
      )
    ]).slice(0, 3),
    closingVariants: dedupeByText([
      buildVariant(
        buildAngleSpecificClosing(angle, "thread"),
        "Используйте, когда thread должен закончиться одной clear working frame, а не открытым финалом."
      ),
      buildVariant(
        "Если хотите, следующим постом разверну самый спорный блок этого разбора отдельно.",
        "Хорошо работает, когда thread должен закрыть мысль и одновременно открыть мягкий follow-up loop."
      ),
      buildVariant(
        "Если унести из этого thread один practical шаг, я бы начал именно отсюда.",
        "Подходит, когда хочется завершить post action-oriented CTA без тяжёлого sales-tone."
      )
    ]).slice(0, 3),
    usageNotes: buildUsageNotes([
      template.whenToUse,
      checklist.whenItMatters,
      "Лучше всего thread-хуки работают, когда первая строка обещает именно тот scope, который thread реально покрывает."
    ]),
    overuseWarning: checklist.avoidWarning ?? template.caution
  };
}

function buildMiniSeriesVariants(
  context: VariantsContext,
  angle: VariantAngle
): FormatOpeningClosingVariantSet {
  const template = context.templatesBucket.formatExecutionTemplates.miniSeriesTemplate;
  const rewrite = context.rewritesBucket.formatExampleRewrites.miniSeriesExample;
  const checklist = context.checklistsBucket.formatPublishChecklists.miniSeriesChecklist;

  return {
    openingVariants: dedupeByText([
      buildVariant(
        rewrite.rewrittenOpening,
        "Подходит, когда у вас уже есть предыдущий эпизод и можно быстро зацепиться за continuity без длинного контекста."
      ),
      buildVariant(
        "Продолжаю серию: сегодня только один следующий слой темы, без перезапуска всей рамки.",
        "Безопасный вариант, когда continuation должен быть понятен даже новым читателям."
      ),
      buildVariant(
        buildAngleSpecificOpening(angle, "miniSeries"),
        "Лучше работает, когда серия уже набрала ритм и можно чуть ярче подсветить текущий sub-angle."
      )
    ]).slice(0, 3),
    closingVariants: dedupeByText([
      buildVariant(
        buildAngleSpecificClosing(angle, "miniSeries"),
        "Хорошо работает, когда нужно естественно перебросить читателя к следующему эпизоду, а не обрывать серию."
      ),
      buildVariant(
        "Если этот слой был полезен, следующим эпизодом разберу самый спорный кусок отдельно.",
        "Подходит, когда аудиторию лучше вести через one-next-question, а не через общий CTA."
      ),
      buildVariant(
        "На сегодня takeaway такой: держите в голове только этот следующий decision point.",
        "Полезно, когда continuation должен закончиться узким выводом и не расползаться в новый mini-thread."
      )
    ]).slice(0, 3),
    usageNotes: buildUsageNotes([
      template.whenToUse,
      checklist.whenItMatters,
      "Mini-series hooks лучше работают, когда continuity можно назвать одной строкой и сразу сузить scope до одного следующего вопроса."
    ]),
    overuseWarning: checklist.avoidWarning ?? template.caution
  };
}

function buildQuoteFollowUpVariants(
  context: VariantsContext,
  angle: VariantAngle
): FormatOpeningClosingVariantSet {
  const template = context.templatesBucket.formatExecutionTemplates.quoteFollowUpTemplate;
  const rewrite = context.rewritesBucket.formatExampleRewrites.quoteFollowUpExample;
  const checklist = context.checklistsBucket.formatPublishChecklists.quoteFollowUpChecklist;

  return {
    openingVariants: dedupeByText([
      buildVariant(
        rewrite.rewrittenOpening,
        "Самый безопасный вариант, когда уже есть конкретный внешний trigger и вы хотите сразу показать свой frame."
      ),
      buildVariant(
        "Сильный тезис, но полезная рамка здесь выглядит немного иначе.",
        "Подходит, когда нужно дать мягкий disagreement без лишней агрессии в первой строке."
      ),
      buildVariant(
        buildAngleSpecificOpening(angle, "quoteFollowUp"),
        "Лучше работает, когда ниша допускает более реактивный или контрарный вход, но вам всё ещё нужен ясный собственный frame."
      )
    ]).slice(0, 3),
    closingVariants: dedupeByText([
      buildVariant(
        buildAngleSpecificClosing(angle, "quoteFollowUp"),
        "Подходит, когда нужно закончить реакцию одной useful implication, а не ещё одним слоем спора."
      ),
      buildVariant(
        "Если тема не затухнет, следующим постом отдельно покажу, где этот тезис реально ломается.",
        "Работает, когда quote-follow-up должен открыть reply-loop и не зависнуть как одиночная реакция."
      ),
      buildVariant(
        "Если коротко: смотреть теперь стоит не на сам шум, а на практический сигнал под ним.",
        "Удобно, когда нужен краткий closing без тяжёлого CTA, но с явным reframe."
      )
    ]).slice(0, 3),
    usageNotes: buildUsageNotes([
      template.whenToUse,
      checklist.whenItMatters,
      "Quote-follow-up hooks особенно важны там, где свой frame должен появиться в первых двух строках, иначе пост выглядит реакцией ради реакции."
    ]),
    overuseWarning: checklist.avoidWarning ?? template.caution
  };
}

function buildRecapVariants(
  context: VariantsContext,
  angle: VariantAngle
): FormatOpeningClosingVariantSet {
  const template = context.templatesBucket.formatExecutionTemplates.recapTemplate;
  const rewrite = context.rewritesBucket.formatExampleRewrites.recapExample;
  const checklist = context.checklistsBucket.formatPublishChecklists.recapChecklist;

  return {
    openingVariants: dedupeByText([
      buildVariant(
        rewrite.rewrittenOpening,
        "Подходит, когда у вас уже есть 2-3 сигнала цикла и можно быстро собрать их в одну рамку."
      ),
      buildVariant(
        "Если собрать последние 2 недели в один ясный вывод, картина выглядит так.",
        "Безопасный вариант, когда recap должен звучать как итог цикла, а не как новый standalone thread."
      ),
      buildVariant(
        buildAngleSpecificOpening(angle, "recap"),
        "Лучше работает, когда хочется сильнее подсветить, какой именно content pattern повторялся внутри ниши."
      )
    ]).slice(0, 3),
    closingVariants: dedupeByText([
      buildVariant(
        buildAngleSpecificClosing(angle, "recap"),
        "Используйте, когда recap должен мягко перекинуть аудиторию в следующий цикл и не закончиться просто summary-блоком."
      ),
      buildVariant(
        "Если продолжать цикл дальше, углублять стоит только тот сигнал, который повторился сильнее всего.",
        "Подходит, когда recap должен оставить one-next-step, а не просто красивый финал."
      ),
      buildVariant(
        "Если сократить всё до одного takeaway, именно этот паттерн стоит оставить, а остальное — вырезать.",
        "Хорошо работает, когда нужен более дисциплинированный closing без лишней драматизации."
      )
    ]).slice(0, 3),
    usageNotes: buildUsageNotes([
      template.whenToUse,
      checklist.whenItMatters,
      "Recap hooks лучше всего звучат в конце цикла, когда уже можно сводить наблюдения в одну рамку, а не перечислять ссылки."
    ]),
    overuseWarning: checklist.avoidWarning ?? template.caution
  };
}

function buildBucketVariants(context: VariantsContext): VariantsBucketWithMeta {
  const angle = inferAngle(context.templatesBucket.bestEntryAngleLabel);
  const threadVariants = buildThreadVariants(context, angle);
  const miniSeriesVariants = buildMiniSeriesVariants(context, angle);
  const quoteFollowUpVariants = buildQuoteFollowUpVariants(context, angle);
  const recapVariants = buildRecapVariants(context, angle);
  const threadFallback = isFallbackSource(
    context.rewritesBucket.formatExampleRewrites.threadExample.sourceCandidate
  );
  const quoteFallback = isFallbackSource(
    context.rewritesBucket.formatExampleRewrites.quoteFollowUpExample.sourceCandidate
  );
  const recapFallback = isFallbackSource(
    context.rewritesBucket.formatExampleRewrites.recapExample.sourceCandidate
  );
  const warningCount = [
    threadVariants.overuseWarning,
    miniSeriesVariants.overuseWarning,
    quoteFollowUpVariants.overuseWarning,
    recapVariants.overuseWarning
  ].filter(Boolean).length;

  const hookClarityScore =
    (threadFallback ? 0 : 3) +
    (quoteFallback ? 0 : 2) +
    (recapFallback ? 0 : 2) +
    (angle === "education" || angle === "benchmarkResults" || angle === "founderOperator"
      ? 1
      : 0) -
    warningCount * 0.5;
  const ctaLoopScore =
    context.repurposingBucket.quoteFollowUpCandidates.length * 2 +
    context.repurposingBucket.miniSeriesCandidates.length * 2 +
    (angle === "contrarian" || angle === "timelyNewsReactive" ? 2 : 0) +
    (angle === "education" || angle === "benchmarkResults" ? 1 : 0);
  const restraintScore =
    warningCount * 2 +
    (angle === "contrarian" || angle === "timelyNewsReactive" ? 2 : 0) +
    (quoteFallback ? 1 : 0);

  return {
    bucket: {
      bucketId: context.templatesBucket.bucketId,
      label: context.templatesBucket.label,
      rank: context.templatesBucket.rank,
      bestEntryAngleLabel: context.templatesBucket.bestEntryAngleLabel,
      formatOpeningClosingVariants: {
        threadVariants,
        miniSeriesVariants,
        quoteFollowUpVariants,
        recapVariants
      },
      variantsConfidenceNote:
        context.checklistsBucket.checklistConfidenceNote ??
        context.rewritesBucket.exampleRewriteConfidenceNote ??
        context.templatesBucket.templateConfidenceNote ??
        context.repurposingBucket.repurposingConfidenceNote ??
        null
    },
    hookClarityScore,
    ctaLoopScore,
    restraintScore
  };
}

function buildSummary(
  buckets: VariantsBucketWithMeta[]
): CrossNicheFormatOpeningClosingVariantsSummary {
  const hookLeader = buckets
    .slice()
    .sort((left, right) => right.hookClarityScore - left.hookClarityScore)[0];
  const ctaLeader = buckets
    .slice()
    .sort((left, right) => right.ctaLoopScore - left.ctaLoopScore)[0];
  const restraintLeader = buckets
    .slice()
    .sort((left, right) => right.restraintScore - left.restraintScore)[0];

  return {
    nicheWithClearestSafeHooks:
      hookLeader && hookLeader.hookClarityScore > 0
        ? buildLeader(
            hookLeader.bucket,
            "здесь безопасные hook-варианты читаются яснее других: source angles уже достаточно чёткие, чтобы не перегружать первую строку."
          )
        : null,
    nicheWithStrongestCtaReplyLoopPotential:
      ctaLeader && ctaLeader.ctaLoopScore > 0
        ? buildLeader(
            ctaLeader.bucket,
            "здесь сильнее всего видно, как closing может мягко переводить пост в цикл ответов, continuation или следующий practical follow-up."
          )
        : null,
    nicheWhereHooksNeedMostRestraint:
      restraintLeader && restraintLeader.restraintScore > 0
        ? buildLeader(
            restraintLeader.bucket,
            "здесь hooks и реактивные входы выглядят сильными, но именно поэтому их важнее дозировать и не передавливать ради внимания."
          )
        : null
  };
}

function buildSummaryText(summary: CrossNicheFormatOpeningClosingVariantsSummary) {
  const parts: string[] = [];

  if (summary.nicheWithClearestSafeHooks) {
    parts.push(
      `самые ясные безопасные hook-варианты сейчас у ${summary.nicheWithClearestSafeHooks.bucketLabel}`
    );
  }

  if (summary.nicheWithStrongestCtaReplyLoopPotential) {
    parts.push(
      `самый сильный потенциал мягкого CTA и follow-up сейчас у ${summary.nicheWithStrongestCtaReplyLoopPotential.bucketLabel}`
    );
  }

  if (summary.nicheWhereHooksNeedMostRestraint) {
    parts.push(
      `а сильнее всего сдерживать hooks сейчас нужно в ${summary.nicheWhereHooksNeedMostRestraint.bucketLabel}`
    );
  }

  if (parts.length === 0) {
    return "Opening и closing variants пока слишком слабы, чтобы уверенно сравнить shortlisted niches между собой.";
  }

  return `${parts.join(", ")}.`;
}

export function buildNicheFormatOpeningClosingVariants(
  shortlist: NicheShortlistResponse,
  existingRepurposing?: CrossNicheContentRepurposingHints | null,
  existingTemplates?: CrossNicheFormatExecutionTemplates | null,
  existingExampleRewrites?: CrossNicheFormatExampleRewrites | null,
  existingChecklists?: CrossNicheFormatPublishChecklists | null
): CrossNicheFormatOpeningClosingVariants {
  const repurposing =
    existingRepurposing ?? buildNicheContentRepurposingHints(shortlist);
  const templates =
    existingTemplates ??
    buildNicheFormatExecutionTemplates(
      shortlist,
      undefined,
      undefined,
      undefined,
      undefined,
      repurposing
    );
  const exampleRewrites =
    existingExampleRewrites ??
    buildNicheFormatExampleRewrites(
      shortlist,
      undefined,
      undefined,
      undefined,
      undefined,
      repurposing,
      templates
    );
  const checklists =
    existingChecklists ??
    buildNicheFormatPublishChecklists(
      shortlist,
      repurposing,
      templates,
      exampleRewrites
    );

  const perBucketVariantsWithMeta = templates.perBucketTemplates
    .map((templatesBucket) => {
      const repurposingBucket = repurposing.perBucketHints.find(
        (item) => item.bucketId === templatesBucket.bucketId
      );
      const rewritesBucket = exampleRewrites.perBucketRewrites.find(
        (item) => item.bucketId === templatesBucket.bucketId
      );
      const checklistsBucket = checklists.perBucketChecklists.find(
        (item) => item.bucketId === templatesBucket.bucketId
      );

      if (!repurposingBucket || !rewritesBucket || !checklistsBucket) {
        return null;
      }

      return buildBucketVariants({
        repurposingBucket,
        templatesBucket,
        rewritesBucket,
        checklistsBucket
      });
    })
    .filter((item): item is VariantsBucketWithMeta => item !== null);

  const summary = buildSummary(perBucketVariantsWithMeta);
  const confidenceNotesCount = perBucketVariantsWithMeta.filter(
    (item) => item.bucket.variantsConfidenceNote
  ).length;

  return {
    comparedBucketCount: shortlist.rankedBuckets.length,
    comparableBucketCount: perBucketVariantsWithMeta.length,
    variantsSummary: buildSummaryText(summary),
    perBucketVariants: perBucketVariantsWithMeta.map((item) => item.bucket),
    summary,
    globalConfidenceNote:
      confidenceNotesCount > 0
        ? "Часть hook и CTA вариантов собрана поверх rule-based templates, rewrite skeletons и checklist hints, поэтому их лучше читать как безопасные ручные варианты, а не как готовую авто-генерацию финального текста."
        : null
  };
}
