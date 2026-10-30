import React, { createContext, useContext, useState, useEffect } from 'react';
import { axiosClient } from '../api/axios_client';
import { useAppDispatch } from '../store/hooks';
import { setCredentials, setUser as setReduxUser, logout as logoutRedux } from '../modules/auth/slices/authSlice';
import { baseApi } from '../store/baseApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const dispatch = useAppDispatch();
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      axiosClient.get('/auth/me/')
        .then((res) => {
          setUser(res.data);
          dispatch(setReduxUser(res.data));
          localStorage.setItem('user', JSON.stringify(res.data));
        })
        .catch(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          setUser(null);
          dispatch(logoutRedux());
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [dispatch]);

  const login = async (email, password) => {
    const res = await axiosClient.post('/auth/login/', { email, password });
    localStorage.setItem('access_token', res.data.access);
    localStorage.setItem('refresh_token', res.data.refresh);

    const userRes = await axiosClient.get('/auth/me/');
    setUser(userRes.data);
    dispatch(setCredentials({
      user: userRes.data,
      access: res.data.access,
      refresh: res.data.refresh,
    }));
    localStorage.setItem('user', JSON.stringify(userRes.data));
    return userRes.data;
  };

  const register = async (email, password, confirmPassword) => {
    const res = await axiosClient.post('/auth/register/', {
      email,
      password,
      confirm_password: confirmPassword,
    });
    localStorage.setItem('access_token', res.data.tokens.access);
    localStorage.setItem('refresh_token', res.data.tokens.refresh);
    setUser(res.data.user);
    dispatch(setCredentials({
      user: res.data.user,
      access: res.data.tokens.access,
      refresh: res.data.tokens.refresh,
    }));
    localStorage.setItem('user', JSON.stringify(res.data.user));
    return res.data.user;
  };

  const logout = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        await axiosClient.post('/auth/logout/', { refresh });
      }
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      setUser(null);
      dispatch(logoutRedux());
      dispatch(baseApi.util.resetApiState());
    }
  };

  const refreshUser = async () => {
    try {
      const res = await axiosClient.get('/auth/me/');
      setUser(res.data);
      dispatch(setReduxUser(res.data));
      localStorage.setItem('user', JSON.stringify(res.data));
    } catch (e) {
      // Keep existing user state on silent failure
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
