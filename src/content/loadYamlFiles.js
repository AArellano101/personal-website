import { load as parseYaml } from "js-yaml";

// CRA's webpack fallback emits unknown file types as assets. Requiring every
// YAML file here therefore gives us URLs that can be fetched and parsed at
// runtime without ejecting or adding a custom loader.
const yamlFileContext = require.context(".", true, /\.ya?ml$/);

export function yamlPathToKey(requestPath) {
  return requestPath
    .replace(/^\.\//, "")
    .replace(/\\/g, "/")
    .replace(/\.ya?ml$/i, "");
}

function unwrapModule(moduleValue) {
  if (
    moduleValue &&
    typeof moduleValue === "object" &&
    Object.prototype.hasOwnProperty.call(moduleValue, "default")
  ) {
    return moduleValue.default;
  }

  return moduleValue;
}

function defaultFetcher() {
  if (typeof fetch !== "function") {
    throw new Error("A fetch implementation is required to load YAML content.");
  }

  return fetch;
}

async function fetchYamlDocument(requestPath, context, fetcher) {
  const asset = unwrapModule(await context(requestPath));

  // Supporting an already-parsed object keeps this helper compatible with a
  // future YAML loader while CRA's default path remains URL -> fetch -> parse.
  if (asset && typeof asset === "object") {
    return asset;
  }

  if (typeof asset !== "string") {
    throw new TypeError(`YAML asset did not resolve to a URL: ${requestPath}`);
  }

  const response = await fetcher(asset);
  if (!response || response.ok === false || typeof response.text !== "function") {
    const status = response && response.status ? ` (${response.status})` : "";
    throw new Error(`Unable to fetch YAML content ${requestPath}${status}.`);
  }

  const source = await response.text();

  try {
    return parseYaml(source, { filename: requestPath });
  } catch (error) {
    error.message = `Unable to parse YAML content ${requestPath}: ${error.message}`;
    throw error;
  }
}

/** Load one YAML document by its extension-free content key. */
export async function loadYamlFile(
  key,
  { context = yamlFileContext, fetcher } = {}
) {
  if (!context || typeof context.keys !== "function") {
    throw new Error(
      "YAML discovery requires CRA/webpack's require.context or an injected context."
    );
  }

  const requestPath = context
    .keys()
    .find((candidate) => yamlPathToKey(candidate) === key);
  if (!requestPath) throw new Error(`YAML document does not exist: ${key}.yaml`);

  return fetchYamlDocument(requestPath, context, fetcher || defaultFetcher());
}

/**
 * Discover and parse every YAML document below src/content.
 *
 * The returned object is keyed by extension-free paths such as `hero`,
 * `right-now/section`, and `projects/working-on/flight-computer`.
 */
export async function loadYamlFiles({ context = yamlFileContext, fetcher, onDocument } = {}) {
  if (!context || typeof context.keys !== "function") {
    throw new Error(
      "YAML discovery requires CRA/webpack's require.context or an injected context."
    );
  }

  const fetchYaml = fetcher || defaultFetcher();
  const requestPaths = context.keys().slice().sort();
  const entries = await Promise.all(
    requestPaths.map(async (requestPath) => {
      const key = yamlPathToKey(requestPath);
      const document = await fetchYamlDocument(requestPath, context, fetchYaml);
      onDocument?.(key, document);
      return [key, document];
    })
  );

  return Object.fromEntries(entries);
}

export default loadYamlFiles;
