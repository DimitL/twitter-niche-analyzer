import type { NicheShortlistScenario } from "../types/nicheShortlist.js";
import { formatScenarioTimestamp } from "../utils/nicheShortlistScenarios.js";

interface ShortlistScenarioSwitcherProps {
  scenarios: NicheShortlistScenario[];
  activeScenarioId: string;
  selectedScenarioIds: string[];
  maxCompareCount: number;
  hasUnsavedChanges: boolean;
  storageNotice: string | null;
  onScenarioCompareToggle: (scenarioId: string) => void;
  onScenarioLoad: (scenarioId: string) => void;
  onScenarioSave: () => void;
  onScenarioSaveAsNew: () => void;
  onScenarioRename: (scenarioId: string) => void;
  onScenarioDuplicate: (scenarioId: string) => void;
  onScenarioDelete: (scenarioId: string) => void;
}

export function ShortlistScenarioSwitcher({
  scenarios,
  activeScenarioId,
  selectedScenarioIds,
  maxCompareCount,
  hasUnsavedChanges,
  storageNotice,
  onScenarioCompareToggle,
  onScenarioLoad,
  onScenarioSave,
  onScenarioSaveAsNew,
  onScenarioRename,
  onScenarioDuplicate,
  onScenarioDelete
}: ShortlistScenarioSwitcherProps) {
  return (
    <section className="scenario-switcher">
      <div className="scenario-switcher__header">
        <div>
          <span>Локальные сценарии</span>
          <p>
            Сохраняйте несколько shortlist-конфигураций локально и быстро
            переключайтесь между ними без повторного ввода bucket-ов. Последний
            успешный shortlist-run автоматически прикрепляется к активному сценарию.
          </p>
        </div>

        <div className="scenario-switcher__actions">
          <button
            type="button"
            className="editor-button editor-button--secondary"
            onClick={onScenarioSave}
          >
            Сохранить текущий
          </button>
          <button
            type="button"
            className="editor-button editor-button--ghost"
            onClick={onScenarioSaveAsNew}
          >
            Сохранить как новый
          </button>
        </div>
      </div>

      {storageNotice ? (
        <p className="scenario-switcher__notice">{storageNotice}</p>
      ) : null}

      <div className="scenario-switcher__list">
        {scenarios.map((scenario) => {
          const isActive = scenario.scenarioId === activeScenarioId;
          const isCompared = selectedScenarioIds.includes(scenario.scenarioId);
          const hasSavedResult = Boolean(scenario.lastResultSummary);

          return (
            <article
              key={scenario.scenarioId}
              className={`scenario-card ${isActive ? "scenario-card--active" : ""}`}
            >
              <div className="scenario-card__header">
                <div>
                  <p className="eyebrow">{isActive ? "Активный сценарий" : "Сценарий"}</p>
                  <h3>{scenario.name}</h3>
                </div>

                <div className="decision-chip-list">
                  {isActive ? <span className="decision-chip">Активен</span> : null}
                  {hasSavedResult ? (
                    <span className="decision-chip">Есть сохранённый результат</span>
                  ) : (
                    <span className="decision-chip decision-chip--neutral">Результат ещё не сохранён</span>
                  )}
                  {isActive && hasUnsavedChanges ? (
                    <span className="decision-chip decision-chip--neutral">Есть несохранённые изменения</span>
                  ) : null}
                  {isCompared ? (
                    <span className="decision-chip decision-chip--neutral">В сравнении</span>
                  ) : null}
                </div>
              </div>

              <div className="scenario-card__meta">
                <div className="summary-box">
                  <span>Buckets</span>
                  <strong>{scenario.formSnapshot.buckets.length}</strong>
                </div>
                <div className="summary-box">
                  <span>Limit</span>
                  <strong>{scenario.formSnapshot.limit || "н/д"}</strong>
                </div>
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
              </div>

              {scenario.lastResultSummary ? (
                <div className="scenario-card__result-summary">
                  <div className="summary-box">
                    <span>Best overall</span>
                    <strong>{scenario.lastResultSummary.bestOverall?.label ?? "н/д"}</strong>
                  </div>
                  <div className="summary-box">
                    <span>Shortlist size</span>
                    <strong>{scenario.lastResultSummary.shortlistSize}</strong>
                  </div>
                </div>
              ) : null}

              <div className="scenario-card__footer">
                <button
                  type="button"
                  className={`editor-button ${isCompared ? "editor-button--secondary" : "editor-button--ghost"}`}
                  onClick={() => onScenarioCompareToggle(scenario.scenarioId)}
                  title={`Можно выбрать до ${maxCompareCount} сценариев одновременно`}
                >
                  {isCompared ? "Убрать из сравнения" : "Добавить к сравнению"}
                </button>
                <button
                  type="button"
                  className="editor-button editor-button--secondary"
                  onClick={() => onScenarioLoad(scenario.scenarioId)}
                >
                  Загрузить
                </button>
                <button
                  type="button"
                  className="editor-button editor-button--ghost"
                  onClick={() => onScenarioRename(scenario.scenarioId)}
                >
                  Переименовать
                </button>
                <button
                  type="button"
                  className="editor-button editor-button--ghost"
                  onClick={() => onScenarioDuplicate(scenario.scenarioId)}
                >
                  Дублировать
                </button>
                <button
                  type="button"
                  className="editor-button editor-button--danger"
                  onClick={() => onScenarioDelete(scenario.scenarioId)}
                >
                  Удалить
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
