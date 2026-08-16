import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE_ELEMENTS = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "summary",
  "[contenteditable]",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function NotebookPopup({
  children,
  className = "",
  closeLabel,
  dialogId,
  eyebrow,
  onClose,
  title,
}) {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const appRoot = document.getElementById("root");
    const rootWasInert = appRoot?.hasAttribute("inert") || false;
    document.body.style.overflow = "hidden";
    appRoot?.setAttribute("inert", "");
    closeRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll(FOCUSABLE_ELEMENTS) || []
      );
      if (!focusable.length) return;

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

    const keepFocusInDialog = (event) => {
      if (!dialogRef.current?.contains(event.target)) {
        closeRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", keepFocusInDialog);
    return () => {
      document.body.style.overflow = previousOverflow;
      if (!rootWasInert) appRoot?.removeAttribute("inert");
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", keepFocusInDialog);
    };
  }, []);

  return createPortal(
    <div
      className="notebook-popup-layer"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCloseRef.current();
      }}
    >
      <article
        className={`notebook-popup ${className}`.trim()}
        id={dialogId}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${dialogId}-heading`}
        ref={dialogRef}
      >
        <header className="notebook-popup__header">
          <div>
            <p className="technical-label">{eyebrow}</p>
            <h2 id={`${dialogId}-heading`}>{title}</h2>
          </div>
          <button
            className="notebook-popup__close"
            type="button"
            aria-label={closeLabel}
            onClick={() => onCloseRef.current()}
            ref={closeRef}
          >
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <path d="M7 7 25 25M25 7 7 25" />
            </svg>
          </button>
        </header>
        <div className="notebook-popup__body">{children}</div>
      </article>
    </div>,
    document.body
  );
}

export default NotebookPopup;
