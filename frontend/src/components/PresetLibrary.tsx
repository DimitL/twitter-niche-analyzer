import { useMemo, useState } from "react";
import type { NicheShortlistPresetPack } from "../data/nicheShortlistPresetLibrary.js";
import { buildPresetSignalBadges } from "../utils/nicheShortlistPresetSignals.js";

interface PresetLibraryProps {
  presets: NicheShortlistPresetPack[];
  recentPresets: NicheShortlistPresetPack[];
  storageNotice: string | null;
  selectedPresetId: string | null;
  onPresetReplace: (presetId: string) => void;
  onPresetAppend: (presetId: string) => void;
  onPresetSaveAsScenario: (presetId: string) => void;
  onResetEditor: () => void;
}

function buildPresetHandlePreview(preset: NicheShortlistPresetPack) {
  return Array.from(
    new Set(
      preset.buckets.flatMap((bucket) => bucket.handles ?? []).filter(Boolean)
    )
  ).slice(0, 6);
}

function countPresetHandles(preset: NicheShortlistPresetPack) {
  return Array.from(
    new Set(
      preset.buckets.flatMap((bucket) => bucket.handles ?? []).filter(Boolean)
    )
  ).length;
}

function buildPresetSearchIndex(preset: NicheShortlistPresetPack) {
  return [
    preset.title,
    preset.description,
    preset.category ?? "",
    ...preset.buckets.flatMap((bucket) => [
      bucket.label,
      bucket.description ?? "",
      ...(bucket.handles ?? [])
    ])
  ]
    .join(" ")
    .toLowerCase();
}

function buildCategoryOptions(presets: NicheShortlistPresetPack[]) {
  return Array.from(
    new Set(
      presets
        .map((preset) => preset.category?.trim())
        .filter((category): category is string => Boolean(category))
    )
  ).sort((left, right) => left.localeCompare(right, "ru"));
}

