import { HandleListEditor } from "./HandleListEditor.js";
import type {
  NicheShortlistBucketDraft,
  NicheShortlistBucketDraftValidation
} from "../types/nicheShortlist.js";

interface BucketCardEditorProps {
  bucket: NicheShortlistBucketDraft;
  index: number;
  validation?: NicheShortlistBucketDraftValidation;
  canRemove: boolean;
  onBucketFieldChange: (
    bucketEditorId: string,
    field: "bucketId" | "label" | "description",
    value: string
  ) => void;
  onBucketDuplicate: (bucketEditorId: string) => void;
  onBucketRemove: (bucketEditorId: string) => void;
  onHandlesAppend: (bucketEditorId: string, value: string) => void;
  onHandleRemove: (bucketEditorId: string, handleId: string) => void;
}

export function BucketCardEditor({
  bucket,
  index,
  validation,
  canRemove,
  onBucketFieldChange,
  onBucketDuplicate,
  onBucketRemove,
  onHandlesAppend,
  onHandleRemove
}: BucketCardEditorProps) {
  return (
    <article className="bucket-card-editor">
      <div className="bucket-card-editor__header">
        <div>
          <p className="eyebrow">Bucket #{index + 1}</p>
          <h3>{bucket.label.trim() || "Новый bucket"}</h3>
        </div>

        <div className="bucket-card-editor__actions">
          <button
            type="button"
            className="editor-button editor-button--ghost"
            onClick={() => onBucketDuplicate(bucket.editorId)}
          >
            Дублировать
          </button>

          <button
            type="button"
            className="editor-button editor-button--danger"
            onClick={() => onBucketRemove(bucket.editorId)}
            disabled={!canRemove}
          >
            Удалить bucket
          </button>
        </div>
      </div>

      <div className="bucket-card-editor__fields">
        <label>
          <span>Bucket ID</span>
          <input
            value={bucket.bucketId}
            onChange={(event) =>
              onBucketFieldChange(bucket.editorId, "bucketId", event.target.value)
            }
            placeholder="Например: frontier-labs"
          />
          <small className="helper-text">
            Если поле пустое, идентификатор сгенерируется автоматически из названия.
          </small>
        </label>

        <label>
          <span>Название bucket</span>
          <input
            value={bucket.label}
            onChange={(event) => onBucketFieldChange(bucket.editorId, "label", event.target.value)}
            placeholder="Например: Frontier Labs"
          />
          {validation?.label ? <p className="validation-text">{validation.label}</p> : null}
        </label>

        <label className="bucket-card-editor__description">
          <span>Описание</span>
          <textarea
            rows={3}
            value={bucket.description}
            onChange={(event) =>
              onBucketFieldChange(bucket.editorId, "description", event.target.value)
            }
            placeholder="Коротко опишите, почему эти аккаунты объединены в одну нишу."
          />
        </label>
      </div>

      <HandleListEditor
        bucketEditorId={bucket.editorId}
        handles={bucket.handles}
        validationMessage={validation?.handles}
        onHandlesAppend={onHandlesAppend}
        onHandleRemove={onHandleRemove}
      />
    </article>
  );
}
