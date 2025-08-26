import express from "express";
import { getMongoClient } from "./lib/mongo.js";
import authRouter from "./routes/auth.js";
import productsRouter from "./routes/products.js";
import invoicesRouter from "./routes/invoices.js";
import statsRouter from "./routes/stats.js";
import layoutRouter from "./routes/layout.js";
import { ensureUserIndexes, ensureOtpIndexes } from "./models/users.js";
import { markExpiredProducts } from "./models/products.js";

const app = express();
app.use(express.json());
// Minimal CORS for dev
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.get("/api/health", async (_req, res) => {
  try {
    const client = await getMongoClient();
    await client.db("admin").command({ ping: 1 });
    res.json({ status: "ok", db: "up" });
  } catch (_err) {
    res.status(500).json({ status: "error", db: "down" });
  }
});

// Initialize indexes on startup (best-effort)
ensureUserIndexes().catch(() => {});
ensureOtpIndexes().catch(() => {});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/invoices", invoicesRouter);
app.use("/api/stats", statsRouter);
app.use("/api/layout", layoutRouter);

// Cron trigger endpoint (to be called by Vercel Cron)
app.post("/api/internal/cron/mark-expired", async (_req, res) => {
  try {
    await markExpiredProducts();
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || "error" });
  }
});

export default app;


