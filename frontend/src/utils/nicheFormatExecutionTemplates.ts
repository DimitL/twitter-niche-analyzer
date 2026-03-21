import type {
  CrossNicheContentCalendarAdaptation,
  NicheContentCalendarAdaptationBucket
} from "./nicheContentCalendarAdaptation.js";
import { buildNicheContentCalendarAdaptation } from "./nicheContentCalendarAdaptation.js";
import type {
  CrossNicheContentRepurposingHints,
  NicheContentRepurposingHintsBucket
} from "./nicheContentRepurposingHints.js";
import { buildNicheContentRepurposingHints } from "./nicheContentRepurposingHints.js";
import type {
  CrossNicheContentCalendarStarter,
  NicheContentCalendarStarterBucket
} from "./nicheContentCalendarStarter.js";
import { buildNicheContentCalendarStarter } from "./nicheContentCalendarStarter.js";
import type { NicheShortlistResponse } from "../types/nicheShortlist.js";
import type {
  CrossNichePositioningPlaybook,
  NichePositioningPlaybookBucket,
  NichePositioningPlaybookLeader
} from "./nichePositioningPlaybook.js";
import { buildNichePositioningPlaybook } from "./nichePositioningPlaybook.js";
import type {
  CrossNicheRepeatableContentSeries,
  NicheRepeatableContentSeriesBucket
} from "./nicheRepeatableContentSeries.js";
import { buildNicheRepeatableContentSeries } from "./nicheRepeatableContentSeries.js";

type TemplateFormat = "thread" | "miniSeries" | "quoteFollowUp" | "recap";
type PositioningAngle =
  | "education"
  | "contrarian"
  | "founderOperator"
  | "benchmarkResults"
  | "timelyNewsReactive"
  | "narrativeStorytelling";

export interface FormatExecutionTemplate {
  templateTitle: string;
  whenToUse: string;
  structureBlocks: string[];
  openingPattern: string;
  whyItFits: string;
  caution: string | null;
}

export interface NicheFormatExecutionTemplatesBucket {
  bucketId: string;
  label: string;
  rank: number | null;
  bestEntryAngleLabel: string | null;
  formatExecutionTemplates: {
    threadTemplate: FormatExecutionTemplate;
    miniSeriesTemplate: FormatExecutionTemplate;
    quoteFollowUpTemplate: FormatExecutionTemplate;
    recapTemplate: FormatExecutionTemplate;
  };
  templateConfidenceNote: string | null;
}

export interface CrossNicheFormatExecutionTemplatesSummary {
  nicheWithClearestThreadFormat: NichePositioningPlaybookLeader | null;
  nicheWithEasiestQuoteFollowUpLoop: NichePositioningPlaybookLeader | null;
  nicheWithStrongestRecapPotential: NichePositioningPlaybookLeader | null;
}

export interface CrossNicheFormatExecutionTemplates {
  comparedBucketCount: number;
  comparableBucketCount: number;
  templatesSummary: string;
  perBucketTemplates: NicheFormatExecutionTemplatesBucket[];
  summary: CrossNicheFormatExecutionTemplatesSummary;
  globalConfidenceNote: string | null;
}

interface TemplateContext {
  playbookBucket: NichePositioningPlaybookBucket;
  repeatableBucket: NicheRepeatableContentSeriesBucket;
  calendarBucket: NicheContentCalendarStarterBucket;
  adaptationBucket: NicheContentCalendarAdaptationBucket;
  repurposingBucket: NicheContentRepurposingHintsBucket;
}

interface TemplateBucketWithMeta {
  bucket: NicheFormatExecutionTemplatesBucket;
  threadScore: number;
  quoteScore: number;
  recapScore: number;
}

function dedupeItems<T>(items: T[]) {
  return Array.from(new Set(items));
}

function getBestAngle(context: TemplateContext): PositioningAngle | null {
  return context.playbookBucket.bestEntryAngle?.angle ?? null;
}

function buildLeader(
  bucket: NicheFormatExecutionTemplatesBucket,
  reason: string
): NichePositioningPlaybookLeader {
  return {
    bucketId: bucket.bucketId,
    bucketLabel: bucket.label,
    rank: bucket.rank,
    reason
  };
}

function buildUsageLabel(
  slots: string[],
  fallback: string
) {
  const uniqueSlots = dedupeItems(slots);

  if (uniqueSlots.length === 0) {
    return fallback;
  }

  return `Лучше всего использовать после слотов ${uniqueSlots.join(", ")}, когда материал уже просится в следующий формат, а не в новый пост с нуля.`;
}

