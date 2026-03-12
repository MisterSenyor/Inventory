import { useMemo, useState } from "react";
import ImageLightbox from "./ImageLightbox";

function getBorrowerText(item, usersById) {
  const borrower = usersById[String(item.loanedTo)] || null;

  if (!borrower) {
    return item.loanedTo || "-";
  }

  if (borrower.phoneNumber) {
    return `${borrower.name} (${borrower.id}) · ${borrower.phoneNumber}`;
  }

  return `${borrower.name} (${borrower.id})`;
}

function BorrowedCard({
  item,
  itemsByParent,
  usersById,
  depth,
  onReturnTree,
  onImageClick,
}) {
  const [expanded, setExpanded] = useState(true);
  const children = itemsByParent[item.id] || [];
  const hasChildren = children.length > 0;
  const fieldEntries = Object.entries(item.fields || {});
  const borrowerText = getBorrowerText(item, usersById);

  return (
    <div className={depth > 0 ? "indented" : ""}>
      <div className="tree-node">
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
                <div className="tree-node-name">{item.name}</div>
                <div className="tree-node-meta">
                  <span className="meta-badge">מזהה {item.id}</span>
                  <span className="meta-badge">{item.type || "ללא סוג"}</span>
                  <span className="meta-badge">{item.class || "ללא קטגוריה"}</span>
                  <span className="meta-badge loaned">
                    מושאל ל־{borrowerText}
                  </span>
                </div>
              </div>
            </div>

            <div className="tree-node-actions">
              <button
                type="button"
                className="btn btn-primary btn-small"
                onClick={() => onReturnTree(item.id)}
              >
                החזר
              </button>
            </div>
          </div>

          <div className="field-list">
            <div className="field-row">
              <strong>מזהה אב:</strong> <span>{item.parentId || "-"}</span>
            </div>

            <div className="field-row">
              <strong>מושאל ל־</strong> <span>{borrowerText}</span>
            </div>

            {fieldEntries.map(([key, value]) => (
              <div className="field-row" key={key}>
                <strong>{key}:</strong> <span>{String(value)}</span>
              </div>
            ))}
          </div>

          {expanded && children.length > 0 && (
            <div className="children-wrap">
              {children.map((child) => (
                <BorrowedCard
                  key={child.id}
                  item={child}
                  itemsByParent={itemsByParent}
                  usersById={usersById}
                  depth={depth + 1}
                  onReturnTree={onReturnTree}
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

export default function BorrowedTree({ items = [], users = [], onReturnTree }) {
  const [lightbox, setLightbox] = useState({ open: false, src: "", alt: "" });

  const usersById = useMemo(() => {
    const map = {};
    for (const user of users) {
      map[String(user.id)] = user;
    }
    return map;
  }, [users]);

  const itemsByParent = useMemo(() => {
    const normalizedItems = Array.isArray(items) ? items : [];
    const map = {};

    for (const item of normalizedItems) {
      const key = item.parentId || "root";
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(item);
    }

    return map;
  }, [items]);

  const rootItems = useMemo(() => {
    const normalizedItems = Array.isArray(items) ? items : [];
    const itemIds = new Set(normalizedItems.map((item) => String(item.id)));

    return normalizedItems.filter((item) => {
      if (!item.parentId) {
        return true;
      }
      return !itemIds.has(String(item.parentId));
    });
  }, [items]);

  if (rootItems.length === 0) {
    return <div className="empty-state">לא נמצאו פריטים מושאלים.</div>;
  }

  return (
    <>
      <div className="tree-list">
        {rootItems.map((item) => (
          <BorrowedCard
            key={item.id}
            item={item}
            itemsByParent={itemsByParent}
            usersById={usersById}
            depth={0}
            onReturnTree={onReturnTree}
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