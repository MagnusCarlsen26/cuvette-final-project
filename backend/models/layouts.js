import { ObjectId } from "mongodb";
import { getMongoClient } from "../lib/mongo.js";

const DATABASE_NAME = process.env.DB_NAME || "appdb";
const LAYOUTS_COLLECTION = "layouts";

export async function getLayoutsCollection() {
  const client = await getMongoClient();
  return client.db(DATABASE_NAME).collection(LAYOUTS_COLLECTION);
}

export async function ensureLayoutIndexes() {
  const col = await getLayoutsCollection();
  await col.createIndex({ userId: 1, page: 1 }, { unique: true });
}

const DEFAULT_HOME = [
  { id: "sales-overview", type: "card", order: 0 },
  { id: "purchase-overview", type: "card", order: 1 },
  { id: "inventory-summary", type: "card", order: 2 },
  { id: "product-summary", type: "card", order: 3 },
  { id: "sales-purchase-chart", type: "chart", order: 4 },
  { id: "top-products", type: "list", order: 5 }
];

const DEFAULT_STATS = [
  { id: "kpi-cards", type: "kpis", order: 0 },
  { id: "sales-purchase-chart", type: "chart", order: 1 },
  { id: "top-products", type: "list", order: 2 }
];

export async function getUserLayout({ userId, page }) {
  const col = await getLayoutsCollection();
  const doc = await col.findOne({ userId, page });
  if (doc) return doc.layout || [];
  return page === "stats" ? DEFAULT_STATS : DEFAULT_HOME;
}

export async function saveUserLayout({ userId, page, layout }) {
  const col = await getLayoutsCollection();
  const now = new Date();
  await col.updateOne(
    { userId, page },
    { $set: { layout, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true }
  );
  return { ok: true };
}


