import type {
  NicheShortlistContentPatternTag,
  NicheShortlistResponse,
  RankedNicheShortlistBucket
} from "../types/nicheShortlist.js";
import type {
  CrossNichePositioningRecommendations,
  NichePositioningAngle,
  NichePositioningAngleRecommendation,
  NichePositioningBucketRecommendation
} from "./nicheCrossPositioning.js";
import { buildCrossNichePositioningRecommendations } from "./nicheCrossPositioning.js";
import { buildNicheEvidencePack } from "./nicheEvidencePack.js";

export interface NichePositioningPlaybookLeader {
  bucketId: string;
  bucketLabel: string;
  rank: number | null;
  reason: string;
}

export interface NichePositioningPlaybookBucket {
  bucketId: string;
  label: string;
  rank: number | null;
  playbookTitle: string;
  bestEntryAngle: NichePositioningAngleRecommendation | null;
  starterContentDirections: string[];
  firstPostIdeas: string[];
  weakAngleWarnings: string[];
  playbookConfidenceNote: string | null;
}

export interface CrossNichePositioningPlaybookSummary {
  easiestNicheToStartPostingIn: NichePositioningPlaybookLeader | null;
  nicheWithClearestPositioningAngle: NichePositioningPlaybookLeader | null;
  nicheWithStrongestContentRepeatability: NichePositioningPlaybookLeader | null;
}

export interface CrossNichePositioningPlaybook {
  comparedBucketCount: number;
  comparableBucketCount: number;
  playbookSummary: string;
  perBucketPlaybooks: NichePositioningPlaybookBucket[];
  summary: CrossNichePositioningPlaybookSummary;
  globalConfidenceNote: string | null;
}

interface PlaybookContext {
  bucket: RankedNicheShortlistBucket;
  positioning: NichePositioningBucketRecommendation;
  evidence: ReturnType<typeof buildNicheEvidencePack>;
  bucketLabel: string;
  whitespaceAngleLabel: string;
  dominantPatternLabel: string;
  archetypeLabel: string;
}

const contentPatternLabelMap: Record<NicheShortlistContentPatternTag, string> = {
  strongHook: "сильный hook",
  contrarianTake: "контрарный угол",
  productUpdate: "продуктовый апдейт",
  benchmarkOrResult: "результат или benchmark",
  educationalBreakdown: "обучающий breakdown",
  founderInsight: "founder/operator perspective",
  timelyNewsTieIn: "привязка к актуальной новости",
  audienceQuestion: "question-led вовлечение",
  narrativeStorytelling: "storytelling"
};

function getPatternLabel(tag: NicheShortlistContentPatternTag | undefined) {
  if (!tag) {
    return "понятная подача";
  }

  return contentPatternLabelMap[tag];
}

function dedupeItems(items: string[]) {
  return Array.from(new Set(items));
}

function buildPlaybookTitle(
  label: string,
  angle: NichePositioningAngleRecommendation | null
) {
  if (!angle) {
    return `${label}: playbook первого теста`;
  }

  return `${label}: старт через ${angle.label.toLowerCase()}`;
}

function getPlaybookContext(
  bucket: RankedNicheShortlistBucket,
  positioning: NichePositioningBucketRecommendation
): PlaybookContext {
  const evidence = buildNicheEvidencePack(bucket);
  const bucketLabel = bucket.label;
  const whitespaceAngleLabel = getPatternLabel(evidence.underrepresentedPatterns[0]);
  const dominantPatternLabel = getPatternLabel(bucket.dominantNichePatterns[0]);
  const archetypeLabel =
    bucket.commonArchetypes[0]?.label ?? "сильный voice этой ниши";

  return {
    bucket,
    positioning,
    evidence,
    bucketLabel,
    whitespaceAngleLabel,
    dominantPatternLabel,
    archetypeLabel
  };
}

