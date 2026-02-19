# HubConnect - Centralized Team Management Platform

A modern, production-ready web application for managing tasks, team communication, GitHub project tracking, and performance analytics.

## 🚀 Features

- **Light/Dark Theme** with localStorage persistence and system preference detection
- **Role-Based Authentication** (Admin, Instructor, Student, Team Leader)
- **Workspace Management** - Create and manage project workspaces with team isolation
- **Team Leader Role** - Scoped per workspace with task creation capabilities
- **Internship/Semester Isolation** - Filter users and tasks by active internship
- **Tabbed Chat System** - General, Workspace, and Team-specific channels
- **Task Management** with deadlines and assignments (Jira-like for Team Leaders)
- **Submission System** with GitHub integration
- **Real-Time Team Chat** using Socket.io with avatars and role indicators
- **User Profiles** with merged settings and preferences (theme, notifications)
- **Reusable Avatar Component** with initials fallback and role-colored rings
- **Performance Analytics** with interactive charts
- **Team Management** and member viewing
- **Notification System** with real-time updates
- **Fully Responsive** modern UI with Tailwind CSS dark mode support

## 📋 Prerequisites

- Node.js 16+ and npm/yarn
- Modern web browser

## 🛠️ Installation

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Start Development Server**

   ```bash
   npm run dev
   ```

3. **Open Browser**
   - Navigate to `http://localhost:3000`
   - Login with one of the demo accounts below

## 👥 Demo Accounts

| Role        | Email              | Password |
| ----------- | ------------------ | -------- |
| Admin       | admin@hub.com      | admin123 |
| Instructor  | instructor@hub.com | inst123  |
| Student     | student@hub.com    | stud123  |
| Team Leader | leader@hub.com     | lead123  |

