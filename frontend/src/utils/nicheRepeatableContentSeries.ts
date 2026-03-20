import type {
  NicheShortlistContentPatternTag,
  NicheShortlistResponse,
  RankedNicheShortlistBucket
} from "../types/nicheShortlist.js";
import { buildNicheEvidencePack } from "./nicheEvidencePack.js";
import type {
  CrossNichePositioningPlaybook,
  NichePositioningPlaybookBucket,
  NichePositioningPlaybookLeader
} from "./nichePositioningPlaybook.js";
import { buildNichePositioningPlaybook } from "./nichePositioningPlaybook.js";

export interface RepeatableContentSeriesItem {
  seriesTitle: string;
  seriesPurpose: string;
  repeatedAngle: string;
  examplePostAngles: string[];
  cadenceHint: string | null;
  genericityWarning: string | null;
}

export interface NicheRepeatableContentSeriesBucket {
  bucketId: string;
  label: string;
  rank: number | null;
  playbookTitle: string;
  bestEntryAngleLabel: string | null;
  repeatableContentSeries: RepeatableContentSeriesItem[];
  seriesConfidenceNote: string | null;
}

export interface CrossNicheRepeatableContentSeriesSummary {
  nicheWithStrongestRepeatableSeriesPotential: NichePositioningPlaybookLeader | null;
  nicheWithEasiestConsistentPostingCadence: NichePositioningPlaybookLeader | null;
  nicheWithMostDifferentiatedSeriesIdeas: NichePositioningPlaybookLeader | null;
}

export interface CrossNicheRepeatableContentSeries {
  comparedBucketCount: number;
  comparableBucketCount: number;
  seriesSummary: string;
  perBucketSeries: NicheRepeatableContentSeriesBucket[];
  summary: CrossNicheRepeatableContentSeriesSummary;
  globalConfidenceNote: string | null;
}

interface SeriesContext {
  bucket: RankedNicheShortlistBucket;
  playbookBucket: NichePositioningPlaybookBucket;
  evidence: ReturnType<typeof buildNicheEvidencePack>;
  bucketLabel: string;
  dominantPatternLabel: string;
  whitespacePatternLabel: string;
  secondaryPatternLabel: string;
  archetypeLabel: string;
}

type PatternSeriesMode = "dominant" | "whitespace" | "secondary";

const patternLabelMap: Record<NicheShortlistContentPatternTag, string> = {
  strongHook: "сильный hook",
  contrarianTake: "контрарный угол",
  productUpdate: "продуктовый апдейт",
  benchmarkOrResult: "результаты и benchmark",
  educationalBreakdown: "обучающий breakdown",
  founderInsight: "founder/operator perspective",
  timelyNewsTieIn: "привязка к актуальной новости",
  audienceQuestion: "question-led вовлечение",
  narrativeStorytelling: "нарративный storytelling"
};

function getPatternLabel(value?: NicheShortlistContentPatternTag) {
  if (!value) {
    return "понятный прикладной угол";
  }

  return patternLabelMap[value];
}

function dedupeItems<T>(items: T[]) {
  return Array.from(new Set(items));
}

function dedupeSeries(items: RepeatableContentSeriesItem[]) {
  const seenKeys = new Set<string>();

  return items.filter((item) => {
    const key = `${item.seriesTitle}::${item.repeatedAngle}`;

    if (seenKeys.has(key)) {
      return false;
    }

    seenKeys.add(key);
    return true;
  });
}

function buildContext(
  bucket: RankedNicheShortlistBucket,
  playbookBucket: NichePositioningPlaybookBucket
): SeriesContext {
  const evidence = buildNicheEvidencePack(bucket);

  return {
    bucket,
    playbookBucket,
    evidence,
    bucketLabel: bucket.label,
    dominantPatternLabel: getPatternLabel(bucket.dominantNichePatterns[0]),
    whitespacePatternLabel: getPatternLabel(evidence.underrepresentedPatterns[0]),
    secondaryPatternLabel: getPatternLabel(bucket.secondaryNichePatterns[0]),
    archetypeLabel: bucket.commonArchetypes[0]?.label ?? "сильный голос ниши"
  };
}

