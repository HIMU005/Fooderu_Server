# Missing Status Codes Documentation - V1

## Overview

This document presents a curated list of missing basic HTTP status codes across API endpoints and serves as a reference and tracking tool for future implementation. **At this stage, the focus is limited to essential status codes only; advanced or edge-case status codes are intentionally excluded.**

Currently, all entries in the Implemented column are marked with “✘”, indicating that the corresponding status codes have not yet been implemented. Once a status code is implemented, please update the document by replacing “✘” with “✔” to indicate successful implementation and update the original _`API_ENDPOINTS.md`_ file as well.

This documentation serves as a guide for developers, QA engineers, and API consumers to implement endpoints consistently, handle errors appropriately, and write automated tests based on expected responses. **It only covers missing or not-yet-implemented status codes, providing a structured framework for future enhancements and additional status codes as the API evolves.**

---

## 1. Authentication Endpoints (`/auth`)

| Method | Endpoint                    | Description             | Missing Status Codes | Authentication | Purpose                               | Implemented |
| ------ | --------------------------- | ----------------------- | -------------------- | -------------- | ------------------------------------- | ----------- |
| POST   | `/auth/register`            | Register a new user     | 409                  | None           | Email already exists                  | ✔           |
| POST   | `/auth/login`               | Login with credentials  | 403                  | None           | Email not verified / account disabled | ✔           |
| POST   | `/auth/login_with_social`   | Social login            | 401                  | None           | Invalid or expired social token       | ✘           |
| POST   | `/auth/login_with_clerk`    | Clerk authentication    | 401                  | None           | Invalid Clerk token                   | ✘           |
| POST   | `/auth/login_with_firebase` | Firebase authentication | 401                  | None           | Invalid Firebase token                | ✘           |
| GET    | `/auth/verify_email`        | Verify email address    | 401                  | None           | Invalid or expired verification token | ✔           |
|        |                             |                         | 404                  | None           | User not found                        | ✔           |

---

## 2. User Endpoints (`/users`)

| Method | Endpoint    | Description              | Missing Status Codes | Authentication | Purpose                              | Implemented |
| ------ | ----------- | ------------------------ | -------------------- | -------------- | ------------------------------------ | ----------- |
| GET    | `/users/me` | Get current user profile | 401                  | Required       | Missing or invalid token             | ✅          |
|        |             |                          | 404                  | Required       | User not found                       | ✅          |
| PUT    | `/users/me` | Update profile           | 401                  | Required       | Unauthorized                         | ✅          |
|        |             |                          | 400                  | Required       | Email password userType can't update | ✅ 🧑‍💻       |
|        |             |                          | 404                  | Required       | User not found                       | ✅          |

---

## 3. Restaurant Endpoints (`/restaurants`)

| Method | Endpoint                           | Description                    | Missing Status Codes | Authentication     | Purpose                   | Implemented |
| ------ | ---------------------------------- | ------------------------------ | -------------------- | ------------------ | ------------------------- | ----------- |
| GET    | `/restaurants`                     | Get all restaurants            | 401                  | Should be Required | Unauthorized              | ✅          |
| GET    | `/restaurants/follow-status`       | Restaurants with follow status | 401                  | Required           | Unauthorized              | ✅          |
| GET    | `/restaurants/byUserId/:ownerId`   | Get by owner ID                | 401                  | Should be Required | Unauthorized              | ✅          |
|        |                                    | Restaurant id object missmatch | 400                  |                    | Object id missmatch       | ✅🧑‍💻        |
|        |                                    |                                | 404                  |                    | Owner not found           | ✅          |
| GET    | `/restaurants/:restaurantId`       | Get restaurant                 | 401                  | Should be Required | Unauthorized              | ✅          |
|        |                                    | Restaurant id object missmatch | 400                  |                    | Object id missmatch       | ✅          |
|        |                                    |                                | 404                  |                    | Restaurant not found      | ✅          |
| GET    | `/restaurants/:restaurantId/items` | Get menu items                 | 401                  | Should be Required | Unauthorized              | ✘           |
|        |                                    |                                | 404                  |                    | Restaurant not found      | ✘           |
| GET    | `/restaurants/:restaurantId/posts` | Get posts                      | 401                  | Should be Required | Unauthorized              | ✘           |
|        |                                    |                                | 404                  |                    | Restaurant not found      | ✘           |
| POST   | `/restaurants`                     | Create restaurant              | 401                  | Should be Required | Unauthorized              | ✅          |
|        |                                    |                                | 409                  | Should be Required | Already have a restaurant | ✅          |
| POST   | `/restaurants/:restaurantId/items` | Create menu item               | 401                  | Should be Required | Unauthorized              | ✘           |
|        |                                    |                                | 403                  |                    | Not owner of restaurant   | ✘           |
|        |                                    |                                | 404                  |                    | Restaurant not found      | ✘           |
| PUT    | `/restaurants/:restaurantId`       | Update restaurant              | 401                  | Required           | Unauthorized              | ✅          |
|        |                                    |                                | 403                  |                    | Not owner of restaurant   | ✅          |
|        |                                    |                                | 404                  |                    | Restaurant not found      | ✅          |
|        |                                    | Restaurant id object missmatch | 400                  |                    | Object id missmatch       | ✅🧑‍💻        |

