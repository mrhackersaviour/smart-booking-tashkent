# Product Requirements Document (PRD)

## Smart Booking Tashkent

**Version:** 1.0
**Date:** March 7, 2026
**Status:** In Development
**Document Owner:** Smart Booking Development Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [Stakeholders & User Roles](#3-stakeholders--user-roles)
4. [Functional Requirements](#4-functional-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [System Features (Feature Breakdown)](#6-system-features-feature-breakdown)
7. [Database & Data Requirements](#7-database--data-requirements)
8. [API & Integration Requirements](#8-api--integration-requirements)
9. [User Interface Requirements](#9-user-interface-requirements)
10. [Security Requirements](#10-security-requirements)
11. [Constraints & Limitations](#11-constraints--limitations)
12. [Glossary](#12-glossary)

---

## 1. Executive Summary

### 1.1 What the System Does

Smart Booking Tashkent is a full-stack web application that enables users to discover, browse, and book venues across Tashkent, Uzbekistan. The platform supports six venue categories — restaurants, cafes, stadiums, fitness centers, barbershops, and car washes — and provides an end-to-end experience from venue discovery through table reservation, payment processing, and post-booking management.

### 1.2 Core Problem

Tashkent's growing hospitality and service industry lacks a centralized, modern digital booking platform. Customers currently rely on phone calls, walk-ins, or fragmented social media channels to reserve tables and services. This leads to double-bookings, wasted time, and missed business for venue operators. Smart Booking Tashkent addresses this gap by offering a single, unified platform with real-time availability, AI-powered recommendations, 3D venue visualization, and an integrated loyalty rewards system.

### 1.3 Target Users and Key Stakeholders

| Stakeholder | Description |
|---|---|
| **End Users (Customers)** | Residents and visitors in Tashkent seeking to book venues for dining, fitness, grooming, and entertainment |
| **Venue Operators** | Businesses that register their venues, manage tables, and receive bookings through the platform |
| **Platform Administrators** | Internal team responsible for managing the platform, venue onboarding, and system operations |
| **Development Team** | Engineers responsible for building and maintaining the system |

---

## 2. Product Overview

### 2.1 Product Vision

To become the leading venue booking platform in Tashkent by providing a seamless, intelligent, and rewarding experience that connects customers with the best venues in the city.

### 2.2 Product Goals

1. Provide a fast, intuitive booking experience with real-time table availability
2. Increase customer engagement and retention through a tiered loyalty points system
3. Leverage AI to deliver personalized venue and table recommendations
4. Enable immersive venue exploration via interactive 3D venue visualization
5. Support group bookings with integrated payment splitting
6. Deliver real-time notifications to keep users informed throughout the booking lifecycle

### 2.3 Scope

#### In Scope

- User registration, authentication, and profile management
- Venue browsing with advanced search, filtering, and sorting
- Real-time table availability checking and booking creation
- 3D interactive venue and table visualization
- AI-powered venue recommendations and conversational assistant (powered by Anthropic Claude)
- Tiered loyalty points system with earning, redemption, and tier multipliers
- Subscription plans (Basic, Premium, VIP) with tiered benefits
- Payment processing via Stripe (payment intents, confirmation, refunds)
- Group bookings with friend invitations and payment splitting
- Real-time WebSocket notifications
- Booking management (view, update, cancel)
- Review display for venues

#### Out of Scope

- Venue operator self-service admin dashboard (venues are currently seeded or managed directly)
- Review creation UI (backend endpoint exists; frontend form is not implemented)
- Native mobile applications (iOS/Android)
- Multi-city support (currently Tashkent only)
- Email or SMS notification delivery (only in-app and WebSocket notifications exist)
- Advanced analytics or reporting dashboards
- Multi-language UI toggle (backend supports `preferred_language` field but frontend is English-only)

### 2.4 Assumptions

1. Users have access to a modern web browser with JavaScript enabled
2. Venues and their table configurations are pre-loaded via database seeding or direct insertion
3. The Stripe integration operates in demo/test mode; production keys are required for live payment processing
4. The Anthropic Claude API key is optional — AI features gracefully degrade to rule-based fallbacks when unavailable
5. All prices are denominated in Uzbekistani Som (UZS) with approximate USD equivalents shown for reference
6. The system operates in a single time zone (Tashkent, UTC+5)

### 2.5 Dependencies

| Dependency | Purpose | Version |
|---|---|---|
| Express.js | Backend API framework | 4.18.2 |
| better-sqlite3 | Embedded SQLite database driver | 11.10.0 |
| React | Frontend UI library | 18.2.0 |
| Vite | Frontend build tool and dev server | 5.0.8 |
| Tailwind CSS | Utility-first CSS framework | 3.4.0 |
| Stripe SDK | Payment processing | 14.14.0 |
| Anthropic SDK | AI recommendations and chat | 0.24.0 |
| Three.js / react-three-fiber | 3D venue visualization | 0.182.0 |
| jsonwebtoken | JWT authentication | 9.0.2 |
| bcryptjs | Password hashing | 2.4.3 |
| Winston | Application logging | 3.11.0 |
| ws | WebSocket server | 8.16.0 |

---

## 3. Stakeholders & User Roles

### 3.1 Guest (Unauthenticated User)

| Attribute | Details |
|---|---|
| **Description** | A visitor who has not created an account or is not logged in |
| **Access Level** | Read-only access to public resources |
| **Capabilities** | Browse venues, view venue details and reviews, view subscription plans, search and filter venues, view district listings, receive AI recommendations (without personalization), chat with AI assistant (without history persistence) |
| **Restrictions** | Cannot create bookings, access loyalty features, make payments, or receive notifications |

### 3.2 Registered User (Authenticated User)

| Attribute | Details |
|---|---|
| **Description** | A user who has created an account and is logged in with a valid JWT |
| **Access Level** | Full access to all customer-facing features |
| **Capabilities** | All Guest capabilities plus: create/update/cancel bookings, select tables (manual or AI-assisted), view and manage personal bookings, earn and redeem loyalty points, subscribe to plans, process payments, invite friends to group bookings, calculate payment splits, receive real-time notifications, access personalized AI recommendations with booking history context, view 3D venue models |
| **Subscription Tiers** | `free` (default), `basic`, `premium`, `vip` — each tier unlocks progressively higher loyalty point multipliers and additional benefits |

### 3.3 System (Automated Processes)

| Attribute | Details |
|---|---|
| **Description** | Background and automated system processes |
| **Capabilities** | Award loyalty points upon booking creation, reverse loyalty points upon booking cancellation, generate and deliver real-time WebSocket notifications, validate JWT tokens for protected endpoints, process Stripe webhook events, enforce rate limiting and security headers |

---

## 4. Functional Requirements

### 4.1 Authentication Module

| ID | Requirement |
|---|---|
| FR-AUTH-01 | The system shall allow a guest to register a new account by providing an email, password (minimum 6 characters), full name, and an optional phone number |
| FR-AUTH-02 | The system shall award 500 loyalty bonus points to every newly registered user as a welcome incentive |
| FR-AUTH-03 | The system shall allow a registered user to log in using their email and password |
| FR-AUTH-04 | The system shall issue a JWT access token (1-hour expiry) and a refresh token (7-day expiry) upon successful login or registration |
| FR-AUTH-05 | The system shall allow a user to refresh an expired access token using a valid refresh token |
| FR-AUTH-06 | The system shall allow an authenticated user to retrieve their profile information |
| FR-AUTH-07 | The system shall reject authentication attempts for deactivated accounts (`is_active = 0`) |

### 4.2 Venue Browsing Module

| ID | Requirement |
|---|---|
| FR-VEN-01 | The system shall allow any user to browse a paginated list of active venues (default 12 per page) |
| FR-VEN-02 | The system shall allow filtering venues by type (`cafe`, `restaurant`, `stadium`, `fitness`, `barbershop`, `carwash`) |
| FR-VEN-03 | The system shall allow filtering venues by district within Tashkent |
| FR-VEN-04 | The system shall allow filtering venues by price range (1 to 4) |
| FR-VEN-05 | The system shall allow filtering venues by cuisine type (substring match, case-insensitive) |
| FR-VEN-06 | The system shall allow free-text search across venue names and descriptions |
| FR-VEN-07 | The system shall support sorting venues by rating (default), price low-to-high, price high-to-low, name, and newest |
| FR-VEN-08 | The system shall allow any user to view detailed information for a single venue, including its description, tables, and the five most recent reviews |
| FR-VEN-09 | The system shall allow any user to check table availability for a specific venue and date, returning each table's booked time slots |
| FR-VEN-10 | The system shall allow any user to retrieve 3D model data for a venue, including table positions (`position_x`, `position_y`, `position_z`), shapes, capacities, and scene configuration |
| FR-VEN-11 | The system shall allow any user to retrieve a list of all districts with their respective venue counts |

### 4.3 Booking Module

| ID | Requirement |
|---|---|
| FR-BOOK-01 | The system shall allow an authenticated user to create a booking by specifying a venue, date, start time, end time, guest count (1–50), and optional table and special requests |
| FR-BOOK-02 | The system shall validate that the selected table is not already booked for overlapping time slots on the same date |
| FR-BOOK-03 | The system shall validate that the guest count does not exceed the selected table's capacity |
| FR-BOOK-04 | The system shall calculate the booking price as: `venue.price_range x 75,000 UZS x guests_count` |
| FR-BOOK-05 | The system shall calculate loyalty points earned as: `floor(total_price / 10,000)` and apply the user's subscription tier multiplier |
| FR-BOOK-06 | The system shall award loyalty points to the user upon booking creation and record a corresponding `loyalty_transactions` entry |
| FR-BOOK-07 | The system shall create a notification of type `booking_confirmed` upon successful booking creation |
| FR-BOOK-08 | The system shall allow an authenticated user to view a paginated list of their own bookings, optionally filtered by status |
| FR-BOOK-09 | The system shall allow an authenticated user to view details of a specific booking they own, including group booking information if applicable |
| FR-BOOK-10 | The system shall allow an authenticated user to update the date, time, guest count, or special requests of a pending or confirmed booking |
| FR-BOOK-11 | The system shall allow an authenticated user to cancel a pending or confirmed booking |
| FR-BOOK-12 | The system shall reverse (deduct) loyalty points previously earned when a booking is cancelled, ensuring the user's balance does not go below zero |
| FR-BOOK-13 | The system shall allow an authenticated user to invite other registered users (by email) to a group booking |
| FR-BOOK-14 | The system shall support three split types for group bookings: `equal`, `custom`, and `inviter_pays` |
| FR-BOOK-15 | The system shall calculate and return the per-person payment amount for group bookings based on the split type |
| FR-BOOK-16 | The system shall create notifications of type `group_invite` for each invited user in a group booking |

### 4.4 Loyalty Module

| ID | Requirement |
|---|---|
| FR-LOY-01 | The system shall allow an authenticated user to view their loyalty transaction history, optionally filtered by transaction type (`earned`, `redeemed`, `bonus`, `expired`) |
| FR-LOY-02 | The system shall allow an authenticated user to view a loyalty summary including current balance, total earned, total redeemed, total bonus, tier multiplier, and point value |
| FR-LOY-03 | The system shall allow an authenticated user to redeem loyalty points, where 1 point equals 1,000 UZS discount |
| FR-LOY-04 | The system shall validate that the user has sufficient points before allowing redemption |
| FR-LOY-05 | The system shall apply the following tier-based earning multipliers: `free` = 1x, `basic` = 1.25x, `premium` = 1.5x, `vip` = 2x |

### 4.5 Subscription Module

| ID | Requirement |
|---|---|
| FR-SUB-01 | The system shall allow any user to view available subscription plans with pricing and feature details |
| FR-SUB-02 | The system shall offer three subscription plans: Basic (99,000 UZS/month), Premium (199,000 UZS/month), and VIP (499,000 UZS/month) |
| FR-SUB-03 | The system shall allow an authenticated user to subscribe to a plan, setting the subscription duration to one calendar month |
| FR-SUB-04 | The system shall award bonus loyalty points upon subscription: Basic = 100, Premium = 250, VIP = 500 |
| FR-SUB-05 | The system shall update the user's `subscription_tier` upon successful subscription |
| FR-SUB-06 | The system shall allow an authenticated user to view their current active subscription |
| FR-SUB-07 | The system shall allow an authenticated user to cancel their active subscription, resetting their tier to `free` |

### 4.6 Payment Module

| ID | Requirement |
|---|---|
| FR-PAY-01 | The system shall allow an authenticated user to create a Stripe payment intent for an unpaid booking |
| FR-PAY-02 | The system shall allow an authenticated user to confirm a payment, updating the booking's `payment_status` to `paid` |
| FR-PAY-03 | The system shall create a notification of type `payment_confirmed` upon successful payment confirmation |
| FR-PAY-04 | The system shall allow an authenticated user to request a refund for a paid booking, updating the `payment_status` to `refunded` |
| FR-PAY-05 | The system shall expose a webhook endpoint for receiving Stripe event notifications |

### 4.7 Notification Module

| ID | Requirement |
|---|---|
| FR-NOT-01 | The system shall allow an authenticated user to retrieve a paginated list of their notifications, optionally filtered to unread only |
| FR-NOT-02 | The system shall return the total unread notification count alongside the notification list |
| FR-NOT-03 | The system shall allow an authenticated user to mark a single notification as read |
| FR-NOT-04 | The system shall allow an authenticated user to mark all their notifications as read |
| FR-NOT-05 | The system shall allow an authenticated user to delete a notification |
| FR-NOT-06 | The system shall deliver real-time notifications to connected users via WebSocket |

### 4.8 AI Assistant Module

| ID | Requirement |
|---|---|
| FR-AI-01 | The system shall allow any user to receive AI-powered venue recommendations based on preferences, date, time, guest count, cuisine, district, and price range |
| FR-AI-02 | The system shall personalize AI recommendations for authenticated users by incorporating their past booking history |
| FR-AI-03 | The system shall allow any user to engage in a multi-turn conversational chat with the AI assistant |
| FR-AI-04 | The system shall persist AI chat history for authenticated users, enabling contextual follow-up conversations |
| FR-AI-05 | The system shall allow an authenticated user to request AI-assisted table selection based on venue layout, guest count, date, and personal preferences |
| FR-AI-06 | The system shall gracefully degrade AI features to rule-based fallbacks (top-rated venues, capacity-based table selection) when the Anthropic API key is not configured |

---

## 5. Non-Functional Requirements

### 5.1 Performance

| ID | Requirement |
|---|---|
| NFR-PERF-01 | The API shall respond to standard queries within 200ms under normal load, leveraging SQLite's in-process architecture |
| NFR-PERF-02 | The database shall operate in WAL (Write-Ahead Logging) mode to support concurrent read operations |
| NFR-PERF-03 | Database queries shall use indexed columns (`idx_venues_type`, `idx_venues_district`, `idx_venues_rating`, `idx_bookings_user`, `idx_bookings_venue`, `idx_bookings_date`, `idx_bookings_status`, `idx_reviews_venue`, `idx_reviews_user`, `idx_loyalty_user`, `idx_notifications_user`) for optimal performance |
| NFR-PERF-04 | The frontend shall use Vite for fast hot module replacement during development and optimized production builds |
| NFR-PERF-05 | Pagination shall be enforced on all list endpoints to limit response sizes |

### 5.2 Security

| ID | Requirement |
|---|---|
| NFR-SEC-01 | All passwords shall be hashed using bcryptjs with a cost factor of 12 before storage |
| NFR-SEC-02 | The API shall enforce rate limiting of 100 requests per 15-minute window per IP address on all `/api/` endpoints |
| NFR-SEC-03 | The API shall apply security headers via the Helmet middleware |
| NFR-SEC-04 | CORS shall be restricted to the configured frontend origin (`FRONTEND_URL`) |
| NFR-SEC-05 | JWT tokens shall never include the user's password hash in the payload |
| NFR-SEC-06 | The request body size shall be limited to 10 MB to prevent payload abuse |
| NFR-SEC-07 | Foreign key constraints shall be enforced at the database level (`PRAGMA foreign_keys = ON`) |

### 5.3 Validation & Error Handling

| ID | Requirement |
|---|---|
| NFR-VAL-01 | Input validation shall be performed using express-validator on all mutating endpoints |
| NFR-VAL-02 | Validation errors shall return HTTP 400 with a structured `{ error, details[] }` response |
| NFR-VAL-03 | The system shall use appropriate HTTP status codes: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 409 (Conflict), 500 (Server Error) |
| NFR-VAL-04 | Expired JWT tokens shall return a `TOKEN_EXPIRED` error code to enable automatic client-side refresh |
| NFR-VAL-05 | All unhandled exceptions shall be caught by a global error handler and logged via Winston |

### 5.4 Logging

| ID | Requirement |
|---|---|
| NFR-LOG-01 | The system shall log all HTTP requests using Morgan in combined format |
| NFR-LOG-02 | Application logs shall be written to `error.log` (errors only) and `combined.log` (all levels) |
| NFR-LOG-03 | Console logging shall be enabled in non-production environments |
| NFR-LOG-04 | Log entries shall include timestamps and service name metadata |

### 5.5 Reliability

| ID | Requirement |
|---|---|
| NFR-REL-01 | Notification creation failures in the booking flow shall be caught silently and not block the primary booking operation |
| NFR-REL-02 | AI feature failures shall fall back to rule-based alternatives without interrupting the user experience |
| NFR-REL-03 | WebSocket disconnections shall not affect the functionality of the REST API |

---

## 6. System Features (Feature Breakdown)

### 6.1 User Registration & Authentication

| Attribute | Details |
|---|---|
| **Description** | Complete user lifecycle management including registration with welcome bonus, secure login, token-based session management, and profile retrieval |
| **User Story** | As a new visitor, I want to create an account so that I can book venues and earn loyalty rewards |
| **Acceptance Criteria** | 1) User can register with email, password (min 6 chars), and full name. 2) 500 welcome bonus points are awarded and visible immediately. 3) JWT tokens are issued and stored client-side. 4) Login validates credentials and returns user profile with tokens. 5) Expired tokens are automatically refreshed using the refresh token. 6) Invalid or expired sessions redirect to the login page. |
| **Priority** | **High** |

### 6.2 Venue Discovery & Search

| Attribute | Details |
|---|---|
| **Description** | Comprehensive venue browsing with multi-criteria filtering (type, district, price range, cuisine, free-text search), configurable sorting, and pagination. The home page features six clickable venue category cards that pre-filter results. |
| **User Story** | As a user, I want to search and filter venues by type, location, and price so that I can quickly find the perfect spot for my needs |
| **Acceptance Criteria** | 1) Venues list loads with pagination (12 per page). 2) Type filter limits results to the selected category. 3) District filter shows only venues in the chosen district. 4) Sort options change the ordering correctly. 5) Free-text search matches venue name or description (case-insensitive). 6) Clear filters resets all criteria. 7) Result count reflects current filters. |
| **Priority** | **High** |