function buildThreadOpeningPattern(angle: PositioningAngle | null) {
  switch (angle) {
    case "education":
      return "Если разложить этот тезис без лишнего шума, картина такая:";
    case "contrarian":
      return "Непопулярный вывод: главный сигнал здесь читают слишком поверхностно.";
    case "founderOperator":
      return "Если смотреть на это как operator, я бы начал с трёх вещей:";
    case "benchmarkResults":
      return "Вот что реально показал этот кейс, если убрать шум вокруг него:";
    case "timelyNewsReactive":
      return "Этот повод кажется громким, но реально важнее вот что:";
    case "narrativeStorytelling":
      return "Короткая история, которая объясняет тему лучше любого hot take:";
    default:
      return "Если собрать это в один понятный ход, структура такая:";
  }
}

function buildMiniSeriesOpeningPattern(angle: PositioningAngle | null) {
  switch (angle) {
    case "education":
      return "Продолжаю короткую серию: сегодня разбираем ещё один слой этой темы.";
    case "contrarian":
      return "В прошлый раз я спорил с общим тезисом, а теперь покажу следующий кусок рамки.";
    case "founderOperator":
      return "Продолжение operator-серии: сегодня один более узкий decision point.";
    case "benchmarkResults":
      return "Вторая часть серии: что показывает следующий результат, если смотреть на него трезво.";
    case "timelyNewsReactive":
      return "Продолжение быстрой серии: что изменилось после первого новостного вывода.";
    case "narrativeStorytelling":
      return "Продолжу историю ещё одним эпизодом, но уже с более прикладным выводом.";
    default:
      return "Продолжение серии: сегодня берём ещё один узкий угол той же темы.";
  }
}

function buildQuoteOpeningPattern(angle: PositioningAngle | null) {
  switch (angle) {
    case "contrarian":
      return "В этом тезисе упускают одну важную вещь:";
    case "timelyNewsReactive":
      return "Эта новость выглядит громко, но её practical implication вот в чём:";
    case "benchmarkResults":
      return "Из этого вывода делают слишком быстрый вывод. Важнее смотреть на другое:";
    default:
      return "Сильный тезис, но рамка у него неполная. Я бы смотрел так:";
  }
}

function buildRecapOpeningPattern(angle: PositioningAngle | null) {
  switch (angle) {
    case "education":
      return "За эти 2 недели стало видно, какие объясняющие углы реально держат внимание:";
    case "contrarian":
      return "Соберу в одно место, какие disagreement-углы оказались действительно рабочими:";
    case "founderOperator":
      return "Короткий итог цикла: что из operator-углов оказалось самым полезным:";
    case "benchmarkResults":
      return "Если собрать все результативные сигналы вместе, вывод получается такой:";
    case "timelyNewsReactive":
      return "Быстрый recap: какие новостные углы дали реальную пользу, а какие только шум:";
    case "narrativeStorytelling":
      return "Подведу итог цикла через 3 коротких story-driven вывода:";
    default:
      return "Короткий recap цикла: вот что реально стоит забрать дальше.";
  }
}

function buildThreadStructure(angle: PositioningAngle | null) {
  const common = [
    "Открывающий тезис: что именно вы хотите переобъяснить, переоценить или проверить.",
    "2-4 коротких шага: один тезис или один сигнал на один блок.",
    "Финальный practical takeaway: что аудитории делать с этим выводом дальше."
  ];

  if (angle === "benchmarkResults") {
    return [
      "Короткий claim: какой результат или benchmark вообще стоит разбирать.",
      "Baseline: по какому критерию вы оцениваете ситуацию.",
      "2-3 наблюдения: что реально сработало, а что только выглядело сильным.",
      "Финальный вывод: какой следующий шаг теперь выглядит разумнее."
    ];
  }

  if (angle === "founderOperator") {
    return [
      "Decision point: какое решение или trade-off вы ставите в центр thread.",
      "Контекст: почему этот выбор вообще важен внутри ниши.",
      "2-3 operator-наблюдения: что стоит проверить, прежде чем спорить о результате.",
      "Закрывающий takeaway: какая рабочая рамка остаётся у читателя."
    ];
  }

  return common;
}

