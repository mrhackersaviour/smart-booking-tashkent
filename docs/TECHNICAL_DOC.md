# Technical Documentation

## Smart Booking Tashkent

**Version:** 1.0.0
**Last Updated:** March 7, 2026
**API Base URL:** `http://localhost:5000/api`
**WebSocket URL:** `ws://localhost:5000/ws`

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Folder Structure](#3-project-folder-structure)
4. [Database Schema & Models](#4-database-schema--models)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Full API Reference](#6-full-api-reference)
7. [Middleware Documentation](#7-middleware-documentation)
8. [Services & Utilities](#8-services--utilities)
9. [Environment Variables](#9-environment-variables)
10. [Installation & Setup Guide](#10-installation--setup-guide)
11. [Error Handling](#11-error-handling)
12. [Security Measures](#12-security-measures)
13. [Known Limitations & Future Improvements](#13-known-limitations--future-improvements)

---

## 1. Project Overview

**Project Name:** Smart Booking Tashkent

**Purpose:** A full-stack venue booking platform for Tashkent, Uzbekistan, enabling users to discover, browse, and reserve tables at restaurants, cafes, stadiums, fitness centers, barbershops, and car washes.

**Technical Problem Solved:** Replaces fragmented phone/walk-in reservation workflows with a unified digital booking system featuring real-time availability checking, time-slot conflict detection, 3D venue visualization, AI-powered recommendations, an integrated loyalty rewards engine, and Stripe payment processing.

**Target Environment:** Node.js (backend), modern web browsers (frontend). Designed for deployment on Linux servers with SQLite as the embedded database.

---

## 2. Tech Stack

### Backend

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Runtime | Node.js | 18+ | Server-side JavaScript runtime |
| Framework | Express.js | 4.18.2 | HTTP API framework |
| Database | SQLite | via better-sqlite3 11.10.0 | Embedded relational database |
| Authentication | JSON Web Tokens | jsonwebtoken 9.0.2 | Stateless token-based auth |
| Password Hashing | bcryptjs | 2.4.3 | Secure password hashing (12 rounds) |
| Validation | express-validator | 7.0.1 | Request input validation |
| AI Integration | Anthropic Claude SDK | @anthropic-ai/sdk 0.24.0 | AI recommendations and chat |
| Payments | Stripe | 14.14.0 | Payment intent processing |
| WebSocket | ws | 8.16.0 | Real-time notifications |
| Security | Helmet | 7.1.0 | HTTP security headers |
| CORS | cors | 2.8.5 | Cross-origin resource sharing |
| Rate Limiting | express-rate-limit | 7.1.5 | API rate limiting |
| Logging | Winston | 3.11.0 | Structured logging to file and console |
| HTTP Logging | Morgan | 1.10.0 | Request logging in combined format |
| UUID | uuid | 9.0.0 | UUID v4 generation |
| Environment | dotenv | 16.4.5 | Environment variable loading |
| Testing | Jest | 29.7.0 | Unit and integration testing |
| Dev Server | Nodemon | 3.0.2 | Auto-restart on file changes |
| API Testing | Supertest | 6.3.3 | HTTP assertion library |

### Frontend

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| UI Library | React | 18.2.0 | Component-based UI |
| Build Tool | Vite | 5.0.8 | Fast development server and bundler |
| Routing | React Router DOM | 6.21.0 | Client-side routing |
| CSS Framework | Tailwind CSS | 3.4.0 | Utility-first CSS |
| 3D Rendering | Three.js | 0.182.0 | 3D venue visualization |
| 3D React | @react-three/fiber | 8.18.0 | React renderer for Three.js |
| 3D Helpers | @react-three/drei | 9.122.0 | Useful Three.js helpers |
| Payments UI | @stripe/react-stripe-js | 5.6.0 | Stripe Elements for React |
| Stripe Core | @stripe/stripe-js | 8.7.0 | Stripe.js browser SDK |
| Icons | lucide-react | 0.300.0 | Icon component library |

---

## 3. Project Folder Structure

```
smart-booking-tashkent/
├── backend/
│   ├── src/
│   │   ├── index.js                    # Express app entry point, middleware setup, route registration
│   │   ├── config/
│   │   │   └── database.js             # SQLite connection, pg-compatible query interface
│   │   ├── controllers/
│   │   │   ├── authController.js       # Registration, login, token refresh, profile
│   │   │   ├── venueController.js      # Venue listing, details, availability, 3D model, districts
│   │   │   ├── bookingController.js    # Booking CRUD, cancellation, group invites, payment splits
│   │   │   ├── loyaltyController.js    # Loyalty transactions, summary, point redemption
│   │   │   ├── subscriptionController.js # Plan listing, subscribe, cancel, current plan
│   │   │   ├── paymentController.js    # Payment intents, confirmation, refunds, webhooks
│   │   │   ├── notificationController.js # Notification CRUD, mark-read, helper function
│   │   │   └── aiController.js         # AI recommendations, chat, table selection
│   │   ├── middleware/
│   │   │   ├── auth.js                 # JWT authentication, optional auth, subscription tier check
│   │   │   └── validate.js             # express-validator error handler
│   │   ├── routes/
│   │   │   ├── auth.js                 # /api/auth/* route definitions with validation rules
│   │   │   ├── venues.js               # /api/venues/* route definitions
│   │   │   ├── bookings.js             # /api/bookings/* route definitions with validation rules
│   │   │   ├── loyalty.js              # /api/loyalty/* route definitions
│   │   │   ├── subscriptions.js        # /api/subscriptions/* route definitions
│   │   │   ├── payments.js             # /api/payments/* route definitions
│   │   │   ├── notifications.js        # /api/notifications/* route definitions
│   │   │   └── ai.js                   # /api/ai/* route definitions
│   │   ├── services/
│   │   │   └── websocket.js            # WebSocket server, sendToUser(), broadcast()
│   │   └── utils/
│   │       └── logger.js               # Winston logger configuration
│   ├── migrations/
│   │   ├── 001_create_tables.sql       # Full database schema (10 tables, 11 indexes)
│   │   ├── run.js                      # Migration runner
│   │   └── seed.js                     # Demo data seeder (5 users, 14 venues, tables, bookings, reviews)
│   ├── data/
│   │   └── smart_booking.db            # SQLite database file (auto-created)
│   ├── logs/
│   │   ├── error.log                   # Error-level logs
│   │   └── combined.log                # All-level logs
│   ├── package.json
│   └── .env                            # Environment variables
├── frontend/
│   ├── src/
│   │   ├── main.jsx                    # React app entry point
│   │   ├── App.jsx                     # Root component, routing, auth state
│   │   ├── services/
│   │   │   └── api.js                  # HTTP client for all API endpoints
│   │   ├── pages/
│   │   │   ├── Home.jsx                # Landing page with categories and features
│   │   │   ├── Login.jsx               # Login form
│   │   │   ├── Register.jsx            # Registration form
│   │   │   ├── Venues.jsx              # Venue browsing with search/filter/sort
│   │   │   ├── VenueDetails.jsx        # Single venue page with reviews and tables
│   │   │   ├── BookingForm.jsx         # Booking creation with table selection
│   │   │   ├── MyBookings.jsx          # User's booking list with status management
│   │   │   ├── LoyaltyDashboard.jsx    # Loyalty points overview and transactions
│   │   │   ├── SubscriptionPlans.jsx   # Subscription tier selection
│   │   │   └── Checkout.jsx            # Stripe payment page
│   │   └── components/
│   │       ├── layout/Navbar.jsx       # Navigation bar with auth state
│   │       ├── venues/VenueCard.jsx    # Venue card component
│   │       ├── ai/AIChatWidget.jsx     # Floating AI chat assistant
│   │       ├── notifications/NotificationBell.jsx # Notification dropdown
│   │       └── three-d/VenueViewer3D.jsx # Interactive 3D venue renderer
│   ├── package.json
│   ├── vite.config.js                  # Vite config with API proxy to :5000
│   ├── tailwind.config.js              # Tailwind CSS configuration
│   └── index.html                      # HTML entry point
├── diagrams/                           # Architecture and flow diagrams (HTML/Mermaid)
├── docs/                               # Project documentation
└── .env.example                        # Environment variable template
```

---

## 4. Database Schema & Models

The database uses SQLite with WAL (Write-Ahead Logging) mode for improved read concurrency and enforced foreign key constraints (`PRAGMA foreign_keys = ON`). All primary keys are auto-generated UUID v4 strings.

### Model: users

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PK, UUID auto-generated | Unique user identifier |
| `email` | TEXT | UNIQUE, NOT NULL | User email address |
| `password_hash` | TEXT | NOT NULL | bcrypt hash (12 rounds) |
| `full_name` | TEXT | NOT NULL | Display name |
| `phone` | TEXT | — | Optional phone number |
| `avatar_url` | TEXT | — | Profile picture URL |
| `loyalty_points` | INTEGER | DEFAULT 0 | Current points balance |
| `subscription_tier` | TEXT | DEFAULT 'free', CHECK IN ('free','basic','premium','vip') | Current tier |
| `preferred_language` | TEXT | DEFAULT 'en', CHECK IN ('en','ru','uz') | Language preference |
| `preferences` | TEXT | DEFAULT '{}' | JSON preferences blob |
| `is_active` | INTEGER | DEFAULT 1 | Account active flag |
| `created_at` | TEXT | DEFAULT datetime('now') | Creation timestamp |
| `updated_at` | TEXT | DEFAULT datetime('now') | Last update timestamp |

**Relationships:** One-to-many with `bookings`, `subscriptions`, `loyalty_transactions`, `reviews`, `notifications`, `ai_chat_history`, `group_bookings`

---

### Model: venues

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PK, UUID auto-generated | Unique venue identifier |
| `name` | TEXT | NOT NULL | Venue name |
| `type` | TEXT | NOT NULL, CHECK IN ('cafe','restaurant','stadium','fitness','barbershop','carwash') | Category |
| `address` | TEXT | NOT NULL | Street address |
| `city` | TEXT | DEFAULT 'Tashkent' | City |
| `district` | TEXT | NOT NULL | Tashkent district |
| `latitude` | REAL | — | GPS latitude |
| `longitude` | REAL | — | GPS longitude |
| `description` | TEXT | — | Full description |
| `cuisine_type` | TEXT | — | Cuisine style |
| `price_range` | INTEGER | CHECK BETWEEN 1 AND 4 | Price tier |
| `rating` | REAL | DEFAULT 0.00 | Average rating |
| `total_reviews` | INTEGER | DEFAULT 0 | Review count |
| `amenities` | TEXT | DEFAULT '[]' | JSON array of amenity strings |
| `opening_hours` | TEXT | DEFAULT '{}' | JSON per-day hours |
| `images` | TEXT | DEFAULT '[]' | JSON array of image URLs |
| `three_d_model_url` | TEXT | — | 3D model asset URL |
| `phone` | TEXT | — | Venue phone |
| `website` | TEXT | — | Venue website |
| `is_active` | INTEGER | DEFAULT 1 | Active listing flag |
| `created_at` | TEXT | DEFAULT datetime('now') | Creation timestamp |
| `updated_at` | TEXT | DEFAULT datetime('now') | Update timestamp |

**Indexes:** `idx_venues_type`, `idx_venues_district`, `idx_venues_rating` (DESC)
**Relationships:** One-to-many with `venue_tables`, `bookings`, `reviews`

---

### Model: venue_tables

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PK, UUID auto-generated | Unique table identifier |
| `venue_id` | TEXT | FK → venues(id) ON DELETE CASCADE, NOT NULL | Parent venue |
| `table_number` | INTEGER | NOT NULL, UNIQUE(venue_id, table_number) | Sequential number |
| `label` | TEXT | — | Human-readable label (e.g., "Table 5") |
| `capacity` | INTEGER | NOT NULL, DEFAULT 2 | Maximum seats |
| `shape` | TEXT | DEFAULT 'round', CHECK IN ('round','square','rectangular','oval') | Shape for 3D |
| `position_x` | REAL | DEFAULT 0 | 3D x-coordinate |
| `position_y` | REAL | DEFAULT 0 | 3D y-coordinate (height) |
| `position_z` | REAL | DEFAULT 0 | 3D z-coordinate |
| `is_available` | INTEGER | DEFAULT 1 | General availability flag |
| `is_vip` | INTEGER | DEFAULT 0 | VIP table indicator |
| `price_multiplier` | REAL | DEFAULT 1.00 | Price modifier (VIP = 1.5) |
| `features` | TEXT | DEFAULT '[]' | JSON array of features |
| `created_at` | TEXT | DEFAULT datetime('now') | Creation timestamp |

**Relationships:** Belongs to `venues`; One-to-many with `bookings`

---

### Model: bookings

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PK, UUID auto-generated | Unique booking identifier |
| `user_id` | TEXT | FK → users(id) ON DELETE CASCADE, NOT NULL | Booking owner |
| `venue_id` | TEXT | FK → venues(id) ON DELETE CASCADE, NOT NULL | Booked venue |
| `table_id` | TEXT | FK → venue_tables(id) ON DELETE SET NULL | Reserved table (nullable) |
| `booking_date` | TEXT | NOT NULL | Date (YYYY-MM-DD) |
| `start_time` | TEXT | NOT NULL | Start time (HH:MM) |
| `end_time` | TEXT | NOT NULL | End time (HH:MM) |
| `guests_count` | INTEGER | NOT NULL, DEFAULT 1 | Number of guests |
| `status` | TEXT | DEFAULT 'pending', CHECK IN ('pending','confirmed','cancelled','completed','no_show') | Lifecycle status |
| `total_price` | REAL | — | Total in UZS |
| `currency` | TEXT | DEFAULT 'UZS' | Currency code |
| `loyalty_points_earned` | INTEGER | DEFAULT 0 | Points awarded |
| `special_requests` | TEXT | — | Free-text notes |
| `is_group_booking` | INTEGER | DEFAULT 0 | Group booking flag |
| `payment_status` | TEXT | DEFAULT 'unpaid', CHECK IN ('unpaid','partial','paid','refunded') | Payment state |
| `payment_intent_id` | TEXT | — | Stripe reference |
| `created_at` | TEXT | DEFAULT datetime('now') | Creation timestamp |
| `updated_at` | TEXT | DEFAULT datetime('now') | Update timestamp |

**Indexes:** `idx_bookings_user`, `idx_bookings_venue`, `idx_bookings_date`, `idx_bookings_status`
**Relationships:** Belongs to `users`, `venues`, `venue_tables`; One-to-one with `group_bookings`; One-to-many with `loyalty_transactions`, `reviews`

---

### Model: group_bookings

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PK, UUID auto-generated | Unique group booking ID |
| `booking_id` | TEXT | FK → bookings(id) ON DELETE CASCADE, NOT NULL | Parent booking |
| `inviter_user_id` | TEXT | FK → users(id) ON DELETE CASCADE, NOT NULL | User who created group |
| `invited_users` | TEXT | DEFAULT '[]' | JSON array of {id, email, name, status} |
| `split_type` | TEXT | DEFAULT 'equal', CHECK IN ('equal','custom','inviter_pays') | Split strategy |
| `split_payment_status` | TEXT | DEFAULT '{}' | JSON per-person payment tracking |
| `created_at` | TEXT | DEFAULT datetime('now') | Creation timestamp |
| `updated_at` | TEXT | DEFAULT datetime('now') | Update timestamp |

---

### Model: subscriptions

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PK, UUID auto-generated | Unique subscription ID |
| `user_id` | TEXT | FK → users(id) ON DELETE CASCADE, NOT NULL | Subscriber |
| `plan_type` | TEXT | NOT NULL, CHECK IN ('basic','premium','vip') | Selected plan |
| `start_date` | TEXT | NOT NULL | Start date (ISO 8601) |
| `end_date` | TEXT | NOT NULL | End date (start + 1 month) |
| `status` | TEXT | DEFAULT 'active', CHECK IN ('active','cancelled','expired','paused') | Status |
| `price` | REAL | NOT NULL | Price at time of subscription |
| `currency` | TEXT | DEFAULT 'UZS' | Currency |
| `benefits` | TEXT | DEFAULT '{}' | JSON features snapshot |
| `stripe_subscription_id` | TEXT | — | Stripe reference (future use) |
| `created_at` | TEXT | DEFAULT datetime('now') | Creation timestamp |
| `updated_at` | TEXT | DEFAULT datetime('now') | Update timestamp |

---

### Model: loyalty_transactions

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PK, UUID auto-generated | Unique transaction ID |
| `user_id` | TEXT | FK → users(id) ON DELETE CASCADE, NOT NULL | Transaction owner |
| `booking_id` | TEXT | FK → bookings(id) ON DELETE SET NULL | Related booking (nullable) |
| `points` | INTEGER | NOT NULL | Points amount (negative for redemptions) |
| `transaction_type` | TEXT | NOT NULL, CHECK IN ('earned','redeemed','bonus','expired') | Category |
| `description` | TEXT | — | Human-readable description |
| `created_at` | TEXT | DEFAULT datetime('now') | Timestamp |

**Index:** `idx_loyalty_user`

---

### Model: reviews

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PK, UUID auto-generated | Unique review ID |
| `user_id` | TEXT | FK → users(id) ON DELETE CASCADE, NOT NULL | Reviewer |
| `venue_id` | TEXT | FK → venues(id) ON DELETE CASCADE, NOT NULL | Reviewed venue |
| `booking_id` | TEXT | FK → bookings(id) ON DELETE SET NULL | Linked booking |
| `rating` | INTEGER | NOT NULL, CHECK BETWEEN 1 AND 5 | Star rating |
| `comment` | TEXT | — | Review text |
| `images` | TEXT | DEFAULT '[]' | JSON array of photo URLs |
| `is_verified` | INTEGER | DEFAULT 0 | Verified purchase flag |
| `created_at` | TEXT | DEFAULT datetime('now') | Creation timestamp |
| `updated_at` | TEXT | DEFAULT datetime('now') | Update timestamp |

**Indexes:** `idx_reviews_venue`, `idx_reviews_user`

---

### Model: notifications

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PK, UUID auto-generated | Unique notification ID |
| `user_id` | TEXT | FK → users(id) ON DELETE CASCADE, NOT NULL | Recipient |
| `type` | TEXT | NOT NULL | Type string (e.g., `booking_confirmed`, `payment_confirmed`, `group_invite`) |
| `title` | TEXT | NOT NULL | Notification headline |
| `message` | TEXT | NOT NULL | Body text |
| `data` | TEXT | DEFAULT '{}' | JSON metadata |
| `is_read` | INTEGER | DEFAULT 0 | Read/unread flag |
| `created_at` | TEXT | DEFAULT datetime('now') | Creation timestamp |

**Index:** `idx_notifications_user` (composite on `user_id`, `is_read`)

---

### Model: ai_chat_history

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PK, UUID auto-generated | Unique message ID |
| `user_id` | TEXT | FK → users(id) ON DELETE CASCADE, NOT NULL | Chat participant |
| `role` | TEXT | NOT NULL, CHECK IN ('user','assistant') | Message sender |
| `content` | TEXT | NOT NULL | Message text |
| `metadata` | TEXT | DEFAULT '{}' | JSON metadata |
| `created_at` | TEXT | DEFAULT datetime('now') | Timestamp |

---

## 5. Authentication & Authorization

### 5.1 Authentication Method

The system uses **JSON Web Tokens (JWT)** for stateless authentication. Two token types are issued:

| Token | Secret | Expiry | Purpose |
|---|---|---|---|
| Access Token | `JWT_SECRET` | 1 hour (configurable via `JWT_EXPIRES_IN`) | API request authentication |
| Refresh Token | `JWT_REFRESH_SECRET` | 7 days (configurable via `JWT_REFRESH_EXPIRES_IN`) | Access token renewal |

### 5.2 Token Payload

```json
{
  "userId": "uuid-string",
  "iat": 1709827200,
  "exp": 1709830800
}
```

### 5.3 Protected Route Flow

1. Client sends `Authorization: Bearer <accessToken>` header
2. `authenticateToken` middleware extracts and verifies the token against `JWT_SECRET`
3. Middleware queries `SELECT id, email, full_name, phone, avatar_url, loyalty_points, subscription_tier, preferred_language FROM users WHERE id = $1 AND is_active = 1`
4. If valid, attaches user object to `req.user` and calls `next()`
5. If expired, returns `401` with `{ error: "Token expired", code: "TOKEN_EXPIRED" }`
6. If invalid, returns `403` with `{ error: "Invalid token" }`

### 5.4 Access Levels

| Level | Middleware | Description |
|---|---|---|
| **Public** | None | No authentication required |
| **Optional Auth** | `optionalAuth` | Token verified if present; request continues regardless |
| **Required Auth** | `authenticateToken` | Valid token required; 401/403 on failure |
| **Subscription Gated** | `requireSubscription(minTier)` | Requires specific subscription tier: `free(0) < basic(1) < premium(2) < vip(3)` |

### 5.5 Authentication Flow (Step by Step)

```
1. User → POST /api/auth/register { email, password, full_name, phone }
2. Server → Hash password (bcrypt, 12 rounds)
3. Server → INSERT into users with 500 loyalty_points
4. Server → INSERT welcome bonus into loyalty_transactions
5. Server → Generate accessToken (1h) + refreshToken (7d)
6. Server → 201 { user, accessToken, refreshToken }

7. Client → Stores tokens in localStorage
8. Client → Sends Authorization: Bearer <accessToken> on each request

9. On 401 TOKEN_EXPIRED:
   Client → POST /api/auth/refresh { refreshToken }
   Server → Verify refreshToken with JWT_REFRESH_SECRET
   Server → 200 { accessToken, refreshToken }
   Client → Retries original request with new token
```

---

## 6. Full API Reference

### Auth Endpoints

---

#### POST /api/auth/register

**Description:** Create a new user account with 500 welcome loyalty points.

**Access:** Public

**Middleware:** `express-validator` → `validate`

**Validation Rules:**
- `email` — Must be valid email, auto-normalized (`isEmail().normalizeEmail()`)
- `password` — Minimum 6 characters (`isLength({ min: 6 })`)
- `full_name` — Required, trimmed (`trim().notEmpty()`)
- `phone` — Optional, trimmed

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "mypassword123",
  "full_name": "Aziz Karimov",
  "phone": "+998901234567"
}
```

**Success Response (201):**
```json
{
  "user": {
    "id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    "email": "user@example.com",
    "full_name": "Aziz Karimov",
    "phone": "+998901234567",
    "loyalty_points": 500,
    "subscription_tier": "free"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Error Responses:**
- `400` — `{ error: "Validation failed", details: [{ field, message }] }`
- `409` — `{ error: "Email already registered" }`
- `500` — `{ error: "Registration failed" }`

---

#### POST /api/auth/login

**Description:** Authenticate user with email and password.

**Access:** Public

**Middleware:** `express-validator` → `validate`

**Validation Rules:**
- `email` — Must be valid email (`isEmail().normalizeEmail()`)
- `password` — Required (`notEmpty()`)

**Request Body:**
```json
{
  "email": "demo@smartbooking.uz",
  "password": "demo123456"
}
```

**Success Response (200):**
```json
{
  "user": {
    "id": "a1b2c3d4-...",
    "email": "demo@smartbooking.uz",
    "full_name": "Aziz Karimov",
    "phone": "+998901234567",
    "avatar_url": null,
    "loyalty_points": 1500,
    "subscription_tier": "premium"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Error Responses:**
- `400` — Validation error
- `401` — `{ error: "Invalid email or password" }`
- `500` — `{ error: "Login failed" }`

---

#### POST /api/auth/refresh

**Description:** Exchange a valid refresh token for new token pair.

**Access:** Public

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Success Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Error Responses:**
- `400` — `{ error: "Refresh token required" }`
- `401` — `{ error: "User not found" }` or `{ error: "Invalid refresh token" }`

---

#### GET /api/auth/me

**Description:** Get the currently authenticated user's profile.

**Access:** Required Auth (`authenticateToken`)

**Headers:** `Authorization: Bearer <accessToken>`

**Success Response (200):**
```json
{
  "user": {
    "id": "a1b2c3d4-...",
    "email": "demo@smartbooking.uz",
    "full_name": "Aziz Karimov",
    "phone": "+998901234567",
    "avatar_url": null,
    "loyalty_points": 1500,
    "subscription_tier": "premium",
    "preferred_language": "en"
  }
}
```

**Error Responses:**
- `401` — `{ error: "Authentication required" }` or `{ error: "Token expired", code: "TOKEN_EXPIRED" }`
- `403` — `{ error: "Invalid token" }`

---

### Venue Endpoints

---

#### GET /api/venues

**Description:** Browse venues with filtering, sorting, and pagination.

**Access:** Optional Auth (`optionalAuth`)

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `type` | string | — | Filter: `cafe`, `restaurant`, `stadium`, `fitness`, `barbershop`, `carwash` |
| `district` | string | — | Filter by Tashkent district name |
| `price_range` | integer | — | Filter by price tier (1-4) |
| `cuisine` | string | — | Substring match on `cuisine_type` (case-insensitive) |
| `search` | string | — | Substring match on `name` or `description` (case-insensitive) |
| `sort` | string | rating | Sort: `price_low`, `price_high`, `newest`, `name` (default: rating DESC) |
| `page` | integer | 1 | Page number |
| `limit` | integer | 12 | Results per page |

**Success Response (200):**
```json
{
  "venues": [
    {
      "id": "uuid",
      "name": "Plov Center Yunusabad",
      "type": "restaurant",
      "address": "45 Amir Temur Street, Yunusabad",
      "city": "Tashkent",
      "district": "Yunusabad",
      "latitude": 41.3385,
      "longitude": 69.2854,
      "description": "The most authentic plov experience...",
      "cuisine_type": "Uzbek Traditional",
      "price_range": 2,
      "rating": 4.8,
      "total_reviews": 342,
      "amenities": "[\"WiFi\", \"Parking\", \"Outdoor Seating\"]",
      "opening_hours": "{\"monday\":{\"open\":\"07:00\",\"close\":\"23:00\"}, ...}",
      "images": "[\"/images/plov-center-1.jpg\"]",
      "phone": "+998712345001",
      "is_active": 1,
      "created_at": "2026-03-07T...",
      "updated_at": "2026-03-07T..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 14,
    "pages": 2
  }
}
```

**Error Responses:**
- `500` — `{ error: "Failed to fetch venues" }`

---

#### GET /api/venues/districts

**Description:** Get all districts with their venue counts.

**Access:** Public

**Success Response (200):**
```json
{
  "districts": [
    { "district": "Almazar", "venue_count": 1 },
    { "district": "Chilanzar", "venue_count": 3 },
    { "district": "Mirzo Ulugbek", "venue_count": 3 },
    { "district": "Sergeli", "venue_count": 2 },
    { "district": "Yakkasaray", "venue_count": 2 },
    { "district": "Yunusabad", "venue_count": 3 }
  ]
}
```

---

#### GET /api/venues/:id

**Description:** Get full venue details including tables and 5 most recent reviews.

**Access:** Optional Auth (`optionalAuth`)

**URL Params:** `id` — Venue UUID

**Success Response (200):**
```json
{
  "venue": { "id": "...", "name": "Plov Center Yunusabad", ... },
  "tables": [
    {
      "id": "uuid",
      "venue_id": "uuid",
      "table_number": 1,
      "label": "Table 1",
      "capacity": 2,
      "shape": "round",
      "position_x": -4.5,
      "position_y": 0,
      "position_z": -4.5,
      "is_available": 1,
      "is_vip": 0,
      "price_multiplier": 1.0,
      "features": "[]"
    }
  ],
  "recentReviews": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "venue_id": "uuid",
      "rating": 5,
      "comment": "Best plov in Tashkent!",
      "images": "[]",
      "is_verified": 1,
      "full_name": "Aziz Karimov",
      "avatar_url": null,
      "created_at": "2026-03-07T..."
    }
  ]
}
```

**Error Responses:**
- `404` — `{ error: "Venue not found" }`
- `500` — `{ error: "Failed to fetch venue" }`

---

#### GET /api/venues/:id/availability

**Description:** Get table availability for a specific date, showing booked time slots per table.

**Access:** Public

**URL Params:** `id` — Venue UUID

**Query Parameters:**

| Param | Type | Required | Description |
|---|---|---|---|
| `date` | string | Yes | Date in YYYY-MM-DD format |

**Success Response (200):**
```json
{
  "tables": [
    {
      "id": "uuid",
      "venue_id": "uuid",
      "table_number": 1,
      "capacity": 2,
      "shape": "round",
      "is_available_for_date": true,
      "booked_slots": [],
      "is_vip": 0
    },
    {
      "id": "uuid",
      "table_number": 5,
      "capacity": 4,
      "is_available_for_date": false,
      "booked_slots": [
        { "start": "19:00", "end": "21:00" }
      ]
    }
  ],
  "date": "2026-03-15"
}
```

**Error Responses:**
- `400` — `{ error: "Date parameter is required" }`
- `500` — `{ error: "Failed to fetch availability" }`

---

#### GET /api/venues/:id/3d-model

**Description:** Get 3D visualization data including table positions and scene configuration.

**Access:** Public

**URL Params:** `id` — Venue UUID

**Success Response (200):**
```json
{
  "venue": {
    "id": "uuid",
    "name": "Plov Center Yunusabad",
    "three_d_model_url": null
  },
  "tables": [
    {
      "id": "uuid",
      "table_number": 1,
      "label": "Table 1",
      "capacity": 2,
      "shape": "round",
      "position_x": -4.5,
      "position_y": 0,
      "position_z": -4.5,
      "is_available": 1,
      "is_vip": 0,
      "price_multiplier": 1.0,
      "features": "[]"
    }
  ],
  "scene": {
    "width": 20,
    "depth": 15,
    "height": 4,
    "floorTexture": "wood",
    "wallTexture": "plaster",
    "ambientLight": 0.4,
    "pointLights": [
      { "x": 0, "y": 3.5, "z": 0, "intensity": 0.8, "color": "#FFF5E1" },
      { "x": -6, "y": 3.5, "z": -4, "intensity": 0.5, "color": "#FFF5E1" },
      { "x": 6, "y": 3.5, "z": 4, "intensity": 0.5, "color": "#FFF5E1" }
    ]
  }
}
```

**Error Responses:**
- `404` — `{ error: "Venue not found" }`
- `500` — `{ error: "Failed to fetch 3D model data" }`

---

### Booking Endpoints

All booking endpoints require `authenticateToken` (applied via `router.use(authenticateToken)`).

---

#### POST /api/bookings

**Description:** Create a new booking with automatic price calculation and loyalty point awarding.

**Access:** Required Auth

**Validation Rules:**
- `venue_id` — Valid UUID (`isUUID()`)
- `booking_date` — Valid date (`isDate()`)
- `start_time` — HH:MM format (`matches(/^\d{2}:\d{2}$/)`)
- `end_time` — HH:MM format (`matches(/^\d{2}:\d{2}$/)`)
- `guests_count` — Integer 1-50 (`isInt({ min: 1, max: 50 })`)
- `table_id` — Optional UUID (`optional().isUUID()`)
- `special_requests` — Optional, trimmed

**Price Formula:** `venue.price_range * 75000 * guests_count` (UZS)
**Loyalty Points Formula:** `floor(total_price / 10000)`

**Request Body:**
```json
{
  "venue_id": "uuid",
  "booking_date": "2026-03-15",
  "start_time": "19:00",
  "end_time": "21:00",
  "guests_count": 4,
  "table_id": "uuid",
  "special_requests": "Window table preferred"
}
```

**Success Response (201):**
```json
{
  "booking": {
    "id": "uuid",
    "user_id": "uuid",
    "venue_id": "uuid",
    "table_id": "uuid",
    "booking_date": "2026-03-15",
    "start_time": "19:00",
    "end_time": "21:00",
    "guests_count": 4,
    "status": "confirmed",
    "total_price": 600000,
    "currency": "UZS",
    "loyalty_points_earned": 60,
    "special_requests": "Window table preferred",
    "is_group_booking": 0,
    "payment_status": "unpaid",
    "created_at": "2026-03-07T..."
  },
  "loyaltyPointsEarned": 60
}
```

**Error Responses:**
- `400` — Validation error or `{ error: "Table capacity is X guests" }`
- `404` — `{ error: "Venue not found" }`
- `409` — `{ error: "Table is already booked for this time" }`
- `500` — `{ error: "Failed to create booking" }`

---

#### GET /api/bookings

**Description:** Get current user's bookings with optional status filter and pagination.

**Access:** Required Auth

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `status` | string | — | Filter: `pending`, `confirmed`, `cancelled`, `completed`, `no_show` |
| `page` | integer | 1 | Page number |
| `limit` | integer | 10 | Results per page |

**Success Response (200):**
```json
{
  "bookings": [
    {
      "id": "uuid",
      "booking_date": "2026-03-15",
      "start_time": "19:00",
      "end_time": "21:00",
      "guests_count": 4,
      "status": "confirmed",
      "total_price": 600000,
      "payment_status": "unpaid",
      "venue_name": "Plov Center Yunusabad",
      "venue_type": "restaurant",
      "venue_address": "45 Amir Temur Street, Yunusabad",
      "venue_images": "[\"/images/plov-center-1.jpg\"]",
      "table_number": 5,
      "table_label": "Table 5"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 6
  }
}
```

---

#### GET /api/bookings/:id

**Description:** Get a specific booking's full details including group booking info.

**Access:** Required Auth (owner only via `user_id` filter)

**Success Response (200):**
```json
{
  "booking": {
    "id": "uuid",
    "venue_name": "Plov Center Yunusabad",
    "venue_type": "restaurant",
    "venue_address": "45 Amir Temur Street, Yunusabad",
    "venue_phone": "+998712345001",
    "table_number": 5,
    "table_label": "Table 5",
    "table_capacity": 4,
    "...all booking fields..."
  },
  "groupBooking": null
}
```

**Error Responses:**
- `404` — `{ error: "Booking not found" }`

---

#### PUT /api/bookings/:id

**Description:** Update booking details. Only pending or confirmed bookings can be updated.

**Access:** Required Auth (owner only)

**Request Body (all optional):**
```json
{
  "booking_date": "2026-03-16",
  "start_time": "20:00",
  "end_time": "22:00",
  "guests_count": 6,
  "special_requests": "Birthday decoration please"
}
```

**Success Response (200):**
```json
{
  "booking": { "...updated booking fields..." }
}
```

**Error Responses:**
- `400` — `{ error: "Cannot update a cancelled or completed booking" }`
- `404` — `{ error: "Booking not found" }`

---

#### POST /api/bookings/:id/cancel

**Description:** Cancel a booking and reverse any loyalty points earned.

**Access:** Required Auth (owner only)

**Success Response (200):**
```json
{
  "booking": { "...booking with status: cancelled..." },
  "message": "Booking cancelled successfully"
}
```

**Error Responses:**
- `400` — `{ error: "Booking is already cancelled" }`
- `404` — `{ error: "Booking not found" }`

**Side Effects:**
- Deducts `loyalty_points_earned` from user's balance (floor at 0)
- Creates a `redeemed` loyalty transaction with negative points

---

#### POST /api/bookings/:id/invite

**Description:** Invite registered users to a group booking by email.

**Access:** Required Auth (owner only)

**Request Body:**
```json
{
  "invited_emails": ["fatima@smartbooking.uz", "ruslan@smartbooking.uz"],
  "split_type": "equal"
}
```

**Success Response (200):**
```json
{
  "groupBooking": {
    "id": "uuid",
    "booking_id": "uuid",
    "inviter_user_id": "uuid",
    "invited_users": "[{\"id\":\"...\",\"email\":\"...\",\"name\":\"...\",\"status\":\"pending\"}]",
    "split_type": "equal"
  },
  "invitedUsers": [
    { "id": "uuid", "email": "fatima@smartbooking.uz", "full_name": "Fatima Rakhimova" }
  ]
}
```

**Side Effects:**
- Sets `bookings.is_group_booking = 1`
- Creates `group_invite` notification for each invited user

---

#### GET /api/bookings/:id/split

**Description:** Calculate per-person payment split for a group booking.

**Access:** Required Auth (inviter only)

**Success Response (200):**
```json
{
  "splitDetails": {
    "inviter": { "user_id": "uuid", "amount": 200000, "status": "pending" },
    "invited": [
      { "id": "uuid", "email": "...", "name": "...", "status": "pending", "amount": 200000, "payment_status": "pending" }
    ]
  },
  "perPerson": 200000,
  "currency": "UZS"
}
```

**Split Formula:** `ceil(total_price / (invited_count + 1))`

**Error Responses:**
- `404` — `{ error: "Group booking not found" }`

---

### Loyalty Endpoints

---

#### GET /api/loyalty/transactions

**Description:** Get the user's loyalty point transaction history.

**Access:** Required Auth (`authenticateToken`)

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `type` | string | — | Filter: `earned`, `redeemed`, `bonus`, `expired` |
| `limit` | integer | 20 | Results per page |
| `offset` | integer | 0 | Pagination offset |

**Success Response (200):**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "booking_id": "uuid",
      "points": 45,
      "transaction_type": "earned",
      "description": "Booking at Plov Center",
      "created_at": "2026-03-07T...",
      "booking_date": "2026-03-15",
      "start_time": "19:00",
      "venue_name": "Plov Center Yunusabad"
    }
  ],
  "total": 9,
  "currentBalance": 1500
}
```

---

#### GET /api/loyalty/summary

**Description:** Get loyalty overview including balance, tier, multiplier, and aggregate stats.

**Access:** Required Auth (`authenticateToken`)

**Success Response (200):**
```json
{
  "currentBalance": 1500,
  "tier": "premium",
  "totalEarned": 545,
  "totalRedeemed": 0,
  "totalBonus": 600,
  "earnMultiplier": 1.5,
  "pointValue": 1000
}
```

**Tier Multiplier Map:** `{ free: 1, basic: 1.25, premium: 1.5, vip: 2 }`

---

#### POST /api/loyalty/redeem

**Description:** Redeem loyalty points for a discount. 1 point = 1,000 UZS.

**Access:** Required Auth (`authenticateToken`)

**Request Body:**
```json
{
  "points": 100,
  "booking_id": "uuid"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "pointsRedeemed": 100,
  "newBalance": 1400,
  "discountApplied": 100000
}
```

**Error Responses:**
- `400` — `{ error: "Invalid points amount" }` or `{ error: "Insufficient loyalty points" }`

---

### Subscription Endpoints

---

#### GET /api/subscriptions/plans

**Description:** Get all available subscription plans with pricing and features.

**Access:** Optional Auth (`optionalAuth`)

**Success Response (200):**
```json
{
  "plans": [
    {
      "id": "basic",
      "name": "Basic",
      "price": 99000,
      "priceUSD": 8,
      "period": "month",
      "features": ["1.25x loyalty points", "Priority booking", "Early access to new venues", "Monthly special offers"]
    },
    {
      "id": "premium",
      "name": "Premium",
      "price": 199000,
      "priceUSD": 16,
      "period": "month",
      "features": ["1.5x loyalty points", "Priority booking", "Free cancellation", "Exclusive VIP tables access", "Personalized recommendations", "Dedicated support"],
      "popular": true
    },
    {
      "id": "vip",
      "name": "VIP",
      "price": 499000,
      "priceUSD": 40,
      "period": "month",
      "features": ["2x loyalty points", "Instant booking confirmation", "Free cancellation anytime", "All VIP tables access", "Personal concierge", "Exclusive events access", "Complimentary upgrades", "Partner discounts"]
    }
  ],
  "currentPlan": "premium"
}
```

---

#### GET /api/subscriptions/current

**Description:** Get the user's active subscription details.

**Access:** Required Auth (`authenticateToken`)

**Success Response (200) — Active subscription:**
```json
{
  "subscription": {
    "id": "uuid",
    "user_id": "uuid",
    "plan_type": "premium",
    "start_date": "2026-02-07T...",
    "end_date": "2026-03-07T...",
    "status": "active",
    "price": 199000,
    "currency": "UZS",
    "benefits": "[\"1.5x loyalty points\", ...]",
    "plan": { "id": "premium", "name": "Premium", "price": 199000, "...": "..." }
  },
  "tier": "premium"
}
```

**Success Response (200) — No subscription:**
```json
{
  "subscription": null,
  "tier": "free"
}
```

---

#### POST /api/subscriptions/subscribe

**Description:** Subscribe to a plan. Awards bonus loyalty points.

**Access:** Required Auth (`authenticateToken`)

**Bonus Points:** Basic = 100, Premium = 250, VIP = 500

**Request Body:**
```json
{
  "plan_type": "premium",
  "payment_method_id": "pm_optional"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "subscription": {
    "id": "uuid",
    "user_id": "uuid",
    "plan_type": "premium",
    "status": "active",
    "start_date": "2026-03-07T...",
    "end_date": "2026-04-07T...",
    "price": 199000,
    "benefits": "[\"1.5x loyalty points\", ...]"
  },
  "bonusPoints": 250,
  "message": "Successfully subscribed to Premium plan!"
}
```

**Error Responses:**
- `400` — `{ error: "Invalid plan type" }`

---

#### POST /api/subscriptions/cancel

**Description:** Cancel the active subscription. Resets user tier to `free`.

**Access:** Required Auth (`authenticateToken`)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Subscription cancelled. You will retain access until the end of your billing period."
}
```

**Error Responses:**
- `404` — `{ error: "No active subscription found" }`

---

### Payment Endpoints

---

#### POST /api/payments/create-intent

**Description:** Create a Stripe payment intent for an unpaid booking. Currently operates in demo mode.

**Access:** Required Auth (`authenticateToken`)

**Request Body:**
```json
{
  "booking_id": "uuid"
}
```

**Success Response (200):**
```json
{
  "clientSecret": "pi_demo_1709827200000_secret_demo",
  "paymentIntentId": "pi_demo_1709827200000",
  "amount": 600000,
  "currency": "UZS",
  "booking": {
    "id": "uuid",
    "venue": "Plov Center Yunusabad",
    "date": "2026-03-15",
    "time": "19:00 - 21:00",
    "guests": 4
  }
}
```

**Error Responses:**
- `400` — `{ error: "Booking ID is required" }` or `{ error: "Booking is already paid" }`
- `404` — `{ error: "Booking not found" }`

---

#### POST /api/payments/confirm

**Description:** Confirm a payment and update booking status to paid. Creates `payment_confirmed` notification.

**Access:** Required Auth (`authenticateToken`)

**Request Body:**
```json
{
  "booking_id": "uuid",
  "payment_intent_id": "pi_demo_1709827200000"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Payment confirmed successfully"
}
```

**Error Responses:**
- `404` — `{ error: "Booking not found" }`

---

#### POST /api/payments/refund

**Description:** Process a refund for a paid booking.

**Access:** Required Auth (`authenticateToken`)

**Request Body:**
```json
{
  "booking_id": "uuid"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Refund processed successfully",
  "refundAmount": 600000
}
```

**Error Responses:**
- `400` — `{ error: "Booking is not paid" }`
- `404` — `{ error: "Booking not found" }`

---

#### POST /api/payments/webhook

**Description:** Stripe webhook handler for asynchronous payment events. Currently a stub implementation.

**Access:** Public (raw JSON body)

**Handled Event Types:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

**Response (200):**
```json
{
  "received": true
}
```

---

### Notification Endpoints

---

#### GET /api/notifications

**Description:** Get the user's notifications with optional unread filter.

**Access:** Required Auth (`authenticateToken`)

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `unread_only` | string | — | Set to `"true"` to filter unread only |
| `limit` | integer | 20 | Results per page |
| `offset` | integer | 0 | Pagination offset |

**Success Response (200):**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "type": "booking_confirmed",
      "title": "Booking Confirmed",
      "message": "Your booking at Plov Center on 2026-03-15 at 19:00 has been confirmed.",
      "data": "{\"booking_id\":\"uuid\",\"venue_id\":\"uuid\"}",
      "is_read": 0,
      "created_at": "2026-03-07T..."
    }
  ],
  "unreadCount": 3
}
```

---

#### POST /api/notifications/:id/read

**Description:** Mark a single notification as read.

**Access:** Required Auth (`authenticateToken`)

**URL Params:** `id` — Notification UUID

**Success Response (200):**
```json
{
  "success": true,
  "notification": { "...notification with is_read: 1..." }
}
```

**Error Responses:**
- `404` — `{ error: "Notification not found" }`

---

#### POST /api/notifications/mark-all-read

**Description:** Mark all of the user's unread notifications as read.

**Access:** Required Auth (`authenticateToken`)

**Success Response (200):**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

#### DELETE /api/notifications/:id

**Description:** Permanently delete a notification.

**Access:** Required Auth (`authenticateToken`)

**URL Params:** `id` — Notification UUID

**Success Response (200):**
```json
{
  "success": true
}
```

**Error Responses:**
- `404` — `{ error: "Notification not found" }`

---

### AI Assistant Endpoints

---

#### POST /api/ai/recommendations

**Description:** Get AI-powered venue recommendations. Uses Claude `claude-sonnet-4-20250514`. Falls back to top-rated venues when API key is not configured.

**Access:** Optional Auth (`optionalAuth`)

**Request Body:**
```json
{
  "preferences": "cozy place with good coffee",
  "date": "2026-03-15",
  "time": "14:00",
  "guests": 2,
  "cuisine": "Uzbek Traditional",
  "district": "Yunusabad",
  "price_range": 2
}
```

**Success Response (200) — AI Powered:**
```json
{
  "recommendations": [
    {
      "venue": { "id": "uuid", "name": "Plov Center Yunusabad", "type": "restaurant", "..." : "..." },
      "reason": "Excellent traditional Uzbek cuisine in your preferred Yunusabad district with top ratings."
    }
  ],
  "aiResponse": "Full AI text response...",
  "aiPowered": true
}
```

**Success Response (200) — Fallback (no API key):**
```json
{
  "recommendations": [
    {
      "venue": { "..." : "..." },
      "reason": "Highly rated restaurant in Yunusabad with 4.8 stars from 342 reviews."
    }
  ],
  "aiPowered": false
}
```

---

#### POST /api/ai/chat

**Description:** Multi-turn conversational chat with the AI assistant. Persists history for authenticated users.

**Access:** Optional Auth (`optionalAuth`)

**Request Body:**
```json
{
  "message": "I'm looking for a good restaurant for dinner tonight",
  "conversation_id": "optional-id"
}
```

**Success Response (200):**
```json
{
  "reply": "I'd recommend checking out Afsona Restaurant in Yakkasaray...",
  "aiPowered": true
}
```

**Fallback Response (200 — no API key):**
```json
{
  "reply": "I'm currently unavailable. Please try again later or browse our venues directly!",
  "aiPowered": false
}
```

---

#### POST /api/ai/select-table

**Description:** AI-assisted table selection based on venue layout, guest count, and preferences.

**Access:** Required Auth (`authenticateToken`)

**Request Body:**
```json
{
  "venue_id": "uuid",
  "preferences": "vip table with window view",
  "guests_count": 4,
  "date": "2026-03-15"
}
```

**Success Response (200):**
```json
{
  "suggestedTable": {
    "id": "uuid",
    "table_number": 11,
    "label": "Table 11",
    "capacity": 6,
    "shape": "rectangular",
    "is_vip": 1,
    "price_multiplier": 1.5,
    "position_x": 1.5,
    "position_z": 1.5,
    "is_available_now": true
  },
  "availableTables": [ "...all available tables..." ],
  "reason": "VIP table with ample seating for your group of 4.",
  "aiPowered": true
}
```

---

### System Endpoints

---

#### GET /api/health

**Description:** Server health check.

**Access:** Public

**Success Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2026-03-07T12:00:00.000Z"
}
```

---

## 7. Middleware Documentation

### 7.1 `authenticateToken`

**File:** `backend/src/middleware/auth.js`

**Purpose:** Verifies JWT access tokens and attaches the authenticated user object to `req.user`.

**How It Works:**
1. Extracts token from `Authorization: Bearer <token>` header
2. Verifies token signature against `JWT_SECRET`
3. Queries the database for the user by `decoded.userId` where `is_active = 1`
4. Attaches user object (id, email, full_name, phone, avatar_url, loyalty_points, subscription_tier, preferred_language) to `req.user`

**Applied To:** All `/api/bookings/*`, `/api/loyalty/*`, `/api/payments/create-intent`, `/api/payments/confirm`, `/api/payments/refund`, `/api/notifications/*`, `/api/subscriptions/current`, `/api/subscriptions/subscribe`, `/api/subscriptions/cancel`, `/api/ai/select-table`, `/api/auth/me`

**Error Responses:**
- `401` — No token: `{ error: "Authentication required" }`
- `401` — Expired: `{ error: "Token expired", code: "TOKEN_EXPIRED" }`
- `401` — User not found: `{ error: "User not found or inactive" }`
- `403` — Invalid signature: `{ error: "Invalid token" }`

---

### 7.2 `optionalAuth`

**File:** `backend/src/middleware/auth.js`

**Purpose:** Attempts JWT verification but does not block the request if no token is present. Enriches `req.user` if a valid token exists.

**How It Works:**
1. Checks for `Authorization` header
2. If no token, calls `next()` immediately (no error)
3. If token present, verifies and attaches user to `req.user`
4. On any error, silently continues without `req.user`

**Applied To:** `GET /api/venues`, `GET /api/venues/:id`, `GET /api/subscriptions/plans`, `POST /api/ai/recommendations`, `POST /api/ai/chat`

---

### 7.3 `requireSubscription(minTier)`

**File:** `backend/src/middleware/auth.js`

**Purpose:** Factory function that creates middleware enforcing a minimum subscription tier.

**Tier Hierarchy:** `free (0) < basic (1) < premium (2) < vip (3)`

**Applied To:** Currently defined but not applied to any routes in the codebase. Available for future use.

**Error Response:**
- `403` — `{ error: "Requires {minTier} subscription or higher" }`

---

### 7.4 `validate`

**File:** `backend/src/middleware/validate.js`

**Purpose:** Checks for express-validator errors and returns structured validation failures.

**How It Works:**
1. Calls `validationResult(req)` to collect validation errors
2. If errors exist, returns 400 with error details
3. If no errors, calls `next()`

**Applied To:** `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/bookings`

**Error Response (400):**
```json
{
  "error": "Validation failed",
  "details": [
    { "field": "email", "message": "Valid email required" },
    { "field": "password", "message": "Password must be at least 6 characters" }
  ]
}
```

---

### 7.5 Global Middleware (Applied in `index.js`)

| Middleware | Configuration | Purpose |
|---|---|---|
| `helmet()` | Default settings | Sets security HTTP headers |
| `cors()` | `origin: FRONTEND_URL`, `credentials: true` | Cross-origin request handling |
| `rateLimit()` | 100 requests / 15 minutes on `/api/` | API abuse prevention |
| `express.json()` | `limit: '10mb'` | JSON body parsing |
| `express.urlencoded()` | `extended: true` | URL-encoded body parsing |
| `morgan('combined')` | Streams to Winston logger | HTTP request logging |

---

## 8. Services & Utilities

### 8.1 WebSocket Service

**File:** `backend/src/services/websocket.js`

**Purpose:** Real-time notification delivery to connected clients via persistent WebSocket connections.

**Endpoint:** `ws://localhost:5000/ws`

#### Functions

| Function | Parameters | Returns | Description |
|---|---|---|---|
| `initWebSocket(server)` | HTTP server instance | WebSocket.Server | Initializes WSS on `/ws` path |
| `sendToUser(userId, notification)` | userId: string, notification: object | boolean | Sends to all connections for a specific user |
| `broadcast(notification)` | notification: object | void | Sends to all connected users |
| `getConnectedCount()` | — | number | Returns count of connected users |

#### Connection Protocol

```
1. Client connects to ws://localhost:5000/ws
2. Server sends: { type: "connected", message: "WebSocket connected. Please authenticate." }
3. Client sends: { type: "auth", token: "jwt_access_token" }
4. Server verifies JWT and sends: { type: "auth_success", message: "Connected" }
5. Server pushes: { type: "notification", data: { ...notification } }
6. Client can send: { type: "ping" } → Server responds: { type: "pong" }
```

#### Message Types

| Type | Direction | Payload |
|---|---|---|
| `connected` | Server → Client | `{ type, message }` |
| `auth` | Client → Server | `{ type, token }` |
| `auth_success` | Server → Client | `{ type, message }` |
| `error` | Server → Client | `{ type, message }` |
| `ping` | Client → Server | `{ type }` |
| `pong` | Server → Client | `{ type }` |
| `notification` | Server → Client | `{ type, data: {...} }` |
| `broadcast` | Server → Client | `{ type, data: {...} }` |

---

### 8.2 Database Wrapper

**File:** `backend/src/config/database.js`

**Purpose:** Provides a PostgreSQL-compatible async query interface over synchronous better-sqlite3.

#### Functions

| Function | Parameters | Returns | Description |
|---|---|---|---|
| `query(text, params)` | SQL string, param array | `{ rows: [], rowCount: number }` | Execute any SQL query |
| `getClient()` | — | `{ query, release }` | Transaction-compatible client |
| `getDb()` | — | Database instance | Direct access for migrations |

#### Key Conversions
- `$1, $2, $3` → `?, ?, ?` (PostgreSQL to SQLite parameter style)
- `true/false` → `1/0` (boolean to integer)
- `::text, ::date, ::integer` → stripped (PostgreSQL type casts removed)
- `RETURNING *` → emulated via `SELECT * FROM table WHERE rowid = last_insert_rowid()`

---

### 8.3 Logger

**File:** `backend/src/utils/logger.js`

**Purpose:** Structured application logging using Winston.

**Configuration:**
- **Log Level:** Configurable via `LOG_LEVEL` env var (default: `info`)
- **Format:** JSON with timestamps (`YYYY-MM-DD HH:mm:ss`), stack traces for errors
- **Service Tag:** `smart-booking-api`

**Transports:**

| Transport | File | Level | Environment |
|---|---|---|---|
| File | `logs/error.log` | error only | All |
| File | `logs/combined.log` | all levels | All |
| Console | stdout | all levels | Non-production only |

---

### 8.4 Notification Helper

**File:** `backend/src/controllers/notificationController.js` (exported as `createNotification`)

**Purpose:** Utility function used by other controllers to create notification records.

**Signature:** `createNotification(userId, type, title, message, data = {})`

**Returns:** `true` on success, `false` on failure (errors caught silently)

**Used By:** `bookingController.createBooking`, `bookingController.inviteFriends`, `paymentController.confirmPayment`

---

## 9. Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `5000` | Backend server port |
| `NODE_ENV` | No | `development` | Environment mode |
| `JWT_SECRET` | **Yes** | — | Secret key for signing access tokens |
| `JWT_REFRESH_SECRET` | **Yes** | — | Secret key for signing refresh tokens |
| `JWT_EXPIRES_IN` | No | `1h` | Access token expiry duration |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Refresh token expiry duration |
| `FRONTEND_URL` | No | `http://localhost:3000` | Allowed CORS origin |
| `DB_PATH` | No | `./data/smart_booking.db` | SQLite database file path |
| `ANTHROPIC_API_KEY` | No | — | Anthropic Claude API key (AI features disabled if absent) |
| `STRIPE_SECRET_KEY` | No | — | Stripe secret key (demo mode if absent) |
| `STRIPE_PUBLIC_KEY` | No | — | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | No | — | Stripe webhook signing secret |
| `LOG_LEVEL` | No | `info` | Winston log level (debug, info, warn, error) |
| `RATE_LIMIT_MAX` | No | `100` | Max requests per 15-minute window |
| `VITE_STRIPE_PUBLIC_KEY` | No | `pk_test_demo` | Frontend Stripe public key |

---

## 10. Installation & Setup Guide

```bash
# 1. Clone the repository
git clone <repo-url>
cd smart-booking-tashkent

# 2. Install backend dependencies
cd backend
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env and set JWT_SECRET and JWT_REFRESH_SECRET

# 4. Run database migrations (creates tables)
npm run migrate

# 5. Seed demo data (5 users, 14 venues, tables, bookings, reviews)
npm run seed

# 6. Start the backend server
npm run dev
# Server runs on http://localhost:5000
# WebSocket available at ws://localhost:5000/ws

# 7. Install frontend dependencies (in a new terminal)
cd ../frontend
npm install

# 8. Start the frontend dev server
npm run dev
# Frontend runs on http://localhost:3000
# API requests are proxied to http://localhost:5000

# Demo credentials:
#   Email:    demo@smartbooking.uz
#   Password: demo123456
```

### NPM Scripts (Backend)

| Script | Command | Description |
|---|---|---|
| `npm start` | `node src/index.js` | Start production server |
| `npm run dev` | `nodemon src/index.js` | Start development server with auto-reload |
| `npm run migrate` | `node migrations/run.js` | Run database migrations |
| `npm run seed` | `node migrations/seed.js` | Seed demo data |
| `npm test` | `jest --coverage` | Run tests with coverage |

### NPM Scripts (Frontend)

| Script | Command | Description |
|---|---|---|
| `npm run dev` | `vite` | Start Vite dev server on port 3000 |
| `npm run build` | `vite build` | Production build |
| `npm run preview` | `vite preview` | Preview production build |

---

## 11. Error Handling

### 11.1 Global Error Handler

**File:** `backend/src/index.js` (lines 63-71)

The application has two catch-all handlers:

1. **404 Handler** — Any unmatched route returns:
```json
{ "error": "Route not found" }
```

2. **500 Handler** — Unhandled exceptions are logged via Winston and return:
```json
{ "error": "Internal server error" }
```

### 11.2 Standard Error Response Format

All errors follow a consistent structure:

```json
{
  "error": "Human-readable error message"
}
```

Validation errors include additional detail:

```json
{
  "error": "Validation failed",
  "details": [
    { "field": "email", "message": "Valid email required" },
    { "field": "password", "message": "Password must be at least 6 characters" }
  ]
}
```

### 11.3 HTTP Status Code Reference

| Code | Meaning | Usage |
|---|---|---|
| `200` | OK | Successful GET, PUT, POST, DELETE |
| `201` | Created | Successful resource creation (register, create booking) |
| `400` | Bad Request | Validation failure, invalid input, business rule violation |
| `401` | Unauthorized | Missing token, expired token, invalid credentials |
| `403` | Forbidden | Invalid token signature, insufficient subscription tier |
| `404` | Not Found | Resource does not exist or user does not own it |
| `409` | Conflict | Duplicate email, table already booked for time slot |
| `500` | Server Error | Unhandled exception |

### 11.4 Rate Limit Error

When the rate limit (100 requests / 15 minutes) is exceeded:

```json
{ "error": "Too many requests, please try again later" }
```

---

## 12. Security Measures

### 12.1 Password Security

- Hashing algorithm: **bcryptjs** with cost factor **12**
- `password_hash` is never included in API responses (explicitly excluded via destructuring in `authController.login`)

### 12.2 Token Security

- Access tokens expire after **1 hour** (configurable)
- Refresh tokens expire after **7 days** (configurable)
- Separate signing secrets (`JWT_SECRET` vs `JWT_REFRESH_SECRET`)
- Token payload contains only `userId` — no sensitive data

### 12.3 HTTP Security Headers

**Helmet** applies the following headers automatically:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 0` (CSP preferred)
- `Strict-Transport-Security` (HSTS)
- Content Security Policy defaults

### 12.4 CORS

- Restricted to `FRONTEND_URL` origin (default: `http://localhost:3000`)
- Credentials support enabled for cookie/token-based auth

### 12.5 Rate Limiting

- **100 requests per 15-minute window** per IP address
- Applied to all `/api/` routes
- Returns `429 Too Many Requests` with error message

### 12.6 Input Validation

- **express-validator** used on all mutation endpoints with field-level rules
- Type checking: `isEmail()`, `isUUID()`, `isDate()`, `isInt()`, `matches(regex)`
- Sanitization: `normalizeEmail()`, `trim()`
- Body size limit: **10 MB** (`express.json({ limit: '10mb' })`)

### 12.7 Database Security

- Foreign key constraints enforced (`PRAGMA foreign_keys = ON`)
- Parameterized queries prevent SQL injection (all values passed as `$1, $2` parameters)
- Resource ownership checked via `WHERE user_id = $N` on all user-specific queries

### 12.8 WebSocket Security

- WebSocket connections require JWT authentication via message: `{ type: "auth", token: "..." }`
- Unauthenticated connections cannot receive user-specific notifications

---

## 13. Known Limitations & Future Improvements

### 13.1 Known Bugs

| Issue | Location | Description |
|---|---|---|
| Missing `cancelled_at` column | `subscriptionController.js:153` | `UPDATE subscriptions SET cancelled_at = datetime('now')` references a column that does not exist in the schema. Will cause runtime SQL error on subscription cancellation. |
| Missing `loyalty_points_redeemed` column | `loyaltyController.js:80-84` | `UPDATE bookings SET loyalty_points_redeemed = $2` references a column not in the `bookings` table. Will cause runtime error when redeeming points against a booking. |

### 13.2 Technical Limitations

| Limitation | Impact | Mitigation |
|---|---|---|
| **SQLite single-writer** | Only one write operation at a time; WAL mode helps reads | Migrate to PostgreSQL for production (query interface is already pg-compatible) |
| **Demo payment processing** | Payment intents use mock `pi_demo_` IDs, not real Stripe | Configure `STRIPE_SECRET_KEY` for production Stripe API calls |
| **No file upload** | Images stored as URL strings only; no upload endpoint | Add multer or S3 integration for image uploads |
| **No email/SMS** | Notifications limited to in-app and WebSocket | Integrate Nodemailer or SendGrid for email delivery |
| **Webhook stub** | Stripe webhook handler has no processing logic | Implement actual payment event handling in `handleWebhook` |
| **No admin API** | No dedicated admin endpoints for venue/user management | Build admin routes with role-based access control |
| **No review creation API** | Reviews exist only as seed data; no POST endpoint | Add `POST /api/reviews` with booking verification |

### 13.3 Suggested Improvements

1. **PostgreSQL migration** — The database wrapper already converts `$1, $2` syntax and emulates `RETURNING *`. Switching to pg requires only changing the driver initialization in `database.js`.

2. **Venue admin panel** — Add `POST /api/venues`, `PUT /api/venues/:id`, and `DELETE /api/venues/:id` with admin role authentication.

3. **Local payment providers** — Integrate Payme and Click (Uzbekistan's dominant mobile payment platforms) alongside Stripe.

4. **Automated testing** — Jest and Supertest are installed but no test files exist. Add integration tests for all API endpoints.

5. **API versioning** — Prefix all routes with `/api/v1/` to enable future backward-compatible API evolution.

6. **Request compression** — Add `compression` middleware to reduce response payload sizes.

7. **Database connection pooling** — For PostgreSQL migration, use `pg-pool` for connection management under load.

---

*This documentation was generated by reading every source file in the Smart Booking Tashkent project: all controllers, routes, middleware, services, utilities, configuration files, migration scripts, seed data, and package manifests. Every endpoint, response format, validation rule, and error code is derived directly from the codebase.*