function buildStarterDirectionsByAngle(
  angle: NichePositioningAngle,
  context: PlaybookContext
) {
  const { bucketLabel, whitespaceAngleLabel, dominantPatternLabel, archetypeLabel } = context;

  switch (angle) {
    case "education":
      return [
        `Короткие разборы одного спорного тезиса в ${bucketLabel} без лишнего jargon.`,
        `Посты формата «что важно понять в ${bucketLabel} за 60 секунд».`,
        `Сравнение двух подходов в ${bucketLabel} с одним практическим выводом.`,
        `Разбор сильного сигнала через ${whitespaceAngleLabel}, но человеческим языком.`,
        `Ответы на повторяющиеся вопросы аудитории вокруг ${bucketLabel}.`,
        `Мини-framework посты, которые переводят ${dominantPatternLabel} в понятный action step.`
      ];
    case "contrarian":
      return [
        `Спокойные disagreement-посты о том, где ${bucketLabel} обычно интерпретируют слишком поверхностно.`,
        `Посты «непопулярное мнение, но...» с обязательным доказательным follow-up.`,
        `Reframe-подача: почему главный спор в ${bucketLabel} идёт не там, где кажется.`,
        `Контрарные тезисы против перегретого ${dominantPatternLabel} без дешёвой провокации.`,
        `Быстрые реакции на новые claims в ${bucketLabel} с более трезвой рамкой.`,
        `Серии «что переоценивают / что недооценивают» внутри ${bucketLabel}.`
      ];
    case "founderOperator":
      return [
        `Operator-мемо о том, как вы бы принимали решения внутри ${bucketLabel}.`,
        `Посты из угла «что реально важно на практике, а не только в discourse».`,
        `Мини build-in-public updates, привязанные к ${bucketLabel}.`,
        `Behind-the-scenes заметки, которые переводят ${whitespaceAngleLabel} в рабочий опыт.`,
        `Разбор одной ошибки или trade-off из роли ${archetypeLabel}.`,
        `Посты про decisions, frameworks и operating principles внутри ${bucketLabel}.`
      ];
    case "benchmarkResults":
      return [
        `Посты «что сработало / что не сработало» по одному углу в ${bucketLabel}.`,
        `Мини-benchmarks без перегруза цифрами, но с ясным outcome.`,
        `Сравнение двух подходов внутри ${bucketLabel} по наблюдаемому результату.`,
        `Результат-ориентированные посты, которые усиливают ${whitespaceAngleLabel}.`,
        `Серии «вот baseline, вот вывод, вот что делать дальше».`,
        `Разбор кейсов, где ${dominantPatternLabel} можно перевести в более доказательную подачу.`
      ];
    case "timelyNewsReactive":
      return [
        `Быстрые интерпретации свежих событий и того, что они реально значат для ${bucketLabel}.`,
        `Посты «что изменилось после новости и что это меняет на практике».`,
        `Реактивные summaries с опорой на один главный вывод, а не пересказ.`,
        `Новостные разборы, которые открывают окно через ${whitespaceAngleLabel}.`,
        `Контекстные посты «почему этот новостной повод важен именно для ${bucketLabel}».`,
        `Серии «сегодняшний инфоповод -> один прогноз -> один practical implication».`
      ];
    case "narrativeStorytelling":
      return [
        `Посты через короткие истории о том, как меняется ${bucketLabel} в реальной жизни.`,
        `Before/after narratives вокруг решений, ошибок и неожиданных результатов.`,
        `Истории с одним сильным выводом, которые добавляют человечности в ${bucketLabel}.`,
        `Мини-эссе, которые смещают нишу от сухого ${dominantPatternLabel} к более живой подаче.`,
        `Личные наблюдения через угол ${archetypeLabel}, но без потери практической пользы.`,
        `Story-driven breakdowns: история -> lesson -> что делать аудитории дальше.`
      ];
    default:
      return [
        `Короткие практические посты вокруг ${bucketLabel}.`,
        `Сравнение подходов внутри ${bucketLabel}.`,
        `Посты с конкретным наблюдением и одним выводом.`,
        `Разбор одного сильного сигнала внутри ${bucketLabel}.`,
        `Мини-серии на базе ${whitespaceAngleLabel}.`
      ];
  }
}

