import { createContext, useContext, useState, useEffect } from 'react';
import axios from '../lib/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Revisa si ya hay una sesión activa al cargar
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get('/api/user');
        setUser(response.data);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const csrf = () => axios.get('/sanctum/csrf-cookie');

  const login = async (data) => {
    await csrf();
    await axios.post('/login', data);
    const response = await axios.get('/api/user');
    setUser(response.data);
  };

  const register = async (data) => {
    await csrf();
    await axios.post('/register', data);
    const response = await axios.get('/api/user');
    setUser(response.data);
  };

  const logout = async () => {
    await axios.post('/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
