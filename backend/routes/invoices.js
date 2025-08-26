import express from "express";
import { ObjectId } from "mongodb";
import { authMiddleware } from "../middleware/auth.js";
import { getMongoClient } from "../lib/mongo.js";

const DATABASE_NAME = process.env.DB_NAME || "appdb";
const INVOICES_COLLECTION = "invoices";

async function getInvoicesCollection() {
  const client = await getMongoClient();
  return client.db(DATABASE_NAME).collection(INVOICES_COLLECTION);
}

const router = express.Router();

// GET /api/invoices/metrics
router.get("/metrics", authMiddleware, async (_req, res) => {
  try {
    const col = await getInvoicesCollection();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [total, recent, processed, paidAgg, unpaidAgg, pending] = await Promise.all([
      col.countDocuments({}),
      col.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      // processed = number of unique invoices viewed at least once
      col.countDocuments({ viewedAt: { $ne: null } }),
      col
        .aggregate([
          { $match: { status: "paid", createdAt: { $gte: sevenDaysAgo } } },
          { $group: { _id: null, sum: { $sum: { $ifNull: ["$total", 0] } } } }
        ])
        .toArray(),
      col
        .aggregate([
          { $match: { status: "unpaid" } },
          { $group: { _id: null, sum: { $sum: { $ifNull: ["$total", 0] } } } }
        ])
        .toArray(),
      col.countDocuments({ status: "unpaid" })
    ]);

    const paidAmount = (paidAgg && paidAgg[0] && Number(paidAgg[0].sum)) || 0;
    const unpaidAmount = (unpaidAgg && unpaidAgg[0] && Number(unpaidAgg[0].sum)) || 0;

    return res.json({ total, recent, processed, paidAmount, unpaidAmount, pending });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/invoices
router.get("/", authMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const col = await getInvoicesCollection();
    const total = await col.countDocuments({});
    const items = await col
      .find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();
    return res.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/invoices
router.post("/", authMiddleware, async (req, res) => {
  try {
    const body = req.body || {};
    const now = new Date();
    const invoice = {
      invoiceId: body.invoiceId || `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      items: body.items || [],
      subtotal: Number(body.subtotal || 0),
      tax: Number(body.tax || 0),
      total: Number(body.total || 0),
      status: body.status || "unpaid",
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      createdAt: now
    };
    const col = await getInvoicesCollection();
    const resInsert = await col.insertOne(invoice);
    return res.status(201).json({ id: resInsert.insertedId.toString(), ...invoice });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/invoices/:id
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const col = await getInvoicesCollection();
    const id = new ObjectId(req.params.id);
    // mark invoice as viewed (first time)
    try {
      await col.updateOne({ _id: id, viewedAt: { $exists: false } }, { $set: { viewedAt: new Date() } });
    } catch (_e) {
      // ignore view tracking errors
    }
    const doc = await col.findOne({ _id: id });
    if (!doc) return res.status(404).json({ error: "Not found" });
    return res.json(doc);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/invoices/:id/mark-paid
router.patch("/:id/mark-paid", authMiddleware, async (req, res) => {
  try {
    const col = await getInvoicesCollection();
    const ref = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
    const upd = await col.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status: "paid", referenceNumber: ref } }
    );
    if (upd.matchedCount === 0) return res.status(404).json({ error: "Not found" });
    const doc = await col.findOne({ _id: new ObjectId(req.params.id) });
    return res.json(doc);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/invoices/:id
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const col = await getInvoicesCollection();
    const del = await col.deleteOne({ _id: new ObjectId(req.params.id) });
    if (del.deletedCount === 0) return res.status(404).json({ error: "Not found" });
    return res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;


