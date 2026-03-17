import type { InfluencerAccount, NicheSeed } from "../types/analysis.js";

interface MockNicheDefinition {
  id: string;
  title: string;
  summary: string;
  audienceSignal: string;
  contentAngle: string;
  scoreInput: NicheSeed["scoreInput"];
  influencerPrefix: string;
  influencerLabel: string;
  followerBase: number;
  engagementBase: number;
  influencerThemes: string[];
}

function createInfluencerAccounts(definition: MockNicheDefinition): InfluencerAccount[] {
  return Array.from({ length: 10 }, (_, index) => ({
    handle: `@${definition.influencerPrefix}_${String(index + 1).padStart(2, "0")}`,
    displayName: `${definition.influencerLabel} ${index + 1}`,
    followers: definition.followerBase + index * 2600,
    avgEngagementRate: Number((definition.engagementBase - index * 0.18).toFixed(1)),
    reason: `Пишет про ${
      definition.influencerThemes[index % definition.influencerThemes.length]
    } и регулярно разбирает практические кейсы.`
  }));
}

const nicheDefinitions: MockNicheDefinition[] = [
  {
    id: "ai-solopreneurs",
    title: "AI-инструменты для соло-предпринимателей",
    summary: "Ниша на стыке автоматизации, запусков и быстрых AI-workflow для одного автора.",
    audienceSignal: "Высокий интерес у людей, которые хотят быстрее запускать продукты и контент.",
    contentAngle: "Подходят треды с примерами стеков, промптов и коротких сценариев внедрения.",
    scoreInput: {
      engagementEfficiency: 92,
      growthPotential: 91,
      monetizationPotential: 88,
      contentEase: 79
    },
    influencerPrefix: "ai_solo",
    influencerLabel: "AI Solo Systems",
    followerBase: 14000,
    engagementBase: 6.7,
    influencerThemes: ["AI workflow", "micro-SaaS", "automation stack", "prompts", "creator tools"]
  },
  {
    id: "b2b-saas-growth",
    title: "Контент-рост для B2B SaaS",
    summary: "Практичная ниша про дистрибуцию, ICP, контент-пайплайн и рост SaaS-продуктов.",
    audienceSignal: "Аудитория активно реагирует на конкретные фреймворки и цифры из воронки.",
    contentAngle: "Лучше всего работают tactical threads, teardown-посты и короткие growth-операции.",
    scoreInput: {
      engagementEfficiency: 86,
      growthPotential: 87,
      monetizationPotential: 93,
      contentEase: 71
    },
    influencerPrefix: "saas_growth",
    influencerLabel: "SaaS Growth Memo",
    followerBase: 18000,
    engagementBase: 5.8,
    influencerThemes: ["ICP", "distribution", "onboarding", "retention", "PLG"]
  },
  {
    id: "creator-monetization",
    title: "Монетизация creator-бизнеса",
    summary: "Ниша про офферы, подписки, digital products и операционку creator-экономики.",
    audienceSignal: "Сильный отклик у экспертов и небольших создателей, которым нужен понятный revenue path.",
    contentAngle: "Хорошо заходят breakdown-посты про офферы, линейки продуктов и unit economics.",
    scoreInput: {
      engagementEfficiency: 84,
      growthPotential: 82,
      monetizationPotential: 95,
      contentEase: 78
    },
    influencerPrefix: "creator_rev",
    influencerLabel: "Creator Revenue Lab",
    followerBase: 16000,
    engagementBase: 5.5,
    influencerThemes: ["offers", "memberships", "digital products", "audience funnel", "pricing"]
  },
  {
    id: "developer-productivity",
    title: "Продуктивность разработчиков с AI",
    summary: "Сегмент про coding workflow, dev tools, automation и ускорение инженерной работы.",
    audienceSignal: "Аудитория любит короткие сравнения инструментов и реальные before/after examples.",
    contentAngle: "Отлично подходят треды про dev stack, snippets, agentic workflow и code review patterns.",
    scoreInput: {
      engagementEfficiency: 90,
      growthPotential: 86,
      monetizationPotential: 80,
      contentEase: 76
    },
    influencerPrefix: "dev_flow",
    influencerLabel: "Dev Flow Signal",
    followerBase: 21000,
    engagementBase: 6.2,
    influencerThemes: ["AI coding", "tooling", "code review", "automation", "team velocity"]
  },
  {
    id: "creator-finance",
    title: "Финансы для креаторов и фрилансеров",
    summary: "Ниша о cash flow, налоговой дисциплине, подушке безопасности и доходной стратегии.",
    audienceSignal: "Хороший отклик дают простые шаблоны, привычки и честные breakdown-посты о деньгах.",
    contentAngle: "Можно строить контент на чек-листах, моделях дохода и ошибках независимых специалистов.",
    scoreInput: {
      engagementEfficiency: 83,
      growthPotential: 78,
      monetizationPotential: 89,
      contentEase: 82
    },
    influencerPrefix: "creator_cash",
    influencerLabel: "Creator Cash Notes",
    followerBase: 12000,
    engagementBase: 5.1,
    influencerThemes: ["cash flow", "pricing", "tax routine", "runway", "income mix"]
  },
  {
    id: "ecommerce-retention",
    title: "Retention и lifecycle для e-commerce",
    summary: "Прикладная ниша про email/SMS, повторные покупки и маржинальный рост магазинов.",
    audienceSignal: "Аудитория особенно хорошо реагирует на твиты с цифрами uplift и teardown-скриншотами.",
    contentAngle: "Подходят мини-кейсы, retention-формулы и контент о post-purchase journeys.",
    scoreInput: {
      engagementEfficiency: 79,
      growthPotential: 81,
      monetizationPotential: 91,
      contentEase: 68
    },
    influencerPrefix: "retention_ops",
    influencerLabel: "Retention Ops",
    followerBase: 17500,
    engagementBase: 4.8,
    influencerThemes: ["email", "SMS", "retention", "LTV", "post-purchase"]
  },
  {
    id: "remote-team-systems",
    title: "Системы удалённой работы для маленьких команд",
    summary: "Ниша про async-менеджмент, процессы, документацию и ритмы распределённых команд.",
    audienceSignal: "Устойчивый интерес у founders и operators, которым нужны рабочие системы без бюрократии.",
    contentAngle: "Можно публиковать шаблоны процессов, meeting replacements и правила async-коммуникации.",
    scoreInput: {
      engagementEfficiency: 77,
      growthPotential: 75,
      monetizationPotential: 82,
      contentEase: 85
    },
    influencerPrefix: "remote_ops",
    influencerLabel: "Remote Ops Stack",
    followerBase: 11000,
    engagementBase: 4.9,
    influencerThemes: ["async work", "documentation", "team rituals", "ops", "knowledge base"]
  },
  {
    id: "knowledge-worker-wellness",
    title: "Wellness для knowledge workers",
    summary: "Фокус на энергии, фокусе, burnout prevention и устойчивом темпе работы у умственного труда.",
    audienceSignal: "Посты с личными экспериментами и measurable routines вызывают выше среднего engagement.",
    contentAngle: "Хорошо работают short-form habits, data-backed routines и anti-burnout systems.",
    scoreInput: {
      engagementEfficiency: 80,
      growthPotential: 84,
      monetizationPotential: 74,
      contentEase: 88
    },
    influencerPrefix: "focus_health",
    influencerLabel: "Focus Health Brief",
    followerBase: 13000,
    engagementBase: 5.4,
    influencerThemes: ["focus", "sleep", "stress", "recovery", "work routine"]
  },
  {
    id: "tech-career-positioning",
    title: "Позиционирование карьеры в tech",
    summary: "Ниша про карьерный narrative, доказательство экспертизы и переходы между ролями.",
    audienceSignal: "Отлично цепляют истории переходов, frameworks для profile positioning и profile audits.",
    contentAngle: "Можно строить контент на разборе профилей, карьерных стратегиях и публичных кейсах роста.",
    scoreInput: {
      engagementEfficiency: 82,
      growthPotential: 80,
      monetizationPotential: 78,
      contentEase: 86
    },
    influencerPrefix: "career_signal",
    influencerLabel: "Career Signal",
    followerBase: 15000,
    engagementBase: 5.3,
    influencerThemes: ["positioning", "job search", "portfolio", "personal brand", "career narrative"]
  },
  {
    id: "learning-systems",
    title: "Системы обучения и microlearning",
    summary: "Ниша о том, как учиться быстрее, структурировать знания и превращать обучение в результат.",
    audienceSignal: "Стабильный отклик у аудитории, которая хочет measurable learning и практическое применение.",
    contentAngle: "Сильны треды про note-taking, learning loops, curriculum design и repetition systems.",
    scoreInput: {
      engagementEfficiency: 78,
      growthPotential: 79,
      monetizationPotential: 76,
      contentEase: 90
    },
    influencerPrefix: "learning_loop",
    influencerLabel: "Learning Loop",
    followerBase: 12500,
    engagementBase: 5,
    influencerThemes: ["note-taking", "learning loop", "curriculum", "memory", "practice"]
  }
];

export const mockNicheSeeds: NicheSeed[] = nicheDefinitions.map((definition) => ({
  id: definition.id,
  title: definition.title,
  summary: definition.summary,
  audienceSignal: definition.audienceSignal,
  contentAngle: definition.contentAngle,
  scoreInput: definition.scoreInput,
  influencerAccounts: createInfluencerAccounts(definition)
}));
