import express from "express";
import { getMongoClient } from "./lib/mongo.js";

const app = express();
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    const client = await getMongoClient();
    await client.db("admin").command({ ping: 1 });
    res.json({ status: "ok", db: "up" });
  } catch (_err) {
    res.status(500).json({ status: "error", db: "down" });
  }
});

export default app;


