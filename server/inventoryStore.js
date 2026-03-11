const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      type TEXT NOT NULL DEFAULT '',
      class_name TEXT NOT NULL DEFAULT '',
      fields_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      parent_id TEXT,
      loaned_to TEXT,
      image_url TEXT NOT NULL DEFAULT ''
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS classes (
      name TEXT PRIMARY KEY
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS types (
      name TEXT PRIMARY KEY,
      fields_json JSONB NOT NULL DEFAULT '[]'::jsonb
    );
  `);
}

async function getItems() {
  const result = await pool.query(`
    SELECT
      id,
      name,
      type,
      class_name,
      fields_json,
      parent_id,
      loaned_to,
      image_url
    FROM items
    ORDER BY id
  `);

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    class: row.class_name,
    fields: row.fields_json || {},
    parentId: row.parent_id,
    loanedTo: row.loaned_to,
    imageUrl: row.image_url || "",
  }));
}

async function getConfig() {
  const classesResult = await pool.query(`
    SELECT name
    FROM classes
    ORDER BY name
  `);

  const typesResult = await pool.query(`
    SELECT name, fields_json
    FROM types
    ORDER BY name
  `);

  const types = {};
  for (const row of typesResult.rows) {
    types[row.name] = {
      fields: row.fields_json || [],
    };
  }

  return {
    classes: classesResult.rows.map((r) => r.name),
    types,
  };
}

async function generateId() {
  const result = await pool.query(`
    SELECT id
    FROM items
  `);

  let maxId = 0;

  for (const row of result.rows) {
    const num = Number(row.id);
    if (!Number.isNaN(num) && num > maxId) {
      maxId = num;
    }
  }

  return String(maxId + 1);
}

async function addItem(data) {
  const providedId = data.id ? String(data.id) : null;
  const newId = providedId || (await generateId());

  const newItem = {
    id: newId,
    name: data.name || "",
    type: data.type || "",
    class: data.class || "",
    fields: data.fields || {},
    parentId: data.parentId || null,
    loanedTo: data.loanedTo || null,
    imageUrl: data.imageUrl || "",
  };

  await pool.query(
    `
    INSERT INTO items (
      id, name, type, class_name, fields_json, parent_id, loaned_to, image_url
    )
    VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8)
    `,
    [
      newItem.id,
      newItem.name,
      newItem.type,
      newItem.class,
      JSON.stringify(newItem.fields),
      newItem.parentId,
      newItem.loanedTo,
      newItem.imageUrl,
    ]
  );

  return newItem;
}

async function editItem(id, updates) {
  const existingResult = await pool.query(
    `
    SELECT *
    FROM items
    WHERE id = $1
    `,
    [String(id)]
  );

  if (existingResult.rowCount === 0) {
    throw new Error(`Item with id ${id} not found`);
  }

  const current = existingResult.rows[0];

  const nextParentId = Object.prototype.hasOwnProperty.call(updates, "parentId")
    ? updates.parentId === "" || updates.parentId === null
      ? null
      : String(updates.parentId)
    : current.parent_id;

  const nextImageUrl =
    updates.imageUrl === undefined ? current.image_url : updates.imageUrl;

  const nextItem = {
    id: current.id,
    name: updates.name ?? current.name,
    type: updates.type ?? current.type,
    class: updates.class ?? current.class_name,
    fields: updates.fields ?? current.fields_json,
    parentId: nextParentId,
    loanedTo: updates.loanedTo === undefined ? current.loaned_to : updates.loanedTo,
    imageUrl: nextImageUrl,
  };

  await pool.query(
    `
    UPDATE items
    SET
      name = $2,
      type = $3,
      class_name = $4,
      fields_json = $5::jsonb,
      parent_id = $6,
      loaned_to = $7,
      image_url = $8
    WHERE id = $1
    `,
    [
      String(id),
      nextItem.name,
      nextItem.type,
      nextItem.class,
      JSON.stringify(nextItem.fields),
      nextItem.parentId,
      nextItem.loanedTo,
      nextItem.imageUrl,
    ]
  );

  return {
    id: String(id),
    name: nextItem.name,
    type: nextItem.type,
    class: nextItem.class,
    fields: nextItem.fields,
    parentId: nextItem.parentId,
    loanedTo: nextItem.loanedTo,
    imageUrl: nextItem.imageUrl,
  };
}

async function removeItem(id) {
  const itemId = String(id);

  const existingResult = await pool.query(
    `
    SELECT id
    FROM items
    WHERE id = $1
    `,
    [itemId]
  );

  if (existingResult.rowCount === 0) {
    throw new Error(`Item with id ${id} not found`);
  }

  await pool.query(
    `
    UPDATE items
    SET parent_id = NULL
    WHERE parent_id = $1
    `,
    [itemId]
  );

  await pool.query(
    `
    DELETE FROM items
    WHERE id = $1
    `,
    [itemId]
  );
}

async function getDescendantIds(rootId) {
  const items = await getItems();
  const result = [];
  const stack = [String(rootId)];

  while (stack.length > 0) {
    const currentId = stack.pop();
    result.push(currentId);

    for (const item of items) {
      if (String(item.parentId) === String(currentId)) {
        stack.push(String(item.id));
      }
    }
  }

  return result;
}

async function loanItem(id, friend) {
  const result = await pool.query(
    `
    UPDATE items
    SET loaned_to = $2
    WHERE id = $1
    RETURNING id
    `,
    [String(id), friend || ""]
  );

  if (result.rowCount === 0) {
    throw new Error(`Item with id ${id} not found`);
  }
}

async function loanItemWithChildren(id, friend) {
  const ids = await getDescendantIds(id);

  if (ids.length === 0) {
    throw new Error(`Item with id ${id} not found`);
  }

  await pool.query(
    `
    UPDATE items
    SET loaned_to = $2
    WHERE id = ANY($1::text[])
      AND (loaned_to IS NULL OR loaned_to = '')
    `,
    [ids, friend || ""]
  );
}

async function returnItem(id) {
  const result = await pool.query(
    `
    UPDATE items
    SET loaned_to = NULL
    WHERE id = $1
    RETURNING id
    `,
    [String(id)]
  );

  if (result.rowCount === 0) {
    throw new Error(`Item with id ${id} not found`);
  }
}

async function returnItemWithChildren(id) {
  const ids = await getDescendantIds(id);

  if (ids.length === 0) {
    throw new Error(`Item with id ${id} not found`);
  }

  await pool.query(
    `
    UPDATE items
    SET loaned_to = NULL
    WHERE id = ANY($1::text[])
    `,
    [ids]
  );
}

async function addClass(className) {
  const trimmed = String(className || "").trim();

  if (!trimmed) {
    throw new Error("Class name is required");
  }

  await pool.query(
    `
    INSERT INTO classes (name)
    VALUES ($1)
    ON CONFLICT (name) DO NOTHING
    `,
    [trimmed]
  );

  return getConfig();
}

async function removeClass(className) {
  await pool.query(
    `
    DELETE FROM classes
    WHERE name = $1
    `,
    [className]
  );

  return getConfig();
}

async function addType(typeName, fields) {
  const trimmed = String(typeName || "").trim();

  if (!trimmed) {
    throw new Error("Type name is required");
  }

  const normalizedFields = (fields || []).map((field) => ({
    name: String(field.name || "").trim(),
    label: String(field.label || field.name || "").trim(),
    type: String(field.type || "text").trim(),
  }));

  for (const field of normalizedFields) {
    if (!field.name) {
      throw new Error("Each field must have a name");
    }
  }

  await pool.query(
    `
    INSERT INTO types (name, fields_json)
    VALUES ($1, $2::jsonb)
    ON CONFLICT (name) DO NOTHING
    `,
    [trimmed, JSON.stringify(normalizedFields)]
  );

  return getConfig();
}

async function removeType(typeName) {
  await pool.query(
    `
    DELETE FROM types
    WHERE name = $1
    `,
    [typeName]
  );

  return getConfig();
}

module.exports = {
  initDb,
  getItems,
  addItem,
  editItem,
  removeItem,
  loanItem,
  loanItemWithChildren,
  returnItem,
  returnItemWithChildren,
  getConfig,
  addClass,
  removeClass,
  addType,
  removeType,
};