# HubConnect — Frontend

React SPA with Vite, Tailwind CSS, real-time Socket.io chat, and role-based dashboards.

---

## Tech Stack

| Layer        | Technology                              |
| ------------ | --------------------------------------- |
| Framework    | React 18                                |
| Build Tool   | Vite 5                                  |
| Styling      | Tailwind CSS 3 (dark mode support)      |
| Routing      | React Router DOM 6                      |
| HTTP Client  | Axios                                   |
| Real-time    | Socket.io Client 4                      |
| Charts       | Recharts                                |
| Icons        | Lucide React                            |
| Auth         | JWT (jwt-decode)                        |

---

## Project Structure

```
Frontend/
├── index.html              # HTML entry
├── package.json
├── vite.config.js          # Vite config + API proxy
├── tailwind.config.js      # Tailwind theme + dark mode
├── postcss.config.js
└── src/
    ├── main.jsx            # React DOM entry
    ├── App.jsx             # Root — context providers wrapper
    ├── index.css           # Tailwind directives + global styles
    ├── components/
    │   ├── Avatar.jsx          # User avatar with initials fallback
    │   ├── ChatBox.jsx         # Real-time chat UI (Socket.io)
    │   ├── ErrorBoundary.jsx   # React error boundary
    │   ├── Navbar.jsx          # Top navigation bar
    │   ├── NotificationBell.jsx# Notification dropdown
    │   ├── RoleGuard.jsx       # Route-level role protection
    │   ├── Sidebar.jsx         # Dashboard sidebar navigation
    │   ├── SubmissionModal.jsx # Task submission dialog
    │   ├── TaskCard.jsx        # Task card component
    │   └── ThemeToggle.jsx     # Light/dark mode toggle
    ├── context/
    │   ├── AuthContext.jsx      # Authentication state + JWT
    │   ├── CohortContext.jsx    # Cohort selection & CRUD
    │   ├── CourseContext.jsx    # Active course state
    │   ├── NotificationContext.jsx # Notifications state
    │   └── ThemeContext.jsx     # Dark/light theme state
    ├── hooks/
    │   ├── useAuth.js          # Auth context consumer hook
    │   └── useSocket.js        # Socket.io connection hook
    ├── layouts/
    │   └── DashboardLayout.jsx # Sidebar + Navbar layout
    ├── pages/
    │   ├── Analytics.jsx       # Charts & analytics (Admin/Instructor)
    │   ├── Chat.jsx            # Tabbed chat (General/Course/Team)
    │   ├── CheckInOut.jsx      # Daily attendance (Student/TL)
    │   ├── Cohorts.jsx         # Cohort management (Admin/Instructor)
    │   ├── CourseDetails.jsx   # Single course view
    │   ├── Courses.jsx         # Course listing
    │   ├── CreateTask.jsx      # Task creation form
    │   ├── DailyReports.jsx    # Daily attendance reports
    │   ├── Dashboard.jsx       # Main dashboard
    │   ├── Instructors.jsx     # Instructor management (Admin)
    │   ├── Login.jsx           # Login page
    │   ├── NotFound.jsx        # 404 page
    │   ├── Profile.jsx         # User profile page
    │   ├── StudentReport.jsx   # Individual student reports
    │   ├── Students.jsx        # Student management (Admin/Instructor)
    │   ├── TaskDetails.jsx     # Single task view
    │   ├── Tasks.jsx           # Task listing
    │   └── Teams.jsx           # Team management
    ├── routes/
    │   └── AppRoutes.jsx       # All routes + role guards
    ├── services/
    │   ├── api.js              # Axios instance + all API modules
    │   └── socket.js           # Socket.io client singleton
    └── utils/
        ├── constants.js        # App-wide constants
        └── helpers.js          # Utility functions
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- Backend API running on `http://localhost:5000` (see Backend README)

### 1. Install dependencies

```bash
cd Frontend
npm install
```

### 2. Start development server

```bash
npm run dev
```

Opens at **http://localhost:5173**. API requests to `/api/*` are proxied to the backend automatically via Vite.

### 3. Build for production

```bash
npm run build
```

Output goes to `dist/`. Preview with:

```bash
npm run preview
```

---

## Pages & Routing

| Path                     | Page             | Access               |
| ------------------------ | ---------------- | -------------------- |
| `/login`                 | Login            | Public               |
| `/dashboard`             | Dashboard        | All authenticated    |
| `/tasks`                 | Tasks            | All authenticated    |
| `/tasks/create`          | Create Task      | Admin, Instructor, TL|
| `/tasks/:id`             | Task Details     | All authenticated    |
| `/teams`                 | Teams            | All authenticated    |
| `/courses`               | Courses          | All authenticated    |
| `/courses/:id`           | Course Details   | All authenticated    |
| `/cohorts`               | Cohorts          | Admin, Instructor    |
| `/students`              | Students         | Admin, Instructor    |
| `/instructors`           | Instructors      | Admin                |
| `/chat`                  | Chat             | All authenticated    |
| `/attendance`            | Check In/Out     | Student, Team Leader |
| `/reports/daily`         | Daily Reports    | Admin, Instructor    |
| `/reports/student`       | Student Reports  | Admin, Instructor    |
| `/analytics`             | Analytics        | Admin, Instructor    |
| `/profile`               | Profile          | All authenticated    |

---

## Roles

The app supports four roles with cascading access:

| Role            | Key Permissions                                         |
| --------------- | ------------------------------------------------------- |
| **Admin**       | Full access — manage orgs, cohorts, instructors, users  |
| **Instructor**  | Manage courses, tasks, teams, view reports & analytics  |
| **Team Leader** | Create tasks, manage team submissions, check attendance |
| **Student**     | View tasks, submit work, chat, check attendance         |

---

## Features

- **Dashboard** — role-specific stats and recent activity
- **Task Management** — create, assign, track, submit, and review tasks
- **Teams** — create teams within courses, assign members and leaders
- **Real-time Chat** — General, Course, and Team chat rooms via Socket.io
- **Attendance** — daily check-in/check-out tracking
- **Notifications** — in-app notification bell with real-time updates
- **Analytics** — charts and metrics for admins/instructors (Recharts)
- **Dark Mode** — system-aware + manual toggle (Tailwind `class` strategy)
- **Role Guards** — routes and UI elements protected by role
- **Responsive** — mobile-friendly sidebar and layouts

---

## Authentication Flow

1. User logs in with email and password
2. Backend returns a JWT stored in localStorage
3. Token is decoded to extract user info (role, id, name, team)
4. Protected routes check authentication and role via `RoleGuard`
5. Sidebar and navigation adapt based on the user's role

---

## Environment

No `.env` file is needed for the frontend in development. The Vite proxy handles API routing:

```js
// vite.config.js — proxy /api to backend
proxy: {
  '/api': {
    target: 'http://localhost:5000',
    changeOrigin: true,
  },
}
```

For production builds, set `VITE_API_URL` if deploying frontend and backend separately.

---

## Scripts

| Command           | Description                        |
| ----------------- | ---------------------------------- |
| `npm run dev`     | Start Vite dev server (port 5173)  |
| `npm run build`   | Production build to `dist/`        |
| `npm run preview` | Preview production build locally   |
