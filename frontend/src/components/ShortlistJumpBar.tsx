export interface ShortlistJumpBarSection {
  id: string;
  label: string;
  enabled: boolean;
}

interface ShortlistJumpBarProps {
  sections: ShortlistJumpBarSection[];
  activeSectionId: string | null;
  onJump: (sectionId: string) => void;
}

export function ShortlistJumpBar({
  sections,
  activeSectionId,
  onJump
}: ShortlistJumpBarProps) {
  return (
    <nav className="panel shortlist-jump-bar" aria-label="Навигация по shortlist">
      <div className="shortlist-jump-bar__header">
        <div>
          <p className="eyebrow">Быстрые переходы</p>
          <strong>Прыжки по главным блокам shortlist</strong>
        </div>
      </div>

      <div className="shortlist-jump-bar__list">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            disabled={!section.enabled}
            aria-pressed={activeSectionId === section.id}
            className={`shortlist-jump-bar__button ${
              activeSectionId === section.id
                ? "shortlist-jump-bar__button--active"
                : ""
            }`}
            onClick={() => onJump(section.id)}
          >
            {section.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
