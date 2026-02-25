# HubConnect

A full-stack team management platform for coding bootcamps and tech hubs. Instructors manage cohorts, courses, teams, and tasks; students submit work, chat in real-time, and track attendance — all from one dashboard.

---

## Tech Stack

| Layer    | Technology                                       |
| -------- | ------------------------------------------------ |
| Frontend | React 18, Vite 5, Tailwind CSS 3, Recharts      |
| Backend  | Node.js (ESM), Express 5, Socket.io 4            |
| Database | PostgreSQL 15+ (local or Supabase)               |
| Auth     | Custom JWT — bcryptjs + jsonwebtoken              |

---

## Features

- **Role-Based Access** — Admin, Instructor, Team Leader, Student
- **Cohort & Course Management** — organise students into cohorts and courses
- **Team Management** — create teams, assign leaders, manage members
- **Task Workflow** — create, assign, submit, review, accept/reject tasks
- **Real-Time Chat** — General, Course, and Team channels via Socket.io
- **Attendance Tracking** — daily check-in / check-out with reports
- **Analytics Dashboard** — submission stats, timelines, team rankings
- **Notifications** — in-app notification bell with live updates
- **Dark Mode** — system-aware + manual toggle
- **Responsive UI** — mobile-friendly layouts and sidebar

---

## Prerequisites

- **Node.js** >= 18
- **PostgreSQL** 15+ (local install or Supabase project)
- **npm** 9+

---

## Quick Start

### 1. Clone the repository

```bash
git clone <repo-url>
cd HubConnect
```

### 2. Database setup

```bash
# Local PostgreSQL
psql -U postgres -c "CREATE DATABASE hubconnect;"
psql -U postgres -d hubconnect -f Backend/init.sql
```

Or point `DATABASE_URL` to a Supabase project and use `Backend/supabase_schema.sql`.

### 3. Backend

```bash
cd Backend
npm install
```

Create a `.env` file (see configuration below), then:

```bash
npm run dev          # http://localhost:5000
```

### 4. Frontend

```bash
cd Frontend
npm install
npm run dev          # http://localhost:5173
```

Open **http://localhost:5173** — the Vite dev server proxies `/api` requests to the backend automatically.

---

## Configuration

### Backend `.env`

```env
PORT=5000
NODE_ENV=development

DATABASE_URL=postgresql://postgres:password@localhost:5432/hubconnect

JWT_SECRET=change-this-to-a-long-random-string-min-32-chars
JWT_EXPIRES_IN=7d

BCRYPT_ROUNDS=10

CORS_ORIGIN=http://localhost:5173
```

| Variable         | Required | Default                 | Description                     |
| ---------------- | -------- | ----------------------- | ------------------------------- |
| `DATABASE_URL`   | **Yes**  | —                       | PostgreSQL connection string    |
| `JWT_SECRET`     | **Yes**  | —                       | Min 32-char secret              |
| `PORT`           | No       | `5000`                  | Server port                     |
| `NODE_ENV`       | No       | `development`           | Environment                     |
| `JWT_EXPIRES_IN` | No       | `7d`                    | Token lifetime                  |
| `BCRYPT_ROUNDS`  | No       | `10`                    | bcrypt cost factor              |
| `CORS_ORIGIN`    | No       | `http://localhost:5173` | Allowed frontend origin         |

### Frontend

No `.env` needed in development — Vite proxies `/api` to `localhost:5000`. For production, set `VITE_API_URL` to your backend URL.

---

## API Overview

All endpoints are prefixed with `/api`. Most require `Authorization: Bearer <token>`.

| Prefix           | Description                              |
| ---------------- | ---------------------------------------- |
| `/auth`          | Register, login, logout, current user    |
| `/cohorts`       | Cohort CRUD + instructor assignment      |
| `/courses`       | Course CRUD                              |
| `/teams`         | Team CRUD + member management            |
| `/tasks`         | Task CRUD + assignment                   |
| `/submissions`   | Submit & review task work                |
| `/chat`          | Chat rooms & messages                    |
| `/attendance`    | Check-in / check-out                     |
| `/notifications` | In-app notifications                     |
| `/analytics`     | Submission stats, rankings, timelines    |
| `/reports`       | Daily, range, student, and summary       |
| `/profiles`      | User profile CRUD                        |
| `/organizations` | Organization CRUD + user listing         |
| `/roles`         | Role assignment                          |
| `/files`         | File upload metadata                     |
| `/activity-logs` | Read-only audit trail                    |

---

## Real-Time (Socket.io)

