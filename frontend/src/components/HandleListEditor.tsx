import { useState } from "react";
import type { KeyboardEvent } from "react";
import type { NicheShortlistHandleDraft } from "../types/nicheShortlist.js";

interface HandleListEditorProps {
  bucketEditorId: string;
  handles: NicheShortlistHandleDraft[];
  validationMessage?: string;
  onHandlesAppend: (bucketEditorId: string, value: string) => void;
  onHandleRemove: (bucketEditorId: string, handleId: string) => void;
}

export function HandleListEditor({
  bucketEditorId,
  handles,
  validationMessage,
  onHandlesAppend,
  onHandleRemove
}: HandleListEditorProps) {
  const [pendingValue, setPendingValue] = useState("");

  function commitPendingValue() {
    if (!pendingValue.trim()) {
      return;
    }

    onHandlesAppend(bucketEditorId, pendingValue);
    setPendingValue("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" && event.key !== ",") {
      return;
    }

    event.preventDefault();
    commitPendingValue();
  }

  return (
    <div className="handle-list-editor">
      <div className="bucket-card-editor__section-header">
        <div>
          <span>X handles</span>
          <p>
            Добавляйте аккаунты по одному или вставляйте сразу несколько через пробел,
            запятую или новую строку.
          </p>
        </div>
      </div>

      <div className="handle-input-row">
        <label>
          <span>Быстрое добавление handles</span>
          <input
            value={pendingValue}
            onChange={(event) => setPendingValue(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Например: @OpenAI, AnthropicAI, vercel"
          />
        </label>

        <button
          type="button"
          className="editor-button editor-button--secondary"
          onClick={commitPendingValue}
        >
          Добавить handles
        </button>
      </div>

      {handles.some((handle) => handle.value.trim()) ? (
        <div className="handle-chip-list">
          {handles
            .filter((handle) => handle.value.trim())
            .map((handle) => (
              <div key={handle.handleId} className="handle-chip">
                <span>{`@${handle.value}`}</span>
                <button
                  type="button"
                  className="handle-chip__remove"
                  onClick={() => onHandleRemove(bucketEditorId, handle.handleId)}
                  aria-label={`Удалить ${handle.value}`}
                >
                  ×
                </button>
              </div>
            ))}
        </div>
      ) : (
        <div className="handle-empty-state">
          <p>Пока нет ни одного handle. Добавьте хотя бы один аккаунт для сравнения.</p>
        </div>
      )}

      {validationMessage ? <p className="validation-text">{validationMessage}</p> : null}
    </div>
  );
}