function buildCoreSeries(context: SeriesContext): RepeatableContentSeriesItem {
  const angle = context.playbookBucket.bestEntryAngle?.angle ?? "education";
  const warning = context.playbookBucket.weakAngleWarnings[0] ?? null;

  switch (angle) {
    case "education":
      return {
        seriesTitle: "Разбираем сложное без перегруза",
        seriesPurpose:
          `Закрепить роль понятного проводника по ${context.bucketLabel} через регулярные explainers.`,
        repeatedAngle:
          `Один сложный сигнал в ${context.bucketLabel} -> одно простое объяснение -> один практический вывод.`,
        examplePostAngles: [
          `Что в ${context.bucketLabel} чаще всего понимают неправильно и как это быстро поправить.`,
          `Один спорный тезис в ${context.bucketLabel}, переведённый на человеческий язык.`,
          `Мини-framework: как читать ${context.dominantPatternLabel} без лишнего шума.`
        ],
        cadenceHint: "1-2 раза в неделю",
        genericityWarning:
          warning ??
          "Не превращайте серию в общие обзоры без конкретного тезиса и одного ясного вывода."
      };
    case "contrarian":
      return {
        seriesTitle: "Спокойный disagreement недели",
        seriesPurpose:
          `Занять более острый, но доказательный угол внутри ${context.bucketLabel} без дешёвой провокации.`,
        repeatedAngle:
          `Шумный consensus в ${context.bucketLabel} -> что в нём переоценивают -> что важнее смотреть вместо этого.`,
        examplePostAngles: [
          `Какой тезис в ${context.bucketLabel} сейчас читают слишком поверхностно.`,
          `Что в ${context.bucketLabel} переоценено, а что остаётся недосмотренным.`,
          `Почему перегретый ${context.dominantPatternLabel} не всегда значит то, что в него вкладывают.`
        ],
        cadenceHint: "1 раз в неделю",
        genericityWarning:
          warning ??
          "Не уходите в чистую полемику: каждый disagreement должен заканчиваться более сильной рамкой или критерием."
      };
    case "founderOperator":
      return {
        seriesTitle: "Operator memo изнутри",
        seriesPurpose:
          `Добавить в ${context.bucketLabel} практический operator/founder голос, а не просто внешнее комментирование.`,
        repeatedAngle:
          `Один trade-off или decision point -> как бы его решал практик внутри ${context.bucketLabel}.`,
        examplePostAngles: [
          `Какой decision framework реально полезен внутри ${context.bucketLabel}.`,
          `Один practical trade-off в ${context.bucketLabel}, который редко разбирают публично.`,
          `Как перевести ${context.whitespacePatternLabel} в рабочую operator-логику.`
        ],
        cadenceHint: "1-2 раза в неделю",
        genericityWarning:
          warning ??
          "Не имитируйте operator-voice без реальных решений, trade-offs или практического опыта."
      };
    case "benchmarkResults":
      return {
        seriesTitle: "Что реально сработало",
        seriesPurpose:
          `Сделать ${context.bucketLabel} более доказательной нишей через регулярные outcomes, benchmarks и результативные сравнения.`,
        repeatedAngle:
          `Один подход -> наблюдаемый результат -> короткий practical takeaway для аудитории.`,
        examplePostAngles: [
          `Какой benchmark по ${context.bucketLabel} полезнее десяти горячих takes.`,
          `Что в ${context.bucketLabel} выглядело сильнее, чем оказалось на деле.`,
          `Как перевести ${context.dominantPatternLabel} в более проверяемую подачу.`
        ],
        cadenceHint: "1 раз в неделю",
        genericityWarning:
          warning ??
          "Не обещайте «результаты», если внутри серии нет baseline, критерия сравнения или хотя бы одного проверяемого исхода."
      };
    case "timelyNewsReactive":
      return {
        seriesTitle: "Что реально значит новость",
        seriesPurpose:
          `Занять быстрый news-reactive угол внутри ${context.bucketLabel}, но не сваливаться в пересказ ленты.`,
        repeatedAngle:
          `Свежий инфоповод -> что он меняет на практике -> какой вывод важен именно для этой ниши.`,
        examplePostAngles: [
          `Главная новость дня по ${context.bucketLabel} и что она реально меняет.`,
          `Почему этот повод в ${context.bucketLabel} важен не по той причине, о которой спорят все.`,
          `Как использовать ${context.whitespacePatternLabel} как более редкий новостной угол входа.`
        ],
        cadenceHint: "2-3 раза в неделю, если есть новости",
        genericityWarning:
          warning ??
          "Не стройте серию на простом пересказе событий: нужен свой фильтр и один конкретный implication."
      };
    case "narrativeStorytelling":
      return {
        seriesTitle: "История с практическим выводом",
        seriesPurpose:
          `Сделать ${context.bucketLabel} более живой через короткие истории, которые всё равно заканчиваются пользой.`,
        repeatedAngle:
          `Короткий сюжет или наблюдение -> один lesson -> один вывод, применимый в ${context.bucketLabel}.`,
        examplePostAngles: [
          `Одна история, через которую ${context.bucketLabel} становится понятнее человеку вне bubble.`,
          `Before/after кейс, который лучше объясняет тему, чем очередной hot take.`,
          `Как ${context.archetypeLabel} превращает сухой ${context.dominantPatternLabel} в запоминающийся storytelling.`
        ],
        cadenceHint: "1 раз в неделю",
        genericityWarning:
          warning ??
          "Не делайте историю самоцелью: в конце всегда должен оставаться полезный, повторяемый вывод."
      };
    default:
      return {
        seriesTitle: "Повторяемый основной угол",
        seriesPurpose: `Сделать вход в ${context.bucketLabel} более системным и узнаваемым.`,
        repeatedAngle: `Один наблюдаемый сигнал в ${context.bucketLabel} -> один вывод -> одно действие для аудитории.`,
        examplePostAngles: [
          `Какой сигнал в ${context.bucketLabel} стоит разбирать регулярно.`,
          `Что в ${context.bucketLabel} чаще всего требует ясного объяснения.`,
          `Как сделать ${context.dominantPatternLabel} более полезным для читателя.`
        ],
        cadenceHint: "1-2 раза в неделю",
        genericityWarning: warning
      };
  }
}

