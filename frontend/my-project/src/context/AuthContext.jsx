import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { initializeSocket, disconnectSocket, getSocket } from '../utils/socket';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          initializeSocket(storedToken);
          const socket = getSocket();
          if (socket) {
            socket.emit('join_rooms');
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setToken(token);
      setUser(user);
      
      initializeSocket(token);
      const socket = getSocket();
      if (socket) {
        socket.emit('join_rooms');
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (username, email, password, profilePicture) => {
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('email', email);
      formData.append('password', password);
      if (profilePicture) {
        formData.append('profilePicture', profilePicture);
      }

      const response = await api.post('/auth/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setToken(token);
      setUser(user);
      
      initializeSocket(token);
      const socket = getSocket();
      if (socket) {
        socket.emit('join_rooms');
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      disconnectSocket();
    }
  };

  const updateProfile = async (username, profilePicture) => {
    try {
      const formData = new FormData();
      formData.append('username', username);
      if (profilePicture) {
        formData.append('profilePicture', profilePicture);
      }

      // Don't set Content-Type header manually - let axios set it with the correct boundary
      const response = await api.put('/users/profile', formData);

      const { user: updatedUser } = response.data;

      // Update local storage and state
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update profile'
      };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
