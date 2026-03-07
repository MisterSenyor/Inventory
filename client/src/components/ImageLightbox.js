export default function ImageLightbox({ open, src, alt, onClose }) {
  if (!open || !src) {
    return null;
  }

  return (
    <div className="image-lightbox-overlay" onClick={onClose}>
      <div
        className="image-lightbox-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="image-lightbox-close"
          onClick={onClose}
        >
          ×
        </button>

        <img className="image-lightbox-image" src={src} alt={alt || "Item"} />
      </div>
    </div>
  );
}