function buildPatternSeries(
  pattern: NicheShortlistContentPatternTag | undefined,
  context: SeriesContext,
  mode: PatternSeriesMode
): RepeatableContentSeriesItem | null {
  if (!pattern) {
    return null;
  }

  const prefix =
    mode === "whitespace"
      ? "Незаполненный угол"
      : mode === "secondary"
        ? "Второй рабочий формат"
        : "Серия на базе сильного паттерна";

  switch (pattern) {
    case "educationalBreakdown":
      return {
        seriesTitle:
          mode === "whitespace"
            ? "Объясняем там, где ниша пока сухая"
            : `${prefix}: быстрые breakdown-посты`,
        seriesPurpose:
          mode === "whitespace"
            ? `Закрыть слабое место ниши через понятные объясняющие посты по ${context.bucketLabel}.`
            : `Сделать ${context.bucketLabel} более понятной и полезной через регулярные короткие разборы.`,
        repeatedAngle:
          `Один тезис -> одно объяснение -> один practical takeaway вокруг ${context.bucketLabel}.`,
        examplePostAngles: [
          `Как читать сложный сигнал в ${context.bucketLabel} без jargon.`,
          `Один спорный вопрос в ${context.bucketLabel}, разобранный по шагам.`,
          `Мини-framework для темы, которую аудитория чаще всего переусложняет.`
        ],
        cadenceHint: "1-2 раза в неделю",
        genericityWarning:
          "Не делайте breakdown слишком широким: серия сильнее, когда в каждом посте есть один узкий тезис."
      };
    case "benchmarkOrResult":
      return {
        seriesTitle:
          mode === "whitespace"
            ? "Результаты там, где их пока мало"
            : `${prefix}: outcomes вместо шума`,
        seriesPurpose:
          `Усилить доверие к ${context.bucketLabel} через повторяемые result-led посты и короткие benchmarks.`,
        repeatedAngle:
          `Один подход -> что получилось на деле -> что это значит для следующего шага.`,
        examplePostAngles: [
          `Один benchmark, который важнее обсуждать, чем сам инфоповод.`,
          `Что в ${context.bucketLabel} реально сработало, а что только казалось сильным.`,
          `Как сравнить два подхода в ${context.bucketLabel} без лишнего шума.`
        ],
        cadenceHint: "1 раз в неделю",
        genericityWarning:
          "Не обещайте серьёзную доказательность без baseline, критерия и хотя бы минимального outcome."
      };
    case "contrarianTake":
      return {
        seriesTitle:
          mode === "whitespace"
            ? "Спокойный contrarian там, где его не хватает"
            : `${prefix}: disagreement с рамкой`,
        seriesPurpose:
          `Выделиться внутри ${context.bucketLabel} через более трезвую и хорошо аргументированную полемику.`,
        repeatedAngle:
          `Популярный consensus -> где он ошибается -> какой критерий полезнее для аудитории.`,
        examplePostAngles: [
          `Какой шумный тезис по ${context.bucketLabel} сейчас стоит читать иначе.`,
          `Что в ${context.bucketLabel} переоценивают почти все.`,
          `Почему один доминирующий сигнал даёт ложное ощущение ясности.`
        ],
        cadenceHint: "1 раз в неделю",
        genericityWarning:
          "Не превращайте серию в спор ради спора: нужен свой критерий и более сильная альтернатива."
      };
    case "productUpdate":
      return {
        seriesTitle:
          mode === "whitespace"
            ? "Shipping-угол там, где его мало"
            : `${prefix}: shipping и product signals`,
        seriesPurpose:
          `Сместить ${context.bucketLabel} к более практичной и наблюдаемой подаче через product updates и concrete changes.`,
        repeatedAngle:
          `Что изменилось в продукте или workflow -> почему это важно -> как это использовать дальше.`,
        examplePostAngles: [
          `Какой продуктовый сдвиг в ${context.bucketLabel} реально влияет на практику.`,
          `Что стоит заметить в свежем update, кроме очевидного announce.`,
          `Как через shipping-based контент усилить ${context.whitespacePatternLabel}.`
        ],
        cadenceHint: "1-2 раза в неделю",
        genericityWarning:
          "Не скатывайтесь в пересказ changelog: в каждом посте должен быть вывод для аудитории."
      };
    case "founderInsight":
      return {
        seriesTitle:
          mode === "whitespace"
            ? "Operator perspective как редкий угол"
            : `${prefix}: operator / founder notes`,
        seriesPurpose:
          `Добавить в ${context.bucketLabel} более редкий operator perspective, который труднее воспроизвести поверхностно.`,
        repeatedAngle:
          `Один decision point -> как его бы решал практик -> что это меняет в реальной работе.`,
        examplePostAngles: [
          `Как founder/operator смотрит на ${context.bucketLabel} иначе, чем внешний наблюдатель.`,
          `Один trade-off, который почти не обсуждают вслух.`,
          `Какой принцип управления особенно полезен внутри ${context.bucketLabel}.`
        ],
        cadenceHint: "1 раз в неделю",
        genericityWarning:
          "Не выдавайте абстрактное мнение за operator voice: серия работает только с реальными trade-offs и решениями."
      };
    case "timelyNewsTieIn":
      return {
        seriesTitle:
          mode === "whitespace"
            ? "Редкий news-reactive угол"
            : `${prefix}: новости с фильтром`,
        seriesPurpose:
          `Дать аудитории быстрый способ понимать свежие события в ${context.bucketLabel} без ленты пересказов.`,
        repeatedAngle:
          `Один повод -> почему он важен именно здесь -> что делать с этим сигналом дальше.`,
        examplePostAngles: [
          `Какой news angle в ${context.bucketLabel} реально стоит внимания сегодня.`,
          `Что меняется после свежего повода на практике, а не только в обсуждениях.`,
          `Почему именно этот сигнал важнее других шумных реакций дня.`
        ],
        cadenceHint: "2-3 раза в неделю при наличии новостей",
        genericityWarning:
          "Не превращайте серию в бесконечную реакцию без собственного фильтра и своего тезиса."
      };
    case "audienceQuestion":
      return {
        seriesTitle:
          mode === "whitespace"
            ? "Вопросы, которые двигают обсуждение"
            : `${prefix}: audience prompt series`,
        seriesPurpose:
          `Быстрее проверять сильные углы внутри ${context.bucketLabel} через question-led посты и реакцию аудитории.`,
        repeatedAngle:
          `Один спорный вопрос -> 2 возможные позиции -> приглашение аудитории к разбору.`,
        examplePostAngles: [
          `Какой вопрос по ${context.bucketLabel} лучше всего разделяет сильные и слабые take-ы.`,
          `Что бы вы выбрали внутри ${context.bucketLabel}, если нужен только один приоритет.`,
          `Какой вопрос стоит задать аудитории перед следующим разбором.`
        ],
        cadenceHint: "1 раз в неделю",
        genericityWarning:
          "Не задавайте вопросы без позиции автора: серия сильнее, когда вопрос уже framed вашим углом."
      };
    case "narrativeStorytelling":
      return {
        seriesTitle:
          mode === "whitespace"
            ? "Истории там, где ниша пока слишком сухая"
            : `${prefix}: короткие narrative cases`,
        seriesPurpose:
          `Сделать ${context.bucketLabel} более запоминающейся через короткие истории, не теряя практичность.`,
        repeatedAngle:
          `История или кейс -> lesson -> practical implication для аудитории.`,
        examplePostAngles: [
          `Один before/after сценарий, через который тема становится живой.`,
          `История ошибки, которая объясняет ${context.bucketLabel} лучше очередного summary.`,
          `Как добавить человечность в ${context.dominantPatternLabel} без потери пользы.`
        ],
        cadenceHint: "1 раз в неделю",
        genericityWarning:
          "Не делайте storytelling самоцелью: история должна заканчиваться полезным выводом или действием."
      };
    case "strongHook":
      return {
        seriesTitle:
          mode === "whitespace"
            ? "Сильный первый тезис там, где его не хватает"
            : `${prefix}: sharp opening hooks`,
        seriesPurpose:
          `Поднять заметность ${context.bucketLabel} через повторяемые, но не кликбейтные первые тезисы.`,
        repeatedAngle:
          `Один sharp opening line -> что она на самом деле раскрывает -> один вывод.`,
        examplePostAngles: [
          `Один тезис по ${context.bucketLabel}, который стоит говорить жёстче и точнее.`,
          `Сильный hook вокруг ${context.secondaryPatternLabel}, за которым сразу идёт полезный разбор.`,
          `Как сделать первую строку в ${context.bucketLabel} цепляющей, но не дешёвой.`
        ],
        cadenceHint: "1-2 раза в неделю",
        genericityWarning:
          "Не замещайте содержание одним только hook: после сильного входа должен идти ясный substance."
      };
    default:
      return {
        seriesTitle: `${prefix}: повторяемый нишевой угол`,
        seriesPurpose: `Сделать контент по ${context.bucketLabel} более повторяемым и узнаваемым.`,
        repeatedAngle: `Один рабочий паттерн -> один вывод -> одна полезная реакция для аудитории.`,
        examplePostAngles: [
          `Как использовать ${getPatternLabel(pattern)} внутри ${context.bucketLabel}.`,
          `Почему этот формат может работать сильнее остальных.`,
          `Как сделать этот паттерн более конкретным и полезным.`
        ],
        cadenceHint: "1 раз в неделю",
        genericityWarning: null
      };
  }
}

