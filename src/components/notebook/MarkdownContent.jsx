import React from "react";

function appendText(nodes, value) {
  if (!value) return;

  const lastIndex = nodes.length - 1;
  if (typeof nodes[lastIndex] === "string") {
    nodes[lastIndex] += value;
  } else {
    nodes.push(value);
  }
}

function findUnescaped(source, token, fromIndex) {
  let index = source.indexOf(token, fromIndex);

  while (index !== -1) {
    let backslashCount = 0;
    for (let cursor = index - 1; cursor >= 0 && source[cursor] === "\\"; cursor -= 1) {
      backslashCount += 1;
    }

    if (backslashCount % 2 === 0) return index;
    index = source.indexOf(token, index + token.length);
  }

  return -1;
}

function findClosingParenthesis(source, fromIndex) {
  let depth = 0;

  for (let index = fromIndex; index < source.length; index += 1) {
    if (source[index] === "\\") {
      index += 1;
    } else if (source[index] === "(") {
      depth += 1;
    } else if (source[index] === ")") {
      if (depth === 0) return index;
      depth -= 1;
    }
  }

  return -1;
}

function linkDestination(rawDestination) {
  const value = rawDestination.trim();
  if (value.startsWith("<")) {
    const closingBracket = value.indexOf(">");
    return closingBracket === -1 ? "" : value.slice(1, closingBracket);
  }

  return value.split(/\s+/u, 1)[0];
}

export function isSafeMarkdownHref(href) {
  const hasControlCharacter = Array.from(href || "").some((character) => {
    const codePoint = character.codePointAt(0);
    return codePoint <= 31 || codePoint === 127;
  });

  if (!href || hasControlCharacter) return false;

  const protocol = href.match(/^([a-z][a-z\d+.-]*):/iu);
  return !protocol || ["http", "https", "mailto", "tel"].includes(protocol[1].toLowerCase());
}

function isExternalHref(href) {
  return /^(?:https?:)?\/\//iu.test(href);
}

/** Parse only the inline constructs the notebook content contract permits. */
export function renderMarkdownInline(source, keyPrefix = "inline") {
  const text = String(source || "");
  const nodes = [];
  let index = 0;

  while (index < text.length) {
    if (text[index] === "\\" && index + 1 < text.length) {
      appendText(nodes, text[index + 1]);
      index += 2;
      continue;
    }

    if (text[index] === "`") {
      const closing = findUnescaped(text, "`", index + 1);
      if (closing !== -1) {
        nodes.push(
          <code key={`${keyPrefix}-code-${index}`}>
            {text.slice(index + 1, closing)}
          </code>
        );
        index = closing + 1;
        continue;
      }
    }

    const strongToken = text.startsWith("**", index)
      ? "**"
      : text.startsWith("__", index)
      ? "__"
      : null;

    if (strongToken) {
      const closing = findUnescaped(text, strongToken, index + 2);
      if (closing > index + 2) {
        nodes.push(
          <strong key={`${keyPrefix}-strong-${index}`}>
            {renderMarkdownInline(
              text.slice(index + 2, closing),
              `${keyPrefix}-strong-${index}`
            )}
          </strong>
        );
        index = closing + 2;
        continue;
      }
    }

    if (text[index] === "[") {
      const labelEnd = findUnescaped(text, "](", index + 1);
      if (labelEnd !== -1) {
        const destinationEnd = findClosingParenthesis(text, labelEnd + 2);
        if (destinationEnd !== -1) {
          const label = text.slice(index + 1, labelEnd);
          const href = linkDestination(text.slice(labelEnd + 2, destinationEnd));
          const linkChildren = renderMarkdownInline(label, `${keyPrefix}-link-${index}`);

          if (isSafeMarkdownHref(href)) {
            const externalProps = isExternalHref(href)
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {};

            nodes.push(
              <a
                href={href}
                key={`${keyPrefix}-link-${index}`}
                {...externalProps}
              >
                {linkChildren}
              </a>
            );
          } else {
            nodes.push(...linkChildren);
          }

          index = destinationEnd + 1;
          continue;
        }
      }
    }

    if (text[index] === "*" || text[index] === "_") {
      const token = text[index];
      const openingBoundaryIsValid =
        token === "*" || index === 0 || !/[\p{L}\p{N}]/u.test(text[index - 1]);
      const closing = openingBoundaryIsValid
        ? findUnescaped(text, token, index + 1)
        : -1;

      if (
        closing > index + 1 &&
        !/\s/u.test(text[index + 1]) &&
        !/\s/u.test(text[closing - 1])
      ) {
        nodes.push(
          <em key={`${keyPrefix}-emphasis-${index}`}>
            {renderMarkdownInline(
              text.slice(index + 1, closing),
              `${keyPrefix}-emphasis-${index}`
            )}
          </em>
        );
        index = closing + 1;
        continue;
      }
    }

    appendText(nodes, text[index]);
    index += 1;
  }

  return nodes;
}

const unorderedItem = /^(\s*)[-+*]\s+(.+)$/u;
const orderedItem = /^(\s*)(\d+)[.)]\s+(.+)$/u;
const alphabeticalItem = /^(\s*)([a-z])[.)]\s+(.+)$/u;

