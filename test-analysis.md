# Test Analysis Report

## Source Code Bugs (discovered during test review)

### 1. `src/features/auth/auth.service.ts:18` — Raw password stored in DB

`register()` does `userCollection.insertOne({ ...data, role: "user" })` which inserts the **raw password** into the database. The hashed password is only returned in the response object, never persisted.

### 2. `src/features/reviews/review.service.ts:54` — Wrong field name in query

`findProductReviews` queries `{ productId: ... }` but the field stored in the database is `product_id`. This method will never return results.

### 3. `src/features/orders/order.service.ts:61` — Typo in projection

```ts
.project({ status: 1, totoalPrice: 1 })
```
`totoalPrice` should be `totalPrice`.

### 4. `src/features/payments/payment.service.ts:82` — Validates same field twice

```ts
if (!ObjectId.isValid(_id) || !ObjectId.isValid(_id))
```
The second check should be `user_id`, not `_id`.

### 5. `src/features/payments/payment.service.ts:65,77` — Wrong error messages

`success()` and `fail()` throw `"product no longer exist"` instead of `"payment no longer exist"`.

### 6. `src/features/reviews/review.service.ts:4-6` — Unused imports

`obj` from `"find-config"` and `openAsBlob` from `"node:fs"` are imported but never used.

---

## Missing Test Scenarios

### `src/test/services/review.service.test.ts`

| Scenario | Status |
|---|---|
| `findProductReviews` | Not tested at all |
| `findById` | Not tested at all |
| `delete` success case | Not tested (only unauthorized-delete failure tested) |
| `add` with missing rate | Not tested |
| `add` with invalid product_id format | Not tested |
| `add` with invalid user_id format | Not tested |
| `findById` with non-existent review | Not tested |
| `findById` with invalid ObjectId | Not tested |
| `delete` with invalid ObjectId | Not tested |
| `createTestProduct` helper missing `description` field | Required by `Product` type |

### `src/test/services/product.service.test.ts`

| Scenario | Status |
|---|---|
| `findById` with invalid ObjectId format | Not tested (should throw "product id is invalid") |
| `delete` with invalid ObjectId format | Not tested |
| `decreaseStock` with invalid ObjectId format | Not tested |
| `increaseStock` with invalid ObjectId format | Not tested |
| `decreaseStock` with zero quantity | Not tested |
| `decreaseStock` with negative quantity | Not tested |
| `increaseStock` with zero quantity | Not tested |

### `src/test/services/order.service.test.ts`

| Scenario | Status |
|---|---|
| `findUserOrders` | Not tested at all |
| `updateItems` when new product is out of stock | Not tested |
| `cancel` on an already-canceled order | Not tested |
| `complete` on an already-completed order | Not tested |
| `confirm` on an already-confirmed order | Not tested |
| `delete` with invalid ObjectId format | Not tested |
| `cancel` with invalid ObjectId format | Not tested |
| `complete` with invalid ObjectId format | Not tested |
| `confirm` with invalid ObjectId format | Not tested |
| `findById` with invalid ObjectId format | Not tested |

### `src/test/services/auth.service.test.ts`

| Scenario | Status |
|---|---|
| `findByPassword` with invalid ObjectId | Not tested |
| `storeToken` with invalid userId | Not tested |
| `storeToken` with missing parameters (jti, tokenRaw, maxAge) | Not tested |
| `findById` with invalid ObjectId format | Not tested |
| `register` verifying raw password is NOT stored in DB | Not tested |

### `payment.service.ts` — No test file exists

The entire `PaymentService` has zero test coverage. No `src/test/services/payment.service.test.ts` file exists.

Untested methods:
- `create`
- `addAuthority`
- `success`
- `fail`
- `findById`
- `findAll`