### 6.3 Venue Details & Availability

| Attribute | Details |
|---|---|
| **Description** | Detailed venue page showing description, amenities, opening hours, recent reviews (with ratings), table list, and real-time availability for a selected date. Available tables show their booked time slots so users can find open windows. |
| **User Story** | As a user, I want to view a venue's full details and check which tables are available on my preferred date so that I can make an informed booking decision |
| **Acceptance Criteria** | 1) Venue page shows all details including description, amenities, phone, and address. 2) Opening hours display per day of week. 3) Up to 5 most recent reviews are shown with reviewer name and star rating. 4) Available/total table count is displayed. 5) Date-based availability query returns tables with their booked time slots. |
| **Priority** | **High** |

### 6.4 3D Venue Visualization

| Attribute | Details |
|---|---|
| **Description** | Interactive 3D rendering of venue floor plans using Three.js (via react-three-fiber). Tables are displayed at their stored positions (`position_x`, `position_y`, `position_z`) with shape-accurate geometries, color-coded availability status, VIP indicators, and capacity labels. Users can orbit, zoom, and click tables to select them for booking. |
| **User Story** | As a user, I want to explore the venue layout in 3D so that I can visually choose the best table for my party |
| **Acceptance Criteria** | 1) 3D canvas renders floor, walls, and lighting. 2) Tables are positioned accurately per their database coordinates. 3) Tables are color-coded: green (available), red (booked), blue (selected), gold (VIP). 4) Clicking an available table selects it. 5) Unavailable tables show a not-allowed cursor. 6) Orbit controls allow rotation, panning, and zooming. 7) A legend explains the color coding. |
| **Priority** | **Medium** |

