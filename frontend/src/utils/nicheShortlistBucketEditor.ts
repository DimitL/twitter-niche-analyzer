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

export function normalizeHandle(value: string) {
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

function buildUniqueBucketId(baseBucketId: string, usedBucketIds: Set<string>) {
  const normalizedBaseBucketId = baseBucketId.trim() || "bucket";

  if (!usedBucketIds.has(normalizedBaseBucketId)) {
    usedBucketIds.add(normalizedBaseBucketId);
    return normalizedBaseBucketId;
  }

  let suffix = 2;
  let nextBucketId = `${normalizedBaseBucketId}-${suffix}`;

  while (usedBucketIds.has(nextBucketId)) {
    suffix += 1;
    nextBucketId = `${normalizedBaseBucketId}-${suffix}`;
  }

  usedBucketIds.add(nextBucketId);
  return nextBucketId;
}

function parseHandleTokens(value: string) {
  return value
    .split(/[\s,;\n\t]+/g)
    .map(normalizeHandle)
    .filter(Boolean);
}

export function createEmptyHandleDraft(value = ""): NicheShortlistHandleDraft {
  return {
    handleId: createEditorId("handle"),
    value: normalizeHandle(value)
  };
}

export function createEmptyBucketDraft(): NicheShortlistBucketDraft {
  return {
    editorId: createEditorId("bucket"),
    bucketId: "",
    label: "",
    description: "",
    handles: []
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
        : []
  }));
}

export function appendHandlesToBucketDraft(
  bucket: NicheShortlistBucketDraft,
  value: string
): NicheShortlistBucketDraft {
  const nextHandleValues = parseHandleTokens(value);

  if (nextHandleValues.length === 0) {
    return bucket;
  }

  const existingHandleValues = new Set(
    bucket.handles.map((handle) => normalizeHandle(handle.value)).filter(Boolean)
  );
  const nextHandles = [...bucket.handles];

  nextHandleValues.forEach((handleValue) => {
    if (existingHandleValues.has(handleValue)) {
      return;
    }

    existingHandleValues.add(handleValue);
    nextHandles.push(createEmptyHandleDraft(handleValue));
  });

  return {
    ...bucket,
    handles: nextHandles
  };
}

export function duplicateBucketDraft(
  bucket: NicheShortlistBucketDraft,
  allBuckets: NicheShortlistBucketDraft[]
): NicheShortlistBucketDraft {
  const sourceBucketIndex = allBuckets.findIndex((entry) => entry.editorId === bucket.editorId);
  const baseBucketId =
    bucket.bucketId.trim() ||
    buildFallbackBucketId(bucket.label.trim(), sourceBucketIndex >= 0 ? sourceBucketIndex : allBuckets.length);
  const usedBucketIds = new Set(
    allBuckets
      .filter((entry) => entry.editorId !== bucket.editorId)
      .map((entry) => entry.bucketId.trim())
      .filter(Boolean)
  );

  return {
    editorId: createEditorId("bucket"),
    bucketId: buildUniqueBucketId(`${baseBucketId}-copy`, usedBucketIds),
    label: bucket.label,
    description: bucket.description,
    handles:
      bucket.handles.length > 0
        ? bucket.handles.map((handle) => createEmptyHandleDraft(handle.value))
        : []
  };
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
  const usedBucketIds = new Set<string>();

  return buckets.map((bucket, index) => {
    const normalizedHandles = Array.from(
      new Set(bucket.handles.map((handle) => normalizeHandle(handle.value)).filter(Boolean))
    );
    const normalizedLabel = bucket.label.trim();
    const normalizedDescription = bucket.description.trim();
    const candidateBucketId =
      bucket.bucketId.trim() || buildFallbackBucketId(normalizedLabel, index);
    const normalizedBucketId = buildUniqueBucketId(candidateBucketId, usedBucketIds);

    return {
      bucketId: normalizedBucketId,
      label: normalizedLabel,
      description: normalizedDescription || undefined,
      handles: normalizedHandles
    };
  });
}
