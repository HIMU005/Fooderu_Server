# API Endpoints Documentation

## Overview
This document lists all API endpoints in the server codebase, organized by resource type following REST API best practices.

**Base URL:** `/` (no API prefix)

**Status Codes:**
- `200` - Success (GET, PUT, PATCH, DELETE)
- `201` - Created (POST)
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

---

## 1. Authentication Endpoints (`/auth`)

| Method | Endpoint | Description | Status Codes | Authentication |
|--------|----------|-------------|--------------|----------------|
| POST | `/auth/register` | Register a new user | 201, 400, 500 | None |
| POST | `/auth/login` | Login with credentials | 200, 400, 500 | None |
| POST | `/auth/login_with_social` | Login with social account | 200, 400, 500 | None |
| POST | `/auth/login_with_clerk` | Login with Clerk authentication | 200, 400, 500 | None |
| POST | `/auth/login_with_firebase` | Login with Firebase authentication | 200, 400, 500 | None |
| GET | `/auth/verify_email` | Verify email address | 200, 400, 500 | None |

---

## 2. User Endpoints (`/users`)

| Method | Endpoint | Description | Status Codes | Authentication |
|--------|----------|-------------|--------------|----------------|
| GET | `/users/me` | Get current user's profile | 200, 500 | Required |
| PUT | `/users/me` | Update current user's profile | 200, 400, 500 | Required |

---

## 3. Restaurant Endpoints (`/restaurants`)

| Method | Endpoint | Description | Status Codes | Authentication |
|--------|----------|-------------|--------------|----------------|
| GET | `/restaurants` | Get all restaurants | 200, 500 | None |
| GET | `/restaurants/follow-status` | Get restaurants with follow status | 200, 500 | Required |
| GET | `/restaurants/byUserId/:ownerId` | Get restaurant by owner ID | 200, 500 | None |
| GET | `/restaurants/:restaurantId` | Get single restaurant by ID | 200, 500 | None |
| GET | `/restaurants/:restaurantId/items` | Get all menu items under a restaurant | 200, 500 | None |
| GET | `/restaurants/:restaurantId/posts` | Get all posts under a restaurant | 200, 500 | None |
| POST | `/restaurants` | Create a new restaurant | 201, 400, 500 | None |
| POST | `/restaurants/:restaurantId/items` | Create menu item for a restaurant | 201, 400, 500 | None |
| PUT | `/restaurants/:restaurantId` | Update restaurant details | 200, 400, 500 | Required |

---

## 4. Menu Item Endpoints (`/menuItems`)

| Method | Endpoint | Description | Status Codes | Authentication |
|--------|----------|-------------|--------------|----------------|
| GET | `/menuItems` | Get all menu items | 200, 500 | None |
| GET | `/menuItems/getMenuItemsByFollowedRestaurants` | Get menu items from followed restaurants | 200, 500 | Required |
| GET | `/menuItems/:menuItemId` | Get single menu item by ID | 200, 500 | None |
| GET | `/menuItems/:menuItemId/myRating` | Get current user's rating for menu item | 200, 500 | Required |
| POST | `/menuItems/:menuItemId/rate` | Rate a menu item | 201, 400, 500 | Required |
| PUT | `/menuItems/:menuItemId` | Update menu item details | 200, 400, 500 | Required |
| DELETE | `/menuItems/:menuItemId` | Delete a menu item | 200, 400, 500 | Required |

---

## 5. Post Endpoints (`/posts`)

| Method | Endpoint | Description | Status Codes | Authentication |
|--------|----------|-------------|--------------|----------------|
| GET | `/posts` | Get all posts | 200, 500 | None |
| GET | `/posts/followedRestaurantsPosts` | Get posts from followed restaurants | 200, 500 | Required |
| GET | `/posts/:id` | Get single post by ID | 200, 500 | None |
| POST | `/posts` | Create a new post | 201, 400, 500 | None |
| PUT | `/posts/:id` | Update post details | 200, 400, 500 | Required |
| DELETE | `/posts/:id` | Delete a post | 200, 400, 500 | Required |

---

## 6. Event Endpoints (`/events`)

| Method | Endpoint | Description | Status Codes | Authentication |
|--------|----------|-------------|--------------|----------------|
| GET | `/events` | Get all events from all restaurants | 200, 500 | None |
| GET | `/events/:restaurantId` | Get events for a specific restaurant | 200, 500 | None |
| POST | `/events/:restaurantId` | Create an event for a restaurant | 201, 400, 500 | None |
| PATCH | `/events/:restaurantId/:eventId/toggle` | Toggle event status | 200, 400, 500 | None |

---

## 7. Comment Endpoints (`/comments`)

| Method | Endpoint | Description | Status Codes | Authentication |
|--------|----------|-------------|--------------|----------------|
| GET | `/comments/:postId` | Get comments for a specific post | 200, 500 | None |
| POST | `/comments` | Add a comment to a post | 201, 500 | None |
| POST | `/comments/:commentId/replies` | Add a reply to a comment | 201, 404, 500 | None |

---

## 8. Follow Endpoints (`/follow`)

| Method | Endpoint | Description | Status Codes | Authentication |
|--------|----------|-------------|--------------|----------------|
| POST | `/follow/:restaurantId/toggle` | Toggle follow status for a restaurant | 200, 500 | Required |

---

## 9. Upload Endpoints (`/upload`)

| Method | Endpoint | Description | Status Codes | Authentication |
|--------|----------|-------------|--------------|----------------|
| POST | `/upload` | Upload an image file | 200, 400, 500 | None |

---

## 10. Trending Endpoints (`/trendings`)

| Method | Endpoint | Description | Status Codes | Authentication |
|--------|----------|-------------|--------------|----------------|
| GET | `/trendings` | Get trending restaurants | 200, 500 | Required |
| GET | `/trendings/posts` | Get trending posts | 200, 500 | None |

---

## 11. Root Endpoint

| Method | Endpoint | Description | Status Codes | Authentication |
|--------|----------|-------------|--------------|----------------|
| GET | `/` | Home route | 200 | None |

---

## Summary Statistics

- **Total Endpoints:** 40
- **GET Endpoints:** 21
- **POST Endpoints:** 14
- **PUT Endpoints:** 4
- **PATCH Endpoints:** 1
- **DELETE Endpoints:** 2
- **Authenticated Endpoints:** 12
- **Public Endpoints:** 28

---

## Notes

1. **Authentication:** Endpoints marked as "Required" use the `protect` middleware for JWT authentication
2. **Status Codes:** All endpoints can return `500` for server errors. Listed status codes are the typical success and common error responses
3. **Error Handling:** All endpoints use a centralized error handler that returns appropriate status codes based on error types
4. **Route Ordering:** Routes are ordered following REST best practices - GET endpoints before POST, then PUT/PATCH, then DELETE
5. **Resource Nesting:** Some resources are nested (e.g., `/restaurants/:restaurantId/items`) following RESTful design principles