function buildArchetypeSeries(context: SeriesContext): RepeatableContentSeriesItem {
  return {
    seriesTitle: `Voice-серия под архетип ${context.archetypeLabel}`,
    seriesPurpose:
      `Сделать подачу в ${context.bucketLabel} более узнаваемой через повторяемый voice, а не только через темы.`,
    repeatedAngle:
      `${context.archetypeLabel} как основная подача: один observation -> одна личная интерпретация -> один useful takeaway.`,
    examplePostAngles: [
      `Как ${context.archetypeLabel} объяснил бы главный сигнал недели в ${context.bucketLabel}.`,
      `Один спорный момент в ${context.bucketLabel} через voice этого архетипа.`,
      `Как связать ${context.dominantPatternLabel} с более узнаваемой персональной рамкой.`
    ],
    cadenceHint: "1 раз в неделю",
    genericityWarning:
      "Не копируйте готовый voice буквально: серия должна опираться на ваш собственный ритм и точку зрения."
  };
}

function buildFallbackSeries(context: SeriesContext): RepeatableContentSeriesItem {
  return {
    seriesTitle: "Один сигнал -> один practical takeaway",
    seriesPurpose:
      `Держать постоянный ритм вокруг ${context.bucketLabel}, даже если evidence по нише пока не идеально полон.`,
    repeatedAngle:
      `Один наблюдаемый сигнал -> одно короткое объяснение -> один следующий шаг для аудитории.`,
    examplePostAngles: [
      `Какой один сигнал по ${context.bucketLabel} стоит заметить на этой неделе.`,
      `Что этот сигнал меняет на практике.`,
      `Как использовать этот вывод без длинного треда.`
    ],
    cadenceHint: "1-2 раза в неделю",
    genericityWarning:
      "Не превращайте серию в абстрактные заметки: всегда фиксируйте конкретный signal и конкретный implication."
  };
}