---

## 4. Menu Item Endpoints (`/menuItems`)

| Method | Endpoint                                       | Description         | Missing Status Codes | Authentication     | Purpose             | Implemented |
| ------ | ---------------------------------------------- | ------------------- | -------------------- | ------------------ | ------------------- | ----------- |
| GET    | `/menuItems`                                   | Get all menu item   | 401                  | Should be Required | Unauthorized        | ✔           |
|        |                                                |                     | 400                  | Required           | Bad Request         | ✔           |
| GET    | `/menuItems/getMenuItemsByFollowedRestaurants` | Followed menu items | 401                  | Required           | Unauthorized        | ✔           |
| GET    | `/menuItems/:menuItemId`                       | Get menu item       | 401                  | Should be Required | Unauthorized        | ✔           |
|        |                                                |                     | 404                  |                    | Menu item not found | ✔           |
| GET    | `/menuItems/:menuItemId/myRating`              | User rating         | 401                  | Required           | Unauthorized        | ✔           |
|        |                                                |                     | 404                  |                    | Rating not found    | ✔           |
| POST   | `/menuItems/:menuItemId/rate`                  | Rate item           | 401                  | Required           | Unauthorized        | ✔           |
|        |                                                |                     | 404                  |                    | Menu item not found | ✔           |
| PUT    | `/menuItems/:menuItemId`                       | Update item         | 401                  | Required           | Unauthorized        | ✔           |
|        |                                                |                     | 403                  |                    | Not owner           | ✔           |
|        |                                                |                     | 404                  |                    | Menu item not found | ✔           |
| DELETE | `/menuItems/:menuItemId`                       | Delete item         | 401                  | Required           | Unauthorized        | ✔           |
|        |                                                |                     | 403                  |                    | Not owner           | ✔           |
|        |                                                |                     | 404                  |                    | Menu item not found | ✔           |

---

## 5. Post Endpoints (`/posts`)

| Method | Endpoint                          | Description    | Missing Status Codes | Authentication     | Purpose                        | Implemented |
| ------ | --------------------------------- | -------------- | -------------------- | ------------------ | ------------------------------ | ----------- |
| GET    | `/posts`                          | Get all posts  | 401                  | Should be Required | Unauthorized                   | ✘           |
| GET    | `/posts/followedRestaurantsPosts` | Followed posts | 401                  | Required           | Unauthorized                   | ✅          |
| GET    | `/posts/:id`                      | Get post       | 401                  | Should be Required | Unauthorized                   | ✅          |
|        |                                   |                | 400                  |                    | Invalid post ID                | ✅ 🧑‍💻       |
|        |                                   |                | 404                  |                    | Post not found                 | ✅          |
| POST   | `/posts`                          | Create post    | 401                  | Should be Required | Unauthorized                   | ✅          |
|        |                                   |                | 400                  |                    | Invalid restaurant ID          | ✅ 🧑‍💻       |
|        |                                   |                | 400                  |                    | Required items is not provided | ✅ 🧑‍💻       |
| PUT    | `/posts/:id`                      | Update post    | 401                  | Required           | Unauthorized                   | ✅          |
|        |                                   |                | 403                  |                    | Not post owner                 | ✅          |
|        |                                   |                | 404                  |                    | Post not found                 | ✅          |
|        |                                   |                | 400                  |                    | Invalid post ID                | ✅ 🧑‍💻       |
| DELETE | `/posts/:id`                      | Delete post    | 401                  | Required           | Unauthorized                   | ✅          |
|        |                                   |                | 403                  |                    | Not post owner                 | ✅          |
|        |                                   |                | 404                  |                    | Post not found                 | ✅          |
|        |                                   |                | 400                  |                    | Invalid post ID                | ✅ 🧑‍💻       |

