import { database } from "../database.ts";

export let paymentCollection: any;
const collections = await database
  .listCollections({ name: "Payment" })
  .toArray();
if (collections.length === 1) {
  paymentCollection = database.collection("Payment");
} else {
  paymentCollection = await database.createCollection("Payment", {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        title: "Payment Validation",
        required: ["user_id", "order_id", "status", "amount", "created_at"],
        properties: {
          user_id: {
            bsonType: "objectId",
          },
          order_id: {
            bsonType: "objectId",
          },
          status: {
            bsonType: "string",
            enum: ["success", "fail", "pending"],
          },
          amount: {
            bsonType: "long",
            minimum: 1,
          },
          created_at: {
            bsonType: "date",
          },
          successed: {
            bsonType: "date",
          },
          failed_at: {
            bsonType: "date",
          },
        },
      },
    },
    validationLevel: "strict",
    validationAction: "error",
  });
}
