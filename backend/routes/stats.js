import express from "express";
import { getMongoClient } from "../lib/mongo.js";
import { authMiddleware } from "../middleware/auth.js";
// import { createProduct } from "../models/products.js";

const DATABASE_NAME = process.env.DB_NAME || "appdb";

async function getDb() {
  const client = await getMongoClient();
  return client.db(DATABASE_NAME);
}

const router = express.Router();

// Dev-only seeding (disabled)
// async function seedDbIfEmpty() {}

// GET /api/stats/kpis?period=weekly|monthly|yearly
router.get("/kpis", authMiddleware, async (req, res) => {
  try {
    // try { await seedDbIfEmpty(); } catch (err) {}
    const db = await getDb();
    const invoices = db.collection("invoices");
    const products = db.collection("products");

    const paid = await invoices
      .aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: null, totalRevenue: { $sum: "$total" }, productsSold: { $sum: { $sum: "$items.qty" } } } }
      ])
      .toArray();
    const totals = paid[0] || { totalRevenue: 0, productsSold: 0 };
    const inStock = await products.countDocuments({ status: { $in: ["in_stock", "low_stock"] } });
    return res.json({ revenue: totals.totalRevenue, sold: totals.productsSold, inStock });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/stats/top-products
router.get("/top-products", authMiddleware, async (_req, res) => {
  try {
    // try { await seedDbIfEmpty(); } catch (err) {}
    const db = await getDb();
    const invoices = db.collection("invoices");
    const top = await invoices
      .aggregate([
        { $unwind: "$items" },
        { $group: { _id: "$items.name", sales: { $sum: "$items.qty" } } },
        { $sort: { sales: -1 } },
        { $limit: 10 }
      ])
      .toArray();
    return res.json(top.map((t) => ({ name: t._id, sales: t.sales })));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;

// GET /api/stats/graph?period=weekly|monthly|yearly
router.get("/graph", authMiddleware, async (req, res) => {
  try {
    const period = (req.query.period || 'monthly').toString();

    const db = await getDb();
    const invoices = db.collection("invoices");

    const now = new Date();

    const monthLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const dayLabels = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

    /**
     * Build time buckets and labels for the requested period
     */
    function buildWeekly() {
      const days = [];
      const keys = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        d.setUTCDate(d.getUTCDate() - i);
        days.push(d);
        keys.push(d.toISOString().slice(0, 10));
      }
      const labels = days.map((d) => dayLabels[d.getUTCDay()]);
      return { start: new Date(days[0]), end: new Date(days[6].getTime() + 24*60*60*1000 - 1), labels, keys };
    }

    function buildMonthly() {
      const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
      const end = new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1) - 1);
      const labels = monthLabels.slice();
      const keys = Array.from({ length: 12 }, (_, i) => String(i + 1));
      return { start, end, labels, keys };
    }

    function buildYearly() {
      const currentYear = now.getUTCFullYear();
      const years = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i);
      const start = new Date(Date.UTC(years[0], 0, 1));
      const end = new Date(Date.UTC(currentYear + 1, 0, 1) - 1);
      const labels = years.map((y) => String(y));
      const keys = years.map((y) => String(y));
      return { start, end, labels, keys };
    }

    let config;
    if (period === 'weekly') config = buildWeekly();
    else if (period === 'yearly') config = buildYearly();
    else config = buildMonthly();

    // Build aggregation bucket expression and match window
    let groupIdExpr;
    if (period === 'weekly') {
      groupIdExpr = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
    } else if (period === 'yearly') {
      groupIdExpr = { $toString: { $year: "$createdAt" } };
    } else {
      groupIdExpr = { $toString: { $month: "$createdAt" } };
    }

    const agg = await invoices
      .aggregate([
        { $match: { status: "paid", createdAt: { $gte: config.start, $lte: config.end } } },
        { $group: { _id: groupIdExpr, sales: { $sum: "$total" } } },
        { $project: { _id: 0, key: "$_id", sales: 1 } }
      ])
      .toArray();

    const keyToSales = new Map(agg.map((r) => [String(r.key), Number(r.sales || 0)]));
    const sales = config.keys.map((k) => keyToSales.get(String(k)) || 0);
    // No purchase source in schema yet; keep zeros for now
    const purchase = config.keys.map(() => 0);

    return res.json({ period, labels: config.labels, sales, purchase });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});


