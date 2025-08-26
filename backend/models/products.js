import { ObjectId } from "mongodb";
import { getMongoClient } from "../lib/mongo.js";

const DATABASE_NAME = process.env.DB_NAME || "appdb";
const PRODUCTS_COLLECTION = "products";

export async function getProductsCollection() {
  const client = await getMongoClient();
  return client.db(DATABASE_NAME).collection(PRODUCTS_COLLECTION);
}

export async function ensureProductIndexes() {
  const col = await getProductsCollection();
  await col.createIndex({ name: 1 });
  await col.createIndex({ status: 1 });
  await col.createIndex({ expiryDate: 1 });
  await col.createIndex({ createdAt: 1 });
}

export function computeAvailabilityStatus({ quantity, threshold, expiryDate }) {
  const now = new Date();
  const exp = expiryDate ? new Date(expiryDate) : null;
  if (exp && exp.getTime() <= now.getTime()) return "expired";
  if (quantity === 0) return "out_of_stock";
  if (typeof threshold === "number" && quantity <= threshold) return "low_stock";
  return "in_stock";
}

export async function listProducts({ page = 1, limit = 10, search = "" }) {
  const col = await getProductsCollection();
  const filter = {};
  if (search) {
    filter.name = { $regex: new RegExp(search, "i") };
  }
  const total = await col.countDocuments(filter);
  const items = await col
    .find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function createProduct(doc) {
  const col = await getProductsCollection();
  const now = new Date();
  const quantity = Number(doc.quantity || 0);
  const threshold = doc.threshold != null ? Number(doc.threshold) : undefined;
  const expiryDate = doc.expiryDate ? new Date(doc.expiryDate) : undefined;
  const status = computeAvailabilityStatus({ quantity, threshold, expiryDate });
  const toInsert = {
    name: doc.name,
    sku: doc.sku || null,
    category: doc.category || null,
    price: Number(doc.price || 0),
    quantity,
    unit: doc.unit || null,
    threshold: threshold ?? 0,
    expiryDate: expiryDate || null,
    status,
    imageUrl: doc.imageUrl || null,
    createdAt: now,
    updatedAt: now
  };
  const res = await col.insertOne(toInsert);
  return { id: res.insertedId.toString(), ...toInsert };
}

export async function updateProduct(id, updates) {
  const col = await getProductsCollection();
  const existing = await col.findOne({ _id: new ObjectId(id) });
  if (!existing) return null;
  const next = { ...existing, ...updates };
  const quantity = Number(next.quantity || 0);
  const threshold = next.threshold != null ? Number(next.threshold) : undefined;
  const expiryDate = next.expiryDate ? new Date(next.expiryDate) : undefined;
  const status = computeAvailabilityStatus({ quantity, threshold, expiryDate });
  const toSet = { ...updates, quantity, threshold, expiryDate, status, updatedAt: new Date() };
  await col.updateOne({ _id: new ObjectId(id) }, { $set: toSet });
  return { ...existing, ...toSet, _id: existing._id };
}

export async function orderProductQuantity(id, delta) {
  const col = await getProductsCollection();
  const existing = await col.findOne({ _id: new ObjectId(id) });
  if (!existing) return null;
  const quantity = Math.max(0, Number(existing.quantity || 0) + Number(delta || 0));
  const threshold = existing.threshold != null ? Number(existing.threshold) : undefined;
  const expiryDate = existing.expiryDate ? new Date(existing.expiryDate) : undefined;
  const status = computeAvailabilityStatus({ quantity, threshold, expiryDate });
  await col.updateOne({ _id: existing._id }, { $set: { quantity, status, updatedAt: new Date() } });
  return { ...existing, quantity, status };
}

export async function deleteProduct(id) {
  const col = await getProductsCollection();
  const res = await col.deleteOne({ _id: new ObjectId(id) });
  return res.deletedCount === 1;
}

export async function markExpiredProducts() {
  const col = await getProductsCollection();
  const now = new Date();
  await col.updateMany(
    { expiryDate: { $ne: null, $lte: now }, status: { $ne: "expired" } },
    { $set: { status: "expired", quantity: 0, updatedAt: new Date() } }
  );
}


