import type {
  NicheShortlistBucketDraft,
  NicheShortlistBucketDraftValidation,
  NicheShortlistBucketInput,
  NicheShortlistHandleDraft
} from "../types/nicheShortlist.js";

let editorSequence = 0;

function createEditorId(prefix: string) {
  editorSequence += 1;
  return `${prefix}-${editorSequence}`;
}

function normalizeHandle(value: string) {
  return value.trim().replace(/^@+/, "");
}

function buildFallbackBucketId(label: string, index: number) {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `bucket-${index + 1}`;
}

export function createEmptyHandleDraft(value = ""): NicheShortlistHandleDraft {
  return {
    handleId: createEditorId("handle"),
    value
  };
}

export function createEmptyBucketDraft(): NicheShortlistBucketDraft {
  return {
    editorId: createEditorId("bucket"),
    bucketId: "",
    label: "",
    description: "",
    handles: [createEmptyHandleDraft()]
  };
}

export function buildBucketDraftsFromInputs(
  buckets: NicheShortlistBucketInput[]
): NicheShortlistBucketDraft[] {
  if (buckets.length === 0) {
    return [createEmptyBucketDraft()];
  }

  return buckets.map((bucket) => ({
    editorId: createEditorId("bucket"),
    bucketId: bucket.bucketId,
    label: bucket.label,
    description: bucket.description ?? "",
    handles:
      bucket.handles && bucket.handles.length > 0
        ? bucket.handles.map((handle) => createEmptyHandleDraft(handle))
        : [createEmptyHandleDraft()]
  }));
}

export function validateBucketDrafts(
  buckets: NicheShortlistBucketDraft[]
): Record<string, NicheShortlistBucketDraftValidation> {
  return buckets.reduce<Record<string, NicheShortlistBucketDraftValidation>>((accumulator, bucket) => {
    const validation: NicheShortlistBucketDraftValidation = {};
    const normalizedHandles = bucket.handles.map((handle) => normalizeHandle(handle.value)).filter(Boolean);

    if (!bucket.label.trim()) {
      validation.label = "Добавьте название bucket, чтобы его было можно сравнить в shortlist.";
    }

    if (normalizedHandles.length === 0) {
      validation.handles = "Добавьте хотя бы один X handle. Пустые строки можно просто оставить пустыми.";
    }

    if (validation.label || validation.handles) {
      accumulator[bucket.editorId] = validation;
    }

    return accumulator;
  }, {});
}

export function hasBucketDraftValidationErrors(
  validations: Record<string, NicheShortlistBucketDraftValidation>
) {
  return Object.values(validations).some((validation) => validation.label || validation.handles);
}

export function buildBucketInputsFromDrafts(
  buckets: NicheShortlistBucketDraft[]
): NicheShortlistBucketInput[] {
  return buckets.map((bucket, index) => {
    const normalizedHandles = Array.from(
      new Set(bucket.handles.map((handle) => normalizeHandle(handle.value)).filter(Boolean))
    );
    const normalizedLabel = bucket.label.trim();
    const normalizedDescription = bucket.description.trim();
    const normalizedBucketId =
      bucket.bucketId.trim() || buildFallbackBucketId(normalizedLabel, index);

    return {
      bucketId: normalizedBucketId,
      label: normalizedLabel,
      description: normalizedDescription || undefined,
      handles: normalizedHandles
    };
  });
}
