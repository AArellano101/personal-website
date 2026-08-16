import React, { useState } from "react";

export default function ImageWithPlaceholder({
  image,
  ui,
  labels,
  missingLabel,
  className = "",
  imageClassName = "",
  figureIndex,
  loading = "lazy",
  decoding = "async",
  onError,
  ...figureProps
}) {
  const { src, alt = "", caption = "" } = image || {};
  const [failedSrc, setFailedSrc] = useState(null);
  const hasImage = Boolean(src) && failedSrc !== src;
  const placeholderLabel =
    missingLabel ?? labels?.image_missing ?? ui?.image_missing ?? "";
  const accessiblePlaceholderLabel = alt || caption || placeholderLabel || undefined;
  const classes = ["notebook-image", className].filter(Boolean).join(" ");
  const imageClasses = ["notebook-image__asset", imageClassName]
    .filter(Boolean)
    .join(" ");

  function handleError(event) {
    setFailedSrc(src);
    if (onError) onError(event);
  }

  return (
    <figure className={classes} {...figureProps}>
      {hasImage ? (
        <img
          className={imageClasses}
          src={src}
          alt={alt}
          loading={loading}
          decoding={decoding}
          onError={handleError}
        />
      ) : (
        <div
          className="notebook-image__placeholder"
          role="img"
          aria-label={accessiblePlaceholderLabel}
        >
          {placeholderLabel && (
            <span className="notebook-image__missing-label">{placeholderLabel}</span>
          )}
        </div>
      )}

      {caption && (
        <figcaption className="notebook-image__caption">
          {figureIndex ? (
            <span className="notebook-image__figure-label">
              {ui?.image_figure_prefix} {String(figureIndex).padStart(2, "0")}
            </span>
          ) : null}
          <span>{caption}</span>
        </figcaption>
      )}
    </figure>
  );
}
