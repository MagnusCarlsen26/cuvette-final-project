import dotenv from "dotenv";
import { MongoClient, ServerApiVersion } from "mongodb";

dotenv.config();

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error("Missing MONGODB_URI in environment. Create a .env file or set the variable.");
}

let cachedClient = null;

export async function getMongoClient() {
  if (cachedClient) return cachedClient;
  const client = new MongoClient(mongoUri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true
    }
  });
  await client.connect();
  cachedClient = client;
  return cachedClient;
}


