import type {
  NicheShortlistScenario,
  NicheShortlistScenarioRequestSnapshot,
  NicheShortlistSummaryEntry
} from "../types/nicheShortlist.js";
import { formatScenarioTimestamp } from "../utils/nicheShortlistScenarios.js";

interface ShortlistScenarioComparisonProps {
  scenarios: NicheShortlistScenario[];
  selectedScenarioIds: string[];
  maxCompareCount: number;
}

function formatSummaryEntry(entry: NicheShortlistSummaryEntry | null | undefined) {
  if (!entry) {
    return "Недостаточно данных";
  }

  return `${entry.label} (${entry.score.toFixed(1)})`;
}

function buildFlagsLabel(snapshot: NicheShortlistScenarioRequestSnapshot | undefined) {
  if (!snapshot) {
    return "Запуск ещё не сохранён";
  }

  const activeFlags: string[] = [];

  if (snapshot.includeUncertain) {
    activeFlags.push("uncertain");
  }

  if (snapshot.treatQuoteAsUsable) {
    activeFlags.push("quote usable");
  }

  if (snapshot.emphasizeGrowth) {
    activeFlags.push("growth");
  }

  if (snapshot.emphasizeMonetization) {
    activeFlags.push("monetization");
  }

  if (snapshot.emphasizeEase) {
    activeFlags.push("ease");
  }

  return activeFlags.length > 0 ? activeFlags.join(", ") : "без усилителей";
}

