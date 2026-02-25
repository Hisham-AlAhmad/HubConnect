# HubConnect — Backend API

Express.js REST API with real-time Socket.io support, JWT authentication, and PostgreSQL (Supabase-compatible).

---

## Tech Stack

| Layer          | Technology                          |
| -------------- | ----------------------------------- |
| Runtime        | Node.js (ESM)                       |
| Framework      | Express 5                           |
| Database       | PostgreSQL via `postgres` (postgres.js) |
| Real-time      | Socket.io 4                         |
| Auth           | JWT (jsonwebtoken) + bcryptjs       |
| Validation     | express-validator                   |
| Security       | Helmet, CORS, express-rate-limit    |
| File Uploads   | Multer                              |

---

## Project Structure

```
Backend/
├── .env                    # Environment variables (not committed)
├── init.sql                # Full database schema (PostgreSQL)
├── package.json
├── migrations/             # Incremental SQL migrations
│   └── add_attendance_table.sql
└── src/
    ├── index.js            # App entry — Express + Socket.io setup
    ├── config/
    │   └── index.js        # Centralised env config
    ├── db/
    │   ├── index.js        # postgres.js connection
    │   ├── migrate.js      # Migration runner
    │   └── seed.js         # Database seeder
    ├── middleware/
    │   ├── authenticate.js # JWT verification middleware
    │   ├── errorHandler.js # Global error handler
    │   ├── rbac.js         # Role-based access control (authorize)
    │   └── validate.js     # express-validator result checker
    └── routes/
        ├── index.js        # Route aggregator (/api/...)
        ├── auth.routes.js          # POST /register, /login, /logout, /me
        ├── organizations.routes.js # CRUD organizations
        ├── profiles.routes.js      # User profiles
        ├── roles.routes.js         # Org-level roles
        ├── cohorts.routes.js       # Cohorts CRUD + instructor assignment
        ├── courses.routes.js       # Courses CRUD
        ├── teams.routes.js         # Teams CRUD + membership
        ├── tasks.routes.js         # Tasks CRUD + assignment
        ├── submissions.routes.js   # Task submissions & reviews
        ├── chat.routes.js          # Chat rooms & messages
        ├── notifications.routes.js # In-app notifications
        ├── analytics.routes.js     # Dashboard analytics
        ├── attendance.routes.js    # Check-in / check-out
        ├── reports.routes.js       # Daily & student reports
        ├── files.routes.js         # File upload metadata
        └── activityLogs.routes.js  # Audit trail
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** 15+ (local or Supabase)

### 1. Install dependencies

```bash
cd Backend
npm install
```

### 2. Configure environment

Copy `.env.example` or create a `.env` file:

```env
PORT=5000
NODE_ENV=development

DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/hubconnect

JWT_SECRET=change-this-to-a-long-random-string
JWT_EXPIRES_IN=7d

BCRYPT_ROUNDS=10

CORS_ORIGIN=http://localhost:5173
```

### 3. Initialise the database

```bash
# Create the database first (if local)
psql -U postgres -c "CREATE DATABASE hubconnect;"

# Run the full schema
psql -U postgres -d hubconnect -f init.sql

# Or run incremental migrations
npm run migrate
```

### 4. (Optional) Seed demo data

```bash
npm run seed
```

### 5. Start the server

```bash
# Development (auto-restart on file changes)
npm run dev