function buildMiniSeriesStructure(angle: PositioningAngle | null) {
  if (angle === "timelyNewsReactive") {
    return [
      "Напомните, какой предыдущий эпизод или news-angle вы продолжаете.",
      "Возьмите один узкий сдвиг: что изменилось после первого вывода.",
      "Один пример или реакция рынка: без перегруза, но с контекстом.",
      "Закройте пост bridge-фразой: какой следующий эпизод логично продолжит серию."
    ];
  }

  return [
    "Откройте пост короткой связкой с предыдущим эпизодом серии.",
    "Возьмите только один узкий под-вопрос, а не всю тему заново.",
    "Дайте один пример, кейс или mini-breakdown.",
    "Закройте continuation-мостом: что логично развернуть следующим постом."
  ];
}

function buildQuoteStructure() {
  return [
    "Один внешний триггер: тезис, новость или спорный claim.",
    "Одной строкой обозначьте, что в этом триггере упущено.",
    "Дайте свою рамку или practical implication.",
    "Закройте пост коротким выводом: что аудитории теперь важно отслеживать."
  ];
}

function buildRecapStructure() {
  return [
    "Соберите 2-3 ключевых наблюдения из последних слотов или серии.",
    "Сведите их в одну общую рамку: что реально повторяется.",
    "Отделите рабочее от шумного: что стоит продолжать, а что убрать.",
    "Закройте recap следующим шагом или направлением следующего цикла."
  ];
}

function buildThreadTemplate(context: TemplateContext): FormatExecutionTemplate {
  const slots = context.repurposingBucket.threadCandidates
    .slice(0, 2)
    .map((candidate) => `${candidate.slotLabel} · ${candidate.seriesTitle}`);
  const angle = getBestAngle(context);
  const firstCandidate = context.repurposingBucket.threadCandidates[0];

  return {
    templateTitle: "Thread: от hook к развернутому выводу",
    whenToUse: buildUsageLabel(
      slots,
      "Используйте, когда одиночный слот уже не помещает в себя все шаги аргумента и просит 3-5 коротких блоков."
    ),
    structureBlocks: buildThreadStructure(angle),
    openingPattern: buildThreadOpeningPattern(angle),
    whyItFits:
      firstCandidate?.fitReason ??
      context.repurposingBucket.whyTheseFormatsFit[0] ??
      "Этот формат подходит, когда внутри слота уже есть несколько логических шагов, а не один короткий тезис.",
    caution:
      firstCandidate?.cautionNote ??
      context.repurposingBucket.overuseWarnings[0] ??
      "Не растягивайте thread, если у вас нет хотя бы 2-3 самостоятельных блоков, а не одного длинного абзаца."
  };
}

function buildMiniSeriesTemplate(context: TemplateContext): FormatExecutionTemplate {
  const slots = context.repurposingBucket.miniSeriesCandidates
    .slice(0, 2)
    .map((candidate) => `${candidate.slotLabel} · ${candidate.seriesTitle}`);
  const angle = getBestAngle(context);
  const firstCandidate = context.repurposingBucket.miniSeriesCandidates[0];

  return {
    templateTitle: "Mini-series continuation: следующий эпизод без перезапуска",
    whenToUse: buildUsageLabel(
      slots,
      "Используйте, когда одна серия уже дала понятный первый сигнал и её легче продолжить, чем заново придумывать новый формат."
    ),
    structureBlocks: buildMiniSeriesStructure(angle),
    openingPattern: buildMiniSeriesOpeningPattern(angle),
    whyItFits:
      firstCandidate?.fitReason ??
      context.repurposingBucket.whyTheseFormatsFit[1] ??
      "Этот формат подходит, когда вы хотите закрепить повторяемый series-loop, а не собирать каждую публикацию как отдельный эксперимент.",
    caution:
      firstCandidate?.cautionNote ??
      context.repeatableBucket.repeatableContentSeries[0]?.genericityWarning ??
      "Не делайте continuation слишком общим: новый эпизод должен отвечать только на один следующий под-вопрос."
  };
}

function buildQuoteFollowUpTemplate(context: TemplateContext): FormatExecutionTemplate {
  const slots = context.repurposingBucket.quoteFollowUpCandidates
    .slice(0, 2)
    .map((candidate) => `${candidate.slotLabel} · ${candidate.seriesTitle}`);
  const angle = getBestAngle(context);
  const firstCandidate = context.repurposingBucket.quoteFollowUpCandidates[0];

  return {
    templateTitle: "Quote-follow-up: реакция с собственной рамкой",
    whenToUse: buildUsageLabel(
      slots,
      "Используйте, когда слот цепляется за чужой тезис, новость или спорный claim и его проще добить через реакцию, а не через новый standalone пост."
    ),
    structureBlocks: buildQuoteStructure(),
    openingPattern: buildQuoteOpeningPattern(angle),
    whyItFits:
      firstCandidate?.fitReason ??
      "Этот формат подходит, когда ценность поста не в пересказе чужого сигнала, а в вашей рамке и practical implication поверх него.",
    caution:
      firstCandidate?.cautionNote ??
      context.repurposingBucket.overuseWarnings.find((warning) =>
        warning.toLowerCase().includes("quote")
      ) ??
      "Не стройте весь цикл на quote-follow-up: без собственного тезиса и рамки он быстро превращается в реакцию ради реакции."
  };
}

