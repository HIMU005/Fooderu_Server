# 🍽️ Foodaru Backend

This is the backend service for **Foodaru**, a food delivery and restaurant management platform. Built with **Node.js**, **Express**, and **MongoDB**, this API handles user authentication, restaurant and menu management, and order processing.

---

## 🛠️ Tech Stack

- **Node.js** + **Express**
- **MongoDB** (Cloud-hosted via MongoDB Atlas)
- **JWT** for authentication
- **Stripe Webhooks** (via `WEBHOOK_SECRET`)
- **Clerk** for identity and access management

---

## 📁 Project Structure (Example)

```bash
 foodaru-backend/
 ├── controllers/
 ├── models/
 ├── routes/
 ├── middlewares/
 ├── utils/
 ├── .env
 |── index.js
```

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/HIMU005/Fooderu_Server
cd Fooderu_Server
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

Server will run on: http://localhost:5000

## 📦 API Endpoints

### 🔐 Authentication

| Method | Endpoint                 | Description                             |
| ------ | ------------------------ | --------------------------------------- |
| POST   | `/auth/register`         | Register a new user                     |
| POST   | `/auth/login`            | Login and get token                     |
| POST   | `/auth/login_with_clerk` | Login for social accounts and get token |

### 🍴 Restaurants

| Method | Endpoint                           | Description                      |
| ------ | ---------------------------------- | -------------------------------- |
| GET    | `/restaurants`                     | List all restaurants             |
| POST   | `/restaurants`                     | Create a new restaurant          |
| GET    | `/restaurants/:restaurantId`       | Get restaurant info by ID        |
| GET    | `/restaurants/byUserId/:ownerId`   | Get restaurant info by owner ID  |
| GET    | `/restaurants/:restaurantId/items` | Get all items under a restaurant |

### 👤 User

| Method | Endpoint    | Description                              |
| ------ | ----------- | ---------------------------------------- |
| GET    | `/users/me` | Get logged-in user's info (JWT required) |

### 🎉 Events

| Method | Endpoint                                            | Description                     |
| ------ | --------------------------------------------------- | ------------------------------- |
| POST   | `/restaurants/:restaurantId/events`                 | Create an event                 |
| GET    | `/restaurants/:restaurantId/events`                 | Get all events for a restaurant |
| PATCH  | `/restaurants/:restaurantId/events/:eventId/toggle` | Toggle event status             |

## 🔐 Environment Variables

Create a `.env` file in the root and add:

```env
DB_URL="......."
ACCESS_TOKEN_SECRET="........"
WEBHOOK_SECRET = "........"
CLERK_SECRET_KEY="..........."
```
