# API Documentation

Complete API reference for the Ecommerce Monolith Backend.

**Base URL**: `http://localhost:{PORT}/api/v1`

---

## 🔐 Authentication

All authenticated endpoints require JWT tokens sent via HTTP-only cookies.

### Token Flow

1. **Access Token** - Short-lived (15 min), used for API requests
2. **Refresh Token** - Long-lived (30 days), used to get new access tokens

---

## Auth Endpoints

### Register User

Create a new user account.

```http
POST /auth/register
```

**Request Body**:
```json
{
  "username": "johndoe",
  "password": "SecurePass123",
  "email": "john@example.com"
}
```

**Validation Rules**:
| Field | Rules |
|-------|-------|
| username | 5-30 characters, automatically lowercased and trimmed |
| password | 8-30 characters, must contain uppercase, lowercase, and number |
| email | Valid email format |

**Success Response** `201 Created`:
```json
{
  "status": "success",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe"
  }
}
```

**Cookies Set**:
- `access_token` (HttpOnly, 15 min)
- `refresh_token` (HttpOnly, 30 days)

---

### Login

Authenticate an existing user.

```http
POST /auth/login
```

**Request Body**:
```json
{
  "username": "johndoe",
  "password": "SecurePass123"
}
```

**Success Response** `200 OK`:
```json
{
  "status": "success",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe"
  }
}
```

---

### Refresh Token

Get a new access token using the refresh token.

```http
POST /auth/refresh
```

**Cookies Required**: `refresh_token`

**Success Response** `201 Created`:
```json
{
  "status": "success",
  "message": "refresh token generated"
}
```

---

### Logout

Invalidate the current session.

```http
POST /auth/logout
```

**Cookies Required**: `refresh_token`

**Success Response** `200 OK`:
```json
{
  "status": "success",
  "message": "sessions deleted successfully"
}
```

**Cookies Cleared**: `access_token`, `refresh_token`

---

## Products Endpoints

### Get Product by ID

Retrieve a single product.

```http
GET /products/:id
```

**Success Response** `200 OK`:
```json
{
  "status": "success",
  "product": {
    "id": "507f1f77bcf86cd799439011",
    "title": "Wireless Headphones",
    "price": 15000000,
    "category": "Electronics",
    "stock": 50,
    "description": "High-quality wireless headphones"
  }
}
```

---

## Reviews Endpoints

Reviews are nested under products: `/products/:productId/reviews`

### Get All Reviews for Product

```http
GET /products/:productId/reviews
```

**Success Response** `200 OK`:
```json
{
  "status": "success",
  "result": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "product_id": "507f1f77bcf86cd799439012",
      "user_id": "507f1f77bcf86cd799439013",
      "rate": 5,
      "comment": "Excellent product!",
      "created_at": "2024-12-24T10:30:00.000Z"
    }
  ]
}
```

---

### Get Review by ID

```http
GET /products/:productId/reviews/:reviewId
```

---

### Add Review 🔒

**Requires Authentication**

```http
POST /products/:productId/reviews
```

**Request Body**:
```json
{
  "rate": 5,
  "comment": "Great product, highly recommended!"
}
```

**Validation**:
- `rate`: Required, must be 1, 2, 3, 4, or 5

**Success Response** `201 Created`:
```json
{
  "status": "success",
  "result": { ... }
}
```

---

### Delete Review 🔒

**Requires Authentication**

```http
DELETE /products/:productId/reviews/:reviewId
```

---

## User Endpoints 🔒

All user endpoints require authentication.

### Get User Profile

```http
GET /users/me
```

**Success Response** `200 OK`:
```json
{
  "status": "success",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

---

## Order Endpoints 🔒

All order endpoints require authentication. Accessed via `/users/me/orders`

### Get All Orders

```http
GET /users/me/orders
```

**Success Response** `200 OK`:
```json
{
  "status": "success",
  "orders": [...]
}
```

---

### Get Order by ID

```http
GET /users/me/orders/:id
```

---

### Create Order

```http
POST /users/me/orders
```

**Request Body**:
```json
{
  "shipping_address": {
    "street": "123 Main St",
    "city": "Tehran",
    "province": "Tehran",
    "postCode": "1234567890"
  },
  "amount": 25000000,
  "products": [
    {
      "product_id": "507f1f77bcf86cd799439011",
      "count": 2
    }
  ]
}
```

**Validation**:
| Field | Rules |
|-------|-------|
| street | Required, min 1 character |
| city | Required, min 1 character |
| province | Required, min 1 character |
| postCode | Exactly 10 digits |
| amount | Positive number |
| products[].count | Minimum 1 |

**Success Response** `201 Created`:
```json
{
  "status": "success",
  "result": { ... }
}
```

---

### Update Order Items

```http
PUT /users/me/orders/:id
```

**Request Body**:
```json
[
  {
    "product_id": "507f1f77bcf86cd799439011",
    "count": 3
  }
]
```

---

### Update Order Status

```http
PATCH /users/me/orders/:id?status={status}
```

**Query Parameters**:
- `status`: `cancel`, `confirm`, or `complete`

---

### Delete Order

```http
DELETE /users/me/orders/:id
```

---

## Payment Endpoints

### Verify Payment (Callback)

ZarinPal callback endpoint.

```http
GET /payments/verify?Authority={authority}&Status={status}
```

---

### Get All Payments 🔒

```http
GET /users/me/payments
```

---

### Get Payment by ID 🔒

```http
GET /users/me/payments/:id
```

---

### Create Payment 🔒

Initiates a payment session with ZarinPal.

```http
POST /users/me/payments
```

**Request Body**:
```json
{
  "order_id": "507f1f77bcf86cd799439011",
  "amount": 25000000
}
```

**Success Response** `201 Created`:
```json
{
  "status": "success",
  "addedPayment": { ... },
  "sessionUrl": "http://sandbox.zarinpal.com/pg/StartPay/{authority}"
}
```

> Redirect the user to `sessionUrl` to complete payment.

---

## Error Codes

| Code | Meaning |
|------|---------|
| `TOKEN_MISSING` | No access token provided |
| `TOKEN_EXPIRED` | Access token has expired, use refresh |
| `REFRESH_TOKEN_MISSING` | No refresh token in cookies |
| `REFRESH_TOKEN_INVALID` | Refresh token is invalid |
| `REFRESH_TOKEN_NOT_FOUND` | Refresh token not in database |
| `REFRESH_TOKEN_MISMATCH` | Token verification failed |
| `USERNAME_MISMATCH` | Username not found |
| `PASSWORD_MISMATCH` | Incorrect password |
| `PRODUCT_NOT_FOUND` | Product ID doesn't exist |
| `ORDER_NOT_FOUND` | Order ID doesn't exist |
| `COOKIE_NOT_FOUND` | No cookies present |

---

## Response Format

### Success Response

```json
{
  "status": "success",
  "data": { ... }
}
```

### Error Response

```json
{
  "status": "fail",
  "error": "ERROR_CODE"
}
```

### Validation Error

```json
{
  "status": "fail",
  "error": "Formatted validation error message from Zod"
}
```