### 6.5 Booking Creation & Management

| Attribute | Details |
|---|---|
| **Description** | Multi-step booking form allowing users to select date (starting from tomorrow), time slot (30-minute intervals), guest count, table (manual grid selection, 3D selection, or auto-assignment), and optional special requests. After creation, users can view, update, or cancel bookings from the My Bookings page. Cancellation automatically reverses earned loyalty points. |
| **User Story** | As a registered user, I want to book a table at my chosen venue for a specific date and time so that my reservation is guaranteed |
| **Acceptance Criteria** | 1) Date selector enforces minimum of tomorrow. 2) End time options are filtered to times after the start time. 3) Table conflict detection prevents double-booking (HTTP 409). 4) Capacity check ensures guests fit the selected table (HTTP 400). 5) Booking price is calculated and displayed. 6) Loyalty points are earned and shown on confirmation. 7) Success screen shows booking details with navigation options. 8) Users can view all their bookings filtered by status. 9) Cancellation deducts earned points and updates status. |
| **Priority** | **High** |

### 6.6 Group Bookings & Payment Splitting

| Attribute | Details |
|---|---|
| **Description** | Extension of individual bookings that allows the booker to invite other registered users by email. The system supports three payment split strategies: equal division, custom amounts, and inviter-pays-all. Each invited user receives a notification of type `group_invite`. |
| **User Story** | As a user organizing a group outing, I want to invite friends to my booking and split the bill fairly so that everyone pays their share |
| **Acceptance Criteria** | 1) User can enter invited email addresses for an existing booking. 2) Invited users are looked up by email in the users table. 3) A group_bookings record is created with invited user details. 4) The booking is flagged as `is_group_booking = 1`. 5) Per-person split amount is calculated correctly: `ceil(total_price / (invited_count + 1))`. 6) Each invitee receives a `group_invite` notification. |
| **Priority** | **Medium** |

