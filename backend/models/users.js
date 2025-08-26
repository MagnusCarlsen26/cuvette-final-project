import { getMongoClient } from "../lib/mongo.js";

const DATABASE_NAME = process.env.DB_NAME || "appdb";
const USERS_COLLECTION = "users";
const OTP_COLLECTION = "password_otps";

export async function getUsersCollection() {
  const client = await getMongoClient();
  return client.db(DATABASE_NAME).collection(USERS_COLLECTION);
}

export async function getOtpCollection() {
  const client = await getMongoClient();
  return client.db(DATABASE_NAME).collection(OTP_COLLECTION);
}

export async function ensureUserIndexes() {
  const users = await getUsersCollection();
  await users.createIndex({ email: 1 }, { unique: true });
  await users.createIndex({ createdAt: 1 });
}

export async function ensureOtpIndexes() {
  const otps = await getOtpCollection();
  await otps.createIndex({ email: 1 });
  await otps.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
}


