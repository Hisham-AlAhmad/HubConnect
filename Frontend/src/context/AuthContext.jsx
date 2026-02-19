import { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Create Auth Context
export const AuthContext = createContext(null);

// ── Local demo accounts (no backend needed) ────────────────
const DEMO_USERS = [
  { id: '1', email: 'admin@hub.com',      password: 'admin123', name: 'Admin User',       role: 'admin',       teamId: null },
  { id: '2', email: 'instructor@hub.com', password: 'inst123',  name: 'Instructor User',  role: 'instructor',  teamId: null },
  { id: '3', email: 'student@hub.com',    password: 'stud123',  name: 'Student User',     role: 'student',     teamId: 't1' },
  { id: '4', email: 'leader@hub.com',     password: 'lead123',  name: 'Team Leader User', role: 'team_leader', teamId: 't1' },
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hc_user');
      if (saved) setUser(JSON.parse(saved));
    } catch (_) {}
    setLoading(false);
  }, []);

  // ── Login ──────────────────────────────────────────────────
  const login = async (email, password) => {
    const match = DEMO_USERS.find(
      (u) => u.email === email && u.password === password
    );
    if (!match) {
      return { success: false, error: 'Invalid email or password.' };
    }
    const { password: _pw, ...profile } = match;
    setUser(profile);
    localStorage.setItem('hc_user', JSON.stringify(profile));

    if (profile.role === 'admin' || profile.role === 'instructor') {
      navigate('/dashboard');
    } else {
      navigate('/tasks');
    }
    return { success: true };
  };

  // ── Logout ─────────────────────────────────────────────────
  const logout = async () => {
    setUser(null);
    localStorage.removeItem('hc_user');
    navigate('/login');
  };

  // ── Role helpers ───────────────────────────────────────────
  const hasRole = (roles) => {
    if (!user) return false;
    if (Array.isArray(roles)) return roles.includes(user.role);
    return user.role === roles;
  };

  const isAuthenticated = () => !!user;

  // ── Update local user state after profile edit ─────────────
  const updateUser = (updatedData) => {
    setUser((prev) => {
      const next = { ...prev, ...updatedData };
      localStorage.setItem('hc_user', JSON.stringify(next));
      return next;
    });
  };

  const value = {
    user,
    token: user ? 'local-token' : null,
    loading,
    login,
    logout,
    hasRole,
    isAuthenticated,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
