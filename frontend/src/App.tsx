import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { appConfig, type AnalysisRequest, type AnalysisResponse } from "@twitter-niche-analyzer/shared";
import { getApiHealth, runMockAnalysis, runNicheShortlist } from "./api/client.js";
import {
  defaultNicheShortlistExampleId,
  nicheShortlistExamples,
  serializeBucketsForTextarea
} from "./data/nicheShortlistExamples.js";
import { NicheCard } from "./components/NicheCard.js";
import { NicheShortlistCard } from "./components/NicheShortlistCard.js";
import { NicheShortlistSummary } from "./components/NicheShortlistSummary.js";
import type {
  NicheShortlistBucketInput,
  NicheShortlistResponse,
  NicheShortlistSortBy
} from "./types/nicheShortlist.js";

const initialRequest: AnalysisRequest = {
  marketHint: "англоязычный tech X",
  creatorGoal: "найти ниши с высоким engagement относительно размера аудитории"
};

interface NicheShortlistFormState {
  bucketsText: string;
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
  { value: "overallTopicScore", label: "Overall topic score" },
  { value: "growthPotential", label: "Growth potential" },
  { value: "monetizationPotential", label: "Monetization potential" },
  { value: "contentEase", label: "Content ease" },
  { value: "dataConfidence", label: "Data confidence" }
];

function buildShortlistFormState(exampleId = defaultNicheShortlistExampleId): NicheShortlistFormState {
  const example =
    nicheShortlistExamples.find((entry) => entry.id === exampleId) ??
    nicheShortlistExamples[0];

  return {
    bucketsText: serializeBucketsForTextarea(example.buckets),
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
    throw new Error("Числовые поля limit и topN должны быть положительными числами.");
  }

  return parsedValue;
}

function parseBucketsText(bucketsText: string): NicheShortlistBucketInput[] {
  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(bucketsText);
  } catch {
    throw new Error("Не удалось прочитать JSON в поле buckets. Проверьте синтаксис.");
  }

  if (!Array.isArray(parsedValue) || parsedValue.length === 0) {
    throw new Error("Поле buckets должно содержать непустой JSON-массив.");
  }

  return parsedValue as NicheShortlistBucketInput[];
}

export default function App() {
  const [request, setRequest] = useState<AnalysisRequest>(initialRequest);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [healthStatus, setHealthStatus] = useState<"checking" | "online" | "offline">("checking");
  const [analysisStatus, setAnalysisStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedShortlistExampleId, setSelectedShortlistExampleId] = useState(
    defaultNicheShortlistExampleId
  );
  const [shortlistForm, setShortlistForm] = useState<NicheShortlistFormState>(() =>
    buildShortlistFormState()
  );
  const [shortlistResult, setShortlistResult] = useState<NicheShortlistResponse | null>(null);
  const [shortlistStatus, setShortlistStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle"
  );
  const [shortlistErrorMessage, setShortlistErrorMessage] = useState("");

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
        buckets: parseBucketsText(nextForm.bucketsText),
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadAnalysis(request);
  }

  function handleShortlistSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadShortlist(shortlistForm);
  }

  function applyShortlistExample(exampleId: string) {
    setSelectedShortlistExampleId(exampleId);
    setShortlistForm(buildShortlistFormState(exampleId));
    setShortlistErrorMessage("");
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
              новый manual niche shortlist flow, который отправляет реальные topic
              buckets в backend niche ranking route.
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
              Shortlist UI: {shortlistStatus === "loading" ? "запрос идёт" : shortlistStatus === "error" ? "есть ошибка" : "готово к запуску"}
            </div>
          </div>
        </section>

        <section className="panel shortlist-panel">
          <div className="shortlist-panel__intro">
            <div>
              <p className="eyebrow">Manual Niche Shortlist</p>
              <h2>Собрать shortlist без curl</h2>
              <p className="section-copy">
                Вставьте ручные topic buckets, выберите ranking акценты и запустите
                shortlist прямо из UI. Для первого шага достаточно JSON textarea и
                пары предустановленных presets.
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
            <label className="shortlist-form__full">
              <span>Buckets JSON</span>
              <textarea
                rows={16}
                value={shortlistForm.bucketsText}
                onChange={(event) =>
                  setShortlistForm((current) => ({
                    ...current,
                    bucketsText: event.target.value
                  }))
                }
                placeholder='[{"bucketId":"frontier-labs","label":"Frontier Labs","handles":["OpenAI","AnthropicAI"]}]'
              />
            </label>

            <div className="field-grid">
              <label>
                <span>Limit на аккаунт</span>
                <input
                  value={shortlistForm.limit}
                  onChange={(event) =>
                    setShortlistForm((current) => ({
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
                    setShortlistForm((current) => ({
                      ...current,
                      topN: event.target.value
                    }))
                  }
                  placeholder="2"
                />
              </label>

              <label>
                <span>Sort by</span>
                <select
                  value={shortlistForm.sortBy}
                  onChange={(event) =>
                    setShortlistForm((current) => ({
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
                    setShortlistForm((current) => ({
                      ...current,
                      includeUncertain: event.target.checked
                    }))
                  }
                />
                <span>Включать uncertain items</span>
              </label>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={shortlistForm.treatQuoteAsUsable}
                  onChange={(event) =>
                    setShortlistForm((current) => ({
                      ...current,
                      treatQuoteAsUsable: event.target.checked
                    }))
                  }
                />
                <span>Считать quote posts usable</span>
              </label>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={shortlistForm.emphasizeGrowth}
                  onChange={(event) =>
                    setShortlistForm((current) => ({
                      ...current,
                      emphasizeGrowth: event.target.checked
                    }))
                  }
                />
                <span>Усилить growth</span>
              </label>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={shortlistForm.emphasizeMonetization}
                  onChange={(event) =>
                    setShortlistForm((current) => ({
                      ...current,
                      emphasizeMonetization: event.target.checked
                    }))
                  }
                />
                <span>Усилить monetization</span>
              </label>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={shortlistForm.emphasizeEase}
                  onChange={(event) =>
                    setShortlistForm((current) => ({
                      ...current,
                      emphasizeEase: event.target.checked
                    }))
                  }
                />
                <span>Усилить ease</span>
              </label>
            </div>

            <button type="submit" disabled={shortlistStatus === "loading"}>
              {shortlistStatus === "loading"
                ? "Собираем shortlist..."
                : "Запустить niche shortlist"}
            </button>
          </form>
        </section>

        {shortlistErrorMessage ? (
          <section className="panel state-panel">
            <p className="eyebrow">Request Error</p>
            <h2>Shortlist пока не получен</h2>
            <p className="error-text">{shortlistErrorMessage}</p>
          </section>
        ) : null}

        {shortlistStatus === "loading" ? (
          <section className="panel state-panel">
            <p className="eyebrow">Loading</p>
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
            <p className="eyebrow">Empty State</p>
            <h2>Shortlist появится здесь</h2>
            <p className="section-copy">
              Выберите один из example presets или вставьте свой JSON buckets payload, затем
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
