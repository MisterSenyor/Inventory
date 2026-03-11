require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const inventoryPath = path.join(__dirname, "inventory.json");
  const configPath = path.join(__dirname, "config.json");

  const items = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

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

  for (const item of items) {
    await pool.query(
      `
      INSERT INTO items (
        id, name, type, class_name, fields_json, parent_id, loaned_to, image_url
      )
      VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        class_name = EXCLUDED.class_name,
        fields_json = EXCLUDED.fields_json,
        parent_id = EXCLUDED.parent_id,
        loaned_to = EXCLUDED.loaned_to,
        image_url = EXCLUDED.image_url
      `,
      [
        String(item.id),
        item.name || "",
        item.type || "",
        item.class || "",
        JSON.stringify(item.fields || {}),
        item.parentId || null,
        item.loanedTo || null,
        item.imageUrl || "",
      ]
    );
  }

  for (const className of config.classes || []) {
    await pool.query(
      `
      INSERT INTO classes (name)
      VALUES ($1)
      ON CONFLICT (name) DO NOTHING
      `,
      [className]
    );
  }

  for (const [typeName, typeDef] of Object.entries(config.types || {})) {
    await pool.query(
      `
      INSERT INTO types (name, fields_json)
      VALUES ($1, $2::jsonb)
      ON CONFLICT (name) DO UPDATE SET
        fields_json = EXCLUDED.fields_json
      `,
      [typeName, JSON.stringify(typeDef.fields || [])]
    );
  }

  console.log("Migration complete.");
  await pool.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});