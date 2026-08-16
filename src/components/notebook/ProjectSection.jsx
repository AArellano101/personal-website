import { useEffect, useMemo, useRef, useState } from "react";
import ImageWithPlaceholder from "./ImageWithPlaceholder";
import MarkdownContent from "./MarkdownContent";
import SectionIntro from "./SectionIntro";

function getProjectIdFromUrl() {
  const url = new URL(window.location.href);
  const queryProject = url.searchParams.get("project");
  if (queryProject) return queryProject;

  const hashQuery = url.hash.includes("?") ? url.hash.split("?")[1] : "";
  return new URLSearchParams(hashQuery).get("project");
}

function projectUrl(projectId) {
  const url = new URL(window.location.href);
  url.searchParams.set("project", projectId);
  url.hash = "projects";
  return `${url.pathname}${url.search}${url.hash}`;
}

function urlWithoutProject() {
  const url = new URL(window.location.href);
  url.searchParams.delete("project");
  url.hash = "projects";
  return `${url.pathname}${url.search}${url.hash}`;
}

function ProjectTags({ tags, className = "" }) {
  if (!tags?.length) return null;
  return (
    <ul className={`project-tags ${className}`.trim()}>
      {tags.map((tag) => (
        <li key={tag}>{tag}</li>
      ))}
    </ul>
  );
}

function ProjectCard({ project, index, onOpen, ui }) {
  return (
    <article
      className={`project-card${project.featured ? " project-card--featured" : ""}`}
      aria-labelledby={`${project.id}-card-title`}
      onClick={(event) => {
        if (event.target.closest("a, button")) return;
        const trigger = event.currentTarget.querySelector(".project-card__title-button");
        onOpen(project.id, trigger);
      }}
    >
      <div className="project-card__content">
        <div className="project-card__topline">
          <span className="project-card__index">{String(index + 1).padStart(2, "0")}</span>
          {project.featured ? <span className="featured-mark">{ui.featured}</span> : null}
        </div>
        <ImageWithPlaceholder image={project.images?.cover} ui={ui} />
        <div className="project-card__copy">
          <p className="project-status">{project.status}</p>
          <h4 id={`${project.id}-card-title`}>
            <button
              type="button"
              className="project-card__title-button"
              onClick={(event) => onOpen(project.id, event.currentTarget)}
              aria-label={`${ui.open_project}: ${project.title}`}
            >
              {project.title}
            </button>
          </h4>
          <MarkdownContent markdown={project.summary_markdown} />
          <ProjectTags tags={project.keywords || project.tags} />
        </div>
        <svg className="project-card__arrow" viewBox="0 0 54 32" aria-hidden="true">
          <path d="M3 17c16-1 29-1 45-2M38 6l11 9-10 11" />
        </svg>
      </div>
    </article>
  );
}

function CompactProjectCard({ project, index, onOpen, ui }) {
  return (
    <article
      className="compact-project-card"
      aria-labelledby={`${project.id}-compact-card-title`}
    >
      <button
        type="button"
        className="compact-project-card__trigger"
        onClick={(event) => onOpen(project.id, event.currentTarget)}
        aria-label={`${ui.open_project}: ${project.title}`}
      >
        <span className="compact-project-card__index" aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="compact-project-card__copy">
          <span
            className="compact-project-card__title"
            id={`${project.id}-compact-card-title`}
          >
            {project.title}
          </span>
          <span className="compact-project-card__status">{project.status}</span>
        </span>
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="M4 10h11M11 5l5 5-5 5" />
        </svg>
      </button>
    </article>
  );
}

function ProjectGrid({
  projects,
  indexById,
  onOpen,
  ui,
  featured,
  compact = false,
  label,
  id,
  hidden = false,
}) {
  if (!projects.length) return null;
  const subgroupLabel = label || (featured ? ui.featured_projects : ui.other_projects);

  return (
    <section
      className={`project-subgroup${featured ? " project-subgroup--featured" : ""}${
        compact ? " project-subgroup--compact" : ""
      }`}
      aria-label={subgroupLabel}
      id={id}
      hidden={hidden}
    >
      <p className="technical-label project-subgroup__label">{subgroupLabel}</p>
      <div className={compact ? "compact-project-grid" : "project-grid"}>
        {projects.map((project) => {
          const index = indexById.get(project.id) ?? 0;
          return compact ? (
            <CompactProjectCard
              project={project}
              index={index}
              onOpen={onOpen}
              ui={ui}
              key={project.id}
            />
          ) : (
            <ProjectCard
              project={project}
              index={index}
              onOpen={onOpen}
              ui={ui}
              key={project.id}
            />
          );
        })}
      </div>
    </section>
  );
}