function buildFirstPostIdeasByAngle(
  angle: NichePositioningAngle,
  context: PlaybookContext
) {
  const { bucketLabel, whitespaceAngleLabel, dominantPatternLabel } = context;

  switch (angle) {
    case "education":
      return [
        `3 вещи, которые стоит понять в ${bucketLabel}, прежде чем спорить о трендах.`,
        `Если бы я начинал писать про ${bucketLabel} сегодня, я бы следил только за этими 5 сигналами.`,
        `Самая частая ошибка в разговорах про ${bucketLabel} и как её быстро исправить.`,
        `Один свежий тезис из ${bucketLabel}, переведённый на человеческий язык.`
      ];
    case "contrarian":
      return [
        `Непопулярное мнение по ${bucketLabel}: главный сигнал сейчас читают не там, где нужно.`,
        `Что в ${bucketLabel} сейчас переоценивают почти все — и что важнее смотреть вместо этого.`,
        `Самый шумный тезис недели по ${bucketLabel} и почему я бы спорил с ним иначе.`,
        `Контрарный взгляд: почему ${dominantPatternLabel} не всегда значит то, что в него вкладывают.`
      ];
    case "founderOperator":
      return [
        `Если бы мне нужно было строить voice в ${bucketLabel} как operator, я бы начал с этих 3 принципов.`,
        `Одна decision-framework заметка по ${bucketLabel}, которую реально можно использовать в работе.`,
        `Что founder/operator видит в ${bucketLabel} иначе, чем обычный комментатор.`,
        `Один practical trade-off в ${bucketLabel}, который почти не обсуждают публично.`
      ];
    case "benchmarkResults":
      return [
        `Что в ${bucketLabel} реально сработало за последнюю неделю, а что выглядело сильнее, чем было на деле.`,
        `Один benchmark по ${bucketLabel}, который полезнее десяти горячих takes.`,
        `Как я бы сравнивал 2 подхода в ${bucketLabel}, если нужен не шум, а результат.`,
        `Один outcome из ${bucketLabel}, который стоит обсуждать чаще, чем инфоповод вокруг него.`
      ];
    case "timelyNewsReactive":
      return [
        `Главная новость дня по ${bucketLabel} и что она реально меняет на практике.`,
        `Быстрый разбор: почему сегодняшний повод в ${bucketLabel} важен не по той причине, о которой все спорят.`,
        `Один свежий news angle в ${bucketLabel}, который стоит перевести в понятный action point.`,
        `Что аудитории на самом деле делать после этой новости по ${bucketLabel}.`
      ];
    case "narrativeStorytelling":
      return [
        `Короткая история о том, как я бы объяснил ${bucketLabel} человеку вне niche bubble.`,
        `Один before/after кейс, через который ${bucketLabel} начинает ощущаться живым, а не абстрактным.`,
        `История одной ошибки в ${bucketLabel}, которая объясняет тему лучше любого hot take.`,
        `Почему ${bucketLabel} для меня начинается не с новости, а с одного человеческого сценария.`
      ];
    default:
      return [
        `Первый понятный пост про ${bucketLabel}.`,
        `Один свежий angle внутри ${bucketLabel}.`,
        `Что важно понять про ${bucketLabel} в первую очередь.`
      ];
  }
}

function buildWeakAngleWarnings(
  context: PlaybookContext
) {
  const warnings = [...context.positioning.positioningRisks];

  if (context.evidence.weakestSignals[0]) {
    warnings.push(
      `Не стройте весь вход только на ${context.evidence.weakestSignals[0].label.toLowerCase()}: этот сигнал пока слабее остальных.`
    );
  }

  if (context.evidence.cautionFlags[0]) {
    warnings.push(context.evidence.cautionFlags[0]);
  }

  return dedupeItems(warnings).slice(0, 3);
}

function buildPlaybookForBucket(
  bucket: RankedNicheShortlistBucket,
  positioning: NichePositioningBucketRecommendation
): NichePositioningPlaybookBucket {
  const context = getPlaybookContext(bucket, positioning);
  const bestEntryAngle = positioning.strongestRecommendedAngle;
  const starterContentDirections = dedupeItems(
    buildStarterDirectionsByAngle(
      bestEntryAngle?.angle ?? "education",
      context
    )
  ).slice(0, 6);
  const firstPostIdeas = dedupeItems(
    buildFirstPostIdeasByAngle(
      bestEntryAngle?.angle ?? "education",
      context
    )
  ).slice(0, 4);
  const weakAngleWarnings = buildWeakAngleWarnings(context);
  const confidenceNotes = [
    positioning.positioningConfidenceNote,
    context.evidence.gapsConfidenceNote,
    context.evidence.nicheArchetypeConfidenceNote
  ].filter((value): value is string => Boolean(value));

  return {
    bucketId: bucket.bucketId,
    label: bucket.label,
    rank: bucket.rank,
    playbookTitle: buildPlaybookTitle(bucket.label, bestEntryAngle),
    bestEntryAngle,
    starterContentDirections,
    firstPostIdeas,
    weakAngleWarnings,
    playbookConfidenceNote: confidenceNotes[0] ?? null
  };
}

function buildLeader(
  bucket: NichePositioningPlaybookBucket,
  reason: string
): NichePositioningPlaybookLeader {
  return {
    bucketId: bucket.bucketId,
    bucketLabel: bucket.label,
    rank: bucket.rank,
    reason
  };
}