function renderPresetCard(options: {
  preset: NicheShortlistPresetPack;
  selectedPresetId: string | null;
  variant: "default" | "recent";
  onPresetReplace: (presetId: string) => void;
  onPresetAppend: (presetId: string) => void;
  onPresetSaveAsScenario: (presetId: string) => void;
}) {
  const { preset, selectedPresetId, variant } = options;
  const previewHandles = buildPresetHandlePreview(preset);
  const totalHandles = countPresetHandles(preset);
  const signalBadges = buildPresetSignalBadges(preset);
  const cardClassName = `preset-card ${
    selectedPresetId === preset.presetId ? "preset-card--active" : ""
  } ${variant === "recent" ? "preset-card--recent" : ""}`;

  return (
    <article key={preset.presetId} className={cardClassName}>
      <div className="preset-card__header">
        <div>
          <p className="eyebrow">
            {preset.category ? `Категория: ${preset.category}` : "Готовый pack"}
          </p>
          <h3>{preset.title}</h3>
          <p className="section-copy">{preset.description}</p>
        </div>

        <div className="decision-chip-list">
          {variant === "recent" ? (
            <span className="decision-chip decision-chip--neutral">Недавно использован</span>
          ) : null}
          {selectedPresetId === preset.presetId ? (
            <span className="decision-chip">Выбран</span>
          ) : null}
        </div>
      </div>

      <div className="preset-card__meta">
        <div className="summary-box">
          <span>Bucket-ов</span>
          <strong>{preset.buckets.length}</strong>
        </div>
        <div className="summary-box">
          <span>Уникальных handles</span>
          <strong>{totalHandles}</strong>
        </div>
        <div className="summary-box">
          <span>Режим shortlist</span>
          <strong>{preset.sortBy}</strong>
        </div>
      </div>

      {signalBadges.length > 0 ? (
        <div className="preset-card__signals">
          <span className="preset-card__signals-label">Для чего подходит быстрее всего</span>
          <div className="decision-chip-list preset-card__signals-list">
            {signalBadges.map((badge) => (
              <span
                key={`${preset.presetId}-${badge.id}`}
                className={`decision-chip ${
                  badge.tone === "neutral"
                    ? "decision-chip--neutral"
                    : badge.tone === "accent"
                      ? "decision-chip--accent"
                      : ""
                }`}
              >
                {badge.label}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="decision-chip-list">
        {previewHandles.map((handle) => (
          <span
            key={`${preset.presetId}-${handle}`}
            className="decision-chip decision-chip--neutral"
          >
            @{handle}
          </span>
        ))}
      </div>

      <details className="preset-card__preview">
        <summary className="preset-card__preview-summary">
          Посмотреть состав preset-а
        </summary>

        <div className="preset-card__bucket-list">
          {preset.buckets.map((bucket) => (
            <div
              key={`${preset.presetId}-${bucket.bucketId}`}
              className="preset-card__bucket"
            >
              <strong>{bucket.label}</strong>
              <p>{bucket.description ?? "Описание пока не задано."}</p>
              <p>
                {(bucket.handles ?? []).length > 0
                  ? (bucket.handles ?? []).map((handle) => `@${handle}`).join(", ")
                  : "Handles пока не заданы"}
              </p>
            </div>
          ))}
        </div>
      </details>

      <div className="preset-card__actions">
        <button
          type="button"
          className="editor-button editor-button--secondary"
          onClick={() => options.onPresetReplace(preset.presetId)}
        >
          Загрузить preset
        </button>
        <button
          type="button"
          className="editor-button editor-button--ghost"
          onClick={() => options.onPresetAppend(preset.presetId)}
        >
          Добавить к текущему
        </button>
        <button
          type="button"
          className="editor-button editor-button--ghost"
          onClick={() => options.onPresetSaveAsScenario(preset.presetId)}
        >
          Сохранить как сценарий
        </button>
      </div>
    </article>
  );
}

export function PresetLibrary({
  presets,
  recentPresets,
  storageNotice,
  selectedPresetId,
  onPresetReplace,
  onPresetAppend,
  onPresetSaveAsScenario,
  onResetEditor
}: PresetLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const categoryOptions = useMemo(() => buildCategoryOptions(presets), [presets]);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredPresets = useMemo(
    () =>
      presets.filter((preset) => {
        const matchesCategory =
          selectedCategory === "all" || preset.category === selectedCategory;

        if (!matchesCategory) {
          return false;
        }

        if (!normalizedSearchQuery) {
          return true;
        }

        return buildPresetSearchIndex(preset).includes(normalizedSearchQuery);
      }),
    [normalizedSearchQuery, presets, selectedCategory]
  );
  const hasActiveFilters = normalizedSearchQuery.length > 0 || selectedCategory !== "all";

  function handleResetFilters() {
    setSearchQuery("");
    setSelectedCategory("all");
  }

  if (presets.length === 0) {
    return (
      <section className="preset-library">
        <div className="preset-library__header">
          <div>
            <span>Библиотека preset-ов</span>
            <p>
              Локальная библиотека preset-ов сейчас недоступна. Можно продолжать
              работу вручную через bucket editor.
            </p>
          </div>

          <button
            type="button"
            className="editor-button editor-button--ghost"
            onClick={onResetEditor}
          >
            Пустой редактор
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="preset-library">
      <div className="preset-library__header">
        <div>
          <span>Библиотека preset-ов</span>
          <p>
            Выбирайте готовые topic packs, фильтруйте их по категории, быстро
            находите нужные packs через поиск и возвращайтесь к recent preset-ам
            без ручной сборки bucket-ов заново.
          </p>
        </div>

        <button
          type="button"
          className="editor-button editor-button--ghost"
          onClick={onResetEditor}
        >
          Пустой редактор
        </button>
      </div>

      <div className="preset-library__toolbar">
        <label className="preset-library__search">
          <span>Поиск по preset-ам</span>
          <input
            type="search"
            placeholder="Например: AI, builders, productivity, @OpenAI"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>

        <label className="preset-library__filter">
          <span>Категория</span>
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
          >
            <option value="all">Все категории</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <div className="preset-library__toolbar-actions">
          <span className="status-pill status-pill--neutral">
            Найдено preset-ов: {filteredPresets.length}
          </span>
          <button
            type="button"
            className="editor-button editor-button--ghost"
            onClick={handleResetFilters}
            disabled={!hasActiveFilters}
          >
            Сбросить фильтры
          </button>
        </div>
      </div>

      {storageNotice ? (
        <div className="state-box">
          <span>Локальная история preset-ов</span>
          <p>{storageNotice}</p>
        </div>
      ) : null}

      <div className="preset-library__recent">
        <div className="preset-library__section-header">
          <div>
            <span>Недавно использованные</span>
            <p>
              Здесь остаются preset-ы, которые вы недавно загружали, добавляли в editor
              или сохраняли как сценарий.
            </p>
          </div>
        </div>

        {recentPresets.length > 0 ? (
          <div className="preset-library__recent-list">
            {recentPresets.map((preset) =>
              renderPresetCard({
                preset,
                selectedPresetId,
                variant: "recent",
                onPresetReplace,
                onPresetAppend,
                onPresetSaveAsScenario
              })
            )}
          </div>
        ) : (
          <div className="state-box">
            <span>Пока пусто</span>
            <p>
              Как только вы загрузите или добавите preset, он появится здесь для быстрого
              возврата в следующих shortlist-экспериментах.
            </p>
          </div>
        )}
      </div>

      <div className="preset-library__section-header">
        <div>
          <span>Все preset-ы</span>
          <p>
            Можно искать по title, description, category, bucket labels и X handles.
          </p>
        </div>
      </div>

      {filteredPresets.length > 0 ? (
        <div className="preset-library__list">
          {filteredPresets.map((preset) =>
            renderPresetCard({
              preset,
              selectedPresetId,
              variant: "default",
              onPresetReplace,
              onPresetAppend,
              onPresetSaveAsScenario
            })
          )}
        </div>
      ) : (
        <div className="state-box">
          <span>Ничего не найдено</span>
          <p>
            По текущему поиску и фильтру preset-ы не нашлись. Сбросьте фильтры или
            попробуйте другой запрос.
          </p>
        </div>
      )}
    </section>
  );
}