export function ShortlistScenarioComparison({
  scenarios,
  selectedScenarioIds,
  maxCompareCount
}: ShortlistScenarioComparisonProps) {
  const scenariosWithSavedResults = scenarios.filter((scenario) => scenario.lastResultSummary);
  const comparedScenarios = selectedScenarioIds
    .map((scenarioId) => scenarios.find((scenario) => scenario.scenarioId === scenarioId) ?? null)
    .filter((scenario): scenario is NicheShortlistScenario => Boolean(scenario))
    .slice(0, maxCompareCount);

  const diffRows = [
    {
      label: "Limit / Top N",
      values: comparedScenarios.map((scenario) => {
        const snapshot = scenario.lastRequestSnapshot;
        return snapshot
          ? `${snapshot.limit ?? "н/д"} / ${snapshot.topN ?? "н/д"}`
          : `${scenario.formSnapshot.limit || "н/д"} / ${scenario.formSnapshot.topN || "н/д"}`;
      })
    },
    {
      label: "Флаги запуска",
      values: comparedScenarios.map((scenario) => buildFlagsLabel(scenario.lastRequestSnapshot))
    },
    {
      label: "Buckets",
      values: comparedScenarios.map((scenario) =>
        scenario.formSnapshot.buckets
          .map((bucket) => `${bucket.label || bucket.bucketId || "Без названия"} (${bucket.handles.length})`)
          .join(", ") || "Пока пусто"
      )
    },
    {
      label: "Лучший overall",
      values: comparedScenarios.map((scenario) =>
        formatSummaryEntry(scenario.lastResultSummary?.bestOverall)
      )
    },
    {
      label: "Лучший для роста",
      values: comparedScenarios.map((scenario) =>
        formatSummaryEntry(scenario.lastResultSummary?.bestForGrowth)
      )
    },
    {
      label: "Лучший для монетизации",
      values: comparedScenarios.map((scenario) =>
        formatSummaryEntry(scenario.lastResultSummary?.bestForMonetization)
      )
    },
    {
      label: "Самый лёгкий старт",
      values: comparedScenarios.map((scenario) =>
        formatSummaryEntry(scenario.lastResultSummary?.easiestToStart)
      )
    }
  ];

  return (
    <section className="panel scenario-compare-panel">
      <div className="scenario-compare-panel__header">
        <div>
          <p className="eyebrow">Scenario Compare</p>
          <h2>Сравнение сохранённых сценариев</h2>
          <p className="section-copy">
            Здесь можно быстро сопоставить 2-3 ручных shortlist-сценария по настройкам
            и последнему сохранённому результату без постоянного переключения editor-а.
          </p>
        </div>
      </div>

      {scenariosWithSavedResults.length === 0 ? (
        <div className="scenario-compare-panel__empty">
          <p className="eyebrow">Пока пусто</p>
          <p>
            Сохранённых результатов ещё нет. Запустите shortlist хотя бы один раз, и
            активный сценарий автоматически получит pinned last-result.
          </p>
        </div>
      ) : comparedScenarios.length === 0 ? (
        <div className="scenario-compare-panel__empty">
          <p className="eyebrow">Выберите сценарии</p>
          <p>
            Добавьте в сравнение до {maxCompareCount} сценариев через кнопку `Добавить к сравнению`
            в секции локальных сценариев.
          </p>
        </div>
      ) : (
        <>
          <div className="scenario-compare-grid">
            {comparedScenarios.map((scenario) => (
              <article key={scenario.scenarioId} className="scenario-compare-card">
                <div className="scenario-compare-card__header">
                  <div>
                    <p className="eyebrow">Pinned Result</p>
                    <h3>{scenario.name}</h3>
                  </div>
                  <div className="decision-chip-list">
                    {scenario.lastResultSummary ? (
                      <span className="decision-chip">Результат сохранён</span>
                    ) : (
                      <span className="decision-chip decision-chip--neutral">Без сохранённого результата</span>
                    )}
                  </div>
                </div>

                <div className="scenario-compare-card__meta">
                  <div className="summary-box">
                    <span>Обновлён</span>
                    <strong>{formatScenarioTimestamp(scenario.updatedAt)}</strong>
                  </div>
                  <div className="summary-box">
                    <span>Последний run</span>
                    <strong>
                      {scenario.lastRunAt
                        ? formatScenarioTimestamp(scenario.lastRunAt)
                        : "ещё не запускался"}
                    </strong>
                  </div>
                  <div className="summary-box">
                    <span>Размер shortlist</span>
                    <strong>{scenario.lastResultSummary?.shortlistSize ?? "н/д"}</strong>
                  </div>
                </div>

                <div className="scenario-compare-card__summary">
                  <div className="summary-box">
                    <span>Best overall</span>
                    <strong>{formatSummaryEntry(scenario.lastResultSummary?.bestOverall)}</strong>
                  </div>
                  <div className="summary-box">
                    <span>Best for growth</span>
                    <strong>{formatSummaryEntry(scenario.lastResultSummary?.bestForGrowth)}</strong>
                  </div>
                  <div className="summary-box">
                    <span>Best for monetization</span>
                    <strong>{formatSummaryEntry(scenario.lastResultSummary?.bestForMonetization)}</strong>
                  </div>
                  <div className="summary-box">
                    <span>Easiest to start</span>
                    <strong>{formatSummaryEntry(scenario.lastResultSummary?.easiestToStart)}</strong>
                  </div>
                </div>

                <div className="scenario-compare-card__buckets">
                  <span>Краткий срез ranking</span>
                  {scenario.lastRankedBuckets && scenario.lastRankedBuckets.length > 0 ? (
                    <ul className="plain-list">
                      {scenario.lastRankedBuckets.slice(0, 3).map((bucket) => (
                        <li key={`${scenario.scenarioId}-${bucket.bucketId}`}>
                          {bucket.rank ? `#${bucket.rank} ` : ""}
                          {bucket.label} ({bucket.overallTopicScore.toFixed(1)})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="section-copy">
                      Для этого сценария ещё нет pinned ranking snapshot.
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>

          <div className="scenario-diff-panel">
            <p className="eyebrow">Scenario Diff</p>
            <div className="scenario-diff-grid">
              {diffRows.map((row) => (
                <div key={row.label} className="scenario-diff-row">
                  <strong>{row.label}</strong>
                  <div className="scenario-diff-values">
                    {row.values.map((value, index) => (
                      <div key={`${row.label}-${comparedScenarios[index]?.scenarioId ?? index}`} className="summary-box">
                        <span>{comparedScenarios[index]?.name ?? "Сценарий"}</span>
                        <strong>{value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
