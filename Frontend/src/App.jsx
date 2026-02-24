import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { CohortProvider } from './context/CohortContext';
import { CourseProvider } from './context/CourseContext';
import AppRoutes from './routes/AppRoutes';

/**
 * Main App Component
 * Wraps the application with context providers
 */
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <CohortProvider>
            <CourseProvider>
              <AppRoutes />
            </CourseProvider>
          </CohortProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
