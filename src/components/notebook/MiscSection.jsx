import MarkdownContent from "./MarkdownContent";
import SectionIntro from "./SectionIntro";

function projectHref(projectId) {
  return `?project=${encodeURIComponent(projectId)}#projects`;
}

function SkillCluster({ group, projectDirectory, ui, index }) {
  return (
    <details
      className={`skill-cluster skill-cluster--${(index % 3) + 1}`}
      name="skill-groups"
    >
      <summary>
        <span className="skill-cluster__heading">{group.heading}</span>
        <span className="skill-cluster__count">
          {group.skills.length} {ui.skills_count_label}
        </span>
      </summary>
      <ul>
        {group.skills.map((skill) => {
          const related = skill.project_ids
            .map((projectId) => projectDirectory.get(projectId))
            .filter(Boolean);
          return (
            <li key={skill.name}>
              <span>{skill.name}</span>
              {related.length ? (
                <span
                  className="skill-project-links"
                  role="group"
                  aria-label={ui.related_projects}
                >
                  {related.map((project, relatedIndex) => (
                    <a
                      href={projectHref(project.id)}
                      key={project.id}
                      aria-label={`${ui.related_project}: ${project.title}`}
                      title={project.title}
                    >
                      {relatedIndex + 1}
                    </a>
                  ))}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </details>
  );
}

function MiscSection({ content, projects, ui }) {
  const projectDirectory = new Map(projects.map((project) => [project.id, project]));

  return (
    <section
      className="notebook-section misc-section"
      id={content.section.id}
      aria-labelledby={`${content.section.id}-heading`}
    >
      <SectionIntro section={content.section} />

      <div className="misc-ledger">
        <section className="skills-section" aria-labelledby="skills-heading">
          <header>
            <p className="technical-label">{ui.skill_ledger_label}</p>
            <h3 id="skills-heading">{content.section.skills_heading}</h3>
          </header>
          <div className="skill-clusters">
            {content.skills.groups.map((group, index) => (
              <SkillCluster
                group={group}
                projectDirectory={projectDirectory}
                ui={ui}
                index={index}
                key={group.id}
              />
            ))}
          </div>
        </section>

        <section className="contact-section" aria-labelledby="contact-heading">
          <div className="contact-section__paperclip" aria-hidden="true">
            <svg viewBox="0 0 50 86">
              <path d="M20 67V19c0-20 27-20 27 0v49c0 22-38 22-38 0V25" />
            </svg>
          </div>
          <p className="technical-label">{ui.contact_ledger_label}</p>
          <h3 id="contact-heading">{content.section.contact_heading}</h3>
          <ul>
            {content.contacts.contacts.map((contact, index) => (
              <li key={contact.id}>
                <span className="contact-index">{String(index + 1).padStart(2, "0")}</span>
                {contact.available === false ? (
                  <span className="contact-unavailable" aria-label={contact.aria_label}>
                    <span>
                      <small>{contact.label}</small>
                      {contact.value}
                    </span>
                  </span>
                ) : (
                  <a
                    href={contact.href}
                    aria-label={contact.aria_label}
                    target={contact.href.startsWith("http") ? "_blank" : undefined}
                    rel={contact.href.startsWith("http") ? "noreferrer" : undefined}
                    download={contact.id === "resume" ? true : undefined}
                  >
                    <span>
                      <small>{contact.label}</small>
                      {contact.value}
                    </span>
                    <svg viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M7 4h9v9M16 4 5 15" />
                    </svg>
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <footer className="notebook-closing">
        <svg viewBox="0 0 120 52" aria-hidden="true">
          <path d="M3 28c23-8 42-7 62-4 14 2 29 4 49-3" />
          <path d="m103 14 12 7-10 10" />
        </svg>
        <MarkdownContent markdown={content.closing.closing_markdown} />
      </footer>
    </section>
  );
}

export default MiscSection;
