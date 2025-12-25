# Changelog

All notable changes to the Ecommerce Monolith Backend will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- OAuth2 integration (Google, GitHub)
- GraphQL API layer
- Redis caching
- Rate limiting
- Input sanitization enhancements

---

## [1.0.0] - 2024-12-24

### Added

#### Authentication System
- User registration with email and password
- Login with JWT access/refresh token flow
- Token refresh endpoint for session extension
- Logout with token revocation
- Password hashing with bcrypt
- Cookie-based token storage (HttpOnly, Secure)

#### Product Management
- Get product by ID endpoint
- Product schema with title, price, category, stock, description

#### Order System
- Create new orders with shipping address and products
- View all user orders
- View single order details
- Update order items (quantity changes)
- Update order status (confirm, complete, cancel)
- Delete orders

#### Payment Integration
- ZarinPal payment gateway integration (sandbox)
- Payment initiation with redirect URL
- Payment verification callback
- Payment status tracking
- Payment history per user

#### Reviews System
- View all reviews for a product
- View single review
- Add review (authenticated, rating 1-5)
- Delete own review

#### User Management
- User profile endpoint
- Protected routes with auth middleware

#### Infrastructure
- Express 5 with TypeScript
- MongoDB with Mongoose ODM
- Zod request validation
- Vitest testing framework
- ESM module system
- Path aliases for clean imports

### Technical Details

#### Dependencies
- express@5.1.0
- mongoose@8.19.3
- jsonwebtoken@9.0.2
- bcrypt@6.0.0
- zod@4.1.12
- axios@1.13.2

#### Dev Dependencies
- typescript@5.9.3
- vitest@4.0.9
- tsx@4.20.6

---

## Version History Template

### [X.Y.Z] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes to existing functionality

### Deprecated
- Features to be removed in upcoming releases

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Security updates

---

## Migration Guide

### Upgrading to 1.0.0

This is the initial release. No migration required.

### Future Migrations

Migration guides will be provided here when breaking changes are introduced.

---

## Release Schedule

| Version | Planned Features | Target Date |
|---------|-----------------|-------------|
| 1.1.0 | OAuth2 authentication | TBD |
| 1.2.0 | GraphQL API | TBD |
| 1.3.0 | Redis caching | TBD |
| 2.0.0 | Microservices split | TBD |

---

## Contributing

When contributing, please:
1. Update this changelog with your changes
2. Follow the existing format
3. Group related changes together
4. Link to relevant issues/PRs

---

[Unreleased]: https://github.com/username/ecommerce-monolith/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/username/ecommerce-monolith/releases/tag/v1.0.0
