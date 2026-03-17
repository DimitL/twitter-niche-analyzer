import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { appConfig, type AnalysisRequest, type AnalysisResponse } from "@twitter-niche-analyzer/shared";
import { getApiHealth, runMockAnalysis } from "./api/client.js";
import { NicheCard } from "./components/NicheCard.js";

const initialRequest: AnalysisRequest = {
  marketHint: "англоязычный tech X",
  creatorGoal: "найти ниши с высоким engagement относительно размера аудитории"
};

export default function App() {
  const [request, setRequest] = useState<AnalysisRequest>(initialRequest);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [healthStatus, setHealthStatus] = useState<"checking" | "online" | "offline">("checking");
  const [analysisStatus, setAnalysisStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadAnalysis(request);
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
              Сейчас это демонстрационный поток: frontend вызывает backend, backend
              возвращает mock-оценку ниш, а общая логика лежит в `shared`.
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
          </div>
        </section>

        <section className="panel control-panel">
          <div>
            <p className="eyebrow">Mock Analysis Input</p>
            <h2>Точка запуска анализа</h2>
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
