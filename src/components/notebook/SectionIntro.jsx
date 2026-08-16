import MarkdownContent from "./MarkdownContent";

function SectionIntro({ section }) {
  return (
    <header className="section-intro">
      <p className="figure-label">{section.figure_label}</p>
      <div className="section-intro__copy">
        <h2 id={`${section.id}-heading`} tabIndex="-1">{section.heading}</h2>
        {section.intro_markdown ? (
          <MarkdownContent className="section-intro__text" markdown={section.intro_markdown} />
        ) : null}
      </div>
      <svg className="section-intro__mark" viewBox="0 0 110 44" aria-hidden="true">
        <path d="M4 31c22-2 43-3 64-2 13 .6 28 3 38-5" />
        <path d="m94 16 13 8-11 10" />
      </svg>
    </header>
  );
}

export default SectionIntro;
