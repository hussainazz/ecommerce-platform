import { mongo_client } from "@config/mongo_client.ts";

export let database = mongo_client.db(process.env.DATABASE_NAME);

async function connectToDatabase() {
  try {
    await mongo_client.connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}
connectToDatabase().catch(console.dir);