function indentationWidth(whitespace) {
  return whitespace.replace(/\t/gu, "    ").length;
}

function matchListItem(line) {
  const orderedMatch = line.match(orderedItem);
  if (orderedMatch) {
    return {
      type: "ordered-list",
      marker: "decimal",
      indent: indentationWidth(orderedMatch[1]),
      start: Number(orderedMatch[2]),
      text: orderedMatch[3],
    };
  }

  const alphabeticalMatch = line.match(alphabeticalItem);
  if (alphabeticalMatch) {
    return {
      type: "ordered-list",
      marker: "lower-alpha",
      indent: indentationWidth(alphabeticalMatch[1]),
      start: alphabeticalMatch[2].charCodeAt(0) - 96,
      text: alphabeticalMatch[3],
    };
  }

  const unorderedMatch = line.match(unorderedItem);
  if (unorderedMatch) {
    return {
      type: "unordered-list",
      marker: "disc",
      indent: indentationWidth(unorderedMatch[1]),
      text: unorderedMatch[2],
    };
  }

  return null;
}

function parseList(lines, startIndex) {
  const firstItem = matchListItem(lines[startIndex]);
  const block = {
    type: firstItem.type,
    marker: firstItem.marker,
    indent: firstItem.indent,
    start: firstItem.start,
    items: [],
  };
  let index = startIndex;
  let currentItem;

  while (index < lines.length) {
    if (!lines[index].trim()) {
      let nextIndex = index + 1;
      while (nextIndex < lines.length && !lines[nextIndex].trim()) nextIndex += 1;

      const nextItem = matchListItem(lines[nextIndex] || "");
      const nextIndent = indentationWidth((lines[nextIndex] || "").match(/^\s*/u)[0]);
      const listContinues =
        nextItem &&
        (nextItem.indent > block.indent ||
          (nextItem.indent === block.indent &&
            nextItem.type === block.type &&
            nextItem.marker === block.marker));
      const textContinues =
        currentItem && lines[nextIndex]?.trim() && !nextItem && nextIndent > block.indent;

      if (!listContinues && !textContinues) break;
      index = nextIndex;
      continue;
    }

    const item = matchListItem(lines[index]);
    if (item) {
      const isSibling =
        item.indent === block.indent &&
        item.type === block.type &&
        item.marker === block.marker;

      if (isSibling) {
        currentItem = { text: item.text, children: [] };
        block.items.push(currentItem);
        index += 1;
        continue;
      }

      if (currentItem && item.indent > block.indent) {
        const nested = parseList(lines, index);
        currentItem.children.push(nested.block);
        index = nested.index;
        continue;
      }

      break;
    }

    const lineIndent = indentationWidth(lines[index].match(/^\s*/u)[0]);
    if (currentItem && lineIndent > block.indent) {
      currentItem.text += ` ${lines[index].trim()}`;
      index += 1;
      continue;
    }

    break;
  }

  return { block, index };
}

export function parseMarkdownBlocks(source) {
  const lines = String(source || "").replace(/\r\n?/gu, "\n").split("\n");
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    if (!lines[index].trim()) {
      index += 1;
      continue;
    }

    if (matchListItem(lines[index])) {
      const parsedList = parseList(lines, index);
      blocks.push(parsedList.block);
      index = parsedList.index;
      continue;
    }

    const paragraphLines = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !matchListItem(lines[index])
    ) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }

    blocks.push({ type: "paragraph", text: paragraphLines.join(" ") });
  }

  return blocks;
}

function renderBlock(block, index, keyPrefix = "block") {
  if (block.type === "paragraph") {
    return (
      <p key={`${keyPrefix}-paragraph-${index}`}>
        {renderMarkdownInline(block.text, `${keyPrefix}-p-${index}`)}
      </p>
    );
  }

  const List = block.type === "ordered-list" ? "ol" : "ul";
  const listProps =
    block.type === "ordered-list"
      ? { start: block.start, type: block.marker === "lower-alpha" ? "a" : "1" }
      : {};

  return (
    <List key={`${keyPrefix}-list-${index}`} {...listProps}>
      {block.items.map((item, itemIndex) => (
        <li key={`${keyPrefix}-item-${itemIndex}`}>
          {renderMarkdownInline(
            item.text,
            `${keyPrefix}-list-${index}-item-${itemIndex}`
          )}
          {item.children.map((child, childIndex) =>
            renderBlock(
              child,
              childIndex,
              `${keyPrefix}-list-${index}-item-${itemIndex}`
            )
          )}
        </li>
      ))}
    </List>
  );
}

/**
 * Render the deliberately small, HTML-free Markdown subset used by YAML copy.
 */
export default function MarkdownContent({
  markdown,
  content,
  children,
  inline = false,
  as,
  className = "",
  ...rest
}) {
  const source = markdown ?? content ?? children ?? "";
  if (source === "") return null;

  const Component = as || (inline ? "span" : "div");
  const classes = ["markdown-content", inline && "markdown-content--inline", className]
    .filter(Boolean)
    .join(" ");

  return (
    <Component className={classes} {...rest}>
      {inline
        ? renderMarkdownInline(String(source).replace(/\s*\n\s*/gu, " "))
        : parseMarkdownBlocks(source).map((block, index) => renderBlock(block, index))}
    </Component>
  );
}
