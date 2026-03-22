import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { appConfig, type AnalysisRequest, type AnalysisResponse } from "@twitter-niche-analyzer/shared";
import { getApiHealth, runMockAnalysis, runNicheShortlist } from "./api/client.js";
import {
  nicheShortlistPresetLibrary,
  type NicheShortlistPresetPack
} from "./data/nicheShortlistPresetLibrary.js";
import { BucketEditor } from "./components/BucketEditor.js";
import { CrossNicheContentCalendarAdaptation } from "./components/CrossNicheContentCalendarAdaptation.js";
import { CrossNicheContentCalendarStarter } from "./components/CrossNicheContentCalendarStarter.js";
import { CrossNicheContentRepurposingHints } from "./components/CrossNicheContentRepurposingHints.js";
import { CrossNicheFormatExampleRewrites } from "./components/CrossNicheFormatExampleRewrites.js";
import { CrossNicheFormatPublishChecklists } from "./components/CrossNicheFormatPublishChecklists.js";
import { CrossNicheFormatExecutionTemplates } from "./components/CrossNicheFormatExecutionTemplates.js";
import { CrossNichePositioningPlaybook } from "./components/CrossNichePositioningPlaybook.js";
import { CrossNichePositioningRecommendations } from "./components/CrossNichePositioningRecommendations.js";
import { CrossNicheRepeatableContentSeries } from "./components/CrossNicheRepeatableContentSeries.js";
import { CrossNicheWhitespaceComparison } from "./components/CrossNicheWhitespaceComparison.js";
import { NicheCard } from "./components/NicheCard.js";
import { NicheShortlistCard } from "./components/NicheShortlistCard.js";
import { PresetLibrary } from "./components/PresetLibrary.js";
import { ShortlistReportPanel } from "./components/ShortlistReportPanel.js";
import { ShortlistPayloadPreview } from "./components/ShortlistPayloadPreview.js";
import { ShortlistScenarioComparison } from "./components/ShortlistScenarioComparison.js";
import { ShortlistScenarioSwitcher } from "./components/ShortlistScenarioSwitcher.js";
import { NicheShortlistSummary } from "./components/NicheShortlistSummary.js";
import type {
  NicheShortlistFormState,
  NicheShortlistRequest,
  NicheShortlistResponse,
  NicheShortlistSortBy
} from "./types/nicheShortlist.js";
import {
  appendBucketDraftsFromInputs,
  appendHandlesToBucketDraft,
  buildBucketDraftsFromInputs,
  buildBucketInputsFromDrafts,
  createEmptyBucketDraft,
  duplicateBucketDraft,
  hasBucketDraftValidationErrors,
  validateBucketDrafts
} from "./utils/nicheShortlistBucketEditor.js";
import {
  areFormStateAndScenarioEqual,
  buildDefaultShortlistFormState,
  buildNextScenarioName,
  createScenarioFromFormState,
  duplicateScenario,
  loadScenarioBootstrapState,
  pinScenarioResult,
  persistScenarioCollection,
  renameScenario,
  restoreFormStateFromSnapshot,
  updateScenarioFromFormState
} from "./utils/nicheShortlistScenarios.js";
import { buildCrossNichePositioningRecommendations } from "./utils/nicheCrossPositioning.js";
import { buildNicheContentCalendarAdaptation } from "./utils/nicheContentCalendarAdaptation.js";
import { buildNicheContentRepurposingHints } from "./utils/nicheContentRepurposingHints.js";
import { buildNicheContentCalendarStarter } from "./utils/nicheContentCalendarStarter.js";
import { buildNicheFormatExampleRewrites } from "./utils/nicheFormatExampleRewrites.js";
import { buildNicheFormatPublishChecklists } from "./utils/nicheFormatPublishChecklists.js";
import { buildNicheFormatExecutionTemplates } from "./utils/nicheFormatExecutionTemplates.js";
import { buildNichePositioningPlaybook } from "./utils/nichePositioningPlaybook.js";
import { buildNicheRepeatableContentSeries } from "./utils/nicheRepeatableContentSeries.js";
import { buildCrossNicheWhitespaceComparison } from "./utils/nicheCrossWhitespace.js";

