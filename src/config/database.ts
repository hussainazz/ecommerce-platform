import { MongoClient } from "mongodb";

export const mongo_client = new MongoClient(process.env.DATABASE_URL!);
async function connectToDatabase() {
  try {
    await mongo_client.connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
  }
}
connectToDatabase().catch(console.dir);
export const database = mongo_client.db(process.env.DATABASE_NAME);
