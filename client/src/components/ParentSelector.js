import { useEffect, useMemo, useRef, useState } from "react";

function getItemExternalId(item) {
  return item?.fields?.id ?? item?.fields?.ID ?? "";
}

function getParentDisplayText(item) {
  const externalId = getItemExternalId(item);
  if (externalId) {
    return `${item.name} (מזהה: ${externalId})`;
  }
  return item.name;
}

export default function ParentSelector({
  items,
  value,
  onChange,
  excludeId = null,
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const selectedItem = useMemo(() => {
    if (!value) {
      return null;
    }
    return items.find((item) => String(item.id) === String(value)) || null;
  }, [items, value]);

  useEffect(() => {
    setQuery(selectedItem ? getParentDisplayText(selectedItem) : "");
  }, [selectedItem]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();

    return items.filter((item) => {
      if (excludeId && String(item.id) === String(excludeId)) {
        return false;
      }

      if (!q) {
        return true;
      }

      const externalId = String(getItemExternalId(item)).toLowerCase();
      const itemName = String(item.name || "").toLowerCase();
      const combined = `${itemName} ${externalId}`.trim();

      return (
        itemName.includes(q) ||
        externalId.includes(q) ||
        combined.includes(q)
      );
    });
  }, [items, query, excludeId]);

  function chooseItem(item) {
    onChange(item.id);
    setQuery(getParentDisplayText(item));
    setOpen(false);
  }

  function clearSelection() {
    onChange(null);
    setQuery("");
    setOpen(false);
  }

  return (
    <div>
      <label className="label">פריט אב</label>

      <div className="autocomplete-wrap" ref={wrapperRef}>
        <input
          className="input"
          value={query}
          onChange={(e) => {
            const nextValue = e.target.value;
            setQuery(nextValue);
            setOpen(true);

            if (!nextValue.trim()) {
              onChange(null);
            } else if (
              selectedItem &&
              getParentDisplayText(selectedItem).toLowerCase() !==
                nextValue.trim().toLowerCase()
            ) {
              onChange(null);
            }
          }}
          onFocus={() => setOpen(true)}
          placeholder="חפש פריט אב לפי שם + מזהה"
        />

        {open && suggestions.length > 0 && (
          <div className="autocomplete-list">
            {suggestions.map((item) => (
              <button
                key={item.id}
                type="button"
                className="autocomplete-item"
                onClick={() => chooseItem(item)}
              >
                {getParentDisplayText(item)}
              </button>
            ))}
          </div>
        )}
      </div>

      {value && (
        <div style={{ marginTop: 8 }}>
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={clearSelection}
          >
            נקה בחירה
          </button>
        </div>
      )}
    </div>
  );
}