## 📁 Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── Sidebar.jsx
│   ├── Navbar.jsx
│   ├── Avatar.jsx              # NEW: Reusable avatar with initials fallback
│   ├── ThemeToggle.jsx          # NEW: Light/Dark theme switcher
│   ├── RoleGuard.jsx
│   ├── TaskCard.jsx
│   ├── SubmissionModal.jsx
│   ├── ChatBox.jsx
│   └── NotificationBell.jsx
├── context/           # Global state management
│   ├── AuthContext.jsx
│   ├── NotificationContext.jsx
│   ├── ThemeContext.jsx         # NEW: Light/Dark theme provider
│   ├── InternshipContext.jsx    # NEW: Semester/internship isolation
│   └── WorkspaceContext.jsx     # NEW: Workspace CRUD & team management
├── hooks/             # Custom React hooks
│   ├── useAuth.js
│   └── useSocket.js
├── layouts/           # Page layouts
│   └── DashboardLayout.jsx
├── pages/             # Application pages
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── Tasks.jsx
│   ├── CreateTask.jsx
│   ├── TaskDetails.jsx
│   ├── Teams.jsx
│   ├── Chat.jsx                 # ENHANCED: Tabbed interface (General/Workspace/Team)
│   ├── Profile.jsx              # ENHANCED: Merged settings with preferences tab
│   ├── Workspaces.jsx           # NEW: List & create workspaces
│   ├── WorkspaceDetails.jsx     # NEW: Teams, members, task creation
│   ├── CheckInOut.jsx
│   ├── DailyReports.jsx
│   ├── StudentReport.jsx
│   ├── Analytics.jsx
│   └── NotFound.jsx
├── routes/            # Routing configuration
│   └── AppRoutes.jsx
├── services/          # API and Socket services
│   ├── api.js
│   └── socket.js
├── utils/             # Helper functions
│   ├── constants.js
│   └── helpers.js
├── App.jsx
└── main.jsx
```

## 🎨 Tech Stack

- **React 18** - UI library with functional components
- **Vite** - Build tool and dev server (lightning-fast HMR)
- **React Router v6** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework with dark mode support
- **Context API** - Global state management (Theme, Auth, Notifications, Workspace, Internship)
- **Axios** - HTTP client
- **Socket.io-client** - Real-time communication with MockSocket
- **Recharts** - Data visualization for analytics
- **Lucide React** - Modern icon library
- **JWT Decode** - Token decoding

## ✨ Key Enhancements

- **Dark Mode** - Complete dark theme applied to all 12+ pages and 7 components with Tailwind CSS `dark:` variants
- **Theme Persistence** - User theme preference saved to localStorage with system preference fallback
- **Avatar Component** - Reusable across entire app with image/initials fallback and role-colored rings
- **Workspace Isolation** - Separate project workspaces with team and task management
- **Team Leader Scoping** - Team leader role can be assigned per workspace for decentralized task creation
- **Internship Filtering** - Automatic visibility filtering by active semester/internship
- **Chat Enhancement** - Tabbed channels (General, Workspace, Team) with avatar display and role indicators in messages

## 🔐 Authentication Flow

1. User logs in with email and password
2. JWT token is generated and stored in localStorage
3. Token is decoded to extract user info (role, id, name, team)
4. Protected routes check authentication and role
5. Sidebar and navigation adapt based on role

## 👤 Role-Based Features

### Admin & Instructor

- View all tasks and submissions
- Create and assign tasks
- View analytics and team performance
- Access all teams

### Team Leader

- View team tasks
- Submit tasks on behalf of team
- Access team chat
- View team members

### Student

- View assigned tasks
- Access team chat
- View submission status
- View team members

## 💬 Real-Time Chat

- Team-based chat rooms
- Online user indicators
- Typing indicators
- Auto-scroll to latest messages
- Mock Socket.io implementation (works without backend)

## 📊 Analytics Dashboard

Available for Instructors and Admins:

- Submission statistics
- Timeline charts (Bar chart)
- On-time vs Late submissions (Pie chart)
- Team performance rankings
- Detailed team comparison table

## 🎯 API Mock System

The application uses a comprehensive mock API system that simulates:

- User authentication
- Task CRUD operations
- Submission tracking
- Team management
- Notifications
- Analytics data

**Note**: All data is stored in memory and resets on page refresh.

## 🚀 Building for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` directory.

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Collapsible sidebar on mobile
- Touch-friendly interface
- Optimized for all screen sizes

## 🎨 UI/UX Features

- Modern SaaS-style design
- Soft shadows and rounded corners
- Smooth transitions and animations
- Loading states and skeletons
- Error handling and validation
- Toast notifications (via context)
- Modal dialogs
- Dropdown menus

## ⚡ Performance Optimizations

- React.memo for expensive components
- Lazy loading for routes
- Optimized re-renders
- Efficient state management
- Code splitting
- Asset optimization

## 🔧 Environment Variables

No environment variables required for development. The app uses mock data.

For production with a real backend:

- Create `.env` file
- Add `VITE_API_URL=your_backend_url`
- Update `api.js` to use environment variable

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## 🐛 Troubleshooting

### Port already in use

```bash
# Change port in vite.config.js
server: {
  port: 3000
}
```

### Module not found

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 🔮 Future Enhancements

- Email notifications
- File upload to cloud storage
- Advanced search and filters
- Calendar view for deadlines
- GitHub API integration
- Real-time collaboration features
- Mobile app (React Native)
- Dark mode

## 📄 License

MIT License - feel free to use this project for learning or production.

## 👨‍💻 Development

This is a frontend-only application with mock backend. To integrate with a real backend:

1. Update API endpoints in `src/services/api.js`
2. Replace MockSocket with real Socket.io connection
3. Handle file uploads with multipart/form-data
4. Implement proper error handling
5. Add environment configuration

## 🤝 Contributing

This is a demo project, but feel free to fork and customize for your needs!

---

**Built with ❤️ using React + Vite + Tailwind CSS**
