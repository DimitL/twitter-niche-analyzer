import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { appConfig, type AnalysisRequest, type AnalysisResponse } from "@twitter-niche-analyzer/shared";
import { getApiHealth, runMockAnalysis, runNicheShortlist } from "./api/client.js";
import {
  defaultNicheShortlistExampleId,
  nicheShortlistExamples
} from "./data/nicheShortlistExamples.js";
import { BucketEditor } from "./components/BucketEditor.js";
import { NicheCard } from "./components/NicheCard.js";
import { NicheShortlistCard } from "./components/NicheShortlistCard.js";
import { NicheShortlistSummary } from "./components/NicheShortlistSummary.js";
import type {
  NicheShortlistBucketDraft,
  NicheShortlistResponse,
  NicheShortlistSortBy
} from "./types/nicheShortlist.js";
import {
  buildBucketDraftsFromInputs,
  buildBucketInputsFromDrafts,
  createEmptyBucketDraft,
  createEmptyHandleDraft,
  hasBucketDraftValidationErrors,
  validateBucketDrafts
} from "./utils/nicheShortlistBucketEditor.js";

const initialRequest: AnalysisRequest = {
  marketHint: "англоязычный tech X",
  creatorGoal: "найти ниши с высоким engagement относительно размера аудитории"
};

interface NicheShortlistFormState {
  buckets: NicheShortlistBucketDraft[];
  limit: string;
  topN: string;
  includeUncertain: boolean;
  treatQuoteAsUsable: boolean;
  sortBy: NicheShortlistSortBy;
  emphasizeGrowth: boolean;
  emphasizeMonetization: boolean;
  emphasizeEase: boolean;
}

const shortlistSortOptions: Array<{
  value: NicheShortlistSortBy;
  label: string;
}> = [
  { value: "overallTopicScore", label: "Итоговый score ниши" },
  { value: "growthPotential", label: "Потенциал роста" },
  { value: "monetizationPotential", label: "Потенциал монетизации" },
  { value: "contentEase", label: "Простота контента" },
  { value: "dataConfidence", label: "Надёжность данных" }
];

function buildEmptyShortlistFormState(): NicheShortlistFormState {
  return {
    buckets: [createEmptyBucketDraft()],
    limit: "1",
    topN: "2",
    includeUncertain: false,
    treatQuoteAsUsable: false,
    sortBy: "overallTopicScore",
    emphasizeGrowth: false,
    emphasizeMonetization: false,
    emphasizeEase: false
  };
}

function buildShortlistFormState(exampleId = defaultNicheShortlistExampleId): NicheShortlistFormState {
  const example =
    nicheShortlistExamples.find((entry) => entry.id === exampleId) ??
    nicheShortlistExamples[0];

  return {
    buckets: buildBucketDraftsFromInputs(example.buckets),
    limit: example.limit,
    topN: example.topN,
    includeUncertain: example.includeUncertain,
    treatQuoteAsUsable: example.treatQuoteAsUsable,
    sortBy: example.sortBy,
    emphasizeGrowth: example.emphasizeGrowth,
    emphasizeMonetization: example.emphasizeMonetization,
    emphasizeEase: example.emphasizeEase
  };
}

function parseOptionalInteger(value: string) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return undefined;
  }

  const parsedValue = Number.parseInt(normalizedValue, 10);

  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    throw new Error("Поля limit и topN должны быть положительными числами.");
  }

  return parsedValue;
}

