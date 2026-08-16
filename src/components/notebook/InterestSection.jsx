import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import MarkdownContent from "./MarkdownContent";
import SectionIntro from "./SectionIntro";

function NodeDetail({ node, ui }) {
  if (!node?.detail) return null;

  return (
    <aside
      className="interest-detail interest-preview__details"
      aria-labelledby={`${node.id}-detail-heading`}
    >
      <h4 id={`${node.id}-detail-heading`}>{node.detail.heading}</h4>
      {node.detail.intro_markdown ? (
        <MarkdownContent markdown={node.detail.intro_markdown} />
      ) : null}
      {node.detail.favourites?.length ? (
        <ul aria-label={ui.favourites_label}>
          {node.detail.favourites.map((favourite) => (
            <li key={`${favourite.title}-${favourite.creator || ""}`}>
              <span>{favourite.title}</span>
              {favourite.creator ? <small>{favourite.creator}</small> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </aside>
  );
}

function InterestPreview({
  anchorId,
  cardRef,
  map,
  node,
  onMouseEnter,
  onMouseLeave,
  ui,
}) {
  const [position, setPosition] = useState(null);

  useLayoutEffect(() => {
    const updatePosition = () => {
      const anchorElement = document.getElementById(anchorId);
      if (!anchorElement || !cardRef.current) return;

      const anchorBounds = anchorElement.getBoundingClientRect();
      const cardBounds = cardRef.current.getBoundingClientRect();
      const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
      const viewportHeight = window.innerHeight;
      const cardWidth = cardBounds.width || Math.min(node.detail ? 680 : 410, viewportWidth - 24);
      const cardHeight = cardBounds.height || 260;
      const edge = 12;
      const gap = 12;

      let left = anchorBounds.right + gap;
      if (left + cardWidth > viewportWidth - edge) {
        left = anchorBounds.left - cardWidth - gap;
      }
      if (left < edge) {
        left = Math.max(edge, (viewportWidth - cardWidth) / 2);
      }

      let top = anchorBounds.top + anchorBounds.height / 2 - cardHeight / 2;
      top = Math.max(edge, Math.min(top, viewportHeight - cardHeight - edge));
      setPosition({ left, top });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorId, cardRef, node.detail, node.id]);

  return createPortal(
    <aside
      className={`interest-preview interest-preview--${map.colour_token}${
        node.detail ? " has-secondary" : ""
      }`}
      id={`${node.id}-notes`}
      role="tooltip"
      aria-labelledby={`${node.id}-notes-heading`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      ref={cardRef}
      style={position ? position : { left: 0, top: 0, visibility: "hidden" }}
    >
      <header className="interest-preview__header">
        <p className="technical-label">{ui.interest_note_label}</p>
        <h3 id={`${node.id}-notes-heading`}>{node.label}</h3>
      </header>
      <div
        className={`interest-preview__content${
          node.detail ? " interest-preview__content--split" : ""
        }`}
      >
        <p className="interest-preview__note">{node.note}</p>
        <NodeDetail node={node} ui={ui} />
      </div>
    </aside>,
    document.body
  );
}

function InterestSection({ content, ui }) {
  const visibleMaps = useMemo(
    () => content.maps.filter((map) => map.visible !== false),
    [content.maps]
  );
  const [activeMapId, setActiveMapId] = useState(visibleMaps[0]?.id || null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [focusedNodeId, setFocusedNodeId] = useState(null);
  const [pinnedNodeId, setPinnedNodeId] = useState(null);
  const sectionRef = useRef(null);
  const cardRef = useRef(null);
  const closeTimerRef = useRef(null);
  const tabRefs = useRef(new Map());
  const nodeRefs = useRef(new Map());

  const activeNodeId = hoveredNodeId || focusedNodeId || pinnedNodeId;
  const activeMap =
    visibleMaps.find((map) => map.id === activeMapId) || visibleMaps[0];
  const activeNode = activeMap?.nodes.find((node) => node.id === activeNodeId);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const clearPreviewState = useCallback(() => {
    clearCloseTimer();
    setHoveredNodeId(null);
    setFocusedNodeId(null);
    setPinnedNodeId(null);
  }, [clearCloseTimer]);

  const dismissPreview = useCallback(
    (restoreFocus = false) => {
      const closingNodeId = activeNodeId;
      clearPreviewState();

      const hashId = window.location.hash.slice(1);
      const isInterestHash = visibleMaps.some((map) =>
        map.nodes.some((node) => node.anchor_id === hashId)
      );
      if (isInterestHash) {
        const url = new URL(window.location.href);
        url.hash = content.section.id;
        window.history.replaceState(window.history.state, "", url);
      }

      if (restoreFocus && closingNodeId) {
        window.requestAnimationFrame(() =>
          nodeRefs.current.get(closingNodeId)?.focus({ preventScroll: true })
        );
      }
    },
    [activeNodeId, clearPreviewState, content.section.id, visibleMaps]
  );

  const selectHashTarget = useCallback(() => {
    const hashId = window.location.hash.slice(1);
    const matchingMap = visibleMaps.find((map) =>
      map.nodes.some((node) => node.anchor_id === hashId)
    );
    const matchingNode = matchingMap?.nodes.find(
      (node) => node.anchor_id === hashId
    );

    if (!matchingMap || !matchingNode) {
      clearPreviewState();
      return;
    }

    setActiveMapId(matchingMap.id);
    setHoveredNodeId(null);
    setFocusedNodeId(null);
    setPinnedNodeId(matchingNode.id);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const target = document.getElementById(hashId);
        target?.scrollIntoView({ block: "center" });
        target?.focus({ preventScroll: true });
      });
    });
  }, [clearPreviewState, visibleMaps]);

  useEffect(() => {
    selectHashTarget();
    window.addEventListener("hashchange", selectHashTarget);
    return () => window.removeEventListener("hashchange", selectHashTarget);
  }, [selectHashTarget]);

  useEffect(() => {
    if (!activeMapId && visibleMaps[0]) {
      setActiveMapId(visibleMaps[0].id);
      return;
    }

    if (activeMapId && !visibleMaps.some((map) => map.id === activeMapId)) {
      setActiveMapId(visibleMaps[0]?.id || null);
      clearPreviewState();
    }
  }, [activeMapId, clearPreviewState, visibleMaps]);

  useEffect(
    () => () => {
      clearCloseTimer();
    },
    [clearCloseTimer]
  );

  useEffect(() => {
    if (!activeNode) return undefined;

    const handleEscape = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      dismissPreview(false);
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [activeNode, dismissPreview]);

  useEffect(() => {
    if (!pinnedNodeId) return undefined;

    const handleOutsidePress = (event) => {
      if (
        sectionRef.current?.contains(event.target) ||
        cardRef.current?.contains(event.target)
      ) {
        return;
      }
      dismissPreview(false);
    };

    document.addEventListener("pointerdown", handleOutsidePress);
    return () => document.removeEventListener("pointerdown", handleOutsidePress);
  }, [dismissPreview, pinnedNodeId]);

  const selectMap = (mapId) => {
    dismissPreview(false);
    setActiveMapId(mapId);
  };

  const handleTabKeyDown = (event, index) => {
    let nextIndex;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        nextIndex = (index + 1) % visibleMaps.length;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        nextIndex = (index - 1 + visibleMaps.length) % visibleMaps.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = visibleMaps.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const nextMap = visibleMaps[nextIndex];
    selectMap(nextMap.id);
    tabRefs.current.get(nextMap.id)?.focus();
  };

  const handleNodeKeyDown = (event, index) => {
    if (!activeMap?.nodes.length) return;

    let nextIndex;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        nextIndex = (index + 1) % activeMap.nodes.length;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        nextIndex = (index - 1 + activeMap.nodes.length) % activeMap.nodes.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = activeMap.nodes.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const nextNode = activeMap.nodes[nextIndex];
    nodeRefs.current.get(nextNode.id)?.focus();
  };

  const openOnHover = (nodeId) => {
    clearCloseTimer();
    setHoveredNodeId(nodeId);
  };

  const scheduleHoverClose = () => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setHoveredNodeId(null);
      closeTimerRef.current = null;
    }, 140);
  };

  const togglePinnedNode = (nodeId, trigger) => {
    clearCloseTimer();
    if (pinnedNodeId === nodeId) {
      dismissPreview(false);
      trigger.blur();
      return;
    }
    setPinnedNodeId(nodeId);
  };

  if (!activeMap) return null;

  return (
    <section
      className="notebook-section interest-section"
      id={content.section.id}
      aria-labelledby={`${content.section.id}-heading`}
      ref={sectionRef}
    >
      <SectionIntro section={content.section} />

      <div className="interest-index">
        <div
          className="interest-index__tabs"
          role="tablist"
          aria-labelledby={`${content.section.id}-heading`}
        >
          {visibleMaps.map((map, index) => (
            <button
              type="button"
              className={`interest-index__tab interest-index__tab--${map.colour_token}${
                activeMap.id === map.id ? " is-active" : ""
              }`}
              id={`${map.id}-interest-tab`}
              key={map.id}
              role="tab"
              aria-selected={activeMap.id === map.id}
              aria-controls={`${map.id}-interest-panel`}
              tabIndex={activeMap.id === map.id ? 0 : -1}
              onClick={() => selectMap(map.id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              ref={(node) => {
                if (node) tabRefs.current.set(map.id, node);
                else tabRefs.current.delete(map.id);
              }}
            >
              {map.label}
            </button>
          ))}
        </div>

        <div
          className={`interest-index__panel interest-index__panel--${activeMap.colour_token}`}
          id={`${activeMap.id}-interest-panel`}
          role="tabpanel"
          aria-labelledby={`${activeMap.id}-interest-tab`}
          tabIndex="0"
        >
          <header className="interest-index__header">
            <h3>{activeMap.label}</h3>
            <MarkdownContent markdown={activeMap.intro_markdown} />
          </header>

          <div className="interest-index__topics">
            {activeMap.nodes.map((node, index) => {
              const isActive = activeNode?.id === node.id;

              return (
                <button
                  type="button"
                  className={`interest-node interest-index__topic${
                    isActive ? " is-active" : ""
                  }`}
                  id={node.anchor_id || node.id}
                  key={node.id}
                  aria-expanded={isActive}
                  aria-controls={isActive ? `${node.id}-notes` : undefined}
                  aria-describedby={isActive ? `${node.id}-notes` : undefined}
                  onClick={(event) =>
                    togglePinnedNode(node.id, event.currentTarget)
                  }
                  onFocus={() => {
                    clearCloseTimer();
                    setFocusedNodeId(node.id);
                  }}
                  onBlur={() =>
                    setFocusedNodeId((current) =>
                      current === node.id ? null : current
                    )
                  }
                  onKeyDown={(event) => handleNodeKeyDown(event, index)}
                  onMouseEnter={() => openOnHover(node.id)}
                  onMouseLeave={scheduleHoverClose}
                  ref={(element) => {
                    if (element) nodeRefs.current.set(node.id, element);
                    else nodeRefs.current.delete(node.id);
                  }}
                >
                  {node.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {activeNode ? (
        <InterestPreview
          anchorId={activeNode.anchor_id || activeNode.id}
          cardRef={cardRef}
          key={activeNode.id}
          map={activeMap}
          node={activeNode}
          onMouseEnter={() => openOnHover(activeNode.id)}
          onMouseLeave={scheduleHoverClose}
          ui={ui}
        />
      ) : null}
    </section>
  );
}

export default InterestSection;
