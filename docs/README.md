# Ecommerce Monolith Backend

A modern, production-ready e-commerce backend built with Node.js, Express 5, TypeScript, and MongoDB.

## 🚀 Features

- **Authentication & Authorization** - JWT-based auth with access/refresh token rotation
- **Product Management** - Product catalog with categories and inventory tracking
- **Order Processing** - Full order lifecycle management
- **Payment Integration** - ZarinPal payment gateway integration
- **Reviews System** - Product reviews with ratings
- **User Profiles** - User account management

## 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express 5** | Web framework |
| **TypeScript** | Type-safe development |
| **MongoDB** | Database |
| **Mongoose** | ODM |
| **JWT** | Authentication tokens |
| **Bcrypt** | Password hashing |
| **Zod** | Request validation |
| **Vitest** | Testing framework |

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB instance (local or cloud)
- npm or yarn

## ⚡ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ecommerce-monolith
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/ecommerce
   JWT_ACCESS_SECRET=your-access-secret-key
   JWT_REFRESH_SECRET=your-refresh-secret-key
   NODE_ENV=development
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## 📁 Project Structure

```
src/
├── config/          # App configuration
├── db/
│   ├── database.ts  # MongoDB connection
│   └── schemas/     # Mongoose schemas
├── features/
│   ├── auth/        # Authentication (register, login, refresh, logout)
│   ├── orders/      # Order management
│   ├── payments/    # Payment processing
│   ├── products/    # Product catalog
│   ├── reviews/     # Product reviews
│   └── users/       # User profiles
├── routes/          # API route definitions
├── shared/
│   ├── middlewares/ # Auth middleware
│   ├── types/       # TypeScript types & Zod schemas
│   └── utils/       # Utility functions
├── test/            # Test utilities
└── server.ts        # Application entry point
```

## 🔗 API Base URL

```
http://localhost:{PORT}/api/v1/
```

## 📖 Documentation

- [API Documentation](./API.md) - Complete API reference
- [Architecture](./ARCHITECTURE.md) - System design overview
- [User Guide](./USER_GUIDE.md) - Integration tutorials
- [Changelog](./CHANGELOG.md) - Version history

## 🗺 Roadmap

The project follows a 10-phase evolution plan:

1. ✅ **Current**: Monolithic backend with core features
2. 🔜 Security enhancements (OAuth2, encryption)
3. 🔜 Advanced APIs (GraphQL, gRPC)
4. 🔜 Caching layer (Redis)
5. 🔜 Performance optimization
6. 🔜 Hybrid databases (PostgreSQL)
7. 🔜 DevOps (Docker, K8s, CI/CD)
8. 🔜 Cloud deployment
9. 🔜 Monitoring (Prometheus, Grafana)
10. 🔜 Microservices architecture

## 📄 License

ISC

---

Built with ❤️ using TypeScript
