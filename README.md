# Aaron's interactive research notebook

A single-page personal website built with React and structured like an engineering research notebook.

## Content

All site copy, links, image metadata, accessibility labels, interest relationships, and project ordering live in YAML under `src/content/`. React components render that content but do not own Aaron-specific copy.

Markdown fields use the `_markdown` suffix and support paragraphs, lists, bold, italic, inline code, and safe internal or external links. Raw HTML is intentionally not rendered.

Images are referenced from YAML. Missing files display a graph-paper figure placeholder and the supplied caption; add authentic images beneath `public/images/` using the existing YAML paths.

## Commands

- `npm start` — start the local development server.
- `npm run build` — create the production build.
- `npm test -- --watchAll=false` — run the interaction tests once.

Project detail sheets are shareable with `?project=<project-id>#projects`.
