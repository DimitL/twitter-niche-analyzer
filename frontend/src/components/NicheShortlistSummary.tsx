import type { NicheShortlistResponse, NicheShortlistSummaryEntry } from "../types/nicheShortlist.js";

interface NicheShortlistSummaryProps {
  shortlist: NicheShortlistResponse;
}

function formatSummaryEntry(entry: NicheShortlistSummaryEntry | null) {
  if (!entry) {
    return "Недостаточно данных";
  }

  return `${entry.label} (${entry.score.toFixed(1)})`;
}

export function NicheShortlistSummary({ shortlist }: NicheShortlistSummaryProps) {
  const { shortlistSummary, timings, notes } = shortlist;

  return (
    <section className="panel shortlist-summary">
      <div className="shortlist-summary__header">
        <div>
          <p className="eyebrow">Niche Shortlist</p>
          <h2>Готовый shortlist для выбора ниши</h2>
          <p className="section-copy">
            Здесь собраны ключевые decision labels и итоговая сводка по текущему ручному
            shortlist запуску.
          </p>
        </div>

        <div className={`status-pill status-pill--${shortlist.status === "ok" ? "online" : shortlist.status === "partial" ? "checking" : "offline"}`}>
          Статус: {shortlist.status === "ok" ? "готово" : shortlist.status === "partial" ? "частично" : "ошибка"}
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-box">
          <span>Запрошено buckets</span>
          <strong>{shortlistSummary.totalRequestedBuckets}</strong>
        </div>
        <div className="summary-box">
          <span>Успешно ранжировано</span>
          <strong>{shortlistSummary.successfullyRankedBuckets}</strong>
        </div>
        <div className="summary-box">
          <span>Размер shortlist</span>
          <strong>{shortlistSummary.shortlistSize}</strong>
        </div>
        <div className="summary-box">
          <span>Время запроса</span>
          <strong>{Math.round(timings.totalMs / 1000)}с</strong>
        </div>
      </div>

      <div className="summary-grid summary-grid--labels">
        <div className="summary-box">
          <span>Лучший overall</span>
          <strong>{formatSummaryEntry(shortlistSummary.bestOverall)}</strong>
        </div>
        <div className="summary-box">
          <span>Лучший для роста</span>
          <strong>{formatSummaryEntry(shortlistSummary.bestForGrowth)}</strong>
        </div>
        <div className="summary-box">
          <span>Лучший для монетизации</span>
          <strong>{formatSummaryEntry(shortlistSummary.bestForMonetization)}</strong>
        </div>
        <div className="summary-box">
          <span>Самый лёгкий старт</span>
          <strong>{formatSummaryEntry(shortlistSummary.easiestToStart)}</strong>
        </div>
        <div className="summary-box">
          <span>Самый сбалансированный</span>
          <strong>{formatSummaryEntry(shortlistSummary.bestBalanced)}</strong>
        </div>
      </div>

      <div className="notes-list notes-list--compact">
        {notes.map((note) => (
          <p key={note}>{note}</p>
        ))}
      </div>
    </section>
  );
}
