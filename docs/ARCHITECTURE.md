# Architecture & Design Documentation

This document provides a high-level overview of the system architecture, design decisions, and data flows.

---

## System Overview

The Ecommerce Monolith is a feature-modular backend application following a layered architecture pattern within a monolithic deployment.

```
┌─────────────────────────────────────────────────────────────┐
│                        Clients                              │
│              (Web, Mobile, Third-party)                     │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Express.js Server                         │
│                   (Port: $PORT)                             │
├─────────────────────────────────────────────────────────────┤
│                   Middleware Layer                          │
│         cookie-parser │ express.json │ authMiddleware       │
├─────────────────────────────────────────────────────────────┤
│                    Route Layer                              │
│                   /api/v1/*                                 │
├─────────────────────────────────────────────────────────────┤
│                  Feature Modules                            │
│   ┌─────────┬─────────┬────────┬─────────┬────────┬───────┐ │
│   │  Auth   │Products │ Orders │Payments │Reviews │ Users │ │
│   └─────────┴─────────┴────────┴─────────┴────────┴───────┘ │
├─────────────────────────────────────────────────────────────┤
│                   Service Layer                             │
│         Business Logic & Data Validation                    │
├─────────────────────────────────────────────────────────────┤
│                  Mongoose ODM                               │
├─────────────────────────────────────────────────────────────┤
│                   MongoDB                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Design Principles

### 1. Feature-Based Module Organization

Each domain feature is self-contained with its own:
- **Controller** - HTTP request handling & response formatting
- **Service** - Business logic & database operations
- **Schema** (in `/db/schemas`) - Data models

```
src/features/
├── auth/
│   ├── auth.controller.ts    # Routes + handlers
│   └── auth.service.ts       # Business logic
├── orders/
│   ├── order.controller.ts
│   └── order.service.ts
└── ...
```

### 2. Separation of Concerns

| Layer | Responsibility |
|-------|---------------|
| **Controller** | Parse requests, validate input (Zod), format responses |
| **Service** | Business rules, database queries, external API calls |
| **Schema** | Data structure, Mongoose validation, indexes |

### 3. Type Safety

- Full TypeScript coverage
- Zod schemas for runtime validation
- Shared type definitions in `/shared/types/types.ts`

---

## Authentication Architecture

### Token-Based Auth Flow

```
┌──────────┐         ┌─────────────┐         ┌─────────────┐
│  Client  │         │   Server    │         │  Database   │
└────┬─────┘         └──────┬──────┘         └──────┬──────┘
     │                      │                       │
     │ POST /auth/login     │                       │
     │─────────────────────►│                       │
     │                      │ Find user by username │
     │                      │──────────────────────►│
     │                      │◄──────────────────────│
     │                      │                       │
     │                      │ Verify password       │
     │                      │ (bcrypt.compare)      │
     │                      │                       │
     │                      │ Generate tokens       │
     │                      │ • Access (15min)      │
     │                      │ • Refresh (30d)       │
     │                      │                       │
     │                      │ Hash & store refresh  │
     │                      │──────────────────────►│
     │                      │◄──────────────────────│
     │                      │                       │
     │ Set-Cookie (HttpOnly)│                       │
     │◄─────────────────────│                       │
     │                      │                       │
```

### Token Storage Strategy

| Token | Storage | Duration | Purpose |
|-------|---------|----------|---------|
| Access Token | HttpOnly Cookie | 15 minutes | API authentication |
| Refresh Token | HttpOnly Cookie + DB Hash | 30 days | Token rotation |

### Security Features

- **Password Hashing**: Bcrypt with salt rounds
- **Token Rotation**: New refresh token on each refresh
- **Secure Cookies**: HttpOnly, SameSite=Strict, Secure (production)
- **Token Revocation**: DB-stored token hashes for logout

---

## Data Models

### Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐
│    User     │───────│   Token     │
│             │ 1   n │             │
└─────────────┘       └─────────────┘
       │
       │ 1
       │
       ▼ n
┌─────────────┐       ┌─────────────┐
│   Order     │───────│  Product    │
│             │ n   m │             │
└─────────────┘       └─────────────┘
       │                     │
       │ 1                   │ 1
       │                     │
       ▼ n                   ▼ n
┌─────────────┐       ┌─────────────┐
│  Payment    │       │   Review    │
└─────────────┘       └─────────────┘
```

### Schema Definitions

**User**
```typescript
{
  _id: ObjectId
  username: string (unique)
  password: string (hashed)
  email: string
  role: 'user' | 'admin'
  created_at: Date
}
```

**Product**
```typescript
{
  _id: ObjectId
  title: string
  price: bigint
  category: string
  stock: number
  description: string | null
}
```

