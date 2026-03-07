import { useEffect, useMemo, useRef, useState } from "react";

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
    setQuery(selectedItem ? selectedItem.name : "");
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

      return item.name.toLowerCase().includes(q);
    });
  }, [items, query, excludeId]);

  function chooseItem(item) {
    onChange(item.id);
    setQuery(item.name);
    setOpen(false);
  }

  function clearSelection() {
    onChange(null);
    setQuery("");
    setOpen(false);
  }

  return (
    <div>
      <label className="label">Parent item</label>

      <div className="autocomplete-wrap" ref={wrapperRef}>
        <input
          className="input"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);

            if (!e.target.value.trim()) {
              onChange(null);
            } else if (
              selectedItem &&
              selectedItem.name.toLowerCase() !== e.target.value.trim().toLowerCase()
            ) {
              onChange(null);
            }
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search parent item by name"
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
                {item.name}
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
            Clear parent
          </button>
        </div>
      )}
    </div>
  );
}