### 6.7 Loyalty Points System

| Attribute | Details |
|---|---|
| **Description** | A comprehensive points economy where users earn points on every booking (scaled by subscription tier), receive bonus points on registration and subscription, and can redeem points for discounts. The loyalty dashboard provides a complete overview of balance, earning rate, tier status, and full transaction history with filtering. |
| **User Story** | As a frequent booker, I want to earn points on every booking and redeem them for discounts so that I am rewarded for my loyalty |
| **Acceptance Criteria** | 1) Points earned per booking = `floor(total_price / 10,000) x tier_multiplier`. 2) 500 bonus points awarded on registration. 3) Subscription bonuses: 100 (basic), 250 (premium), 500 (vip). 4) Redemption rate: 1 point = 1,000 UZS. 5) Redemption blocked if insufficient balance. 6) Transaction history shows type, amount, description, and related venue. 7) Summary card displays balance, total earned, total redeemed, and current multiplier. |
| **Priority** | **High** |

### 6.8 Subscription Plans

| Attribute | Details |
|---|---|
| **Description** | Three-tier monthly subscription system that upgrades the user's loyalty earning rate and unlocks additional benefits. Plans are displayed on a dedicated page with pricing in UZS and approximate USD equivalents, feature lists, and a "Most Popular" badge on the Premium plan. |
| **User Story** | As a regular user, I want to subscribe to a premium plan so that I earn more loyalty points and access VIP features |
| **Acceptance Criteria** | 1) Three plans displayed: Basic (99,000 UZS), Premium (199,000 UZS), VIP (499,000 UZS). 2) Current plan is indicated and the subscribe button is disabled. 3) Subscribing creates a subscription record with 1-month duration. 4) User's `subscription_tier` is updated immediately. 5) Bonus points are awarded per plan tier. 6) Cancellation resets tier to `free` while retaining access until period end. 7) FAQ section answers common questions. |
| **Priority** | **Medium** |

### 6.9 Payment Processing

| Attribute | Details |
|---|---|
| **Description** | Stripe-integrated payment flow with a dedicated checkout page. The system creates a payment intent for unpaid bookings, processes card payments through Stripe Elements (CardElement), confirms the payment on success, and supports refunds. A demo mode is available with test card `4242 4242 4242 4242`. |
| **User Story** | As a user with a confirmed booking, I want to securely pay online so that my reservation is fully guaranteed |
| **Acceptance Criteria** | 1) Checkout page displays booking summary (venue, date, time, guests, amount). 2) Stripe CardElement renders for card input. 3) Payment intent is created via the API and returns a client secret. 4) Successful payment updates `payment_status` to `paid` and generates a `payment_confirmed` notification. 5) Payment success screen shows confirmation with booking ID and amount. 6) Refund endpoint updates `payment_status` to `refunded` and returns the refund amount. |
| **Priority** | **High** |

### 6.10 Real-Time Notifications

| Attribute | Details |
|---|---|
| **Description** | Dual-channel notification system combining a REST API for persistent storage and retrieval with a WebSocket server (`/ws`) for real-time delivery. The frontend NotificationBell component displays an unread count badge (capped at "9+"), a scrollable dropdown of recent notifications, mark-as-read functionality, and browser notification prompts. |
| **User Story** | As a user, I want to receive instant notifications about my booking confirmations, payment status, and group invitations so that I stay informed without refreshing the page |
| **Acceptance Criteria** | 1) WebSocket connection authenticates via JWT token message. 2) Notifications appear in real-time in the bell dropdown. 3) Unread badge shows accurate count. 4) Clicking a notification marks it as read. 5) "Mark all read" clears all unread indicators. 6) Notifications can be deleted individually. 7) Browser notifications fire if permission is granted. |
| **Priority** | **Medium** |

### 6.11 AI-Powered Assistant

| Attribute | Details |
|---|---|
| **Description** | Anthropic Claude-powered AI assistant accessible via a floating chat widget (bottom-right corner). Supports three modes: venue recommendations (considers user history for authenticated users), free-form conversational chat with multi-turn context, and intelligent table selection based on party size and preferences. Quick-action buttons ("Best restaurants", "Cafes nearby", "VIP dining", "Group booking") accelerate common queries. |
| **User Story** | As a user unsure about where to dine, I want to ask the AI assistant for personalized recommendations so that I discover venues that match my preferences |
| **Acceptance Criteria** | 1) Chat widget opens from floating button with Sparkles icon. 2) Quick actions populate the input with preset queries. 3) AI responses include venue recommendations with booking links. 4) Authenticated users receive personalized suggestions based on past bookings. 5) Chat history persists across messages within a session. 6) AI table selection recommends the best available table given constraints. 7) System functions without AI key using top-rated venue fallbacks. |
| **Priority** | **Medium** |

---

## 7. Database & Data Requirements

### 7.1 Entity Overview

The system uses SQLite (via better-sqlite3) with 10 tables. All primary keys are UUID v4 strings. Timestamps use SQLite's `datetime('now')` format.

### 7.2 Entity Definitions

#### 7.2.1 `users`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT (UUID) | PRIMARY KEY | Unique user identifier |
| `email` | TEXT | UNIQUE, NOT NULL | User's email address |
| `password_hash` | TEXT | NOT NULL | bcrypt-hashed password (12 rounds) |
| `full_name` | TEXT | NOT NULL | User's display name |
| `phone` | TEXT | — | Optional phone number |
| `avatar_url` | TEXT | — | Profile picture URL |
| `loyalty_points` | INTEGER | DEFAULT 0 | Current loyalty points balance |
| `subscription_tier` | TEXT | DEFAULT 'free', CHECK IN ('free','basic','premium','vip') | Current subscription level |
| `preferred_language` | TEXT | DEFAULT 'en', CHECK IN ('en','ru','uz') | Language preference |
| `preferences` | TEXT (JSON) | DEFAULT '{}' | User preferences blob |
| `is_active` | INTEGER | DEFAULT 1 | Account active flag (0 = deactivated) |
| `created_at` | TEXT | DEFAULT datetime('now') | Account creation timestamp |
| `updated_at` | TEXT | DEFAULT datetime('now') | Last update timestamp |

