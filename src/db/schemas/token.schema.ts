import { database } from "@db/database.ts";
import { required } from "zod/mini";

export let tokenCollection = database.collection("Token");

if (!tokenCollection) {
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
