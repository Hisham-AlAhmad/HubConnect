import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { InternshipProvider } from './context/InternshipContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
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
          <InternshipProvider>
            <WorkspaceProvider>
              <AppRoutes />
            </WorkspaceProvider>
          </InternshipProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
