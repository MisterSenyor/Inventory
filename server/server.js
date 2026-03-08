const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const store = require("./inventoryStore");

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:30000",
  "https://peaceful-starburst-c51e22.netlify.app",
  "https://agent-69ad92596348a99--peaceful-starburst-c51e22.netlify.app",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
  })
);

app.use(bodyParser.json());

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "blueshelf-admin-token";

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : "";

  if (token === ADMIN_TOKEN) {
    return next();
  }

  return res.status(401).send("Unauthorized");
}

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = ext || ".png";
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

app.use("/uploads", express.static(uploadsDir));

app.post("/api/login", (req, res) => {
  const username = String(req.body.username || "");
  const password = String(req.body.password || "");

  if (username === "admin" && password === "admin") {
    return res.json({
      authenticated: true,
      user: "admin",
      token: ADMIN_TOKEN,
    });
  }

  return res.status(401).send("Invalid username or password");
});

app.post("/api/logout", (req, res) => {
  return res.json({ authenticated: false });
});

app.get("/api/me", (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : "";

  if (token === ADMIN_TOKEN) {
    return res.json({ authenticated: true, user: "admin" });
  }

  return res.json({ authenticated: false });
});

app.get("/api/items", requireAuth, (req, res) => {
  res.json(store.getItems());
});

app.get("/api/config", requireAuth, (req, res) => {
  res.json(store.getConfig());
});

app.post("/api/upload-image", requireAuth, upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No image uploaded");
    }

    res.json({
      imageUrl: `/uploads/${req.file.filename}`,
    });
  } catch (err) {
    res.status(400).send(err.message || "Failed to upload image");
  }
});

app.post("/api/items", requireAuth, (req, res) => {
  try {
    const item = store.addItem(req.body);
    res.json(item);
  } catch (err) {
    res.status(400).send(err.message || "Failed to add item");
  }
});

app.put("/api/items/:id", requireAuth, (req, res) => {
  try {
    const updated = store.editItem(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(400).send(err.message || "Failed to edit item");
  }
});

app.delete("/api/items/:id", requireAuth, (req, res) => {
  try {
    store.removeItem(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).send(err.message || "Failed to remove item");
  }
});

app.post("/api/loan", requireAuth, (req, res) => {
  try {
    store.loanItem(req.body.id, req.body.friend);
    res.json({ success: true });
  } catch (err) {
    res.status(400).send(err.message || "Failed to loan item");
  }
});

app.post("/api/loan-with-children", requireAuth, (req, res) => {
  try {
    store.loanItemWithChildren(req.body.id, req.body.friend);
    res.json({ success: true });
  } catch (err) {
    res.status(400).send(err.message || "Failed to loan item tree");
  }
});

app.post("/api/return", requireAuth, (req, res) => {
  try {
    store.returnItem(req.body.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).send(err.message || "Failed to return item");
  }
});

app.post("/api/return-with-children", requireAuth, (req, res) => {
  try {
    store.returnItemWithChildren(req.body.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).send(err.message || "Failed to return item tree");
  }
});

app.post("/api/config/classes", requireAuth, (req, res) => {
  try {
    const config = store.addClass(req.body.name);
    res.json(config);
  } catch (err) {
    res.status(400).send(err.message || "Failed to add class");
  }
});

app.delete("/api/config/classes/:name", requireAuth, (req, res) => {
  try {
    const config = store.removeClass(req.params.name);
    res.json(config);
  } catch (err) {
    res.status(400).send(err.message || "Failed to remove class");
  }
});

app.post("/api/config/types", requireAuth, (req, res) => {
  try {
    const config = store.addType(req.body.name, req.body.fields || []);
    res.json(config);
  } catch (err) {
    res.status(400).send(err.message || "Failed to add type");
  }
});

app.delete("/api/config/types/:name", requireAuth, (req, res) => {
  try {
    const config = store.removeType(req.params.name);
    res.json(config);
  } catch (err) {
    res.status(400).send(err.message || "Failed to remove type");
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`API running on port ${port}`);
});