export default function App() {
  const [request, setRequest] = useState<AnalysisRequest>(initialRequest);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [healthStatus, setHealthStatus] = useState<"checking" | "online" | "offline">("checking");
  const [analysisStatus, setAnalysisStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedShortlistExampleId, setSelectedShortlistExampleId] = useState<string | null>(null);
  const [shortlistForm, setShortlistForm] = useState<NicheShortlistFormState>(() =>
    buildEmptyShortlistFormState()
  );
  const [shortlistResult, setShortlistResult] = useState<NicheShortlistResponse | null>(null);
  const [shortlistStatus, setShortlistStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle"
  );
  const [shortlistErrorMessage, setShortlistErrorMessage] = useState("");
  const [showShortlistValidation, setShowShortlistValidation] = useState(false);

  const shortlistValidations = useMemo(
    () => (showShortlistValidation ? validateBucketDrafts(shortlistForm.buckets) : {}),
    [showShortlistValidation, shortlistForm.buckets]
  );

  useEffect(() => {
    void loadHealth();
    void loadAnalysis(initialRequest);
  }, []);

  async function loadHealth() {
    try {
      await getApiHealth();
      setHealthStatus("online");
    } catch {
      setHealthStatus("offline");
    }
  }

  async function loadAnalysis(nextRequest: AnalysisRequest) {
    try {
      setAnalysisStatus("loading");
      setErrorMessage("");
      const response = await runMockAnalysis(nextRequest);
      setAnalysis(response);
      setAnalysisStatus("ready");
    } catch {
      setAnalysisStatus("error");
      setErrorMessage("Не удалось получить mock-анализ от backend.");
    }
  }

  async function loadShortlist(nextForm: NicheShortlistFormState) {
    try {
      setShortlistStatus("loading");
      setShortlistErrorMessage("");

      const response = await runNicheShortlist({
        buckets: buildBucketInputsFromDrafts(nextForm.buckets),
        limit: parseOptionalInteger(nextForm.limit),
        topN: parseOptionalInteger(nextForm.topN),
        includeUncertain: nextForm.includeUncertain,
        treatQuoteAsUsable: nextForm.treatQuoteAsUsable,
        sortBy: nextForm.sortBy,
        emphasizeGrowth: nextForm.emphasizeGrowth,
        emphasizeMonetization: nextForm.emphasizeMonetization,
        emphasizeEase: nextForm.emphasizeEase
      });

      setShortlistResult(response);
      setShortlistStatus("ready");
    } catch (error) {
      setShortlistStatus("error");
      setShortlistErrorMessage(
        error instanceof Error
          ? error.message
          : "Не удалось получить shortlist от backend."
      );
    }
  }

  function patchShortlistForm(
    updater: (current: NicheShortlistFormState) => NicheShortlistFormState,
    options?: { keepPreset?: boolean }
  ) {
    if (!options?.keepPreset) {
      setSelectedShortlistExampleId(null);
    }

    setShortlistErrorMessage("");
    setShortlistForm((current) => updater(current));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadAnalysis(request);
  }

  function handleShortlistSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowShortlistValidation(true);

    const validations = validateBucketDrafts(shortlistForm.buckets);

    if (hasBucketDraftValidationErrors(validations)) {
      setShortlistStatus("error");
      setShortlistErrorMessage("Исправьте поля bucket editor и попробуйте снова.");
      return;
    }

    void loadShortlist(shortlistForm);
  }

  function applyShortlistExample(exampleId: string) {
    setSelectedShortlistExampleId(exampleId);
    setShortlistForm(buildShortlistFormState(exampleId));
    setShortlistErrorMessage("");
    setShortlistStatus("idle");
    setShowShortlistValidation(false);
  }

  function resetShortlistEditor() {
    setSelectedShortlistExampleId(null);
    setShortlistForm(buildEmptyShortlistFormState());
    setShortlistErrorMessage("");
    setShortlistStatus("idle");
    setShowShortlistValidation(false);
  }

  function handleBucketFieldChange(
    bucketEditorId: string,
    field: "bucketId" | "label" | "description",
    value: string
  ) {
    patchShortlistForm((current) => ({
      ...current,
      buckets: current.buckets.map((bucket) =>
        bucket.editorId === bucketEditorId ? { ...bucket, [field]: value } : bucket
      )
    }));
  }

  function handleBucketAdd() {
    patchShortlistForm((current) => ({
      ...current,
      buckets: [...current.buckets, createEmptyBucketDraft()]
    }));
  }

  function handleBucketRemove(bucketEditorId: string) {
    patchShortlistForm((current) => {
      const nextBuckets = current.buckets.filter((bucket) => bucket.editorId !== bucketEditorId);

      return {
        ...current,
        buckets: nextBuckets.length > 0 ? nextBuckets : [createEmptyBucketDraft()]
      };
    });
  }

  function handleHandleChange(bucketEditorId: string, handleId: string, value: string) {
    patchShortlistForm((current) => ({
      ...current,
      buckets: current.buckets.map((bucket) =>
        bucket.editorId === bucketEditorId
          ? {
              ...bucket,
              handles: bucket.handles.map((handle) =>
                handle.handleId === handleId ? { ...handle, value } : handle
              )
            }
          : bucket
      )
    }));
  }

  function handleHandleAdd(bucketEditorId: string) {
    patchShortlistForm((current) => ({
      ...current,
      buckets: current.buckets.map((bucket) =>
        bucket.editorId === bucketEditorId
          ? {
              ...bucket,
              handles: [...bucket.handles, createEmptyHandleDraft()]
            }
          : bucket
      )
    }));
  }

  function handleHandleRemove(bucketEditorId: string, handleId: string) {
    patchShortlistForm((current) => ({
      ...current,
      buckets: current.buckets.map((bucket) => {
        if (bucket.editorId !== bucketEditorId) {
          return bucket;
        }

        const nextHandles = bucket.handles.filter((handle) => handle.handleId !== handleId);

        return {
          ...bucket,
          handles: nextHandles.length > 0 ? nextHandles : [createEmptyHandleDraft()]
        };
      })
    }));
  }

  return (
    <div className="page-shell">
      <div className="page-shell__gradient" />

      <main className="layout">
        <section className="hero panel">
          <div className="hero__copy">
            <p className="eyebrow">MVP Scaffold</p>
            <h1>Поиск перспективных ниш для Twitter/X-блога</h1>
            <p className="hero__lead">
              В интерфейсе уже есть два слоя: старый mock flow для scaffold-проверки и
              новый shortlist flow с ручным bucket editor, который отправляет реальные
              topic buckets в backend niche ranking route.
            </p>
          </div>

          <div className="hero__status">
            <div className={`status-pill status-pill--${healthStatus}`}>
              API: {healthStatus === "checking" ? "проверяем" : healthStatus === "online" ? "онлайн" : "оффлайн"}
            </div>
            <div className="status-pill status-pill--neutral">
              Источник данных: {analysis?.source ?? "mock"}
            </div>
            <div className="status-pill status-pill--neutral">
              Top niches: {appConfig.analysis.defaultTopNiches}
            </div>
            <div className={`status-pill status-pill--${shortlistStatus === "error" ? "offline" : shortlistStatus === "loading" ? "checking" : "neutral"}`}>
              Shortlist: {shortlistStatus === "loading" ? "запрос идёт" : shortlistStatus === "error" ? "есть ошибка" : "готово к запуску"}
            </div>
          </div>
        </section>

        <section className="panel shortlist-panel">
          <div className="shortlist-panel__intro">
            <div>
              <p className="eyebrow">Manual Niche Shortlist</p>
              <h2>Собрать shortlist без curl</h2>
              <p className="section-copy">
                Используйте presets или соберите buckets вручную через понятный редактор.
                JSON больше не нужен: достаточно добавить названия bucket-ов и X handles.
              </p>
            </div>

            <div className="preset-grid">
              {nicheShortlistExamples.map((example) => (
                <button
                  key={example.id}
                  type="button"
                  className={`preset-button ${selectedShortlistExampleId === example.id ? "preset-button--active" : ""}`}
                  onClick={() => applyShortlistExample(example.id)}
                >
                  <strong>{example.label}</strong>
                  <span>{example.description}</span>
                </button>
              ))}

              <button
                type="button"
                className={`preset-button ${selectedShortlistExampleId === null ? "preset-button--active" : ""}`}
                onClick={resetShortlistEditor}
              >
                <strong>Пустой editor</strong>
                <span>Начать вручную с одного пустого bucket-а и постепенно собрать shortlist.</span>
              </button>
            </div>

            <div className="state-box">
              <span>Что важно знать</span>
              <p>
                Этот запрос уже ходит в живой backend pipeline и может выполняться дольше,
                чем mock flow. Для первой проверки удобно использовать `limit=1` и 2-3 buckets.
              </p>
            </div>
          </div>

          <form className="shortlist-form" onSubmit={handleShortlistSubmit}>
            <div className="shortlist-form__full">
              <BucketEditor
                buckets={shortlistForm.buckets}
                validations={shortlistValidations}
                onBucketAdd={handleBucketAdd}
                onBucketRemove={handleBucketRemove}
                onBucketFieldChange={handleBucketFieldChange}
                onHandleAdd={handleHandleAdd}
                onHandleChange={handleHandleChange}
                onHandleRemove={handleHandleRemove}
              />
            </div>

            <div className="field-grid">
              <label>
                <span>Limit на аккаунт</span>
                <input
                  value={shortlistForm.limit}
                  onChange={(event) =>
                    patchShortlistForm((current) => ({
                      ...current,
                      limit: event.target.value
                    }))
                  }
                  placeholder="1"
                />
              </label>

              <label>
                <span>Top N</span>
                <input
                  value={shortlistForm.topN}
                  onChange={(event) =>
                    patchShortlistForm((current) => ({
                      ...current,
                      topN: event.target.value
                    }))
                  }
                  placeholder="2"
                />
              </label>

              <label>
                <span>Как ранжировать shortlist</span>
                <select
                  value={shortlistForm.sortBy}
                  onChange={(event) =>
                    patchShortlistForm((current) => ({
                      ...current,
                      sortBy: event.target.value as NicheShortlistSortBy
                    }))
                  }
                >
                  {shortlistSortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="toggle-grid">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={shortlistForm.includeUncertain}
                  onChange={(event) =>
                    patchShortlistForm((current) => ({
                      ...current,
                      includeUncertain: event.target.checked
                    }))
                  }
                />
                <span>Включать сомнительные посты</span>
              </label>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={shortlistForm.treatQuoteAsUsable}
                  onChange={(event) =>
                    patchShortlistForm((current) => ({
                      ...current,
                      treatQuoteAsUsable: event.target.checked
                    }))
                  }
                />
                <span>Считать quote-посты пригодными</span>
              </label>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={shortlistForm.emphasizeGrowth}
                  onChange={(event) =>
                    patchShortlistForm((current) => ({
                      ...current,
                      emphasizeGrowth: event.target.checked
                    }))
                  }
                />
                <span>Усилить сигнал роста</span>
              </label>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={shortlistForm.emphasizeMonetization}
                  onChange={(event) =>
                    patchShortlistForm((current) => ({
                      ...current,
                      emphasizeMonetization: event.target.checked
                    }))
                  }
                />
                <span>Усилить сигнал монетизации</span>
              </label>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={shortlistForm.emphasizeEase}
                  onChange={(event) =>
                    patchShortlistForm((current) => ({
                      ...current,
                      emphasizeEase: event.target.checked
                    }))
                  }
                />
                <span>Усилить простоту запуска</span>
              </label>
            </div>

            <button type="submit" disabled={shortlistStatus === "loading"}>
              {shortlistStatus === "loading"
                ? "Собираем shortlist..."
                : "Запустить shortlist ниш"}
            </button>
          </form>
        </section>

        {shortlistErrorMessage ? (
          <section className="panel state-panel">
            <p className="eyebrow">Ошибка запроса</p>
            <h2>Shortlist пока не получен</h2>
            <p className="error-text">{shortlistErrorMessage}</p>
          </section>
        ) : null}

        {shortlistStatus === "loading" ? (
          <section className="panel state-panel">
            <p className="eyebrow">Загрузка</p>
            <h2>Backend собирает shortlist</h2>
            <p className="section-copy">
              Маршрут проходит через topic scoring pipeline и может занимать до минуты.
              Для первого прогона лучше держать `limit` небольшим.
            </p>
          </section>
        ) : null}

        {shortlistResult ? (
          <>
            <NicheShortlistSummary shortlist={shortlistResult} />

            <section className="shortlist-results">
              {shortlistResult.rankedBuckets.map((bucket) => (
                <NicheShortlistCard key={bucket.bucketId} bucket={bucket} />
              ))}
            </section>
          </>
        ) : shortlistStatus === "idle" ? (
          <section className="panel state-panel">
            <p className="eyebrow">Пустое состояние</p>
            <h2>Shortlist появится здесь</h2>
            <p className="section-copy">
              Выберите один из preset-ов или соберите buckets через editor, затем
              запустите shortlist. Результат покажет ranking reasons, decision labels и
              сильнейшие аккаунты по каждой нише.
            </p>
          </section>
        ) : null}

        <section className="panel control-panel">
          <div>
            <p className="eyebrow">Legacy Mock Flow</p>
            <h2>Точка запуска mock-анализа</h2>
            <p className="section-copy">
              Здесь уже есть форма, которую позже можно будет связать с реальным
              Playwright-коллектором и scoring pipeline.
            </p>
          </div>

          <form className="analysis-form" onSubmit={handleSubmit}>
            <label>
              <span>Рынок / аудитория</span>
              <input
                value={request.marketHint ?? ""}
                onChange={(event) =>
                  setRequest((current) => ({
                    ...current,
                    marketHint: event.target.value
                  }))
                }
                placeholder="Например: англоязычный tech X"
              />
            </label>

            <label>
              <span>Цель автора</span>
              <textarea
                rows={3}
                value={request.creatorGoal ?? ""}
                onChange={(event) =>
                  setRequest((current) => ({
                    ...current,
                    creatorGoal: event.target.value
                  }))
                }
                placeholder="Например: найти нишу с высоким ER и хорошей монетизацией"
              />
            </label>

            <button type="submit" disabled={analysisStatus === "loading"}>
              {analysisStatus === "loading" ? "Собираем mock-анализ..." : "Запустить mock-анализ"}
            </button>
          </form>

          {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

          {analysis ? (
            <div className="analysis-meta">
              <div>
                <span>Сгенерировано</span>
                <strong>{new Date(analysis.generatedAt).toLocaleString("ru-RU")}</strong>
              </div>
              <div>
                <span>Ниш найдено</span>
                <strong>{analysis.topNiches.length}</strong>
              </div>
              <div>
                <span>Influencers на нишу</span>
                <strong>{appConfig.analysis.influencersPerNiche}</strong>
              </div>
            </div>
          ) : null}
        </section>

        <section className="panel notes-panel">
          <p className="eyebrow">Backend Notes</p>
          <h2>Что уже проверяется этим scaffold</h2>
          <div className="notes-list">
            {(analysis?.notes ?? ["Ожидаем первый ответ backend."]).map((note) => (
              <p key={note}>{note}</p>
            ))}
          </div>
        </section>

        <section className="results">
          {analysis?.topNiches.map((niche, index) => (
            <NicheCard key={niche.id} niche={niche} rank={index + 1} />
          ))}
        </section>
      </main>
    </div>
  );
}