Clients authenticate with `socket.handshake.auth.token` (JWT).

| Event (client → server) | Payload           | Description        |
| ------------------------ | ----------------- | ------------------ |
| `join_room`              | `{ roomId }`      | Join a chat room   |
| `leave_room`             | `{ roomId }`      | Leave a chat room  |
| `send_message`           | `{ roomId, ... }` | Send a message     |
| `typing`                 | `{ roomId }`      | Broadcast typing   |
| `stop_typing`            | `{ roomId }`      | Stop typing        |

| Event (server → client) | Payload            | Description         |
| ------------------------ | ------------------ | ------------------- |
| `receive_message`        | Message object     | New message in room |
| `user_typing`            | `{ userId, name }` | User is typing     |
| `user_stop_typing`       | `{ userId }`       | Stopped typing     |

---

## Database Schema

The full schema lives in [Backend/init.sql](Backend/init.sql). Key tables:

| Table               | Purpose                          |
| ------------------- | -------------------------------- |
| `auth.users`        | Minimal auth identity (UUID PK)  |
| `profiles`          | Full user info + password hash   |
| `organizations`     | Multi-tenant organisations       |
| `cohorts`           | Academic cohorts with date range  |
| `user_cohorts`      | Student ↔ Cohort membership      |
| `courses`           | Courses within cohorts           |
| `teams`             | Teams within courses             |
| `team_members`      | Team membership                  |
| `tasks`             | Task management                  |
| `task_assignments`  | Task ↔ User assignments          |
| `submissions`       | Task submissions + review        |
| `chat_rooms`        | General / Course / Team rooms    |
| `messages`          | Chat messages                    |
| `notifications`     | In-app notifications             |
| `attendance`        | Daily check-in / check-out       |
| `activity_logs`     | Audit trail                      |
| `files`             | File upload metadata             |

---

## Project Structure

```
HubConnect/
├── README.md                 # ← you are here
├── Backend/
│   ├── .env                  # Environment config (not committed)
│   ├── init.sql              # Full PostgreSQL schema
│   ├── supabase_schema.sql   # Supabase-compatible variant
│   ├── package.json
│   ├── migrations/           # Incremental SQL migrations
│   └── src/
│       ├── index.js          # Express + Socket.io entry
│       ├── config/           # Centralised env config
│       ├── db/               # DB connection, migration runner, seeder
│       ├── middleware/       # authenticate, rbac, validate, errorHandler
│       └── routes/           # One file per API resource (17 route files)
└── Frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js        # Dev server + API proxy
    ├── tailwind.config.js    # Theme + dark mode
    └── src/
        ├── App.jsx           # Context providers wrapper
        ├── components/       # 10 reusable UI components
        ├── context/          # Auth, Cohort, Course, Notification, Theme
        ├── hooks/            # useAuth, useSocket
        ├── layouts/          # DashboardLayout
        ├── pages/            # 18 page components
        ├── routes/           # AppRoutes with role guards
        ├── services/         # api.js (Axios) + socket.js
        └── utils/            # constants + helpers
```

---

## Roles & Access

| Role            | Permissions                                              |
| --------------- | -------------------------------------------------------- |
| **Admin**       | Full access — orgs, cohorts, instructors, all users      |
| **Instructor**  | Manage courses, tasks, teams; view reports & analytics   |
| **Team Leader** | Create tasks, manage team submissions, check attendance  |
| **Student**     | View tasks, submit work, chat, check attendance          |

---

## Scripts

### Backend (`Backend/`)

| Command           | Description                            |
| ----------------- | -------------------------------------- |
| `npm run dev`     | Start with `--watch` (auto-restart)    |
| `npm start`       | Production start                       |
| `npm run migrate` | Run pending SQL migrations             |
| `npm run seed`    | Seed database with demo data           |
| `npm run init-db` | Run `init.sql` against `$DATABASE_URL` |

### Frontend (`Frontend/`)

| Command           | Description                       |
| ----------------- | --------------------------------- |
| `npm run dev`     | Vite dev server (port 5173)       |
| `npm run build`   | Production build to `dist/`       |
| `npm run preview` | Preview production build locally  |

---

## Seed Data

```bash
cd Backend
npm run seed
```

Creates demo accounts:

| Email                | Password    | Role         |
| -------------------- | ----------- | ------------ |
| `admin@hub.com`      | `admin123`  | admin        |
| `instructor@hub.com` | `inst123`   | instructor   |
| `student@hub.com`    | `stud123`   | student      |
| `leader@hub.com`     | `lead123`   | team_leader  |

---

## License

MIT
