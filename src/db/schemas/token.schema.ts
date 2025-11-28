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
        required: ["jti", "userId", "tokenHash", "expires_at", "created_at"],
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
          expires_at: {
            bsonType: "date",
          },
          created_at: {
            bsonType: "date",
          },
        },
      },
    },
  });
}
