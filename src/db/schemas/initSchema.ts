import { initTokenSchema } from "./token.schema.ts";
import { initUserSchema } from "./user.schema.ts";
import { initProductSchema } from "./product.schema.ts";
import { initReviewSchema } from "./review.schema.ts";
import { initOrderSchema } from "./order.schema.ts";
import { initPaymentSchema } from "./payment.schema.ts";

export async function initSchema() {
  await initTokenSchema();
  await initUserSchema();
  await initProductSchema();
  await initReviewSchema();
  await initOrderSchema();
  await initPaymentSchema();
}