function buildBucketSeries(
  bucket: RankedNicheShortlistBucket,
  playbookBucket: NichePositioningPlaybookBucket
): NicheRepeatableContentSeriesBucket {
  const context = buildContext(bucket, playbookBucket);
  const candidateSeries = dedupeSeries(
    [
      buildCoreSeries(context),
      buildPatternSeries(bucket.dominantNichePatterns[0], context, "dominant"),
      buildPatternSeries(context.evidence.underrepresentedPatterns[0], context, "whitespace"),
      buildArchetypeSeries(context),
      buildPatternSeries(bucket.secondaryNichePatterns[0], context, "secondary")
    ].filter((item): item is RepeatableContentSeriesItem => Boolean(item))
  );

  while (candidateSeries.length < 3) {
    candidateSeries.push(buildFallbackSeries(context));
  }

  const confidenceNotes = [
    playbookBucket.playbookConfidenceNote,
    context.evidence.gapsConfidenceNote,
    context.evidence.nicheArchetypeConfidenceNote
  ].filter((value): value is string => Boolean(value));

  return {
    bucketId: bucket.bucketId,
    label: bucket.label,
    rank: bucket.rank,
    playbookTitle: playbookBucket.playbookTitle,
    bestEntryAngleLabel: playbookBucket.bestEntryAngle?.label ?? null,
    repeatableContentSeries: candidateSeries.slice(0, 5).map((series) => ({
      ...series,
      examplePostAngles: dedupeItems(series.examplePostAngles).slice(0, 4)
    })),
    seriesConfidenceNote: confidenceNotes[0] ?? null
  };
}

