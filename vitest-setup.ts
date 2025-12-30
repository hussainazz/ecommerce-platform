import { beforeAll, afterAll } from "vitest";
import { mongo_client } from "./src/config/mongo_client.ts";

beforeAll(async () => {
  await mongo_client.connect();
});

afterAll(async () => {
  await mongo_client.close();
});