**Order**
```typescript
{
  _id: ObjectId
  user_id: string (ref: User)
  status: 'pending' | 'confirmed' | 'completed' | 'canceled'
  shipping_address: {
    street: string
    city: string
    province: string
    postCode: bigint
  }
  products: [{ product_id: string, count: number }]
  totalPrice: bigint
  created_at: Date
  confirmed_at?: Date
  completed_at?: Date
  canceled_at?: Date
}
```

**Payment**
```typescript
{
  _id: ObjectId
  user_id: string (ref: User)
  order_id: string (ref: Order)
  status: 'pending' | 'success' | 'fail'
  amount: bigint
  authority: string | null  // ZarinPal reference
  created_at: Date
  canceled_at?: Date
}
```

**Review**
```typescript
{
  _id: ObjectId
  product_id: string (ref: Product)
  user_id: string (ref: User)
  rate: 1 | 2 | 3 | 4 | 5
  comment: string
  created_at: Date
}
```

---

## API Routing Structure

```
/api/v1/
├── /auth
│   ├── POST /register
│   ├── POST /login
│   ├── POST /refresh
│   └── POST /logout
│
├── /products
│   ├── GET /:id
│   └── /:productId/reviews
│       ├── GET /
│       ├── GET /:reviewId
│       ├── POST /           🔒
│       └── DELETE /:reviewId 🔒
│
└── /users 🔒
    └── /me
        ├── GET /
        ├── /orders
        │   ├── GET /
        │   ├── POST /
        │   └── /:id
        │       ├── GET
        │       ├── PUT
        │       ├── PATCH
        │       └── DELETE
        └── /payments
            ├── GET /
            ├── POST /
            └── GET /:id

🔒 = Requires Authentication
```

---

## Payment Flow

Integration with ZarinPal payment gateway:

```
┌──────────┐      ┌─────────────┐      ┌─────────────┐
│  Client  │      │   Server    │      │  ZarinPal   │
└────┬─────┘      └──────┬──────┘      └──────┬──────┘
     │                   │                    │
     │ POST /payments    │                    │
     │──────────────────►│                    │
     │                   │                    │
     │                   │ Create payment     │
     │                   │ (DB: pending)      │
     │                   │                    │
     │                   │ Request session    │
     │                   │───────────────────►│
     │                   │◄───────────────────│
     │                   │ authority + URL    │
     │                   │                    │
     │ { sessionUrl }    │                    │
     │◄──────────────────│                    │
     │                   │                    │
     │ Redirect to       │                    │
     │ ZarinPal ─────────┼───────────────────►│
     │                   │                    │
     │ ◄── User pays ────┼────────────────────│
     │                   │                    │
     │                   │ GET /verify        │
     │                   │◄───────────────────│
     │                   │ (Authority,Status) │
     │                   │                    │
     │                   │ Update payment     │
     │                   │ (success/fail)     │
     │                   │                    │
```

---

## Error Handling Strategy

### Standardized Error Responses

All errors follow a consistent format:

```json
{
  "status": "fail",
  "error": "ERROR_CODE"
}
```

### Error Propagation

```
Controller → try/catch → next(error) → Express Error Handler
```

### Validation Errors

Zod schemas provide user-friendly validation messages:

```typescript
const result = Schema.safeParse(req.body);
if (!result.success) {
  return res.status(400).json({
    status: "fail",
    error: z.prettifyError(result.error)
  });
}
```

---

## Future Architecture (Roadmap)

### Phase Evolution

1. **Current State**: Monolithic with feature modules
2. **Next Steps**:
   - Redis caching layer
   - PostgreSQL for relational data
   - GraphQL API gateway
   - Docker containerization
   - Kubernetes orchestration
3. **Final Goal**: Microservices architecture

### Microservices Split Plan

```
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway                             │
├───────────┬───────────┬───────────┬───────────┬────────────┤
│   Auth    │  Product  │   Order   │  Payment  │  Review    │
│  Service  │  Service  │  Service  │  Service  │  Service   │
├───────────┼───────────┼───────────┼───────────┼────────────┤
│  MongoDB  │  MongoDB  │ PostgreSQL│  MongoDB  │  MongoDB   │
└───────────┴───────────┴───────────┴───────────┴────────────┘
```

---

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Express 5 | Async error handling, modern features |
| Database | MongoDB | Flexible schemas, fast development |
| Validation | Zod | TypeScript-first, great error messages |
| Auth | JWT + Cookies | Stateless + XSS protection |
| Testing | Vitest | Fast, ESM-native, great DX |
| ORM | Mongoose | Mature, strong typing support |