#### 7.2.2 `venues`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT (UUID) | PRIMARY KEY | Unique venue identifier |
| `name` | TEXT | NOT NULL | Venue name |
| `type` | TEXT | NOT NULL, CHECK IN ('cafe','restaurant','stadium','fitness','barbershop','carwash') | Venue category |
| `address` | TEXT | NOT NULL | Street address |
| `city` | TEXT | DEFAULT 'Tashkent' | City name |
| `district` | TEXT | NOT NULL | Tashkent district |
| `latitude` | REAL | — | GPS latitude |
| `longitude` | REAL | — | GPS longitude |
| `description` | TEXT | — | Venue description |
| `cuisine_type` | TEXT | — | Cuisine style (restaurants/cafes) |
| `price_range` | INTEGER | CHECK BETWEEN 1 AND 4 | Price tier (1=budget, 4=luxury) |
| `rating` | REAL | DEFAULT 0.00 | Average rating |
| `total_reviews` | INTEGER | DEFAULT 0 | Review count |
| `amenities` | TEXT (JSON) | DEFAULT '[]' | List of amenities |
| `opening_hours` | TEXT (JSON) | DEFAULT '{}' | Per-day opening hours |
| `images` | TEXT (JSON) | DEFAULT '[]' | Image URLs array |
| `three_d_model_url` | TEXT | — | URL to 3D model asset |
| `phone` | TEXT | — | Venue phone number |
| `website` | TEXT | — | Venue website |
| `is_active` | INTEGER | DEFAULT 1 | Active listing flag |
| `created_at` | TEXT | DEFAULT datetime('now') | Creation timestamp |
| `updated_at` | TEXT | DEFAULT datetime('now') | Update timestamp |

**Indexes:** `idx_venues_type`, `idx_venues_district`, `idx_venues_rating` (DESC)

#### 7.2.3 `venue_tables`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT (UUID) | PRIMARY KEY | Unique table identifier |
| `venue_id` | TEXT | FK → venues(id) ON DELETE CASCADE, NOT NULL | Parent venue |
| `table_number` | INTEGER | NOT NULL, UNIQUE(venue_id, table_number) | Sequential table number |
| `label` | TEXT | — | Human-readable label |
| `capacity` | INTEGER | NOT NULL, DEFAULT 2 | Maximum seats |
| `shape` | TEXT | DEFAULT 'round', CHECK IN ('round','square','rectangular','oval') | Table shape for 3D rendering |
| `position_x` | REAL | DEFAULT 0 | 3D x-coordinate |
| `position_y` | REAL | DEFAULT 0 | 3D y-coordinate |
| `position_z` | REAL | DEFAULT 0 | 3D z-coordinate |
| `is_available` | INTEGER | DEFAULT 1 | General availability flag |
| `is_vip` | INTEGER | DEFAULT 0 | VIP table indicator |
| `price_multiplier` | REAL | DEFAULT 1.00 | Price modifier (e.g., 1.5x for VIP) |
| `features` | TEXT (JSON) | DEFAULT '[]' | Special table features |
| `created_at` | TEXT | DEFAULT datetime('now') | Creation timestamp |

#### 7.2.4 `bookings`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT (UUID) | PRIMARY KEY | Unique booking identifier |
| `user_id` | TEXT | FK → users(id) ON DELETE CASCADE, NOT NULL | Booking owner |
| `venue_id` | TEXT | FK → venues(id) ON DELETE CASCADE, NOT NULL | Booked venue |
| `table_id` | TEXT | FK → venue_tables(id) | Reserved table (nullable for auto-assign) |
| `booking_date` | TEXT | NOT NULL | Reservation date (YYYY-MM-DD) |
| `start_time` | TEXT | NOT NULL | Start time (HH:MM) |
| `end_time` | TEXT | NOT NULL | End time (HH:MM) |
| `guests_count` | INTEGER | NOT NULL, DEFAULT 1 | Number of guests |
| `status` | TEXT | DEFAULT 'pending', CHECK IN ('pending','confirmed','cancelled','completed','no_show') | Booking lifecycle status |
| `total_price` | REAL | — | Calculated total in UZS |
| `currency` | TEXT | DEFAULT 'UZS' | Price currency |
| `loyalty_points_earned` | INTEGER | DEFAULT 0 | Points awarded for this booking |
| `special_requests` | TEXT | — | Free-text customer notes |
| `is_group_booking` | INTEGER | DEFAULT 0 | Group booking flag |
| `payment_status` | TEXT | DEFAULT 'unpaid', CHECK IN ('unpaid','partial','paid','refunded') | Payment lifecycle status |
| `payment_intent_id` | TEXT | — | Stripe payment intent reference |
| `created_at` | TEXT | DEFAULT datetime('now') | Creation timestamp |
| `updated_at` | TEXT | DEFAULT datetime('now') | Update timestamp |

**Indexes:** `idx_bookings_user`, `idx_bookings_venue`, `idx_bookings_date`, `idx_bookings_status`

#### 7.2.5 `group_bookings`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT (UUID) | PRIMARY KEY | Unique group booking ID |
| `booking_id` | TEXT | FK → bookings(id) ON DELETE CASCADE, NOT NULL | Associated booking |
| `inviter_user_id` | TEXT | FK → users(id), NOT NULL | User who initiated the group |
| `invited_users` | TEXT (JSON) | DEFAULT '[]' | Array of `{id, email, name, status}` objects |
| `split_type` | TEXT | DEFAULT 'equal', CHECK IN ('equal','custom','inviter_pays') | Payment splitting strategy |
| `split_payment_status` | TEXT (JSON) | DEFAULT '{}' | Per-person payment tracking |
| `created_at` | TEXT | DEFAULT datetime('now') | Creation timestamp |
| `updated_at` | TEXT | DEFAULT datetime('now') | Update timestamp |

#### 7.2.6 `subscriptions`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT (UUID) | PRIMARY KEY | Unique subscription ID |
| `user_id` | TEXT | FK → users(id) ON DELETE CASCADE, NOT NULL | Subscriber |
| `plan_type` | TEXT | NOT NULL, CHECK IN ('basic','premium','vip') | Selected plan |
| `start_date` | TEXT | NOT NULL | Subscription start date |
| `end_date` | TEXT | NOT NULL | Subscription end date (start + 1 month) |
| `status` | TEXT | DEFAULT 'active', CHECK IN ('active','cancelled','expired','paused') | Subscription status |
| `price` | REAL | NOT NULL | Price at time of subscription (UZS) |
| `currency` | TEXT | DEFAULT 'UZS' | Currency |
| `benefits` | TEXT (JSON) | DEFAULT '{}' | Plan benefits snapshot |
| `stripe_subscription_id` | TEXT | — | Stripe reference (future use) |
| `created_at` | TEXT | DEFAULT datetime('now') | Creation timestamp |
| `updated_at` | TEXT | DEFAULT datetime('now') | Update timestamp |