// POST /api/stats/seed-graph
// Dev-only helper to insert backdated paid invoices to visualize the graph
router.post("/seed-graph", authMiddleware, async (req, res) => {
  try {
    const allowDev = process.env.ALLOW_DEV_SEED === '1' || (process.env.NODE_ENV || 'development') !== 'production';
    if (!allowDev) return res.status(403).json({ error: "Seeding disabled in production" });

    const period = (req.query.period || req.body?.period || 'monthly').toString();
    const db = await getDb();
    const invoices = db.collection("invoices");

    const now = new Date();
    const sample = {
      weekly: {
        // 7 values, oldest to newest
        labels: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
        sales: [8200, 10200, 7600, 9400, 10800, 5600, 6100]
      },
      monthly: {
        // 12 months, Jan..Dec
        labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
        sales: [48000, 50500, 38000, 31000, 37000, 30000, 28000, 24000, 39000, 26000, 21000, 23000]
      },
      yearly: {
        // last 5 years from current year - 4 .. current year
        labels: Array.from({ length: 5 }, (_, i) => String(now.getUTCFullYear() - 4 + i)),
        sales: [420000, 455000, 390000, 365000, 410000]
      }
    };

    function qtyFromTotal(total) {
      // Approximate sold items for KPI: 1 item per 500 currency units, min 1
      return Math.max(1, Math.round(Number(total || 0) / 500));
    }

    const inserts = [];
    if (period === 'weekly') {
      // Build last 7 days ending today (oldest..newest)
      const startOfTodayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(startOfTodayUtc);
        d.setUTCDate(d.getUTCDate() - i);
        // place createdAt at 10:00 UTC of that day to be safe
        d.setUTCHours(10, 0, 0, 0);
        days.push(d);
      }
      const series = (req.body && Array.isArray(req.body.sales)) ? req.body.sales : sample.weekly.sales;
      for (let i = 0; i < days.length && i < series.length; i++) {
        const total = Number(series[i]) || 0;
        inserts.push({
          invoiceId: `SEED-W-${i + 1}-${Math.floor(Math.random() * 10000)}`,
          items: [{ name: "Seed Item", qty: qtyFromTotal(total), price: total }],
          subtotal: total,
          tax: 0,
          total,
          status: "paid",
          dueDate: null,
          createdAt: days[i]
        });
      }
      // Clean any existing paid invoices in this window generated by previous seeds (best-effort)
      await invoices.deleteMany({ status: "paid", createdAt: { $gte: new Date(days[0]), $lte: new Date(days[6].getTime() + 24*60*60*1000 - 1) }, invoiceId: { $regex: /^SEED-W-/ } });
    } else if (period === 'yearly') {
      const currentYear = now.getUTCFullYear();
      const years = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i);
      const series = (req.body && Array.isArray(req.body.sales)) ? req.body.sales : sample.yearly.sales;
      for (let i = 0; i < years.length && i < series.length; i++) {
        const year = years[i];
        const d = new Date(Date.UTC(year, 6, 1, 10, 0, 0, 0)); // mid-year
        const total = Number(series[i]) || 0;
        inserts.push({
          invoiceId: `SEED-Y-${year}-${Math.floor(Math.random() * 10000)}`,
          items: [{ name: "Seed Item", qty: qtyFromTotal(total), price: total }],
          subtotal: total,
          tax: 0,
          total,
          status: "paid",
          dueDate: null,
          createdAt: d
        });
      }
      await invoices.deleteMany({ status: "paid", createdAt: { $gte: new Date(Date.UTC(years[0], 0, 1)), $lte: new Date(Date.UTC(currentYear + 1, 0, 1) - 1) }, invoiceId: { $regex: /^SEED-Y-/ } });
    } else {
      // monthly for current year Jan..Dec
      const series = (req.body && Array.isArray(req.body.sales)) ? req.body.sales : sample.monthly.sales;
      for (let m = 0; m < 12 && m < series.length; m++) {
        const d = new Date(Date.UTC(now.getUTCFullYear(), m, 15, 10, 0, 0, 0));
        const total = Number(series[m]) || 0;
        inserts.push({
          invoiceId: `SEED-M-${m + 1}-${Math.floor(Math.random() * 10000)}`,
          items: [{ name: "Seed Item", qty: qtyFromTotal(total), price: total }],
          subtotal: total,
          tax: 0,
          total,
          status: "paid",
          dueDate: null,
          createdAt: d
        });
      }
      await invoices.deleteMany({ status: "paid", createdAt: { $gte: new Date(Date.UTC(now.getUTCFullYear(), 0, 1)), $lte: new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1) - 1) }, invoiceId: { $regex: /^SEED-M-/ } });
    }

    if (inserts.length) await invoices.insertMany(inserts, { ordered: false });
    return res.json({ seeded: inserts.length, period });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});