function SheetSection({ heading, children, className = "" }) {
  if (!children) return null;
  return (
    <section className={`project-sheet__section ${className}`.trim()}>
      <h3>{heading}</h3>
      {children}
    </section>
  );
}

function ProjectSheet({ project, projects, onClose, onNavigate, ui }) {
  const sheetRef = useRef(null);
  const closeRef = useRef(null);
  const index = projects.findIndex((candidate) => candidate.id === project.id);
  const previous = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];
  const gallery = [project.images?.cover, ...(project.images?.gallery || [])].filter(Boolean);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = sheetRef.current?.querySelectorAll(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, project.id]);

  return (
    <div className="project-sheet-layer" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <article
        className="project-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-sheet-title"
        ref={sheetRef}
      >
        <div className="project-sheet__binding" aria-hidden="true" />
        <header className="project-sheet__header">
          <div>
            <p className="figure-label">{ui.project_sheet_label}</p>
            <p className="project-status">{project.status}</p>
            <h2 id="project-sheet-title">{project.title}</h2>
            <MarkdownContent className="project-sheet__summary" markdown={project.summary_markdown} />
          </div>
          <button className="sheet-close" type="button" onClick={onClose} ref={closeRef}>
            <span className="sr-only">{ui.close_project}</span>
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <path d="M6 6c7 7 13 13 20 20M26 6 6 26" />
              <circle cx="16" cy="16" r="14" />
            </svg>
          </button>
        </header>

        <div className="project-sheet__body">
          <div className="project-sheet__main">
            <SheetSection heading={ui.description_heading}>
              <MarkdownContent markdown={project.description_markdown} />
            </SheetSection>

            {project.personal_explanation_markdown ? (
              <SheetSection heading={ui.personal_explanation_heading}>
                <MarkdownContent
                  className="project-personal-note"
                  markdown={project.personal_explanation_markdown}
                />
              </SheetSection>
            ) : null}

            {project.contributions?.length ? (
              <SheetSection heading={ui.contributions_heading}>
                <ol className="contribution-list">
                  {project.contributions.map((contribution) => (
                    <li key={contribution}>{contribution}</li>
                  ))}
                </ol>
              </SheetSection>
            ) : null}

            {gallery.length ? (
              <SheetSection heading={ui.gallery_heading} className="project-sheet__gallery-section">
                <div className="notebook-gallery notebook-gallery--project">
                  {gallery.map((image, galleryIndex) => (
                    <ImageWithPlaceholder
                      image={image}
                      ui={ui}
                      key={`${image.src}-${galleryIndex}`}
                      className={galleryIndex === 0 ? "notebook-image--wide" : ""}
                    />
                  ))}
                </div>
              </SheetSection>
            ) : null}
          </div>

          <aside className="project-sheet__ledger">
            {project.technologies?.length ? (
              <div className="ledger-block">
                <h3>{ui.technologies_heading}</h3>
                <ProjectTags tags={project.technologies} />
              </div>
            ) : null}
            <div className="ledger-block">
              <h3>{ui.keywords_heading}</h3>
              <ProjectTags tags={project.keywords || project.tags} />
            </div>
            {project.links?.length ? (
              <div className="ledger-block">
                <h3>{ui.links_heading}</h3>
                <ul className="project-links">
                  {project.links.map((link) => (
                    <li key={`${link.href}-${link.label}`}>
                      <a href={link.href} target="_blank" rel="noreferrer">
                        <span>{link.label}</span>
                        <svg viewBox="0 0 20 20" aria-hidden="true">
                          <path d="M7 4h9v9M16 4 5 15" />
                        </svg>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </aside>
        </div>

        <nav className="project-sheet__pager" aria-label={ui.project_navigation_label}>
          <button type="button" onClick={() => onNavigate(previous.id)}>
            <svg viewBox="0 0 32 20" aria-hidden="true">
              <path d="M30 10H3M11 2 2 10l9 8" />
            </svg>
            <span>
              <small>{ui.previous_project}</small>
              {previous.title}
            </span>
          </button>
          <button type="button" onClick={() => onNavigate(next.id)}>
            <span>
              <small>{ui.next_project}</small>
              {next.title}
            </span>
            <svg viewBox="0 0 32 20" aria-hidden="true">
              <path d="M2 10h27M21 2l9 8-9 8" />
            </svg>
          </button>
        </nav>
      </article>
    </div>
  );
}

function ProjectSection({ content, ui }) {
  const projects = content.all;
  const [activeProjectId, setActiveProjectId] = useState(() => getProjectIdFromUrl());
  const [expandedProjectGroups, setExpandedProjectGroups] = useState(() => new Set());
  const triggerRef = useRef(null);
  const activeProjectIdRef = useRef(activeProjectId);
  const indexById = useMemo(
    () => new Map(projects.map((project, index) => [project.id, index])),
    [projects]
  );

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId),
    [activeProjectId, projects]
  );

  useEffect(() => {
    const syncProject = () => {
      const nextProjectId = getProjectIdFromUrl();
      const projectWasOpen = Boolean(activeProjectIdRef.current);
      activeProjectIdRef.current = nextProjectId;
      setActiveProjectId(nextProjectId);
      if (projectWasOpen && !nextProjectId) {
        window.requestAnimationFrame(() => {
          (triggerRef.current || document.getElementById("projects-heading"))?.focus();
        });
      }
    };
    window.addEventListener("popstate", syncProject);
    window.addEventListener("hashchange", syncProject);
    return () => {
      window.removeEventListener("popstate", syncProject);
      window.removeEventListener("hashchange", syncProject);
    };
  }, []);

  const openProject = (projectId, trigger) => {
    triggerRef.current = trigger;
    activeProjectIdRef.current = projectId;
    window.history.pushState({ project: projectId }, "", projectUrl(projectId));
    setActiveProjectId(projectId);
  };

  const navigateProject = (projectId) => {
    activeProjectIdRef.current = projectId;
    window.history.replaceState({ project: projectId }, "", projectUrl(projectId));
    setActiveProjectId(projectId);
  };

  const closeProject = () => {
    window.history.replaceState({}, "", urlWithoutProject());
    activeProjectIdRef.current = null;
    setActiveProjectId(null);
    window.requestAnimationFrame(() => {
      (triggerRef.current || document.getElementById("projects-heading"))?.focus();
    });
  };

  const toggleProjectGroup = (groupId) => {
    setExpandedProjectGroups((current) => {
      const next = new Set(current);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  return (
    <section
      className="notebook-section project-section"
      id={content.section.id}
      aria-labelledby={`${content.section.id}-heading`}
    >
      <SectionIntro section={content.section} />
      <div className="project-groups">
        {content.groups.map((group) => {
          const featured = group.projects.filter((project) => project.featured);
          const visibleOther = group.projects.filter(
            (project) => !project.featured && !project.collapsible
          );
          const collapsible = group.projects.filter(
            (project) => !project.featured && project.collapsible
          );
          const collapsibleLimit =
            group.collapsible_limit ?? group.nonfeatured_limit ?? 7;
          const displayedCollapsible = collapsible.slice(0, collapsibleLimit);
          const hasCollapsibleProjects = displayedCollapsible.length > 0;
          const collapsibleProjectsId = `${group.id}-collapsible-projects`;
          const isExpanded = expandedProjectGroups.has(group.id);
          const showLabel =
            group.show_collapsible_label ||
            group.show_nonfeatured_label ||
            `View ${displayedCollapsible.length} more projects`;
          const hideLabel =
            group.hide_collapsible_label ||
            group.hide_nonfeatured_label ||
            "Hide additional projects";
          return (
            <section className={`project-group project-group--${group.id}`} key={group.id}>
              <header className="project-group__header">
                <span className="project-group__pin" aria-hidden="true" />
                <h3>{group.heading}</h3>
                <p>{group.description}</p>
              </header>
              <ProjectGrid
                projects={featured}
                indexById={indexById}
                onOpen={openProject}
                ui={ui}
                featured
              />
              <ProjectGrid
                projects={visibleOther}
                indexById={indexById}
                onOpen={openProject}
                ui={ui}
              />
              {hasCollapsibleProjects ? (
                <button
                  type="button"
                  className="project-reveal"
                  aria-expanded={isExpanded}
                  aria-controls={collapsibleProjectsId}
                  onClick={() => toggleProjectGroup(group.id)}
                >
                  <span aria-hidden="true">{isExpanded ? "−" : "+"}</span>
                  {isExpanded ? hideLabel : showLabel}
                </button>
              ) : null}
              <ProjectGrid
                projects={displayedCollapsible}
                indexById={indexById}
                onOpen={openProject}
                ui={ui}
                compact
                label={group.collapsible_heading || ui.other_projects}
                id={hasCollapsibleProjects ? collapsibleProjectsId : undefined}
                hidden={hasCollapsibleProjects && !isExpanded}
              />
            </section>
          );
        })}
      </div>
      {activeProject ? (
        <ProjectSheet
          project={activeProject}
          projects={projects}
          onClose={closeProject}
          onNavigate={navigateProject}
          ui={ui}
        />
      ) : null}
    </section>
  );
}

export default ProjectSection;