#### 7.2.7 `loyalty_transactions`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT (UUID) | PRIMARY KEY | Unique transaction ID |
| `user_id` | TEXT | FK → users(id) ON DELETE CASCADE, NOT NULL | Transaction owner |
| `booking_id` | TEXT | FK → bookings(id) | Related booking (nullable for bonuses) |
| `points` | INTEGER | NOT NULL | Points amount (negative for redemptions) |
| `transaction_type` | TEXT | NOT NULL, CHECK IN ('earned','redeemed','bonus','expired') | Transaction category |
| `description` | TEXT | — | Human-readable description |
| `created_at` | TEXT | DEFAULT datetime('now') | Transaction timestamp |

**Index:** `idx_loyalty_user`

#### 7.2.8 `reviews`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT (UUID) | PRIMARY KEY | Unique review ID |
| `user_id` | TEXT | FK → users(id) ON DELETE CASCADE, NOT NULL | Reviewer |
| `venue_id` | TEXT | FK → venues(id) ON DELETE CASCADE, NOT NULL | Reviewed venue |
| `booking_id` | TEXT | FK → bookings(id) | Linked booking (nullable) |
| `rating` | INTEGER | NOT NULL, CHECK BETWEEN 1 AND 5 | Star rating |
| `comment` | TEXT | — | Review text |
| `images` | TEXT (JSON) | DEFAULT '[]' | Review photo URLs |
| `is_verified` | INTEGER | DEFAULT 0 | Verified purchase flag |
| `created_at` | TEXT | DEFAULT datetime('now') | Creation timestamp |
| `updated_at` | TEXT | DEFAULT datetime('now') | Update timestamp |

**Indexes:** `idx_reviews_venue`, `idx_reviews_user`

#### 7.2.9 `notifications`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT (UUID) | PRIMARY KEY | Unique notification ID |
| `user_id` | TEXT | FK → users(id) ON DELETE CASCADE, NOT NULL | Recipient |
| `type` | TEXT | NOT NULL | Notification type (e.g., `booking_confirmed`, `payment_confirmed`, `group_invite`) |
| `title` | TEXT | NOT NULL | Notification headline |
| `message` | TEXT | NOT NULL | Notification body text |
| `data` | TEXT (JSON) | DEFAULT '{}' | Metadata (booking_id, venue_id, etc.) |
| `is_read` | INTEGER | DEFAULT 0 | Read/unread flag |
| `created_at` | TEXT | DEFAULT datetime('now') | Creation timestamp |

**Indexes:** `idx_notifications_user`, indexed on `is_read`

#### 7.2.10 `ai_chat_history`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT (UUID) | PRIMARY KEY | Unique message ID |
| `user_id` | TEXT | FK → users(id) ON DELETE CASCADE, NOT NULL | Chat participant |
| `role` | TEXT | NOT NULL, CHECK IN ('user','assistant') | Message sender role |
| `content` | TEXT | NOT NULL | Message text |
| `metadata` | TEXT (JSON) | DEFAULT '{}' | Additional metadata |
| `created_at` | TEXT | DEFAULT datetime('now') | Message timestamp |

### 7.3 Entity Relationships

```
users (1) ──────── (M) bookings
users (1) ──────── (M) group_bookings        (via inviter_user_id)
users (1) ──────── (M) subscriptions
users (1) ──────── (M) loyalty_transactions
users (1) ──────── (M) reviews
users (1) ──────── (M) notifications
users (1) ──────── (M) ai_chat_history

venues (1) ─────── (M) venue_tables
venues (1) ─────── (M) bookings
venues (1) ─────── (M) reviews

venue_tables (1) ── (M) bookings              (nullable FK)

bookings (1) ────── (0..1) group_bookings
bookings (1) ────── (M) loyalty_transactions   (nullable FK)
bookings (1) ────── (M) reviews                (nullable FK)
```

### 7.4 Data Validation Rules

- **Email**: Must be a valid email format (express-validator `isEmail()`), normalized to lowercase
- **Password**: Minimum 6 characters
- **Full Name**: Required, trimmed of whitespace
- **Venue ID**: Must be a valid UUID
- **Booking Date**: Must be a valid date string
- **Start/End Time**: Must match `HH:MM` format (regex `\d{2}:\d{2}`)
- **Guest Count**: Integer between 1 and 50
- **Rating**: Integer between 1 and 5
- **Price Range**: Integer between 1 and 4
- **Subscription Tier**: One of `free`, `basic`, `premium`, `vip`
- **Booking Status**: One of `pending`, `confirmed`, `cancelled`, `completed`, `no_show`
- **Payment Status**: One of `unpaid`, `partial`, `paid`, `refunded`
- **Split Type**: One of `equal`, `custom`, `inviter_pays`

---

## 8. API & Integration Requirements

### 8.1 API Endpoints

#### Authentication (`/api/auth`)

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register new user account |
| POST | `/api/auth/login` | Public | Authenticate and receive tokens |
| POST | `/api/auth/refresh` | Public | Refresh expired access token |
| GET | `/api/auth/me` | Required | Get current user profile |

#### Venues (`/api/venues`)

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/venues` | Optional | List venues with filters and pagination |
| GET | `/api/venues/districts` | Optional | Get districts with venue counts |
| GET | `/api/venues/:id` | Optional | Get venue details with tables and reviews |
| GET | `/api/venues/:id/availability` | Optional | Get table availability for a date |
| GET | `/api/venues/:id/3d-model` | Optional | Get 3D visualization data |

#### Bookings (`/api/bookings`)

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/bookings` | Required | Create a new booking |
| GET | `/api/bookings` | Required | List user's bookings with filters |
| GET | `/api/bookings/:id` | Required | Get booking details |
| PUT | `/api/bookings/:id` | Required | Update booking details |
| POST | `/api/bookings/:id/cancel` | Required | Cancel a booking |
| POST | `/api/bookings/:id/invite` | Required | Invite friends to group booking |
| GET | `/api/bookings/:id/split` | Required | Calculate payment split |

#### Loyalty (`/api/loyalty`)

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/loyalty/transactions` | Required | Get loyalty transaction history |
| GET | `/api/loyalty/summary` | Required | Get loyalty summary and tier info |
| POST | `/api/loyalty/redeem` | Required | Redeem points for discount |

#### Subscriptions (`/api/subscriptions`)

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/subscriptions/plans` | Optional | Get available subscription plans |
| GET | `/api/subscriptions/current` | Required | Get user's active subscription |
| POST | `/api/subscriptions/subscribe` | Required | Subscribe to a plan |
| POST | `/api/subscriptions/cancel` | Required | Cancel active subscription |