function buildRecapTemplate(context: TemplateContext): FormatExecutionTemplate {
  const slots = context.repurposingBucket.recapCandidates
    .slice(0, 2)
    .map((candidate) => `${candidate.slotLabel} · ${candidate.seriesTitle}`);
  const angle = getBestAngle(context);
  const firstCandidate = context.repurposingBucket.recapCandidates[0];

  return {
    templateTitle: "Recap: сводка цикла с выводом",
    whenToUse: buildUsageLabel(
      slots,
      "Используйте ближе к концу 2-week цикла, когда уже есть 2-3 наблюдения, которые стоит собрать в одну рамку."
    ),
    structureBlocks: buildRecapStructure(),
    openingPattern: buildRecapOpeningPattern(angle),
    whyItFits:
      firstCandidate?.fitReason ??
      "Этот формат подходит, когда календарь уже дал несколько кусочков сигнала и их нужно собрать в ясный итог, а не продолжать разрозненно.",
    caution:
      firstCandidate?.cautionNote ??
      context.repurposingBucket.overuseWarnings.find((warning) =>
        warning.toLowerCase().includes("recap")
      ) ??
      "Не превращайте recap в сухой список ссылок: у него должна оставаться одна итоговая рамка и один следующий шаг."
  };
}

function buildBucketTemplates(context: TemplateContext): TemplateBucketWithMeta {
  const threadTemplate = buildThreadTemplate(context);
  const miniSeriesTemplate = buildMiniSeriesTemplate(context);
  const quoteFollowUpTemplate = buildQuoteFollowUpTemplate(context);
  const recapTemplate = buildRecapTemplate(context);
  const angle = getBestAngle(context);
  const threadScore =
    context.repurposingBucket.threadCandidates.length * 3 +
    (angle === "education" || angle === "benchmarkResults" || angle === "founderOperator"
      ? 2
      : 0);
  const quoteScore =
    context.repurposingBucket.quoteFollowUpCandidates.length * 3 +
    (angle === "contrarian" || angle === "timelyNewsReactive" ? 2 : 0);
  const recapScore =
    context.repurposingBucket.recapCandidates.length * 3 +
    (angle === "education" || angle === "benchmarkResults" ? 1 : 0);

  return {
    bucket: {
      bucketId: context.calendarBucket.bucketId,
      label: context.calendarBucket.label,
      rank: context.calendarBucket.rank,
      bestEntryAngleLabel: context.calendarBucket.bestEntryAngleLabel,
      formatExecutionTemplates: {
        threadTemplate,
        miniSeriesTemplate,
        quoteFollowUpTemplate,
        recapTemplate
      },
      templateConfidenceNote:
        context.repurposingBucket.repurposingConfidenceNote ??
        context.adaptationBucket.adaptationConfidenceNote ??
        context.calendarBucket.calendarConfidenceNote ??
        context.playbookBucket.playbookConfidenceNote ??
        null
    },
    threadScore,
    quoteScore,
    recapScore
  };
}

function buildSummary(
  buckets: TemplateBucketWithMeta[]
): CrossNicheFormatExecutionTemplatesSummary {
  const threadLeader = buckets
    .slice()
    .sort((left, right) => right.threadScore - left.threadScore)[0];
  const quoteLeader = buckets
    .slice()
    .sort((left, right) => right.quoteScore - left.quoteScore)[0];
  const recapLeader = buckets
    .slice()
    .sort((left, right) => right.recapScore - left.recapScore)[0];

  return {
    nicheWithClearestThreadFormat:
      threadLeader && threadLeader.threadScore > 0
        ? buildLeader(
            threadLeader.bucket,
            "здесь thread-формат читается яснее других: сильные слоты уже готовы к 3-5 пошаговым блокам, а не к одному короткому посту."
          )
        : null,
    nicheWithEasiestQuoteFollowUpLoop:
      quoteLeader && quoteLeader.quoteScore > 0
        ? buildLeader(
            quoteLeader.bucket,
            "здесь легче всего строить quote-follow-up loop: реактивные или спорные слоты уже дают понятный внешний триггер для продолжения."
          )
        : null,
    nicheWithStrongestRecapPotential:
      recapLeader && recapLeader.recapScore > 0
        ? buildLeader(
            recapLeader.bucket,
            "здесь recap работает особенно естественно: в цикле уже достаточно наблюдений, чтобы собирать их в одну понятную рамку."
          )
        : null
  };
}

