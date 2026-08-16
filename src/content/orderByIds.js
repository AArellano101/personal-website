function getDefaultId(item) {
  return item && item.id;
}

/**
 * Return a new array whose leading items follow an explicit list of IDs.
 * Items omitted from `orderedIds` retain their original relative order at the
 * end, which makes adding a draft YAML document non-destructive.
 */
export function orderByIds(
  items = [],
  orderedIds = [],
  { getId = getDefaultId, appendUnlisted = true, strict = true } = {}
) {
  if (!Array.isArray(items) || !Array.isArray(orderedIds)) {
    throw new TypeError("orderByIds expects arrays of items and IDs.");
  }

  const itemsById = new Map();

  items.forEach((item, index) => {
    const id = getId(item);

    if (id === undefined || id === null || id === "") {
      if (strict) {
        throw new Error(`Ordered content item at index ${index} has no ID.`);
      }
      return;
    }

    if (itemsById.has(id)) {
      throw new Error(`Duplicate content ID: ${id}`);
    }

    itemsById.set(id, item);
  });

  const seenIds = new Set();
  const ordered = [];

  orderedIds.forEach((id) => {
    if (seenIds.has(id)) {
      throw new Error(`Duplicate ID in content order: ${id}`);
    }

    seenIds.add(id);

    if (!itemsById.has(id)) {
      if (strict) {
        throw new Error(`Content order references missing ID: ${id}`);
      }
      return;
    }

    ordered.push(itemsById.get(id));
  });

  if (appendUnlisted) {
    items.forEach((item) => {
      const id = getId(item);
      if (itemsById.has(id) && !seenIds.has(id)) {
        ordered.push(item);
      }
    });
  }

  return ordered;
}

export default orderByIds;
