import { database } from "@config/database.ts";

export const paymentCollection = await database.createCollection("Payment", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      title: "Payment Validation",
      required: ["user_id", "order_id", "status", "amount", "created_at"],
      properties: {
        user_id: {
          bsonType: "objectId",
          description: "Reference to the User making the payment",
        },
        order_id: {
          bsonType: "objectId",
          description: "Reference to the associated Order",
        },
        status: {
          bsonType: "string",
          enum: ["success", "fail", "pending"],
          default: "pending",
          description: "Payment status",
        },
        amount: {
          bsonType: "long",
          minimum: 1,
          description: "Amount paid",
        },
        created_at: {
          bsonType: "number",
          description: "Timestamp of payment creation",
        },
        canceled_at: {
          bsonType: "number",
          description: "Timestamp of payment cancellation (optional)",
        },
      },
    },
    validationLevel: "strict",
    validationAction: "error",
  },
});