function buildLeader(
  bucket: NicheRepeatableContentSeriesBucket,
  reason: string
): NichePositioningPlaybookLeader {
  return {
    bucketId: bucket.bucketId,
    bucketLabel: bucket.label,
    rank: bucket.rank,
    reason
  };
}

function getBucketMap(shortlist: NicheShortlistResponse) {
  return new Map(shortlist.rankedBuckets.map((bucket) => [bucket.bucketId, bucket]));
}

function buildSummary(
  shortlist: NicheShortlistResponse,
  perBucketSeries: NicheRepeatableContentSeriesBucket[],
  playbook: CrossNichePositioningPlaybook
): CrossNicheRepeatableContentSeriesSummary {
  const bucketMap = getBucketMap(shortlist);

  const nicheWithStrongestRepeatableSeriesPotential =
    playbook.summary.nicheWithStrongestContentRepeatability
      ? buildLeader(
          perBucketSeries.find(
            (bucket) =>
              bucket.bucketId ===
              playbook.summary.nicheWithStrongestContentRepeatability?.bucketId
          ) ??
            {
              bucketId: playbook.summary.nicheWithStrongestContentRepeatability.bucketId,
              label: playbook.summary.nicheWithStrongestContentRepeatability.bucketLabel,
              rank: playbook.summary.nicheWithStrongestContentRepeatability.rank,
              playbookTitle: "",
              bestEntryAngleLabel: null,
              repeatableContentSeries: [],
              seriesConfidenceNote: null
            },
          "эта ниша уже даёт самый понятный переход от первых идей к повторяемым сериям."
        )
      : null;

  const nicheWithEasiestConsistentPostingCadence =
    perBucketSeries
      .slice()
      .sort((left, right) => {
        const leftBucket = bucketMap.get(left.bucketId);
        const rightBucket = bucketMap.get(right.bucketId);
        const leftEase = leftBucket?.topicScores.contentEase ?? 0;
        const rightEase = rightBucket?.topicScores.contentEase ?? 0;
        const leftPenalty = left.bestEntryAngleLabel?.includes("Новостной") ? 1.2 : 0;
        const rightPenalty = right.bestEntryAngleLabel?.includes("Новостной") ? 1.2 : 0;

        return rightEase - rightPenalty - (leftEase - leftPenalty);
      })
      .map((bucket) =>
        buildLeader(
          bucket,
          "здесь легче держать устойчивый ритм: серии не так завязаны на редкие инфоповоды и лучше поддерживаются текущим contentEase score."
        )
      )[0] ?? null;

  const nicheWithMostDifferentiatedSeriesIdeas =
    perBucketSeries
      .slice()
      .sort((left, right) => {
        const leftBucket = bucketMap.get(left.bucketId);
        const rightBucket = bucketMap.get(right.bucketId);
        const leftVariety =
          new Set([
            ...(leftBucket?.dominantNichePatterns ?? []),
            ...(leftBucket?.secondaryNichePatterns ?? []),
            ...(buildNicheEvidencePack(leftBucket!).underrepresentedPatterns ?? [])
          ]).size;
        const rightVariety =
          new Set([
            ...(rightBucket?.dominantNichePatterns ?? []),
            ...(rightBucket?.secondaryNichePatterns ?? []),
            ...(buildNicheEvidencePack(rightBucket!).underrepresentedPatterns ?? [])
          ]).size;

        return rightVariety - leftVariety;
      })
      .map((bucket) =>
        buildLeader(
          bucket,
          "в этой нише серии опираются на более разнообразные паттерны и дают больше шансов не повторяться слишком быстро."
        )
      )[0] ?? null;

  return {
    nicheWithStrongestRepeatableSeriesPotential,
    nicheWithEasiestConsistentPostingCadence,
    nicheWithMostDifferentiatedSeriesIdeas
  };
}

