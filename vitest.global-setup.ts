import { configDotenv } from "dotenv";
import findConfig from "find-config";
import { MongoMemoryServer } from "mongodb-memory-server";

export default async function setup() {
  configDotenv({ path: findConfig(".env")! });

  const mongoServer = await MongoMemoryServer.create({
    instance: {
      port: 27017,
    },
  });
  const uri = mongoServer.getUri();
  const dbName = process.env.DATABASE_NAME;

  process.env.DATABASE_URL = uri;
  process.env.DATABASE_NAME = `test-${dbName}`;
  // teardown
  return async () => {
    await mongoServer.stop();
  };
}
