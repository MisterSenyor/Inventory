import { useMemo, useState } from "react";
import ImageLightbox from "./ImageLightbox";

function ItemCard({ item, allItemsByParent, depth, onEdit, onImageClick }) {
  const [expanded, setExpanded] = useState(true);
  const children = allItemsByParent[item.id] || [];
  const fieldEntries = Object.entries(item.fields || {});
  const hasChildren = children.length > 0;
  const isMissing = !!item.loanedTo;

  return (
    <div className={depth > 0 ? "indented" : ""}>
      <div className={`tree-node ${isMissing ? "tree-node-missing" : ""}`}>
        <div className="tree-node-inner">
          <div className="tree-node-top">
            <div className="tree-node-left">
              {hasChildren ? (
                <button
                  type="button"
                  className="icon-toggle"
                  onClick={() => setExpanded((prev) => !prev)}
                >
                  {expanded ? "−" : "+"}
                </button>
              ) : (
                <span style={{ width: 30, display: "inline-block" }} />
              )}

              <img
                className="item-thumb item-thumb-clickable"
                src={item.imageUrl || "/default-item.png"}
                alt={item.name}
                onClick={() =>
                  onImageClick(item.imageUrl || "/default-item.png", item.name)
                }
                onError={(e) => {
                  e.currentTarget.src = "/default-item.png";
                }}
              />

              <div>
                <div className="tree-node-name">
                  {item.name}
                  {isMissing && (
                    <span className="missing-label">
                      חסר · מושאל ל־{item.loanedTo}
                    </span>
                  )}
                </div>

                <div className="tree-node-meta">
                  <span className="meta-badge">מזהה {item.id}</span>
                  <span className="meta-badge">{item.type || "ללא סוג"}</span>
                  <span className="meta-badge">{item.class || "ללא קטגוריה"}</span>
                  {isMissing && (
                    <span className="meta-badge loaned">
                      חסר
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="tree-node-actions">
              {!isMissing && (
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => onEdit(item)}
                >
                  עריכה
                </button>
              )}
            </div>
          </div>

          <div className="field-list">
            <div className="field-row">
              <strong>מזהה אב:</strong> <span>{item.parentId || "-"}</span>
            </div>

            {isMissing && (
              <div className="field-row">
                <strong>סטטוס:</strong> <span>מושאל ל־{item.loanedTo}</span>
              </div>
            )}

            {fieldEntries.map(([key, value]) => (
              <div className="field-row" key={key}>
                <strong>{key}:</strong> <span>{String(value)}</span>
              </div>
            ))}
          </div>

          {expanded && children.length > 0 && (
            <div className="children-wrap">
              {children.map((child) => (
                <ItemCard
                  key={child.id}
                  item={child}
                  allItemsByParent={allItemsByParent}
                  depth={depth + 1}
                  onEdit={onEdit}
                  onImageClick={onImageClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ItemTree({ items, allItems, onEdit }) {
  const [lightbox, setLightbox] = useState({ open: false, src: "", alt: "" });

  const safeItems = Array.isArray(items) ? items : [];
  const allItemsByParent = useMemo(() => {
    const map = {};
    const list = Array.isArray(allItems) ? allItems : [];
    for (const item of list) {
      const key = item.parentId || "root";
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(item);
    }
    return map;
  }, [allItems]);

  const rootItems = safeItems;

  if (rootItems.length === 0) {
    return <div className="empty-state">לא נמצאו פריטים זמינים.</div>;
  }

  return (
    <>
      <div className="tree-list">
        {rootItems.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            allItemsByParent={allItemsByParent}
            depth={0}
            onEdit={onEdit}
            onImageClick={(src, alt) => setLightbox({ open: true, src, alt })}
          />
        ))}
      </div>

      <ImageLightbox
        open={lightbox.open}
        src={lightbox.src}
        alt={lightbox.alt}
        onClose={() => setLightbox({ open: false, src: "", alt: "" })}
      />
    </>
  );
}