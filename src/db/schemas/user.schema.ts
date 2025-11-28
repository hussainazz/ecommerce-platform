import { property } from "zod";
import { database } from "../database.ts";

export let userCollection: any;
const collections = await database.listCollections({ name: "User" }).toArray();
if (collections.length === 1) {
  userCollection = database.collection("User");
} else {
  userCollection = await database.createCollection("User", {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        title: "User Validation",
        required: ["username", "password", "email", "role"],
        properties: {
          email: {
            bsonType: "string",
            pattern: "^[^@]+@[^@]+\\.[^@]+$",
          },
          username: {
            bsonType: "string",
          },
          password: {
            bsonType: "string",
          },
          role: {
            bsonType: "string",
          },
          created_at: {
            bsonType: "date",
          },
        },
      },
    },
    validationLevel: "strict",
    validationAction: "error",
  });
}

await userCollection.createIndex({ email: 1 }, { unique: true });
await userCollection.createIndex({ username: 1 }, { unique: true });