const initialRequest: AnalysisRequest = {
  marketHint: "англоязычный tech X",
  creatorGoal: "найти ниши с высоким engagement относительно размера аудитории"
};

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

const maxScenarioCompareCount = 3;

function buildShortlistFormStateFromPreset(
  preset: NicheShortlistPresetPack
): NicheShortlistFormState {
  return {
    buckets: buildBucketDraftsFromInputs(preset.buckets),
    limit: preset.limit,
    topN: preset.topN,
    includeUncertain: preset.includeUncertain,
    treatQuoteAsUsable: preset.treatQuoteAsUsable,
    sortBy: preset.sortBy,
    emphasizeGrowth: preset.emphasizeGrowth,
    emphasizeMonetization: preset.emphasizeMonetization,
    emphasizeEase: preset.emphasizeEase
  };
}

function resolvePresetById(presetId: string) {
  return (
    nicheShortlistPresetLibrary.find((preset) => preset.presetId === presetId) ?? null
  );
}

function buildPresetScenarioName(
  preset: NicheShortlistPresetPack,
  scenariosCount: number
) {
  if (scenariosCount === 0) {
    return preset.title;
  }

  return `${preset.title} (${scenariosCount + 1})`;
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

function buildShortlistRequestPayload(
  nextForm: NicheShortlistFormState,
  options?: { safeNumericParsing?: boolean }
): NicheShortlistRequest {
  function parseNumericValue(value: string) {
    if (options?.safeNumericParsing) {
      try {
        return parseOptionalInteger(value);
      } catch {
        return undefined;
      }
    }

    return parseOptionalInteger(value);
  }

  return {
    buckets: buildBucketInputsFromDrafts(nextForm.buckets),
    limit: parseNumericValue(nextForm.limit),
    topN: parseNumericValue(nextForm.topN),
    includeUncertain: nextForm.includeUncertain,
    treatQuoteAsUsable: nextForm.treatQuoteAsUsable,
    sortBy: nextForm.sortBy,
    emphasizeGrowth: nextForm.emphasizeGrowth,
    emphasizeMonetization: nextForm.emphasizeMonetization,
    emphasizeEase: nextForm.emphasizeEase
  };
}

export default function App() {
  const [scenarioBootstrap] = useState(() => loadScenarioBootstrapState());
  const [request, setRequest] = useState<AnalysisRequest>(initialRequest);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [healthStatus, setHealthStatus] = useState<"checking" | "online" | "offline">("checking");
  const [analysisStatus, setAnalysisStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedPresetPackId, setSelectedPresetPackId] = useState<string | null>(null);
  const [shortlistScenarios, setShortlistScenarios] = useState(() => scenarioBootstrap.scenarios);
  const [activeScenarioId, setActiveScenarioId] = useState(() => scenarioBootstrap.activeScenarioId);
  const [comparedScenarioIds, setComparedScenarioIds] = useState<string[]>(() =>
    scenarioBootstrap.activeScenarioId ? [scenarioBootstrap.activeScenarioId] : []
  );
  const [scenarioStorageNotice, setScenarioStorageNotice] = useState<string | null>(
    () => scenarioBootstrap.storageNotice
  );
  const [shortlistForm, setShortlistForm] = useState<NicheShortlistFormState>(
    () => scenarioBootstrap.formState
  );
  const [shortlistResult, setShortlistResult] = useState<NicheShortlistResponse | null>(null);
  const [shortlistResultScenarioId, setShortlistResultScenarioId] = useState<string | null>(null);
  const [shortlistResultGeneratedAt, setShortlistResultGeneratedAt] = useState<string | null>(null);
  const [shortlistResultSourceKind, setShortlistResultSourceKind] = useState<"live" | "pinned" | null>(null);
  const [shortlistStatus, setShortlistStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle"
  );
  const [shortlistErrorMessage, setShortlistErrorMessage] = useState("");
  const [showShortlistValidation, setShowShortlistValidation] = useState(false);
  const activeScenarioIdRef = useRef(scenarioBootstrap.activeScenarioId);

  const currentShortlistValidations = useMemo(
    () => validateBucketDrafts(shortlistForm.buckets),
    [shortlistForm.buckets]
  );
  const shortlistValidations = useMemo(
    () => (showShortlistValidation ? currentShortlistValidations : {}),
    [currentShortlistValidations, showShortlistValidation]
  );
  const shortlistPayloadPreview = useMemo(
    () => buildShortlistRequestPayload(shortlistForm, { safeNumericParsing: true }),
    [shortlistForm]
  );
  const activeScenario = useMemo(
    () =>
      shortlistScenarios.find((scenario) => scenario.scenarioId === activeScenarioId) ?? null,
    [activeScenarioId, shortlistScenarios]
  );
  const hasUnsavedScenarioChanges = useMemo(
    () => !areFormStateAndScenarioEqual(shortlistForm, activeScenario),
    [activeScenario, shortlistForm]
  );
  const shortlistReportSource = useMemo(() => {
    if (shortlistResult && shortlistResultScenarioId === activeScenarioId) {
      return {
        shortlist: shortlistResult,
        generatedAt: shortlistResultGeneratedAt,
        sourceKind: shortlistResultSourceKind ?? "live"
      } as const;
    }

    if (activeScenario?.lastShortlistResponse) {
      return {
        shortlist: activeScenario.lastShortlistResponse,
        generatedAt: activeScenario.lastRunAt ?? null,
        sourceKind: "pinned"
      } as const;
    }

    return {
      shortlist: null,
      generatedAt: null,
      sourceKind: null
    } as const;
  }, [
    activeScenario,
    activeScenarioId,
    shortlistResult,
    shortlistResultGeneratedAt,
    shortlistResultScenarioId,
    shortlistResultSourceKind
  ]);
  const shortlistCrossWhitespace = useMemo(
    () => (shortlistResult ? buildCrossNicheWhitespaceComparison(shortlistResult) : null),
    [shortlistResult]
  );
  const shortlistCrossPositioning = useMemo(
    () =>
      shortlistResult
        ? buildCrossNichePositioningRecommendations(
            shortlistResult,
            shortlistCrossWhitespace
          )
        : null,
    [shortlistCrossWhitespace, shortlistResult]
  );
  const shortlistPositioningPlaybook = useMemo(
    () =>
      shortlistResult
        ? buildNichePositioningPlaybook(
            shortlistResult,
            shortlistCrossPositioning
          )
        : null,
    [shortlistCrossPositioning, shortlistResult]
  );
  const shortlistRepeatableSeries = useMemo(
    () =>
      shortlistResult
        ? buildNicheRepeatableContentSeries(
            shortlistResult,
            shortlistPositioningPlaybook
          )
        : null,
    [shortlistPositioningPlaybook, shortlistResult]
  );
  const shortlistContentCalendar = useMemo(
    () =>
      shortlistResult
        ? buildNicheContentCalendarStarter(
            shortlistResult,
            shortlistPositioningPlaybook,
            shortlistRepeatableSeries
          )
        : null,
    [shortlistPositioningPlaybook, shortlistRepeatableSeries, shortlistResult]
  );
  const shortlistContentCalendarAdaptation = useMemo(
    () =>
      shortlistResult
        ? buildNicheContentCalendarAdaptation(
            shortlistResult,
            shortlistPositioningPlaybook,
            shortlistRepeatableSeries,
            shortlistContentCalendar
          )
        : null,
    [
      shortlistContentCalendar,
      shortlistPositioningPlaybook,
      shortlistRepeatableSeries,
      shortlistResult
    ]
  );
  const shortlistContentRepurposingHints = useMemo(
    () =>
      shortlistResult
        ? buildNicheContentRepurposingHints(
            shortlistResult,
            shortlistPositioningPlaybook,
            shortlistRepeatableSeries,
            shortlistContentCalendar,
            shortlistContentCalendarAdaptation
          )
        : null,
    [
      shortlistContentCalendar,
      shortlistContentCalendarAdaptation,
      shortlistPositioningPlaybook,
      shortlistRepeatableSeries,
      shortlistResult
    ]
  );
  const shortlistFormatExecutionTemplates = useMemo(
    () =>
      shortlistResult
        ? buildNicheFormatExecutionTemplates(
            shortlistResult,
            shortlistPositioningPlaybook,
            shortlistRepeatableSeries,
            shortlistContentCalendar,
            shortlistContentCalendarAdaptation,
            shortlistContentRepurposingHints
          )
        : null,
    [
      shortlistContentCalendar,
      shortlistContentCalendarAdaptation,
      shortlistContentRepurposingHints,
      shortlistPositioningPlaybook,
      shortlistRepeatableSeries,
      shortlistResult
    ]
  );
  const shortlistFormatExampleRewrites = useMemo(
    () =>
      shortlistResult
        ? buildNicheFormatExampleRewrites(
            shortlistResult,
            shortlistPositioningPlaybook,
            shortlistRepeatableSeries,
            shortlistContentCalendar,
            shortlistContentCalendarAdaptation,
            shortlistContentRepurposingHints,
            shortlistFormatExecutionTemplates
          )
        : null,
    [
      shortlistContentCalendar,
      shortlistContentCalendarAdaptation,
      shortlistContentRepurposingHints,
      shortlistFormatExecutionTemplates,
      shortlistPositioningPlaybook,
      shortlistRepeatableSeries,
      shortlistResult
    ]
  );
  const shortlistFormatPublishChecklists = useMemo(
    () =>
      shortlistResult
        ? buildNicheFormatPublishChecklists(
            shortlistResult,
            shortlistContentRepurposingHints,
            shortlistFormatExecutionTemplates,
            shortlistFormatExampleRewrites
          )
        : null,
    [
      shortlistContentRepurposingHints,
      shortlistFormatExampleRewrites,
      shortlistFormatExecutionTemplates,
      shortlistResult
    ]
  );

  useEffect(() => {
    void loadHealth();
    void loadAnalysis(initialRequest);
  }, []);

  useEffect(() => {
    activeScenarioIdRef.current = activeScenarioId;
  }, [activeScenarioId]);

  useEffect(() => {
    setComparedScenarioIds((current) => {
      const validScenarioIds = new Set(shortlistScenarios.map((scenario) => scenario.scenarioId));
      const nextComparedScenarioIds = current.filter((scenarioId) => validScenarioIds.has(scenarioId));

      if (nextComparedScenarioIds.length > 0) {
        return nextComparedScenarioIds.slice(0, maxScenarioCompareCount);
      }

      return activeScenarioId ? [activeScenarioId] : [];
    });
  }, [activeScenarioId, shortlistScenarios]);

  useEffect(() => {
    try {
      persistScenarioCollection(shortlistScenarios, activeScenarioId);
      setScenarioStorageNotice(null);
    } catch {
      setScenarioStorageNotice(
        "Не удалось сохранить сценарии в localStorage. Проверьте доступность хранилища браузера."
      );
    }
  }, [activeScenarioId, shortlistScenarios]);

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
    const targetScenarioId = activeScenarioIdRef.current;
    const generatedAt = new Date().toISOString();

    try {
      setShortlistStatus("loading");
      setShortlistErrorMessage("");
      const requestPayload = buildShortlistRequestPayload(nextForm);
      const response = await runNicheShortlist(requestPayload);

      setShortlistResult(response);
      setShortlistResultScenarioId(targetScenarioId);
      setShortlistResultGeneratedAt(generatedAt);
      setShortlistResultSourceKind("live");
      setShortlistStatus("ready");
      setShortlistScenarios((current) => {
        const activeScenario = current.find((scenario) => scenario.scenarioId === targetScenarioId);

        if (!activeScenario) {
          return current;
        }

        return current.map((scenario) =>
          scenario.scenarioId === targetScenarioId
            ? pinScenarioResult(scenario, nextForm, requestPayload, response)
            : scenario
        );
      });
      setComparedScenarioIds((current) => {
        if (!targetScenarioId) {
          return current.slice(0, maxScenarioCompareCount);
        }

        if (current.includes(targetScenarioId)) {
          return current.slice(0, maxScenarioCompareCount);
        }

        return [targetScenarioId, ...current].slice(0, maxScenarioCompareCount);
      });
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
      setSelectedPresetPackId(null);
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

    if (hasBucketDraftValidationErrors(currentShortlistValidations)) {
      setShortlistStatus("error");
      setShortlistErrorMessage("Исправьте поля bucket editor и попробуйте снова.");
      return;
    }

    void loadShortlist(shortlistForm);
  }

  function resetShortlistTransientState() {
    setShortlistErrorMessage("");
    setShortlistStatus("idle");
    setShowShortlistValidation(false);
  }

  function applyPresetReplace(presetId: string) {
    const preset = resolvePresetById(presetId);

    if (!preset) {
      return;
    }

    setSelectedPresetPackId(presetId);
    setShortlistForm(buildShortlistFormStateFromPreset(preset));
    resetShortlistTransientState();
  }

  function resetShortlistEditor() {
    setSelectedPresetPackId(null);
    setShortlistForm(buildDefaultShortlistFormState());
    resetShortlistTransientState();
  }

  function handlePresetAppend(presetId: string) {
    const preset = resolvePresetById(presetId);

    if (!preset) {
      return;
    }

    setSelectedPresetPackId(presetId);
    patchShortlistForm(
      (current) => ({
        ...current,
        buckets: appendBucketDraftsFromInputs(current.buckets, preset.buckets)
      }),
      { keepPreset: true }
    );
    resetShortlistTransientState();
  }

  function handlePresetSaveAsScenario(presetId: string) {
    const preset = resolvePresetById(presetId);

    if (!preset) {
      return;
    }

    const nextForm = buildShortlistFormStateFromPreset(preset);
    const nextScenario = createScenarioFromFormState(
      nextForm,
      buildPresetScenarioName(preset, shortlistScenarios.length)
    );

    setShortlistScenarios((current) => [nextScenario, ...current]);
    activeScenarioIdRef.current = nextScenario.scenarioId;
    setActiveScenarioId(nextScenario.scenarioId);
    setComparedScenarioIds((current) =>
      [nextScenario.scenarioId, ...current].slice(0, maxScenarioCompareCount)
    );
    setSelectedPresetPackId(presetId);
    setShortlistForm(nextForm);
    resetShortlistTransientState();
  }

  function handleScenarioLoad(scenarioId: string) {
    const scenario = shortlistScenarios.find((entry) => entry.scenarioId === scenarioId);

    if (!scenario) {
      return;
    }

    activeScenarioIdRef.current = scenario.scenarioId;
    setActiveScenarioId(scenario.scenarioId);
    setSelectedPresetPackId(null);
    setShortlistForm(restoreFormStateFromSnapshot(scenario.formSnapshot));
    resetShortlistTransientState();
  }

  function handleScenarioSave() {
    if (!activeScenario) {
      const nextScenario = createScenarioFromFormState(
        shortlistForm,
        buildNextScenarioName(shortlistScenarios)
      );

      setShortlistScenarios((current) => [...current, nextScenario]);
      activeScenarioIdRef.current = nextScenario.scenarioId;
      setActiveScenarioId(nextScenario.scenarioId);
      setComparedScenarioIds((current) => [nextScenario.scenarioId, ...current].slice(0, maxScenarioCompareCount));
      return;
    }

    setShortlistScenarios((current) =>
      current.map((scenario) =>
        scenario.scenarioId === activeScenario.scenarioId
          ? updateScenarioFromFormState(scenario, shortlistForm)
          : scenario
      )
    );
  }

  function handleScenarioSaveAsNew() {
    const defaultName = activeScenario
      ? `${activeScenario.name} копия`
      : buildNextScenarioName(shortlistScenarios);
    const nextName = window.prompt("Как назвать новый сценарий?", defaultName);

    if (nextName === null) {
      return;
    }

    const nextScenario = createScenarioFromFormState(shortlistForm, nextName || defaultName);

    setShortlistScenarios((current) => [nextScenario, ...current]);
    activeScenarioIdRef.current = nextScenario.scenarioId;
    setActiveScenarioId(nextScenario.scenarioId);
    setComparedScenarioIds((current) => [nextScenario.scenarioId, ...current].slice(0, maxScenarioCompareCount));
    setSelectedPresetPackId(null);
  }

  function handleScenarioRename(scenarioId: string) {
    const scenario = shortlistScenarios.find((entry) => entry.scenarioId === scenarioId);

    if (!scenario) {
      return;
    }

    const nextName = window.prompt("Новое имя сценария", scenario.name);

    if (nextName === null) {
      return;
    }

    setShortlistScenarios((current) =>
      current.map((entry) =>
        entry.scenarioId === scenarioId ? renameScenario(entry, nextName) : entry
      )
    );
  }

  function handleScenarioDuplicate(scenarioId: string) {
    const scenario = shortlistScenarios.find((entry) => entry.scenarioId === scenarioId);

    if (!scenario) {
      return;
    }

    const nextScenario = duplicateScenario(scenario);

    setShortlistScenarios((current) => [nextScenario, ...current]);
    activeScenarioIdRef.current = nextScenario.scenarioId;
    setActiveScenarioId(nextScenario.scenarioId);
    setComparedScenarioIds((current) => [nextScenario.scenarioId, ...current].slice(0, maxScenarioCompareCount));
    setSelectedPresetPackId(null);
    setShortlistForm(restoreFormStateFromSnapshot(nextScenario.formSnapshot));
    resetShortlistTransientState();
  }

  function handleScenarioCompareToggle(scenarioId: string) {
    setComparedScenarioIds((current) => {
      if (current.includes(scenarioId)) {
        return current.filter((entry) => entry !== scenarioId);
      }

      return [scenarioId, ...current].slice(0, maxScenarioCompareCount);
    });
  }

  function handleScenarioDelete(scenarioId: string) {
    const scenario = shortlistScenarios.find((entry) => entry.scenarioId === scenarioId);

    if (!scenario) {
      return;
    }

    const shouldDelete = window.confirm(
      `Удалить сценарий «${scenario.name}»? Его ещё можно будет пересобрать вручную, но локальная история этого варианта исчезнет.`
    );

    if (!shouldDelete) {
      return;
    }

    const nextScenarios = shortlistScenarios.filter((entry) => entry.scenarioId !== scenarioId);

    if (nextScenarios.length === 0) {
      const defaultScenario = createScenarioFromFormState(
        buildDefaultShortlistFormState(),
        "Сценарий 1"
      );

      setShortlistScenarios([defaultScenario]);
      activeScenarioIdRef.current = defaultScenario.scenarioId;
      setActiveScenarioId(defaultScenario.scenarioId);
      setSelectedPresetPackId(null);
      setShortlistForm(restoreFormStateFromSnapshot(defaultScenario.formSnapshot));
      resetShortlistTransientState();
      return;
    }

    setShortlistScenarios(nextScenarios);

    if (activeScenarioId === scenarioId) {
      const nextActiveScenario = nextScenarios[0];
      activeScenarioIdRef.current = nextActiveScenario.scenarioId;
      setActiveScenarioId(nextActiveScenario.scenarioId);
      setSelectedPresetPackId(null);
      setShortlistForm(restoreFormStateFromSnapshot(nextActiveScenario.formSnapshot));
      resetShortlistTransientState();
    }
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

  function handleBucketDuplicate(bucketEditorId: string) {
    patchShortlistForm((current) => {
      const sourceBucket = current.buckets.find((bucket) => bucket.editorId === bucketEditorId);

      if (!sourceBucket) {
        return current;
      }

      return {
        ...current,
        buckets: [...current.buckets, duplicateBucketDraft(sourceBucket, current.buckets)]
      };
    });
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

  function handleHandlesAppend(bucketEditorId: string, value: string) {
    patchShortlistForm((current) => ({
      ...current,
      buckets: current.buckets.map((bucket) =>
        bucket.editorId === bucketEditorId
          ? appendHandlesToBucketDraft(bucket, value)
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
          handles: nextHandles
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
              <p className="eyebrow">Ручной shortlist ниш</p>
              <h2>Собрать shortlist без curl</h2>
              <p className="section-copy">
                Используйте библиотеку preset-ов для быстрого старта или соберите buckets
                вручную через понятный редактор. JSON больше не нужен: достаточно
                добавить названия bucket-ов и X handles.
              </p>
            </div>

            <ShortlistScenarioSwitcher
              scenarios={shortlistScenarios}
              activeScenarioId={activeScenarioId}
              selectedScenarioIds={comparedScenarioIds}
              maxCompareCount={maxScenarioCompareCount}
              hasUnsavedChanges={hasUnsavedScenarioChanges}
              storageNotice={scenarioStorageNotice}
              onScenarioCompareToggle={handleScenarioCompareToggle}
              onScenarioLoad={handleScenarioLoad}
              onScenarioSave={handleScenarioSave}
              onScenarioSaveAsNew={handleScenarioSaveAsNew}
              onScenarioRename={handleScenarioRename}
              onScenarioDuplicate={handleScenarioDuplicate}
              onScenarioDelete={handleScenarioDelete}
            />

            <PresetLibrary
              presets={nicheShortlistPresetLibrary}
              selectedPresetId={selectedPresetPackId}
              onPresetReplace={applyPresetReplace}
              onPresetAppend={handlePresetAppend}
              onPresetSaveAsScenario={handlePresetSaveAsScenario}
              onResetEditor={resetShortlistEditor}
            />

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
                onBucketDuplicate={handleBucketDuplicate}
                onBucketRemove={handleBucketRemove}
                onBucketFieldChange={handleBucketFieldChange}
                onHandlesAppend={handleHandlesAppend}
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

            <div className="shortlist-form__full">
              <ShortlistPayloadPreview
                payload={shortlistPayloadPreview}
                validationBlocked={hasBucketDraftValidationErrors(currentShortlistValidations)}
              />
            </div>

            <button type="submit" disabled={shortlistStatus === "loading"}>
              {shortlistStatus === "loading"
                ? "Собираем shortlist..."
                : "Запустить shortlist ниш"}
            </button>
          </form>
        </section>

        <ShortlistScenarioComparison
          scenarios={shortlistScenarios}
          selectedScenarioIds={comparedScenarioIds}
          maxCompareCount={maxScenarioCompareCount}
        />

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

            {shortlistCrossWhitespace ? (
              <CrossNicheWhitespaceComparison comparison={shortlistCrossWhitespace} />
            ) : null}

            {shortlistCrossPositioning ? (
              <CrossNichePositioningRecommendations
                recommendations={shortlistCrossPositioning}
              />
            ) : null}

            {shortlistPositioningPlaybook ? (
              <CrossNichePositioningPlaybook
                playbook={shortlistPositioningPlaybook}
              />
            ) : null}

            {shortlistRepeatableSeries ? (
              <CrossNicheRepeatableContentSeries
                series={shortlistRepeatableSeries}
              />
            ) : null}

            {shortlistContentCalendar ? (
              <CrossNicheContentCalendarStarter
                calendar={shortlistContentCalendar}
              />
            ) : null}

            {shortlistContentCalendarAdaptation ? (
              <CrossNicheContentCalendarAdaptation
                adaptation={shortlistContentCalendarAdaptation}
              />
            ) : null}

            {shortlistContentRepurposingHints ? (
              <CrossNicheContentRepurposingHints
                hints={shortlistContentRepurposingHints}
              />
            ) : null}

            {shortlistFormatExecutionTemplates ? (
              <CrossNicheFormatExecutionTemplates
                templates={shortlistFormatExecutionTemplates}
              />
            ) : null}

            {shortlistFormatExampleRewrites ? (
              <CrossNicheFormatExampleRewrites
                rewrites={shortlistFormatExampleRewrites}
              />
            ) : null}

            {shortlistFormatPublishChecklists ? (
              <CrossNicheFormatPublishChecklists
                checklists={shortlistFormatPublishChecklists}
              />
            ) : null}

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
              Выберите один из готовых preset-ов или соберите buckets через editor, затем
              запустите shortlist. Результат покажет ranking reasons, decision labels,
              сильнейшие аккаунты и evidence pack по каждой нише.
            </p>
          </section>
        ) : null}

        <ShortlistReportPanel
          shortlist={shortlistReportSource.shortlist}
          scenarioName={activeScenario?.name ?? null}
          generatedAt={shortlistReportSource.generatedAt}
          sourceKind={shortlistReportSource.sourceKind}
        />

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