# Production
npm start
```

The API will be available at **http://localhost:5000**.

---

## API Endpoints

All routes are prefixed with `/api`.

| Method   | Endpoint                              | Auth | Roles               | Description                  |
| -------- | ------------------------------------- | ---- | -------------------- | ---------------------------- |
| `POST`   | `/auth/register`                      | —    | —                    | Register a new user          |
| `POST`   | `/auth/login`                         | —    | —                    | Login & receive JWT          |
| `POST`   | `/auth/logout`                        | ✓    | Any                  | Logout                       |
| `GET`    | `/auth/me`                            | ✓    | Any                  | Current user profile         |
| `GET`    | `/organizations`                      | ✓    | Any                  | List organizations           |
| `GET`    | `/profiles`                           | ✓    | Any                  | List profiles                |
| `GET`    | `/cohorts`                            | ✓    | Any                  | List cohorts                 |
| `POST`   | `/cohorts`                            | ✓    | Admin                | Create cohort                |
| `PUT`    | `/cohorts/:id`                        | ✓    | Admin                | Update cohort                |
| `DELETE` | `/cohorts/:id`                        | ✓    | Admin                | Delete cohort                |
| `POST`   | `/cohorts/:id/instructor`             | ✓    | Admin                | Assign instructor to cohort  |
| `GET`    | `/courses`                            | ✓    | Any                  | List courses                 |
| `POST`   | `/courses`                            | ✓    | Admin, Instructor    | Create course                |
| `GET`    | `/teams`                              | ✓    | Any                  | List teams                   |
| `POST`   | `/teams`                              | ✓    | Admin, Instructor    | Create team                  |
| `GET`    | `/tasks`                              | ✓    | Any                  | List tasks                   |
| `POST`   | `/tasks`                              | ✓    | Admin, Instructor, TL| Create task                  |
| `GET`    | `/submissions`                        | ✓    | Any                  | List submissions             |
| `POST`   | `/submissions`                        | ✓    | Any                  | Submit work                  |
| `GET`    | `/chat/rooms`                         | ✓    | Any                  | List chat rooms              |
| `POST`   | `/chat/rooms`                         | ✓    | Admin, Instructor    | Create chat room             |
| `GET`    | `/chat/rooms/:id/messages`            | ✓    | Any                  | Get room messages            |
| `POST`   | `/chat/rooms/:id/messages`            | ✓    | Any                  | Send message                 |
| `GET`    | `/notifications`                      | ✓    | Any                  | List notifications           |
| `GET`    | `/analytics`                          | ✓    | Admin, Instructor    | Dashboard analytics          |
| `POST`   | `/attendance/check-in`                | ✓    | Student, TL          | Check in                     |
| `POST`   | `/attendance/check-out`               | ✓    | Student, TL          | Check out                    |
| `GET`    | `/reports/daily`                      | ✓    | Admin, Instructor    | Daily reports                |

---

## Real-time (Socket.io)

Clients authenticate via `socket.handshake.auth.token` (JWT).

| Event (Client → Server) | Payload                | Description          |
| ------------------------ | ---------------------- | -------------------- |
| `join_room`              | `{ roomId }`           | Join a chat room     |
| `leave_room`             | `{ roomId }`           | Leave a chat room    |
| `send_message`           | `{ roomId, ... }`      | Send a message       |
| `typing`                 | `{ roomId }`           | Broadcast typing     |
| `stop_typing`            | `{ roomId }`           | Stop typing          |

| Event (Server → Client)  | Payload               | Description          |
| ------------------------- | --------------------- | -------------------- |
| `receive_message`         | Message object         | New message in room  |
| `user_typing`             | `{ userId, name }`    | User is typing       |
| `user_stop_typing`        | `{ userId }`          | User stopped typing  |

---

## Database Schema

The full schema is in `init.sql`. Key tables:

- **auth.users** — minimal auth identity (UUID PK)
- **profiles** — full user info, password hash, role
- **organizations** / **organization_users** — multi-tenant orgs
- **cohorts** / **user_cohorts** — academic cohorts
- **courses** — courses within cohorts
- **teams** / **team_members** — teams within courses
- **tasks** / **task_assignments** — task management
- **submissions** — task submissions & review workflow
- **chat_rooms** / **messages** — real-time messaging
- **notifications** — in-app notification system
- **attendance** — daily check-in/out
- **activity_logs** — audit trail
- **files** — file upload metadata

---

## Security

- **Helmet** — HTTP security headers
- **CORS** — restricted to `CORS_ORIGIN`
- **Rate limiting** — 500 req/15 min global, 20 req/15 min for auth
- **JWT** — token-based authentication on all protected routes
- **RBAC** — role-based authorization (`admin`, `instructor`, `team_leader`, `student`)
- **bcrypt** — password hashing (configurable rounds)
- **Input validation** — express-validator on all mutation endpoints

---

## Scripts

| Command            | Description                              |
| ------------------ | ---------------------------------------- |
| `npm run dev`      | Start with `--watch` (auto-restart)      |
| `npm start`        | Production start                         |
| `npm run migrate`  | Run pending SQL migrations               |
| `npm run seed`     | Seed the database with demo data         |
| `npm run init-db`  | Run `init.sql` against `$DATABASE_URL`   |
