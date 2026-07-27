# AI Website Builder - Backend API 🚀

A robust, asynchronous Node.js & TypeScript backend service built with **Express 5**, **Prisma ORM**, and **Better-Auth**. It uses OpenAI / OpenRouter AI models to automatically generate, revise, version, and serve complete web projects from simple natural language text prompts.

> **Note:** This repository currently houses the **Backend API & Service Logic**. The backend handles user sessions, credit management, AI website generation, version control, project persistence, and publishing workflows.

---

## 🛠️ Tech Stack

- **Language & Runtime:** TypeScript, Node.js (`tsx`)
- **Web Framework:** Express.js (v5)
- **Database & ORM:** PostgreSQL (Neon DB) via Prisma ORM
- **Authentication:** [Better-Auth](https://www.better-auth.com/) (Session-based Node handler middleware)
- **AI Integration:** OpenAI SDK configured with OpenRouter API
- **Development Tools:** Nodemon, TypeScript Compiler (`tsc`)

---

## ✨ Key Features

- 🤖 **AI-Powered Code Generation:** Automatically converts initial user text prompts into generated website code.
- 🔄 **Interactive AI Revisions:** Modify existing projects using natural language feedback; past conversational context is preserved in the database.
- 📜 **Version History & Rollback:** Each AI revision generates a unique version snapshot, enabling seamless rollbacks to any prior code version.
- 💳 **Credit & Usage Management:** Integrated credit system tracking usage per user with quota enforcement (e.g. minimum credit check before generation).
- 🌐 **Project Publishing System:** Toggle projects between private drafts and publicly accessible published websites.
- 🔒 **Secure Authentication:** Better-Auth powered authentication supporting session validations across protected routes.

---

## 📁 Repository Structure

```
websiteb/
└── server/
    ├── config/           # App configuration (OpenAI/OpenRouter setup)
    ├── controllers/      # Route handler logic (User & Project controllers)
    ├── lib/              # Shared libraries (Prisma client instance & BetterAuth)
    ├── middlewares/      # Authentication & authorization middlewares
    ├── prisma/           # Database schema & migrations config
    ├── routes/           # Express API endpoints routing definitions
    ├── types/            # Custom TypeScript type definitions
    ├── server.ts         # Application entry point & server setup
    └── package.json      # Dependencies and execution scripts
```

---

## 🗄️ Database Models (Prisma)

- **`User`**: Manages user profiles, total site creations, and credit balances.
- **`WebsiteProject`**: Stores project metadata, current code state, author reference, and publishing status.
- **`Conversation`**: Records chat message history (`user` vs `assistant`) associated with each project for context-aware AI updates.
- **`Version`**: Tracks code version snapshots for versioning and rollback capability.
- **`Transaction`**: Records credit purchase transactions and payment status.
- **`Session` / `Account` / `Verification`**: Auth schema managed by Better-Auth.

---

## 🛰️ API Reference

### 🔐 Auth Endpoints
- `ALL /api/auth/*` – Handled by Better-Auth for sign-in, sign-up, and session handling.

### 👤 User Endpoints (`/api/user`)
*All endpoints require authentication middleware (`protect`).*

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/user/credits` | Fetch the current user's available credit balance |
| `POST` | `/api/user/project` | Create a new project & generate initial website code |
| `GET` | `/api/user/projects` | Fetch all projects belonging to the logged-in user |
| `GET` | `/api/user/project/:projectId` | Fetch details of a specific user project |
| `GET` | `/api/user/publish-toggle/:projectId` | Toggle public/private visibility status of a project |

### 🏗️ Project & AI Endpoints (`/api/project`)

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/project/revision/:projectId` | Yes | Request AI code revisions based on user feedback prompt |
| `PUT` | `/api/project/save/:projectId` | Yes | Save manual code edits to a project |
| `GET` | `/api/project/rollback/:projectId/:versionId` | Yes | Revert project code back to a specific version snapshot |
| `DELETE`| `/api/project/:projectId` | Yes | Delete a project and its associated history |
| `GET` | `/api/project/preview/:projectId` | Yes | Fetch preview data for project rendering |
| `GET` | `/api/project/published` | No | List all publicly published projects |
| `GET` | `/api/project/published/:projectId` | No | Fetch a specific published project for public viewing |

---

## ⚙️ Environment Variables Setup

Create a `.env` file inside the `server/` directory:

```env
# Server Port & URLs
BETTER_AUTH_URL="http://localhost:3000"
Trusted_url="http://localhost:5173"
NODE_ENV="development"

# Secret Key for Better-Auth Sessions
BETTER_AUTH_SECRET="your_better_auth_secret_key"

# Database Connection String (PostgreSQL / Neon)
DATABASE_URL="postgresql://<user>:<password>@<host>/<dbname>?sslmode=require"

# OpenRouter / OpenAI API Key for AI Model Access
API_KEY="your_openrouter_api_key"
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- PostgreSQL database (or [Neon DB](https://neon.tech/))
- OpenRouter / OpenAI API Key

### 2. Installation
```bash
# Navigate to the server folder
cd server

# Install dependencies
npm install
```

### 3. Database Migration & Prisma Setup
```bash
# Generate Prisma Client
npx prisma generate

# Push database schema to PostgreSQL
npx prisma db push
```

### 4. Running the Development Server
```bash
# Start backend in development mode (auto-reload on changes via nodemon)
npm run server

# Or run with tsx directly
npm start
```
The server will start at `http://localhost:3000`.

---
