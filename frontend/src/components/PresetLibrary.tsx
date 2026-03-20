import type { NicheShortlistPresetPack } from "../data/nicheShortlistPresetLibrary.js";

interface PresetLibraryProps {
  presets: NicheShortlistPresetPack[];
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

export function PresetLibrary({
  presets,
  selectedPresetId,
  onPresetReplace,
  onPresetAppend,
  onPresetSaveAsScenario,
  onResetEditor
}: PresetLibraryProps) {
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
            Выбирайте готовые topic packs, быстро загружайте их в editor или
            сразу сохраняйте как локальный сценарий для повторных shortlist-экспериментов.
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

      <div className="preset-library__list">
        {presets.map((preset) => {
          const previewHandles = buildPresetHandlePreview(preset);
          const totalHandles = countPresetHandles(preset);

          return (
            <article
              key={preset.presetId}
              className={`preset-card ${selectedPresetId === preset.presetId ? "preset-card--active" : ""}`}
            >
              <div className="preset-card__header">
                <div>
                  <p className="eyebrow">
                    {preset.category ? `Категория: ${preset.category}` : "Готовый pack"}
                  </p>
                  <h3>{preset.title}</h3>
                  <p className="section-copy">{preset.description}</p>
                </div>

                {selectedPresetId === preset.presetId ? (
                  <span className="decision-chip">Выбран</span>
                ) : null}
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
                  onClick={() => onPresetReplace(preset.presetId)}
                >
                  Загрузить preset
                </button>
                <button
                  type="button"
                  className="editor-button editor-button--ghost"
                  onClick={() => onPresetAppend(preset.presetId)}
                >
                  Добавить к текущему
                </button>
                <button
                  type="button"
                  className="editor-button editor-button--ghost"
                  onClick={() => onPresetSaveAsScenario(preset.presetId)}
                >
                  Сохранить как сценарий
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
