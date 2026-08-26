# Wordplay Game Application

A full-stack game application with a React frontend and a Bun/TypeScript backend using GraphQL, Prisma, and PostgreSQL.

## Tech Stack

### Frontend

* React
* Vite
* npm

### Backend

* Bun
* TypeScript
* GraphQL Yoga
* Prisma
* PostgreSQL
* Docker Compose
* JWT Authentication

---

# Requirements

Before running the project, install:

* Git
* Node.js and npm
* Bun
* Docker Desktop

Make sure Docker Desktop is running before starting the backend.

---

# Project Structure

The project is organized like this:

```text
game/
├── backend/
│   ├── prisma/
│   ├── src/
│   ├── .env.example
│   ├── package.json
│   └── ...
├── src/
├── package.json
├── vite.config.js
└── ...
```

The frontend is located in the project root. There is no separate `frontend` folder.

The frontend is started using:

```bash
npm run game
```

---

# 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd game
```

Replace `game` with your actual project folder name if different.

---

# Backend Setup

Open a terminal in the project root and run:

```bash
cd backend
```

## 2. Create the Environment File

Copy the example environment file.

### macOS / Linux / Git Bash

```bash
cp .env.example .env
```

### Windows PowerShell

```powershell
Copy-Item .env.example .env
```

Open `.env` and set your environment variables.

Example:

```env
POSTGRES_USER=gameuser
POSTGRES_PASSWORD=gamepass
POSTGRES_DB=gamedb

DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}?schema=public"

JWT_SECRET="replace-this-with-a-long-random-secret"

PORT=3000
```

Do not commit `.env` to GitHub.

---

## 3. Start PostgreSQL

Make sure Docker Desktop is running.

From the `backend` directory, run:

```bash
docker compose up -d postgres
```

Check that PostgreSQL is running:

```bash
docker compose ps
```

The PostgreSQL container should show a status similar to:

```text
Up ... (healthy)
```

---

## 4. Install Backend Dependencies

Inside the `backend` directory:

```bash
bun install
```

---

## 5. Generate Prisma Client

```bash
bunx prisma generate
```

---

## 6. Run Database Migrations

```bash
bunx prisma migrate deploy
```

---

## 7. Start the Backend

```bash
bun run dev
```

The GraphQL API will be available at:

```text
http://localhost:3000/graphql
```

Keep this terminal running.

---

## 8. Run Backend Tests(optional)

Open another terminal and go to the backend directory:

```bash
cd backend
```

Then run:

```bash
bun test
```

---

# Frontend Setup

The frontend is located in the project root. There is no separate `frontend` directory.

Open a new terminal in the project root:

```bash
cd game
```

Install the frontend dependencies:

```bash
npm install
```

Start the frontend:

```bash
npm run game
```

Vite will display the local URL in the terminal, usually:

```text
http://localhost:5173
```

Open that URL in your browser.

---

# Running the Complete Application

You need two terminals.

### Terminal 1 — Backend

From the project root:

```bash
cd backend
docker compose up -d postgres
bun install
bunx prisma generate
bunx prisma migrate deploy
bun run dev
```

The backend will run at:

```text
http://localhost:3000/graphql
```

### Terminal 2 — Frontend

From the project root:

```bash
npm install
npm run game
```

The frontend will usually run at:

```text
http://localhost:5173
```

Open the frontend URL in your browser.

---

# Important

The frontend uses **npm**, while the backend uses **Bun**.

Do not run `bun install` in the frontend unless you intentionally want to switch the frontend package manager to Bun.

Frontend:

```bash
npm install
npm run game
```

Backend:

```bash
bun install
bun run dev
```
