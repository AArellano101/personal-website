import { readFileSync } from "fs";
import path from "path";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { load as parseYaml } from "js-yaml";
import CurrentWorkSection from "./CurrentWorkSection";
import ImageWithPlaceholder from "./ImageWithPlaceholder";
import InterestSection from "./InterestSection";
import MiscSection from "./MiscSection";
import ProjectSection from "./ProjectSection";

function yamlFixture(relativePath) {
  const filename = path.join(process.cwd(), "src", "content", relativePath);
  return parseYaml(readFileSync(filename, "utf8"), { filename });
}

const ui = yamlFixture("ui.yaml");

describe("notebook content and interactions", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
  });

  test("uses YAML image copy for an accessible placeholder after an image fails", () => {
    const project = yamlFixture("projects/finished/flight-computer.yaml");
    const cover = project.images.cover;

    render(<ImageWithPlaceholder image={cover} ui={ui} figureIndex={1} />);

    const image = screen.getByRole("img", { name: cover.alt });
    expect(image).toHaveAttribute("src", cover.src);

    fireEvent.error(image);

    const placeholder = screen.getByRole("img", { name: cover.alt });
    expect(placeholder).toHaveProperty("tagName", "DIV");
    expect(placeholder).toHaveTextContent(ui.image_missing);
    expect(screen.getByText(cover.caption)).toBeInTheDocument();
  });

  test("opens current-work details in a popup and restores its launcher", async () => {
    const research = yamlFixture("right-now/ml-research.yaml");
    const engineering = yamlFixture("right-now/electrical-engineering.yaml");
    const projectsAnchor = yamlFixture("right-now/building-projects.yaml");
    const content = {
      section: yamlFixture("right-now/section.yaml"),
      entries: [research, engineering, projectsAnchor],
    };

    render(<CurrentWorkSection content={content} ui={ui} />);

    const researchToggle = screen.getByRole("button", {
      name: research.title,
    });
    const engineeringToggle = screen.getByRole("button", {
      name: engineering.title,
    });
    expect(researchToggle).toHaveAttribute("aria-haspopup", "dialog");
    expect(researchToggle).not.toHaveAttribute("aria-controls");
    expect(
      screen.queryByText(/groups of language-model agents/i)
    ).not.toBeInTheDocument();
    expect(engineeringToggle).toHaveAttribute("aria-haspopup", "dialog");
    expect(engineeringToggle).not.toHaveAttribute("aria-controls");

    researchToggle.focus();
    fireEvent.click(researchToggle);

    const dialog = screen.getByRole("dialog", { name: research.title });
    expect(researchToggle).toHaveAttribute("aria-controls", "ml-research-popup");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(
      within(dialog).getByText(/groups of language-model agents/i)
    ).toBeVisible();
    expect(document.body).toHaveStyle({ overflow: "hidden" });
    const closeButton = screen.getByRole("button", {
      name: ui.close_current_detail,
    });
    const externalLink = within(dialog).getByRole("link", {
      name: research.external_link.aria_label,
    });
    expect(closeButton).toHaveFocus();

    fireEvent.keyDown(closeButton, {
      key: "Tab",
      code: "Tab",
      shiftKey: true,
    });
    expect(externalLink).toHaveFocus();
    fireEvent.keyDown(externalLink, { key: "Tab", code: "Tab" });
    expect(closeButton).toHaveFocus();

    engineeringToggle.focus();
    expect(closeButton).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });

    expect(
      screen.queryByRole("dialog", { name: research.title })
    ).not.toBeInTheDocument();
    expect(document.body).not.toHaveStyle({ overflow: "hidden" });
    await waitFor(() => expect(researchToggle).toHaveFocus());

    expect(
      screen.getByRole("link", { name: projectsAnchor.aria_label })
    ).toHaveAttribute("href", "#projects");
  });

  test("closes a current-work popup before following an in-page link", () => {
    const curious = yamlFixture("right-now/staying-curious.yaml");
    const content = {
      section: yamlFixture("right-now/section.yaml"),
      entries: [curious],
    };

    render(<CurrentWorkSection content={content} ui={ui} />);
    fireEvent.click(
      screen.getByRole("button", { name: new RegExp(curious.title, "i") })
    );

    const dialog = screen.getByRole("dialog", { name: curious.title });
    const readingLink = within(dialog).getByRole("link", { name: "reading" });
    expect(readingLink).toHaveAttribute("href", "#interest-books");

    fireEvent.click(readingLink);

    expect(
      screen.queryByRole("dialog", { name: curious.title })
    ).not.toBeInTheDocument();
    expect(window.location.hash).toBe("#interest-books");
  });

  test("shows an interest preview on hover without opening a modal", async () => {
    const ml = yamlFixture("interests/ml.yaml");
    const engineering = yamlFixture("interests/engineering.yaml");
    const media = yamlFixture("interests/media.yaml");
    const content = {
      section: yamlFixture("interests/section.yaml"),
      maps: [ml, engineering, media],
    };

    render(<InterestSection content={content} ui={ui} />);

    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      ml.label,
      engineering.label,
      media.label,
    ]);

    const mlTab = screen.getByRole("tab", { name: ml.label });
    expect(mlTab).toHaveAttribute("aria-selected", "true");

    const firstMlTopic = ml.nodes[0];
    const topicToggle = screen.getByRole("button", {
      name: firstMlTopic.label,
    });
    expect(topicToggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    fireEvent.mouseEnter(topicToggle);

    expect(topicToggle).toHaveAttribute("aria-expanded", "true");
    const topicPreview = screen.getByRole("tooltip", {
      name: firstMlTopic.label,
    });
    expect(topicPreview).not.toHaveAttribute("aria-modal");
    expect(topicPreview).not.toHaveClass("has-secondary");
    expect(within(topicPreview).getByText(ui.interest_note_label)).toBeInTheDocument();
    expect(topicPreview).toHaveTextContent(firstMlTopic.note.trim());
    expect(within(topicPreview).queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.queryByText("Cross-domain connections")).not.toBeInTheDocument();
    expect(document.body).not.toHaveStyle({ overflow: "hidden" });

    fireEvent.mouseLeave(topicToggle);
    fireEvent.mouseEnter(topicPreview);
    expect(topicPreview).toBeInTheDocument();

    fireEvent.mouseLeave(topicPreview);
    await waitFor(() =>
      expect(
        screen.queryByRole("tooltip", { name: firstMlTopic.label })
      ).not.toBeInTheDocument()
    );
  });

  test("supports keyboard interest previews and a click fallback", () => {
    const ml = yamlFixture("interests/ml.yaml");
    const engineering = yamlFixture("interests/engineering.yaml");
    const media = yamlFixture("interests/media.yaml");
    const content = {
      section: yamlFixture("interests/section.yaml"),
      maps: [ml, engineering, media],
    };

    render(<InterestSection content={content} ui={ui} />);

    const mlTab = screen.getByRole("tab", { name: ml.label });
    mlTab.focus();
    fireEvent.keyDown(mlTab, { key: "ArrowRight", code: "ArrowRight" });

    const engineeringTab = screen.getByRole("tab", {
      name: engineering.label,
    });
    expect(engineeringTab).toHaveFocus();
    expect(engineeringTab).toHaveAttribute("aria-selected", "true");
    expect(mlTab).toHaveAttribute("aria-selected", "false");

    const firstEngineeringTopic = engineering.nodes[0];
    const secondEngineeringTopic = engineering.nodes[1];
    const firstEngineeringToggle = screen.getByRole("button", {
      name: firstEngineeringTopic.label,
    });
    fireEvent.focus(firstEngineeringToggle);
    expect(
      screen.getByRole("tooltip", { name: firstEngineeringTopic.label })
    ).toBeInTheDocument();

    fireEvent.keyDown(firstEngineeringToggle, {
      key: "ArrowRight",
      code: "ArrowRight",
    });

    const secondEngineeringToggle = screen.getByRole("button", {
      name: secondEngineeringTopic.label,
    });
    expect(secondEngineeringToggle).toHaveFocus();
    expect(
      screen.getByRole("tooltip", { name: secondEngineeringTopic.label })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("tooltip", { name: firstEngineeringTopic.label })
    ).not.toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    expect(secondEngineeringToggle).toHaveFocus();

    fireEvent.click(secondEngineeringToggle);
    expect(
      screen.getByRole("tooltip", { name: secondEngineeringTopic.label })
    ).toBeInTheDocument();
    fireEvent.click(secondEngineeringToggle);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  test("opens the Books detail from its hash and restores focus when it closes", async () => {
    const ml = yamlFixture("interests/ml.yaml");
    const engineering = yamlFixture("interests/engineering.yaml");
    const media = yamlFixture("interests/media.yaml");
    const content = {
      section: yamlFixture("interests/section.yaml"),
      maps: [ml, engineering, media],
    };
    const originalScrollIntoView = Object.getOwnPropertyDescriptor(
      Element.prototype,
      "scrollIntoView"
    );
    const scrollIntoView = jest.fn();
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });
    window.history.replaceState({}, "", "/#interest-books");

    try {
      render(<InterestSection content={content} ui={ui} />);

      expect(screen.getByRole("tab", { name: media.label })).toHaveAttribute(
        "aria-selected",
        "true"
      );
      const books = screen.getByRole("button", { name: "Books" });
      expect(books).toHaveAttribute("id", "interest-books");
      expect(books).toHaveAttribute("aria-expanded", "true");
      const booksPreview = screen.getByRole("tooltip", { name: "Books" });
      expect(booksPreview).toHaveClass("has-secondary");
      expect(
        within(booksPreview).getByRole("heading", {
          name: "Books I keep thinking about",
        })
      ).toBeInTheDocument();
      await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
      await waitFor(() => expect(books).toHaveFocus());

      fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
      expect(window.location.hash).toBe("#interests");
      expect(
        screen.queryByRole("tooltip", { name: "Books" })
      ).not.toBeInTheDocument();
      expect(books).toHaveFocus();
    } finally {
      if (originalScrollIntoView) {
        Object.defineProperty(
          Element.prototype,
          "scrollIntoView",
          originalScrollIntoView
        );
      } else {
        delete Element.prototype.scrollIntoView;
      }
    }
  });

  test("keeps project sheets in URL state and restores focus after Escape", async () => {
    const projectSection = yamlFixture("projects/section.yaml");
    const workingSection = yamlFixture("projects/working-on/section.yaml");
    const finishedSection = yamlFixture("projects/finished/section.yaml");
    const featuredProject = yamlFixture("projects/finished/flight-computer.yaml");
    const visibleArticle = yamlFixture("projects/finished/advanced-materials.yaml");
    const collapsibleProject = yamlFixture("projects/finished/eng200-car.yaml");
    const content = {
      section: projectSection,
      groups: [
        { ...workingSection, projects: [featuredProject] },
        {
          ...finishedSection,
          projects: [visibleArticle, collapsibleProject],
        },
      ],
      all: [featuredProject, visibleArticle, collapsibleProject],
    };
    window.history.replaceState({}, "", "/notebook?source=test#projects");

    render(<ProjectSection content={content} ui={ui} />);

    const featuredCard = screen.getByRole("article", {
      name: (accessibleName) => accessibleName.includes(featuredProject.title),
    });
    const visibleCard = screen.getByRole("article", {
      name: (accessibleName) => accessibleName.includes(visibleArticle.title),
    });
    const finishedReveal = screen.getByRole("button", {
      name: finishedSection.show_collapsible_label,
    });

    expect(finishedReveal).toHaveAttribute("aria-expanded", "false");
    expect(visibleCard).toHaveClass("project-card");
    expect(visibleCard).not.toHaveClass("compact-project-card");
    expect(
      screen.queryByRole("article", {
        name: (accessibleName) => accessibleName.includes(collapsibleProject.title),
      })
    ).not.toBeInTheDocument();

    fireEvent.click(finishedReveal);

    const compactCard = screen.getByRole("article", {
      name: (accessibleName) => accessibleName.includes(collapsibleProject.title),
    });
    const compactOpener = screen.getByRole("button", {
      name: `${ui.open_project}: ${collapsibleProject.title}`,
    });

    expect(featuredCard).toHaveAccessibleName();
    expect(compactCard).toHaveAccessibleName();
    expect(featuredCard).toHaveClass("project-card--featured");
    expect(compactCard).toHaveClass("compact-project-card");
    expect(compactCard).not.toHaveClass("project-card");
    expect(finishedReveal).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(ui.featured_projects)).toBeInTheDocument();
    expect(screen.getByText(ui.other_projects)).toBeInTheDocument();
    expect(screen.getByText(finishedSection.collapsible_heading)).toBeInTheDocument();

    fireEvent.click(compactOpener);

    expect(
      screen.getByRole("dialog", { name: collapsibleProject.title })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: ui.close_project })).toHaveFocus();
    expect(new URL(window.location.href).searchParams.get("project")).toBe(
      collapsibleProject.id
    );
    expect(window.location.hash).toBe("#projects");
    expect(document.body).toHaveStyle({ overflow: "hidden" });

    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(new URL(window.location.href).searchParams.get("project")).toBeNull();
    expect(new URL(window.location.href).searchParams.get("source")).toBe("test");
    expect(window.location.hash).toBe("#projects");
    expect(document.body).not.toHaveStyle({ overflow: "hidden" });
    await waitFor(() => expect(compactOpener).toHaveFocus());
  });

  test("keeps regular non-featured projects visible and reveals seven compact projects", () => {
    const projectSection = yamlFixture("projects/section.yaml");
    const finishedSection = yamlFixture("projects/finished/section.yaml");
    const visibleProject = yamlFixture("projects/finished/advanced-materials.yaml");
    const collapsibleProjects = [
      "anemometer",
      "ai-mma-judging",
      "xenobots",
      "eng200-car",
      "inspire",
      "nestup",
      "bot-builder",
      "connect-four",
    ].map((id) => ({
      ...yamlFixture(`projects/finished/${id}.yaml`),
      collapsible: true,
    }));
    const finishedProjects = [visibleProject, ...collapsibleProjects];
    const content = {
      section: projectSection,
      groups: [{ ...finishedSection, projects: finishedProjects }],
      all: finishedProjects,
    };

    render(<ProjectSection content={content} ui={ui} />);

    expect(
      screen.getByRole("button", {
        name: `${ui.open_project}: ${visibleProject.title}`,
      })
    ).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(1);

    fireEvent.click(
      screen.getByRole("button", { name: finishedSection.show_collapsible_label })
    );

    const revealedCards = screen.getAllByRole("article");
    expect(revealedCards).toHaveLength(8);
    revealedCards.slice(1).forEach((card) =>
      expect(card).toHaveClass("compact-project-card")
    );
    expect(
      screen.queryByRole("button", {
        name: `${ui.open_project}: ${collapsibleProjects[7].title}`,
      })
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: finishedSection.hide_collapsible_label })
    );
    expect(
      screen.getByRole("button", {
        name: `${ui.open_project}: ${visibleProject.title}`,
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: `${ui.open_project}: ${collapsibleProjects[0].title}`,
      })
    ).not.toBeInTheDocument();
  });

  test("keeps the concise skills index closed until a category is requested", () => {
    const project = yamlFixture("projects/working-on/multi-agent-simulator.yaml");
    const content = {
      section: yamlFixture("misc/section.yaml"),
      skills: yamlFixture("misc/skills.yaml"),
      contacts: yamlFixture("misc/contacts.yaml"),
      closing: yamlFixture("misc/closing.yaml"),
    };

    render(<MiscSection content={content} projects={[project]} ui={ui} />);

    const summaryLabel = screen.getByText("Machine Learning");
    expect(screen.getByText("PyTorch")).not.toBeVisible();

    fireEvent.click(summaryLabel);

    expect(screen.getByText("PyTorch")).toBeVisible();
    expect(
      screen.getAllByRole("link", {
        name: `${ui.related_project}: ${project.title}`,
      })[0]
    ).toHaveAttribute("href", `?project=${project.id}#projects`);
  });
});
