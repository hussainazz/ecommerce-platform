import { Db, MongoClient } from "mongodb";

const db_url = process.env.DATABASE_URL;
if (!db_url) throw new Error(`env.DATABASE_URL doesn't exist`);
console.log(db_url);

export const mongo_client = new MongoClient(db_url);
