import { database } from "@config/database.ts";
export const userCollection = await database.createCollection("User", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      title: "User Validation",
      required: ["username", "password", "email", "role"],
      properties: {
        email: {
          bsonType: "string",
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
      },
    },
    validationLevel: "strict",
    validationAction: "error",
  },
});
