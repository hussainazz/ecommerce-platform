import { Db, MongoClient } from "mongodb";
import { configDotenv } from "dotenv";
import findConfig from "find-config";
configDotenv({ path: findConfig(".env")! });

const db_url = process.env.DATABASE_URL;
if (!db_url) throw new Error(`env.DATABASE_URL doesn't exist`);

export const mongo_client = new MongoClient(db_url);
