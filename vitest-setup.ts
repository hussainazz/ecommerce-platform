import { beforeAll, afterAll } from "vitest";
import { mongo_client } from "./src/config/mongo_client.ts";
import { initSchema } from "./src/db/schemas/initSchema.ts";
beforeAll(async () => {
  await mongo_client.connect();
  await initSchema();
});

afterAll(async () => {
  await mongo_client.close();
});
