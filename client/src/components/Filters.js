import { useState } from "react";

function renderFilterInput(fieldDef, value, onChange) {
  const fieldType = fieldDef.type || "text";

  if (fieldType === "boolean") {
    return (
      <select
        className="select"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">הכול</option>
        <option value="true">כן</option>
        <option value="false">לא</option>
      </select>
    );
  }

  return (
    <input
      className="input"
      type={fieldType === "number" ? "number" : fieldType === "date" ? "date" : "text"}
      value={value || ""}
      placeholder={`סינון לפי ${fieldDef.label || fieldDef.name}`}
      onChange={(e) => onChange(e.target.value.toLowerCase())}
    />
  );
}

export default function Filters({ config, setFilters }) {
  const [search, setSearch] = useState("");
  const [classes, setClasses] = useState([...config.classes]);
  const [type, setType] = useState("");
  const [fields, setFields] = useState({});

  function pushFilters(next = {}) {
    setFilters({
      search: next.search ?? search,
      classes: next.classes ?? classes,
      type: next.type ?? type,
      fields: next.fields ?? fields,
    });
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">סינון פריטים זמינים</h3>
      </div>

      <div className="card-body form-grid">
        <div>
          <label className="label">חיפוש לפי שם פריט</label>
          <input
            className="input"
            placeholder="חפש לפי שם פריט"
            value={search}
            onChange={(e) => {
              const newSearch = e.target.value.toLowerCase();
              setSearch(newSearch);
              pushFilters({ search: newSearch });
            }}
          />
        </div>

        <div>
          <label className="label">קטגוריות</label>
          <div className="checkbox-group">
            {config.classes.map((c) => (
              <label key={c} className="checkbox-pill">
                <input
                  type="checkbox"
                  checked={classes.includes(c)}
                  onChange={(e) => {
                    let newClasses;

                    if (e.target.checked) {
                      newClasses = [...classes, c];
                    } else {
                      newClasses = classes.filter((x) => x !== c);
                    }

                    setClasses(newClasses);
                    pushFilters({ classes: newClasses });
                  }}
                />
                {c}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="label">סוג</label>
          <select
            className="select"
            value={type}
            onChange={(e) => {
              const newType = e.target.value;
              setType(newType);
              setFields({});
              setFilters({
                search,
                classes,
                type: newType,
                fields: {},
              });
            }}
          >
            <option value="">כל הסוגים</option>
            {Object.keys(config.types).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {type &&
          config.types[type].fields.map((f) => (
            <div key={f.name}>
              <label className="label">{f.label || f.name}</label>
              {renderFilterInput(f, fields[f.name], (nextValue) => {
                const newFields = {
                  ...fields,
                  [f.name]: nextValue,
                };
                setFields(newFields);
                pushFilters({ fields: newFields });
              })}
            </div>
          ))}
      </div>
    </div>
  );
}