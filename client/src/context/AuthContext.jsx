import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, getCurrentUser } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('librax_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize and verify existing session on page load
  useEffect(() => {
    async function loadUser() {
      const savedToken = localStorage.getItem('librax_token');
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await getCurrentUser();
        if (response?.user) {
          setUser(response.user);
          setToken(savedToken);
        } else {
          logout();
        }
      } catch (error) {
        console.warn('Session verification failed:', error.customMessage || error.message);
        logout();
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (email, password) => {
    const data = await loginUser({ email, password });
    if (data?.token && data?.user) {
      localStorage.setItem('librax_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    }
    throw new Error('Invalid login response from server.');
  };

  const register = async (name, email, password, role) => {
    const data = await registerUser({ name, email, password, role });
    if (data?.token && data?.user) {
      localStorage.setItem('librax_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    }
    throw new Error('Invalid registration response from server.');
  };

  const logout = () => {
    localStorage.removeItem('librax_token');
    localStorage.removeItem('librax_user');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
