import React, { useState, useEffect} from 'react';
import api from '../api/config';
import AuthContext from './context';


const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    token ? fetchCurrentUser() : setLoading(false);
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res && res.data) {
        setUser(res.data.user);
      } else {
        logout();
        setErrorMessage('Failed to fetch user data');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || 'Error fetching user data');
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (!res || !res.data) throw new Error((res && res.data && res.data.message) || 'Login failed');
    setUser(res.data.user);
    localStorage.setItem('token', res.data.token);
    setToken(res.data.token);
    return res.data;
  };

  const register = async (username, email, password) => {
   try {
     const res = await api.post('/auth/register', { username, email, password });    
    if (!res || !res.data) throw new Error((res && res.data && res.data.message) || 'Registration failed');
    const data = res.data;
    setUser(data.user);
    localStorage.setItem('token', data.token);
    setToken(data.token);
    return data;
   } catch (error) {
     setErrorMessage(error.response?.data?.message || 'Registration failed');
     console.error("Registration error:", error);
   }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, errorMessage, loading, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;