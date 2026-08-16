import MarkdownContent from "./MarkdownContent";

function HeroSection({ content }) {
  return (
    <section className="hero-section" id={content.id} aria-labelledby="hero-title">
      <div className="hero-section__index" aria-hidden="true">
        <svg viewBox="0 0 180 120">
          <path d="M8 97c32-7 34-55 72-54 30 0 30 39 62 37 12-.8 19-7 30-17" />
          <circle cx="80" cy="43" r="4" />
          <circle cx="142" cy="80" r="4" />
          <path className="dashed" d="M80 43c5-22 23-31 42-30" />
        </svg>
      </div>
      <div className="hero-section__content">
        <p className="eyebrow">{content.eyebrow}</p>
        <h1 id="hero-title">{content.title}</h1>
        <div className="hero-thesis">
          <MarkdownContent markdown={content.thesis_markdown} />
        </div>
      </div>
      <a className="hero-scroll" href="#right-now" aria-label={content.scroll_label}>
        <svg viewBox="0 0 32 52" aria-hidden="true">
          <path d="M16 2c1 13-1 29 .5 45M8 39l8.5 9L25 38" />
        </svg>
      </a>
    </section>
  );
}

export default HeroSection;
