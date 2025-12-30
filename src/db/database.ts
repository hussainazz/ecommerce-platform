import { mongo_client } from "@config/mongo_client.ts";

export let database = mongo_client.db(process.env.DATABASE_NAME);

/**
 * Establishes connection to MongoDB.
 * This should be called explicitly in application startup or test setup,
 * NOT automatically on module import to prevent race conditions.
 */
export async function connectToDatabase() {
  try {
    await mongo_client.connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}