---

## 6. Event Endpoints (`/events`)

| Method | Endpoint                                | Description                         | Missing Status Codes | Authentication     | Purpose                                          | Implemented |
| ------ | --------------------------------------- | ----------------------------------- | -------------------- | ------------------ | ------------------------------------------------ | ----------- |
| GET    | `/events`                               | Get all events from all restaurants | 401                  | Should be Required | Unauthorized                                     | ✅          |
| GET    | `/events/:restaurantId`                 | Get restaurant events               | 401                  | Should be Required | Unauthorized                                     | ✅          |
|        |                                         |                                     | 400                  |                    | Restaurant object id missmatch                   | ✅🧑‍💻        |
|        |                                         |                                     | 404                  |                    | Restaurant not found                             | ✅          |
| POST   | `/events/:restaurantId`                 | Create event                        | 401                  | Should be Required | Unauthorized                                     | ✅          |
|        |                                         |                                     | 403                  |                    | Not restaurant owner                             | ✅          |
|        |                                         |                                     | 404                  |                    | Restaurant not found                             | ✅          |
|        |                                         |                                     | 400                  |                    | Mongoose object id missmatch                     | ✅🧑‍💻        |
| PATCH  | `/events/:restaurantId/:eventId/toggle` | Toggle event                        | 401                  | Should be Required | Unauthorized                                     | ✅          |
|        |                                         |                                     | 403                  |                    | Not event owner                                  | ✅          |
|        |                                         |                                     | 404                  |                    | Event/restaurant not found                       | ✅          |
|        |                                         |                                     | 400                  |                    | Invalid restaurant / event ID                    | ✅🧑‍💻        |
|        |                                         |                                     | 403                  |                    | This event and the restaurant are not associated | ✅🧑‍💻        |

---

## 7. Comment Endpoints (`/comments`)

| Method | Endpoint                       | Description  | Missing Status Codes | Authentication     | Purpose           | Implemented |
| ------ | ------------------------------ | ------------ | -------------------- | ------------------ | ----------------- | ----------- |
| GET    | `/comments/:postId`            | Get comments | 401                  | Should be Required | Unauthorized      | ✘           |
|        |                                |              | 404                  |                    | Post not found    | ✘           |
| POST   | `/comments`                    | Add comment  | 401                  | Should be Required | Unauthorized      | ✘           |
| POST   | `/comments/:commentId/replies` | Add reply    | 401                  | Should be Required | Unauthorized      | ✘           |
|        |                                |              | 404                  |                    | Comment not found | ✘           |

---

## 8. Follow Endpoints (`/follow`)

| Method | Endpoint                       | Description   | Missing Status Codes | Authentication | Purpose              | Implemented |
| ------ | ------------------------------ | ------------- | -------------------- | -------------- | -------------------- | ----------- |
| POST   | `/follow/:restaurantId/toggle` | Toggle follow | 401                  | Required       | Unauthorized         | ✘           |
|        |                                |               | 404                  |                | Restaurant not found | ✘           |

---

## 9. Upload Endpoints (`/upload`)

| Method | Endpoint  | Description  | Missing Status Codes | Authentication     | Purpose                | Implemented |
| ------ | --------- | ------------ | -------------------- | ------------------ | ---------------------- | ----------- |
| POST   | `/upload` | Upload image | 401                  | Should be Required | Unauthorized           | ✘           |
|        |           |              | 415                  |                    | Unsupported media type | ✘           |

---

## 10. Trending Endpoints (`/trendings`)

| Method | Endpoint           | Description          | Missing Status Codes | Authentication     | Purpose      | Implemented |
| ------ | ------------------ | -------------------- | -------------------- | ------------------ | ------------ | ----------- |
| GET    | `/trendings`       | Trending restaurants | 401                  | Required           | Unauthorized | ✘           |
| GET    | `/trendings/posts` | Trending posts       | 401                  | Should be Required | Unauthorized | ✘           |

---

## Notes

- Every resource endpoint other than `/auth` and `/` should now returns 401 if accessed without valid authentiction.
- Critical resource modifications (PUT, POST, DELETE) should be protected with 403 checks for ownership.
