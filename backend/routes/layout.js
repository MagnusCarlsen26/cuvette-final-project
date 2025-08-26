import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { ensureLayoutIndexes, getUserLayout, saveUserLayout } from "../models/layouts.js";

const router = express.Router();

ensureLayoutIndexes().catch(() => {});

// GET /api/layout/:page (page = home | stats)
router.get("/:page", authMiddleware, async (req, res) => {
  try {
    const { page } = req.params;
    if (!["home", "stats"].includes(page)) return res.status(400).json({ error: "Invalid page" });
    const layout = await getUserLayout({ userId: req.user.userId, page });
    return res.json({ page, layout });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/layout/:page
router.put("/:page", authMiddleware, async (req, res) => {
  try {
    const { page } = req.params;
    if (!["home", "stats"].includes(page)) return res.status(400).json({ error: "Invalid page" });
    const layout = Array.isArray(req.body?.layout) ? req.body.layout : [];
    await saveUserLayout({ userId: req.user.userId, page, layout });
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;


