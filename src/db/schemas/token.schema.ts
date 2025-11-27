import { database } from "@db/database.ts";
import { required } from "zod/mini";

export let tokenCollection: any;
const collections = await database.listCollections({ name: "Token" }).toArray();
if (collections.length === 1) {
  tokenCollection = database.collection("Token");
} else {
  tokenCollection = await database.createCollection("Token", {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        title: "Refresh Tokens",
        required: ["jti", "userId", "tokenHash", "expDate", "createdAt"],
        properties: {
          jti: {
            bsonType: "string",
          },
          userId: {
            bsonType: "string",
          },
          tokenHash: {
            bsonType: "string",
          },
          expDate: {
            bsonType: "number",
          },
          createdAt: {
            bsonType: "number",
          },
        },
      },
    },
  });
}
