import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Avatar from './Avatar';
import {
  LayoutDashboard,
  ListTodo,
  Users,
  MessageSquare,
  BarChart3,
  PlusCircle,
  LogOut,
  Clock,
  FileText,
  GraduationCap,
  Briefcase
} from 'lucide-react';

/**
 * Sidebar Component
 * Navigation sidebar with role-based menu items.
 * Fix: Create Task active-state no longer also highlights Tasks.
 */
const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();

  // Navigation items based on role
  const getNavItems = () => {
    const items = [
      {
        name: 'Dashboard',
        path: '/dashboard',
        icon: LayoutDashboard,
        roles: ['admin', 'instructor', 'student', 'team_leader'],
      },
      {
        name: 'Tasks',
        path: '/tasks',
        icon: ListTodo,
        roles: ['admin', 'instructor', 'student', 'team_leader'],
        /** exact match — /tasks/create should NOT make this active */
        end: true,
      },
    ];

    // Create Task for instructors and admins
    if (hasRole(['instructor', 'admin'])) {
      items.push({
        name: 'Create Task',
        path: '/tasks/create',
        icon: PlusCircle,
        roles: ['instructor', 'admin'],
      });
    }

    // Workspaces — admins, instructors, and team leaders can view
    items.push({
      name: 'Workspaces',
      path: '/workspaces',
      icon: Briefcase,
      roles: ['admin', 'instructor', 'student', 'team_leader'],
    });

    items.push({
      name: 'Teams',
      path: '/teams',
      icon: Users,
      roles: ['admin', 'instructor', 'student', 'team_leader'],
    });

    // Check In/Out for students and team leaders
    if (hasRole(['student', 'team_leader'])) {
      items.push({
        name: 'Check In/Out',
        path: '/attendance',
        icon: Clock,
        roles: ['student', 'team_leader'],
      });
    }

    // Chat for all roles that have access
    items.push({
      name: 'Chat',
      path: '/chat',
      icon: MessageSquare,
      roles: ['admin', 'instructor', 'student', 'team_leader'],
    });

    // Daily Reports
    if (hasRole(['instructor', 'admin'])) {
      items.push({
        name: 'Daily Reports',
        path: '/reports/daily',
        icon: FileText,
        roles: ['instructor', 'admin'],
      });
    }

    // Student Reports
    if (hasRole(['instructor', 'admin'])) {
      items.push({
        name: 'Student Reports',
        path: '/reports/student',
        icon: GraduationCap,
        roles: ['instructor', 'admin'],
      });
    }

    // Analytics
    if (hasRole(['instructor', 'admin'])) {
      items.push({
        name: 'Analytics',
        path: '/analytics',
        icon: BarChart3,
        roles: ['instructor', 'admin'],
      });
    }

    return items.filter((item) => item.roles.includes(user?.role));
  };

  const navItems = getNavItems();

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-white dark:bg-gray-800 shadow-soft-lg border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">H</span>
              </div>
              <span className="text-xl font-bold text-gray-800 dark:text-white">HubConnect</span>
            </div>
          </div>

          {/* User info */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Avatar name={user?.name || 'U'} imageUrl={user?.avatarUrl} size={40} role={user?.role} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize truncate">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.end || false}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors ${isActive
                          ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`
                      }
                    >
                      <Icon size={20} />
                      <span>{item.name}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout button */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full transition-colors"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
