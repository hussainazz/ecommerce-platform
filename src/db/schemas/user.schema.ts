import { property } from "zod";
import { database } from "../database.ts";

export let userCollection = database.collection("User");
if (!userCollection) {
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
            description: "email must be a string and is required",
          },
          username: {
            bsonType: "string",
            description: "username must be a string and is required",
          },
          password: {
            bsonType: "string",
            description: "password must be a string and is required",
          },
          role: {
            bsonType: "string",
            description: "role must be a string and is required",
          },
          createdAt: {
            bsonType: "date",
            default: { $date: "$$NOW" },
          },
        },
      },
      validationLevel: "strict",
      validationAction: "error",
    },
  });
}

await userCollection.createIndex({ email: 1 }, { unique: true });
await userCollection.createIndex({ username: 1 }, { unique: true });
