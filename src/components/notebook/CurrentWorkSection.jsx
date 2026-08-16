import { useRef, useState } from "react";
import ImageWithPlaceholder from "./ImageWithPlaceholder";
import MarkdownContent from "./MarkdownContent";
import NotebookPopup from "./NotebookPopup";
import SectionIntro from "./SectionIntro";

function ExternalLink({ link }) {
  if (!link) return null;

  return (
    <a
      className="ink-link external-link"
      href={link.href}
      target="_blank"
      rel="noreferrer"
      aria-label={link.aria_label}
    >
      <span>{link.label}</span>
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M7 4h9v9M16 4 5 15" />
      </svg>
    </a>
  );
}

function TagList({ tags }) {
  if (!tags?.length) return null;
  return (
    <ul className="tag-list">
      {tags.map((tag) => (
        <li key={tag}>{tag}</li>
      ))}
    </ul>
  );
}

function CurrentEntryContent({ entry, ui }) {
  const details = entry.content;
  if (!details) return null;

  return (
    <div className={`current-entry__content current-entry__content--${entry.id}`}>
      <ExternalLink link={entry.external_link} />

      {details.lead_markdown ? (
        <MarkdownContent className="current-entry__lead" markdown={details.lead_markdown} />
      ) : null}
      {details.intro_markdown ? (
        <MarkdownContent className="current-entry__lead" markdown={details.intro_markdown} />
      ) : null}
      {details.body_markdown ? <MarkdownContent markdown={details.body_markdown} /> : null}

      {details.stats?.length ? (
        <div className="notebook-stats">
          {details.stats.map((stat) => (
            <div className="notebook-stat" key={`${stat.value}-${stat.label}`}>
              <div>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
              <p className="margin-annotation">{stat.annotation}</p>
            </div>
          ))}
        </div>
      ) : null}

      {details.awards?.length ? (
        <details className="award-ledger">
          <summary>{details.awards_heading}</summary>
          <ul>
            {details.awards.map((award, index) => (
              <li key={award}>
                <span className="award-ledger__index">{String(index + 1).padStart(2, "0")}</span>
                <span>{award}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {details.favourite_areas?.length ? (
        <div className="favourite-areas">
          <h4>{details.favourite_areas_heading}</h4>
          <div className="favourite-areas__grid">
            {details.favourite_areas.map((area, index) => (
              <article key={area.id}>
                <span className="circled-index">{index + 1}</span>
                <h5>{area.title}</h5>
                <MarkdownContent markdown={area.description_markdown} />
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {details.topics?.length ? (
        <div className="topic-grid">
          {details.topics.map((topic, index) => (
            <article key={topic.title}>
              <span className="technical-index">{String(index + 1).padStart(2, "0")}</span>
              <h4>{topic.title}</h4>
              <p>{topic.description}</p>
            </article>
          ))}
        </div>
      ) : null}

      {details.columns?.length ? (
        <div className="education-columns">
          {details.columns.map((column, index) => (
            <article key={column.id}>
              <span className="circled-index">{index + 1}</span>
              <h4>{column.heading}</h4>
              <MarkdownContent markdown={column.body_markdown} />
              <ImageWithPlaceholder image={column.image} ui={ui} figureIndex={index + 1} />
            </article>
          ))}
        </div>
      ) : null}

      <TagList tags={details.keywords} />

      {details.images?.length ? (
        <div className="notebook-gallery notebook-gallery--current">
          {details.images.map((image, index) => (
            <ImageWithPlaceholder
              image={image}
              ui={ui}
              figureIndex={index + 1}
              key={`${image.src}-${image.caption}`}
            />
          ))}
        </div>
      ) : null}

    </div>
  );
}

function PopupIcon() {
  return (
    <svg className="disclosure-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 12h12M12 6v12" />
    </svg>
  );
}

function CurrentWorkSection({ content, ui }) {
  const [activeEntryId, setActiveEntryId] = useState(null);
  const triggerRef = useRef(null);
  const activeEntry = content.entries.find((entry) => entry.id === activeEntryId);
  const activeEntryIndex = content.entries.findIndex(
    (entry) => entry.id === activeEntryId
  );

  const openEntry = (id, trigger) => {
    triggerRef.current = trigger;
    setActiveEntryId(id);
  };

  const closeEntry = (restoreFocus = true) => {
    setActiveEntryId(null);
    if (restoreFocus) {
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    }
  };

  const handlePopupLink = (event) => {
    const link = event.target.closest("a[href]");
    const href = link?.getAttribute("href");
    if (!href?.startsWith("#")) return;

    event.preventDefault();
    closeEntry(false);
    window.location.hash = href;
  };

  return (
    <section
      className="notebook-section current-work-section"
      id={content.section.id}
      aria-labelledby={`${content.section.id}-heading`}
    >
      <SectionIntro section={content.section} />
      <div className="current-entries">
        {content.entries.map((entry) => {
          if (entry.behavior === "anchor") {
            return (
              <a
                className="current-entry current-entry--anchor"
                href={`#${entry.target}`}
                aria-label={entry.aria_label}
                key={entry.id}
              >
                <span className="current-entry__disclosure-spacer" aria-hidden="true" />
                <span className="current-entry__number">{entry.number}</span>
                <span className="current-entry__title">
                  <MarkdownContent inline markdown={entry.title_markdown} />
                </span>
                <svg viewBox="0 0 46 24" aria-hidden="true">
                  <path d="M2 12h39M32 4l10 8-10 8" />
                </svg>
              </a>
            );
          }

          const active = activeEntryId === entry.id;
          const popupId = `${entry.id}-popup`;
          return (
            <article className={`current-entry${active ? " is-active" : ""}`} key={entry.id}>
              <h3>
                <button
                  type="button"
                  className="current-entry__button"
                  aria-haspopup="dialog"
                  aria-controls={active ? popupId : undefined}
                  onClick={(event) => openEntry(entry.id, event.currentTarget)}
                >
                  <PopupIcon />
                  <span className="current-entry__number" aria-hidden="true">
                    {entry.number}
                  </span>
                  <span className="current-entry__title">{entry.title}</span>
                </button>
              </h3>
            </article>
          );
        })}
      </div>
      {activeEntry ? (
        <NotebookPopup
          className={`notebook-popup--current notebook-popup--tone-${
            (activeEntryIndex % 5) + 1
          }`}
          closeLabel={ui.close_current_detail}
          dialogId={`${activeEntry.id}-popup`}
          eyebrow={ui.current_work_label}
          onClose={() => closeEntry()}
          title={activeEntry.title}
        >
          <div onClickCapture={handlePopupLink}>
            <CurrentEntryContent entry={activeEntry} ui={ui} />
          </div>
        </NotebookPopup>
      ) : null}
    </section>
  );
}

export default CurrentWorkSection;
