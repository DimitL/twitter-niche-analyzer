import { BucketCardEditor } from "./BucketCardEditor.js";
import type {
  NicheShortlistBucketDraft,
  NicheShortlistBucketDraftValidation
} from "../types/nicheShortlist.js";

interface BucketEditorProps {
  buckets: NicheShortlistBucketDraft[];
  validations: Record<string, NicheShortlistBucketDraftValidation>;
  onBucketAdd: () => void;
  onBucketDuplicate: (bucketEditorId: string) => void;
  onBucketRemove: (bucketEditorId: string) => void;
  onBucketFieldChange: (
    bucketEditorId: string,
    field: "bucketId" | "label" | "description",
    value: string
  ) => void;
  onHandlesAppend: (bucketEditorId: string, value: string) => void;
  onHandleRemove: (bucketEditorId: string, handleId: string) => void;
}

export function BucketEditor({
  buckets,
  validations,
  onBucketAdd,
  onBucketDuplicate,
  onBucketRemove,
  onBucketFieldChange,
  onHandlesAppend,
  onHandleRemove
}: BucketEditorProps) {
  return (
    <div className="bucket-editor">
      <div className="bucket-editor__header">
        <div>
          <span>Topic buckets</span>
          <p>
            Соберите buckets вручную: одно направление, короткое описание и несколько
            X-аккаунтов для сравнения.
          </p>
        </div>
        <button
          type="button"
          className="editor-button editor-button--secondary"
          onClick={onBucketAdd}
        >
          Добавить bucket
        </button>
      </div>

      <div className="bucket-editor__list">
        {buckets.map((bucket, index) => (
          <BucketCardEditor
            key={bucket.editorId}
            bucket={bucket}
            index={index}
            validation={validations[bucket.editorId]}
            canRemove={buckets.length > 1}
            onBucketFieldChange={onBucketFieldChange}
            onBucketDuplicate={onBucketDuplicate}
            onBucketRemove={onBucketRemove}
            onHandlesAppend={onHandlesAppend}
            onHandleRemove={onHandleRemove}
          />
        ))}
      </div>
    </div>
  );
}
