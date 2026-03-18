import type { NicheShortlistRequest } from "../types/nicheShortlist.js";

interface ShortlistPayloadPreviewProps {
  payload: NicheShortlistRequest;
  validationBlocked: boolean;
}

export function ShortlistPayloadPreview({
  payload,
  validationBlocked
}: ShortlistPayloadPreviewProps) {
  return (
    <details className="payload-preview">
      <summary className="payload-preview__summary">
        <div>
          <span>Предпросмотр запроса в backend</span>
          <p>
            Здесь видно итоговый payload после нормализации handles и автоматической
            генерации `bucketId`, если он пустой или дублируется.
          </p>
        </div>
        <strong>{`${payload.buckets.length} bucket`}</strong>
      </summary>

      <div className="payload-preview__body">
        {validationBlocked ? (
          <p className="validation-text">
            В preview уже применена нормализация, но submit всё ещё заблокируется, если
            обязательные поля bucket-а не заполнены.
          </p>
        ) : null}

        <pre className="payload-preview__code">
          <code>{JSON.stringify(payload, null, 2)}</code>
        </pre>
      </div>
    </details>
  );
}
