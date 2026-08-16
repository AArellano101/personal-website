import { loadYamlFile, loadYamlFiles } from "./loadYamlFiles";
import { orderByIds } from "./orderByIds";

function requiredDocument(documents, key) {
  const document = documents[key];

  if (!document || typeof document !== "object") {
    throw new Error(`Required YAML document is missing: ${key}.yaml`);
  }

  return document;
}

function immediateDocuments(documents, directory, excludedNames = []) {
  const prefix = `${directory}/`;
  const excluded = new Set(excludedNames);

  return Object.entries(documents)
    .filter(([key]) => {
      if (!key.startsWith(prefix)) return false;

      const name = key.slice(prefix.length);
      return !name.includes("/") && !excluded.has(name);
    })
    .map(([, document]) => document);
}

function orderedDirectory(documents, directory, order, excludedNames = ["section"]) {
  return orderByIds(
    immediateDocuments(documents, directory, excludedNames),
    order || []
  );
}

function assembleProjectGroups(documents, projectsSection) {
  const groupSections = Object.entries(documents)
    .filter(([key]) => /^projects\/[^/]+\/section$/.test(key))
    .map(([, document]) => document);

  return orderByIds(groupSections, projectsSection.group_order || []).map(
    (groupSection) => ({
      ...groupSection,
      projects: orderedDirectory(
        documents,
        `projects/${groupSection.id}`,
        groupSection.project_order
      ),
    })
  );
}

/** Assemble parsed YAML documents into the shape consumed by the notebook UI. */
export function assembleSiteContent(documents) {
  if (!documents || typeof documents !== "object") {
    throw new TypeError("assembleSiteContent expects parsed YAML documents.");
  }

  const rightNowSection = requiredDocument(documents, "right-now/section");
  const interestsSection = requiredDocument(documents, "interests/section");
  const projectsSection = requiredDocument(documents, "projects/section");
  const miscSection = requiredDocument(documents, "misc/section");

  const projectGroups = assembleProjectGroups(documents, projectsSection);

  return {
    site: requiredDocument(documents, "site"),
    navigation: requiredDocument(documents, "navigation"),
    hero: requiredDocument(documents, "hero"),
    ui: requiredDocument(documents, "ui"),
    rightNow: {
      section: rightNowSection,
      entries: orderedDirectory(
        documents,
        "right-now",
        rightNowSection.entry_order
      ),
    },
    interests: {
      section: interestsSection,
      maps: orderedDirectory(
        documents,
        "interests",
        interestsSection.map_order
      ).filter((map) => map.visible !== false),
    },
    projects: {
      section: projectsSection,
      groups: projectGroups,
      all: projectGroups.flatMap((group) => group.projects),
    },
    misc: {
      section: miscSection,
      skills: requiredDocument(documents, "misc/skills"),
      contacts: requiredDocument(documents, "misc/contacts"),
      closing: requiredDocument(documents, "misc/closing"),
    },
  };
}

export async function loadSiteContent(options) {
  return assembleSiteContent(await loadYamlFiles(options));
}

export { loadYamlFile, loadYamlFiles, orderByIds };

export default loadSiteContent;