function buildPlaybookSummary(
  perBucketPlaybooks: NichePositioningPlaybookBucket[],
  positioning: CrossNichePositioningRecommendations
): CrossNichePositioningPlaybookSummary {
  const easiestNicheToStartPostingIn =
    perBucketPlaybooks
      .slice()
      .sort((left, right) => {
        const leftAngleScore = left.bestEntryAngle?.score ?? 0;
        const rightAngleScore = right.bestEntryAngle?.score ?? 0;
        const leftRank = left.rank ?? Number.MAX_SAFE_INTEGER;
        const rightRank = right.rank ?? Number.MAX_SAFE_INTEGER;

        return rightAngleScore - leftAngleScore || leftRank - rightRank;
      })
      .map((bucket) =>
        buildLeader(
          bucket,
          "у этой ниши самый простой стартовый набор контентных направлений и достаточно ясный первый угол входа."
        )
      )[0] ?? null;

  const nicheWithClearestPositioningAngle =
    perBucketPlaybooks
      .filter((bucket) => bucket.bestEntryAngle !== null)
      .slice()
      .sort((left, right) => {
        const leftScore = left.bestEntryAngle?.score ?? 0;
        const rightScore = right.bestEntryAngle?.score ?? 0;

        return rightScore - leftScore;
      })
      .map((bucket) =>
        buildLeader(
          bucket,
          "здесь лучший angle отделяется особенно ясно и даёт более конкретную точку входа."
        )
      )[0] ?? null;

  const repeatabilitySource =
    positioning.summary.bestNicheForEducation ??
    positioning.summary.bestNicheForBenchmarkResults ??
    positioning.summary.bestNicheForFounderOperator;
  const nicheWithStrongestContentRepeatability = repeatabilitySource
    ? buildLeader(
        perBucketPlaybooks.find((bucket) => bucket.bucketId === repeatabilitySource.bucketId) ??
          {
            bucketId: repeatabilitySource.bucketId,
            label: repeatabilitySource.bucketLabel,
            rank: repeatabilitySource.rank,
            playbookTitle: "",
            bestEntryAngle: null,
            starterContentDirections: [],
            firstPostIdeas: [],
            weakAngleWarnings: [],
            playbookConfidenceNote: null
          },
        "эта ниша выглядит наиболее пригодной для повторяемой серии постов, а не для единичных удачных экспериментов."
      )
    : null;

  return {
    easiestNicheToStartPostingIn,
    nicheWithClearestPositioningAngle,
    nicheWithStrongestContentRepeatability
  };
}

function buildPlaybookSummaryText(summary: CrossNichePositioningPlaybookSummary) {
  const parts: string[] = [];

  if (summary.easiestNicheToStartPostingIn) {
    parts.push(
      `проще всего стартовать в ${summary.easiestNicheToStartPostingIn.bucketLabel}`
    );
  }

  if (summary.nicheWithClearestPositioningAngle) {
    parts.push(
      `самый ясный angle входа сейчас виден в ${summary.nicheWithClearestPositioningAngle.bucketLabel}`
    );
  }

  if (summary.nicheWithStrongestContentRepeatability) {
    parts.push(
      `лучшая повторяемость контента пока читается в ${summary.nicheWithStrongestContentRepeatability.bucketLabel}`
    );
  }

  if (parts.length === 0) {
    return "Пока playbook лучше читать как набор первых контентных гипотез, а не как окончательный posting plan.";
  }

  return `Если перевести shortlist в практический старт, то сейчас ${parts.join("; ")}.`;
}

export function buildNichePositioningPlaybook(
  shortlist: NicheShortlistResponse,
  existingPositioning?: CrossNichePositioningRecommendations | null
): CrossNichePositioningPlaybook {
  const positioning =
    existingPositioning ?? buildCrossNichePositioningRecommendations(shortlist);
  const shortlistedBuckets = shortlist.rankedBuckets.filter(
    (bucket) => bucket.shortlistIncluded && bucket.status !== "error"
  );
  const perBucketPlaybooks = shortlistedBuckets
    .map((bucket) => {
      const positioningForBucket = positioning.perBucketRecommendations.find(
        (entry) => entry.bucketId === bucket.bucketId
      );

      if (!positioningForBucket) {
        return null;
      }

      return buildPlaybookForBucket(bucket, positioningForBucket);
    })
    .filter((entry): entry is NichePositioningPlaybookBucket => Boolean(entry));
  const summary = buildPlaybookSummary(perBucketPlaybooks, positioning);

  return {
    comparedBucketCount: shortlist.rankedBuckets.length,
    comparableBucketCount: perBucketPlaybooks.length,
    playbookSummary: buildPlaybookSummaryText(summary),
    perBucketPlaybooks,
    summary,
    globalConfidenceNote: positioning.globalConfidenceNote
  };
}
