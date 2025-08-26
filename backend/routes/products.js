import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  ensureProductIndexes,
  listProducts,
  createProduct,
  updateProduct,
  orderProductQuantity,
  deleteProduct,
  getProductsCollection
} from "../models/products.js";

const router = express.Router();

// ensure indexes at route load
ensureProductIndexes().catch(() => {});

// GET /api/products/metrics
router.get("/metrics", authMiddleware, async (_req, res) => {
  try {
    const col = await getProductsCollection();
    const now = new Date();
    const [buckets, total, categoriesAgg] = await Promise.all([
      col
        .aggregate([
          {
            $project: {
              category: 1,
              computedStatus: {
                $cond: [
                  { $and: [ { $ne: ["$expiryDate", null] }, { $lte: ["$expiryDate", now] } ] },
                  "expired",
                  {
                    $cond: [
                      { $eq: ["$quantity", 0] },
                      "out_of_stock",
                      {
                        $cond: [
                          { $and: [ { $ne: ["$threshold", null] }, { $lte: ["$quantity", "$threshold"] } ] },
                          "low_stock",
                          "in_stock"
                        ]
                      }
                    ]
                  }
                ]
              }
            }
          },
          { $group: { _id: "$computedStatus", count: { $sum: 1 } } }
        ])
        .toArray(),
      col.countDocuments({}),
      col
        .aggregate([
          { $match: { category: { $ne: null } } },
          { $group: { _id: "$category" } },
          { $count: "count" }
        ])
        .toArray()
    ]);
    const map = new Map(buckets.map((b) => [b._id, b.count]));
    const expired = map.get("expired") || 0;
    const outOfStock = map.get("out_of_stock") || 0;
    const lowStock = map.get("low_stock") || 0;
    const inStock = map.get("in_stock") || 0;
    const categories = (categoriesAgg && categoriesAgg[0] && Number(categoriesAgg[0].count)) || 0;
    return res.json({ total, inStock, lowStock, outOfStock, expired, categories });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/products
router.get("/", authMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const search = (req.query.search || "").toString();
    const data = await listProducts({ page, limit, search });
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/products
router.post("/", authMiddleware, async (req, res) => {
  try {
    const created = await createProduct(req.body || {});
    return res.status(201).json(created);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/products/:id
router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const updated = await updateProduct(req.params.id, req.body || {});
    if (!updated) return res.status(404).json({ error: "Not found" });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/products/:id/order { delta }
router.patch("/:id/order", authMiddleware, async (req, res) => {
  try {
    const { delta } = req.body || {};
    const updated = await orderProductQuantity(req.params.id, delta || 0);
    if (!updated) return res.status(404).json({ error: "Not found" });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/products/:id
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const ok = await deleteProduct(req.params.id);
    if (!ok) return res.status(404).json({ error: "Not found" });
    return res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;

// CSV upload (expects text/csv payload). Columns: name,price,quantity,unit,threshold,expiryDate,sku,category
router.post("/csv", authMiddleware, express.text({ type: ["text/*", "*/*"], limit: "2mb" }), async (req, res) => {
  try {
    const csv = (req.body || "").toString().trim();
    if (!csv) return res.status(400).json({ error: "Empty CSV" });
    const lines = csv.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return res.status(400).json({ error: "CSV must include header and at least one row" });
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const rows = lines.slice(1).map((line) => {
      const cols = line.split(",").map((c) => c.trim());
      const obj = {};
      header.forEach((key, idx) => {
        obj[key] = cols[idx];
      });
      return obj;
    });
    const created = [];
    for (const r of rows) {
      created.push(
        await createProduct({
          name: r.name,
          price: r.price,
          quantity: r.quantity,
          unit: r.unit,
          threshold: r.threshold,
          expiryDate: r.expirydate || r.expiryDate,
          sku: r.sku,
          category: r.category
        })
      );
    }
    return res.status(201).json({ inserted: created.length, items: created });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});


