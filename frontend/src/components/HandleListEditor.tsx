import type { NicheShortlistHandleDraft } from "../types/nicheShortlist.js";

interface HandleListEditorProps {
  bucketEditorId: string;
  handles: NicheShortlistHandleDraft[];
  validationMessage?: string;
  onHandleChange: (bucketEditorId: string, handleId: string, value: string) => void;
  onHandleAdd: (bucketEditorId: string) => void;
  onHandleRemove: (bucketEditorId: string, handleId: string) => void;
}

export function HandleListEditor({
  bucketEditorId,
  handles,
  validationMessage,
  onHandleChange,
  onHandleAdd,
  onHandleRemove
}: HandleListEditorProps) {
  return (
    <div className="handle-list-editor">
      <div className="bucket-card-editor__section-header">
        <div>
          <span>X handles</span>
          <p>Укажите аккаунты без JSON и без запятых. Символ `@` можно не писать.</p>
        </div>
        <button
          type="button"
          className="editor-button editor-button--secondary"
          onClick={() => onHandleAdd(bucketEditorId)}
        >
          Добавить handle
        </button>
      </div>

      <div className="handle-list">
        {handles.map((handle, index) => (
          <div key={handle.handleId} className="handle-row">
            <label>
              <span>{`Handle #${index + 1}`}</span>
              <input
                value={handle.value}
                onChange={(event) =>
                  onHandleChange(bucketEditorId, handle.handleId, event.target.value)
                }
                placeholder="Например: OpenAI"
              />
            </label>

            <button
              type="button"
              className="editor-button editor-button--ghost"
              onClick={() => onHandleRemove(bucketEditorId, handle.handleId)}
            >
              Удалить
            </button>
          </div>
        ))}
      </div>

      {validationMessage ? <p className="validation-text">{validationMessage}</p> : null}
    </div>
  );
}