function buildSummaryText(summary: CrossNicheFormatExecutionTemplatesSummary) {
  const parts: string[] = [];

  if (summary.nicheWithClearestThreadFormat) {
    parts.push(
      `самый ясный thread-format сейчас читается в ${summary.nicheWithClearestThreadFormat.bucketLabel}`
    );
  }

  if (summary.nicheWithEasiestQuoteFollowUpLoop) {
    parts.push(
      `проще всего собирать quote-follow-up loop в ${summary.nicheWithEasiestQuoteFollowUpLoop.bucketLabel}`
    );
  }

  if (summary.nicheWithStrongestRecapPotential) {
    parts.push(
      `самый сильный recap potential сейчас у ${summary.nicheWithStrongestRecapPotential.bucketLabel}`
    );
  }

  if (parts.length === 0) {
    return "Execution templates пока слишком слабы, чтобы уверенно сравнить shortlisted niches между собой.";
  }

  return `${parts[0]}${parts.length > 1 ? `, а ${parts.slice(1).join(", а ")}` : ""}.`;
}

export function buildNicheFormatExecutionTemplates(
  shortlist: NicheShortlistResponse,
  existingPlaybook?: CrossNichePositioningPlaybook | null,
  existingRepeatableSeries?: CrossNicheRepeatableContentSeries | null,
  existingCalendar?: CrossNicheContentCalendarStarter | null,
  existingAdaptation?: CrossNicheContentCalendarAdaptation | null,
  existingRepurposing?: CrossNicheContentRepurposingHints | null
): CrossNicheFormatExecutionTemplates {
  const playbook = existingPlaybook ?? buildNichePositioningPlaybook(shortlist);
  const repeatableSeries =
    existingRepeatableSeries ?? buildNicheRepeatableContentSeries(shortlist, playbook);
  const calendar =
    existingCalendar ??
    buildNicheContentCalendarStarter(shortlist, playbook, repeatableSeries);
  const adaptation =
    existingAdaptation ??
    buildNicheContentCalendarAdaptation(
      shortlist,
      playbook,
      repeatableSeries,
      calendar
    );
  const repurposing =
    existingRepurposing ??
    buildNicheContentRepurposingHints(
      shortlist,
      playbook,
      repeatableSeries,
      calendar,
      adaptation
    );
  const perBucketTemplatesWithMeta = calendar.perBucketCalendars
    .map((calendarBucket) => {
      const playbookBucket = playbook.perBucketPlaybooks.find(
        (item) => item.bucketId === calendarBucket.bucketId
      );
      const repeatableBucket = repeatableSeries.perBucketSeries.find(
        (item) => item.bucketId === calendarBucket.bucketId
      );
      const adaptationBucket = adaptation.perBucketAdaptations.find(
        (item) => item.bucketId === calendarBucket.bucketId
      );
      const repurposingBucket = repurposing.perBucketHints.find(
        (item) => item.bucketId === calendarBucket.bucketId
      );

      if (!playbookBucket || !repeatableBucket || !adaptationBucket || !repurposingBucket) {
        return null;
      }

      return buildBucketTemplates({
        playbookBucket,
        repeatableBucket,
        calendarBucket,
        adaptationBucket,
        repurposingBucket
      });
    })
    .filter((item): item is TemplateBucketWithMeta => Boolean(item));
  const summary = buildSummary(perBucketTemplatesWithMeta);

  return {
    comparedBucketCount: shortlist.rankedBuckets.length,
    comparableBucketCount: perBucketTemplatesWithMeta.length,
    templatesSummary: buildSummaryText(summary),
    perBucketTemplates: perBucketTemplatesWithMeta.map((item) => item.bucket),
    summary,
    globalConfidenceNote:
      perBucketTemplatesWithMeta.length < 2
        ? "Сейчас shortlist слишком маленький для уверенного сравнения format templates между нишами."
        : repurposing.globalConfidenceNote ??
          adaptation.globalConfidenceNote ??
          calendar.globalConfidenceNote ??
          repeatableSeries.globalConfidenceNote ??
          playbook.globalConfidenceNote ??
          null
  };
}