function buildSummaryText(summary: CrossNicheRepeatableContentSeriesSummary) {
  const parts: string[] = [];

  if (summary.nicheWithStrongestRepeatableSeriesPotential) {
    parts.push(
      `самый сильный запас для повторяемых серий сейчас виден в ${summary.nicheWithStrongestRepeatableSeriesPotential.bucketLabel}`
    );
  }

  if (summary.nicheWithEasiestConsistentPostingCadence) {
    parts.push(
      `проще всего держать стабильный ритм в ${summary.nicheWithEasiestConsistentPostingCadence.bucketLabel}`
    );
  }

  if (summary.nicheWithMostDifferentiatedSeriesIdeas) {
    parts.push(
      `самое разнообразное поле для серий даёт ${summary.nicheWithMostDifferentiatedSeriesIdeas.bucketLabel}`
    );
  }

  if (parts.length === 0) {
    return "Пока repeatable series лучше читать как первые гипотезы для регулярного posting cadence, а не как окончательный контент-план.";
  }

  return `Если превращать shortlist в более устойчивую posting strategy, то сейчас ${parts.join("; ")}.`;
}

export function buildNicheRepeatableContentSeries(
  shortlist: NicheShortlistResponse,
  existingPlaybook?: CrossNichePositioningPlaybook | null
): CrossNicheRepeatableContentSeries {
  const playbook = existingPlaybook ?? buildNichePositioningPlaybook(shortlist);
  const shortlistedBuckets = shortlist.rankedBuckets.filter(
    (bucket) => bucket.shortlistIncluded && bucket.status !== "error"
  );
  const perBucketSeries = shortlistedBuckets
    .map((bucket) => {
      const playbookBucket = playbook.perBucketPlaybooks.find(
        (item) => item.bucketId === bucket.bucketId
      );

      if (!playbookBucket) {
        return null;
      }

      return buildBucketSeries(bucket, playbookBucket);
    })
    .filter((item): item is NicheRepeatableContentSeriesBucket => Boolean(item));
  const summary = buildSummary(shortlist, perBucketSeries, playbook);

  return {
    comparedBucketCount: shortlist.rankedBuckets.length,
    comparableBucketCount: perBucketSeries.length,
    seriesSummary: buildSummaryText(summary),
    perBucketSeries,
    summary,
    globalConfidenceNote: playbook.globalConfidenceNote
  };
}
