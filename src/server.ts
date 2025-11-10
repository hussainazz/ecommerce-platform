import express from "express";
import { configDotenv } from "dotenv";
import findConfig from "find-config";
import { MongoClient } from "mongodb";
configDotenv({ path: findConfig(".env")! });

const client = new MongoClient(process.env.DATABASE_URL!);
async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
  }
}
connectToDatabase().catch(console.dir);

const app = express();
app.listen(process.env.PORT, async () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

// ecommerce/monolith/