#### Payments (`/api/payments`)

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/payments/create-intent` | Required | Create Stripe payment intent |
| POST | `/api/payments/confirm` | Required | Confirm payment for booking |
| POST | `/api/payments/refund` | Required | Process refund for paid booking |
| POST | `/api/payments/webhook` | Public | Receive Stripe webhook events |

#### Notifications (`/api/notifications`)

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/notifications` | Required | Get user's notifications |
| POST | `/api/notifications/mark-all-read` | Required | Mark all notifications as read |
| POST | `/api/notifications/:id/read` | Required | Mark single notification as read |
| DELETE | `/api/notifications/:id` | Required | Delete a notification |

#### AI Assistant (`/api/ai`)

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/ai/recommendations` | Optional | Get AI venue recommendations |
| POST | `/api/ai/chat` | Optional | Chat with AI assistant |
| POST | `/api/ai/select-table` | Required | AI-assisted table selection |

#### System

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | Health check endpoint |

### 8.2 Third-Party Integrations

#### Stripe (Payment Processing)

| Attribute | Details |
|---|---|
| **SDK** | stripe v14.14.0 |
| **Environment Variables** | `STRIPE_SECRET_KEY`, `STRIPE_PUBLIC_KEY`, `STRIPE_WEBHOOK_SECRET` |
| **Features Used** | Payment Intents, Card Element (frontend), Webhooks |
| **Currency** | UZS (Uzbekistani Som) |
| **Current Status** | Demo mode with generated payment intent IDs (`pi_demo_` prefix); production Stripe integration is structurally in place but uses mock responses |
| **Frontend** | `@stripe/react-stripe-js` and `@stripe/stripe-js` for the CardElement on the checkout page |

#### Anthropic Claude AI (Intelligent Assistant)

| Attribute | Details |
|---|---|
| **SDK** | @anthropic-ai/sdk v0.24.0 |
| **Environment Variable** | `ANTHROPIC_API_KEY` |
| **Model** | `claude-sonnet-4-20250514` |
| **Max Tokens** | 1,024 per request |
| **Features Used** | Venue recommendations with user history context, multi-turn conversational chat, intelligent table selection |
| **Fallback Behavior** | When API key is not configured, returns top-rated venues (recommendations), generic response (chat), and capacity-sorted table (selection) |
| **System Prompt** | Configured as a helpful Tashkent venue booking assistant that responds in English, Russian, or Uzbek and knows all venue types |

#### WebSocket (Real-Time Communication)

| Attribute | Details |
|---|---|
| **Library** | ws v8.16.0 |
| **Endpoint** | `/ws` |
| **Authentication** | JWT token sent as message: `{ type: 'auth', token: '...' }` |
| **Server Functions** | `sendToUser(userId, notification)`, `broadcast(notification)`, `getConnectedCount()` |
| **Client Events** | `connected`, `auth_success`, `notification`, `pong`, `error` |

---

## 9. User Interface Requirements

### 9.1 Key Screens

#### Home Page (`/`)
- Hero banner with headline "Book the Best Venues in Tashkent" and primary call-to-action buttons
- Six venue category cards (Restaurant, Cafe, Stadium, Fitness, Barbershop, Car Wash) with icons that link to pre-filtered venue listings
- Three feature highlight cards (Easy Booking, Earn Rewards, Group Bookings)
- Registration call-to-action section for unauthenticated users mentioning the 500-point welcome bonus

#### Login Page (`/login`)
- Centered card with email and password fields, toggle password visibility, error display, and demo credentials hint (`demo@smartbooking.uz` / `demo123456`)

#### Register Page (`/register`)
- Centered card with full name, email, phone (optional), and password fields
- Frontend validation for minimum 6-character password
- Mention of 500 bonus points incentive in the subheading

#### Venues Page (`/venues`)
- Search bar with text input and search button
- Filter row: venue type dropdown, district dropdown (with counts), sort dropdown, clear filters button
- Responsive venue card grid (1/2/3 columns) with pagination
- Loading skeleton states and empty-result messaging

#### Venue Details Page (`/venues/:id`)
- Venue header with colored gradient, type/cuisine badges, rating, price range, address, and phone
- Two-column layout: left side with description, amenities, and reviews; right sidebar with booking call-to-action and opening hours

#### Booking Form Page (`/venues/:id/book`)
- Sequential form: date picker (min tomorrow), start/end time dropdowns (30-min intervals), guest count selector, table selection (grid view or 3D view toggle), special requests textarea
- Success confirmation screen with earned loyalty points display

#### My Bookings Page (`/my-bookings`)
- Status filter buttons (All, Confirmed, Pending, Completed, Cancelled)
- Booking cards with venue info, date/time, guests, table assignment, price, loyalty points, and action buttons (Pay Now, Cancel)

#### Loyalty Dashboard Page (`/loyalty`)
- Four stat cards: Current Balance, Total Earned, Redeemed, Earn Rate
- Membership tier card with color-coded badge and point value information
- Transaction history with type filter tabs (All, Earned, Redeemed, Bonus)

#### Subscription Plans Page (`/subscriptions`)
- Three-column plan comparison cards (Basic, Premium, VIP) with pricing, feature lists, and subscribe buttons
- Current plan indicator, "Most Popular" badge on Premium
- Cancellation option and FAQ section

#### Checkout Page (`/checkout/:bookingId`)
- Booking summary card with venue, date, time, guests, and total amount
- Stripe CardElement for card input with SSL encryption note
- Success confirmation with booking ID and paid amount
- Demo card hint: `4242 4242 4242 4242`

### 9.2 Persistent UI Components

- **Navbar**: Sticky header with logo, navigation links (Venues, My Bookings, Rewards, Plans), user info with loyalty points badge, notification bell, and login/logout controls. Mobile-responsive hamburger menu.
- **NotificationBell**: Bell icon with unread count badge, dropdown panel with notification list, mark-as-read functionality, WebSocket-driven real-time updates.
- **AIChatWidget**: Floating action button (bottom-right) that opens a chat panel with message history, quick-action suggestions, venue recommendation cards, and conversation context.

### 9.3 UI/UX Patterns

- **Mobile-first responsive design** using Tailwind CSS breakpoints (sm, md, lg, xl)
- **Loading states**: Skeleton cards with `animate-pulse` effect for content loading, spinner overlays for form submissions
- **Empty states**: Centered icon + descriptive text + action button for all list views
- **Error states**: Red banner at top of forms/pages displaying API error messages
- **Color coding**: Consistent status colors throughout — green (confirmed/success), yellow (pending), red (cancelled/error), gray (completed/neutral)
- **Card-based layouts**: All content presented in white cards with rounded corners and subtle shadows
- **Gradient backgrounds**: Venue header images use rotating color gradients with large initial letters
- **Interactive 3D**: Three.js canvas with orbit controls, color-coded tables, VIP gold indicators, and click-to-select interaction

---

## 10. Security Requirements

### 10.1 Authentication

| ID | Requirement |
|---|---|
| SEC-AUTH-01 | The system shall use JSON Web Tokens (JWT) for stateless authentication |
| SEC-AUTH-02 | Access tokens shall expire after 1 hour; refresh tokens after 7 days |
| SEC-AUTH-03 | Tokens shall be signed using separate secrets (`JWT_SECRET` for access, `JWT_REFRESH_SECRET` for refresh) |
| SEC-AUTH-04 | Password hashing shall use bcryptjs with a cost factor of 12 |
| SEC-AUTH-05 | The system shall never return `password_hash` in any API response |
| SEC-AUTH-06 | Expired access tokens shall trigger a `TOKEN_EXPIRED` error code, allowing clients to auto-refresh |
| SEC-AUTH-07 | Deactivated accounts (`is_active = 0`) shall be rejected during authentication and token verification |

### 10.2 Authorization

| ID | Requirement |
|---|---|
| SEC-AUTHZ-01 | Protected endpoints shall require a valid JWT in the `Authorization: Bearer <token>` header |
| SEC-AUTHZ-02 | Users shall only access their own resources (bookings, notifications, subscriptions, loyalty data) via `user_id` filtering in queries |
| SEC-AUTHZ-03 | The `requireSubscription(minTier)` middleware shall enforce minimum subscription tier access with a defined hierarchy: `free (0) < basic (1) < premium (2) < vip (3)` |
| SEC-AUTHZ-04 | Optional authentication (`optionalAuth`) shall allow public access while enriching the request with user context when a token is present |

### 10.3 Infrastructure Security

| ID | Requirement |
|---|---|
| SEC-INFRA-01 | HTTP security headers shall be applied via Helmet (X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security, etc.) |
| SEC-INFRA-02 | CORS shall restrict requests to the configured `FRONTEND_URL` origin with credentials support |
| SEC-INFRA-03 | API rate limiting shall cap requests at 100 per 15-minute window per IP address |
| SEC-INFRA-04 | Request body size shall be limited to 10 MB |
| SEC-INFRA-05 | Database foreign key constraints shall be enforced to maintain referential integrity |
| SEC-INFRA-06 | WebSocket connections shall require JWT authentication before receiving user-specific notifications |

---

## 11. Constraints & Limitations

### 11.1 Technical Constraints

| Constraint | Description |
|---|---|
| **SQLite Database** | The system uses an embedded SQLite database, which limits concurrent write operations to a single writer at a time. WAL mode mitigates read contention but does not support horizontal database scaling. |
| **Single Server Architecture** | The backend runs as a single Express.js process. WebSocket connections, API requests, and database operations all share the same process, limiting vertical scalability. |
| **PostgreSQL Compatibility Layer** | The database wrapper converts PostgreSQL-style `$1, $2` parameters to SQLite `?` placeholders and emulates `RETURNING *` via rowid lookups. This adds slight overhead and may not cover all edge cases. |
| **Tashkent-Only Scope** | The `city` field defaults to 'Tashkent' and the frontend is designed around a single-city experience. Multi-city support would require schema and UI changes. |
| **English-Only Frontend** | Although the database supports `preferred_language` (en, ru, uz) and the AI can respond in multiple languages, the frontend UI is exclusively in English. |

### 11.2 Known Limitations

| Limitation | Description |
|---|---|
| **Demo Payment Processing** | Stripe integration generates mock `pi_demo_` payment intent IDs rather than calling the actual Stripe API. Production deployment requires real Stripe API keys and proper intent creation. |
| **No Venue Admin Panel** | Venues are loaded via database seeding (`seed.js`). There is no admin interface for venue operators to manage their listings, tables, or view booking analytics. |
| **No Review Creation UI** | The backend stores reviews and the frontend displays them, but there is no user-facing form to submit new reviews. Reviews exist only as seed data. |
| **Missing Database Columns** | The `subscriptionController` references a `cancelled_at` column that does not exist in the `subscriptions` table. The `loyaltyController` references a `loyalty_points_redeemed` column that does not exist in the `bookings` table. These operations will fail at runtime. |
| **No Email/SMS Notifications** | Notifications are limited to in-app storage and WebSocket real-time delivery. There is no integration with email or SMS services for out-of-app communication. |
| **Webhook Stub** | The Stripe webhook handler (`POST /api/payments/webhook`) contains a switch statement on event types but performs no actual processing. |
| **No Image Upload** | Venue images, review images, and user avatars reference URLs but there is no file upload functionality. All images are stored as URL strings. |
| **Group Booking UI** | The API supports group booking invitations and payment splitting, but the frontend does not fully expose these features beyond the API layer. |

---

## 12. Glossary

| Term | Definition |
|---|---|
| **Venue** | A physical business location listed on the platform where bookings can be made. Includes restaurants, cafes, stadiums, fitness centers, barbershops, and car washes. |
| **Venue Table** | A bookable unit within a venue (a physical table, seat, or station). Each table has a capacity, shape, position coordinates for 3D rendering, and an optional VIP designation. |
| **Booking** | A reservation made by a user for a specific venue, date, time slot, and optionally a specific table. Bookings progress through statuses: `pending` → `confirmed` → `completed` (or `cancelled` / `no_show`). |
| **Group Booking** | An extension of a standard booking where the booking creator invites other registered users and splits the payment among participants. |
| **Split Type** | The payment division strategy for group bookings: `equal` (divided evenly), `custom` (user-defined amounts), or `inviter_pays` (creator pays the full amount). |
| **Loyalty Points** | A reward currency earned by users on every booking. Points can be redeemed for monetary discounts at a rate of 1 point = 1,000 UZS. |
| **Tier Multiplier** | A subscription-based earning rate modifier applied to loyalty point calculations: `free` (1x), `basic` (1.25x), `premium` (1.5x), `vip` (2x). |
| **Subscription Tier** | A monthly paid plan (`basic`, `premium`, `vip`) that grants the user enhanced loyalty earning rates and additional platform benefits. |
| **Payment Intent** | A Stripe concept representing an intended payment. The system creates a payment intent when a user initiates checkout and confirms it upon successful card processing. |
| **JWT (JSON Web Token)** | A compact, URL-safe token format used for stateless authentication. The system issues access tokens (1-hour) and refresh tokens (7-day). |
| **WebSocket** | A persistent bidirectional communication protocol used for delivering real-time notifications from the server to connected clients. |
| **UZS** | Uzbekistani Som, the official currency of Uzbekistan. All prices in the system are denominated in UZS. |
| **District** | An administrative subdivision of Tashkent (e.g., Yunusabad, Mirzo Ulugbek, Chilanzar, Yakkasaray, Sergeli, Almazar). Used to geographically filter venues. |
| **Price Range** | A 1-to-4 scale indicating venue pricing level: 1 (budget), 2 (moderate), 3 (upscale), 4 (luxury). Displayed as dollar signs ($–$$$$) in the UI. |
| **3D Venue Model** | An interactive Three.js-rendered visualization of a venue's floor plan showing table layouts, positions, shapes, and real-time availability status with color coding. |
| **Claude** | Anthropic's AI assistant model used by the system for venue recommendations, conversational chat, and intelligent table selection. The system uses the `claude-sonnet-4-20250514` model. |
| **WAL Mode** | Write-Ahead Logging, a SQLite journal mode that allows concurrent readers alongside a single writer, improving read performance in multi-user scenarios. |

---

*This document was generated by analyzing the complete source code of the Smart Booking Tashkent application, including all backend controllers, routes, middleware, database schemas, migrations, seed data, frontend pages, components, and services. All entity names, field names, route paths, and business rules are derived directly from the codebase.*
