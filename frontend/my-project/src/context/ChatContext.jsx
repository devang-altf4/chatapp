import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getSocket } from '../utils/socket';
import api from '../utils/api';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Map());
  const [typingUsers, setTypingUsers] = useState({});
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (isAuthenticated) {
      loadRooms();
      loadUsers();
      setupSocketListeners();
    }

    return () => {
      cleanupSocketListeners();
    };
  }, [isAuthenticated]);

  const setupSocketListeners = () => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('new_message', ({ message }) => {
      setMessages(prev => ({
        ...prev,
        [message.room]: [...(prev[message.room] || []), message]
      }));
    });

    socket.on('file_uploaded', ({ message }) => {
      setMessages(prev => ({
        ...prev,
        [message.room]: [...(prev[message.room] || []), message]
      }));
    });

    socket.on('typing_update', ({ roomId, userId, username, isTyping }) => {
      setTypingUsers(prev => {
        const roomTyping = prev[roomId] || [];
        if (isTyping) {
          if (!roomTyping.find(u => u.userId === userId)) {
            return {
              ...prev,
              [roomId]: [...roomTyping, { userId, username }]
            };
          }
        } else {
          return {
            ...prev,
            [roomId]: roomTyping.filter(u => u.userId !== userId)
          };
        }
        return prev;
      });
    });

    socket.on('user_status_change', ({ userId, username, isOnline }) => {
      setOnlineUsers(prev => {
        const newMap = new Map(prev);
        newMap.set(userId, isOnline);
        return newMap;
      });
      
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, isOnline } : u
      ));
    });

    socket.on('user_joined_room', ({ roomId, userId, username }) => {
      console.log(`${username} joined room ${roomId}`);
    });

    socket.on('user_left_room', ({ roomId, userId, username }) => {
      console.log(`${username} left room ${roomId}`);
    });

    socket.on('error', ({ message }) => {
      console.error('Socket error:', message);
    });
  };

  const cleanupSocketListeners = () => {
    const socket = getSocket();
    if (!socket) return;

    socket.off('new_message');
    socket.off('typing_update');
    socket.off('user_status_change');
    socket.off('user_joined_room');
    socket.off('user_left_room');
    socket.off('error');
  };

  const loadRooms = async () => {
    try {
      const response = await api.get('/rooms');
      setRooms(response.data.rooms);
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get('/users');
      // Normalize user IDs to ensure consistency
      const normalizedUsers = response.data.users.map(u => ({
        ...u,
        id: u._id || u.id,
        _id: u._id || u.id
      }));
      setUsers(normalizedUsers);
      
      const onlineMap = new Map();
      normalizedUsers.forEach(u => {
        onlineMap.set(u.id || u._id, u.isOnline);
      });
      setOnlineUsers(onlineMap);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadMessages = async (roomId) => {
    try {
      const response = await api.get(`/messages/${roomId}`);
      setMessages(prev => ({
        ...prev,
        [roomId]: response.data.messages
      }));
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const joinRoom = (room) => {
    const socket = getSocket();
    if (!socket) return;

    setCurrentRoom(room);
    socket.emit('join_room', room._id);
    
    if (!messages[room._id]) {
      loadMessages(room._id);
    }
  };

  const leaveRoom = () => {
    const socket = getSocket();
    if (!socket || !currentRoom) return;

    socket.emit('leave_room', currentRoom._id);
    setCurrentRoom(null);
  };

  const sendMessage = (content) => {
    const socket = getSocket();
    if (!socket || !currentRoom) return;

    socket.emit('send_message', {
      content,
      roomId: currentRoom._id
    });
  };

  const sendFileMessage = async (file) => {
    try {
      if (!currentRoom) return;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('roomId', currentRoom._id);

      const response = await api.post('/messages/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Add the message to state
      setMessages(prev => ({
        ...prev,
        [currentRoom._id]: [...(prev[currentRoom._id] || []), response.data.message]
      }));

      // Emit socket event to notify other users
      const socket = getSocket();
      if (socket) {
        socket.emit('file_uploaded', {
          message: response.data.message,
          roomId: currentRoom._id
        });
      }

      return response.data.message;
    } catch (error) {
      console.error('Error sending file:', error);
      throw error;
    }
  };

  const startTyping = () => {
    const socket = getSocket();
    if (!socket || !currentRoom) return;

    socket.emit('typing_start', { roomId: currentRoom._id });
  };

  const stopTyping = () => {
    const socket = getSocket();
    if (!socket || !currentRoom) return;

    socket.emit('typing_stop', { roomId: currentRoom._id });
  };

  const createRoom = async (name, participants = []) => {
    try {
      const response = await api.post('/rooms', { name, participants });
      setRooms(prev => [...prev, response.data.room]);
      return response.data.room;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  };

  const createPrivateRoom = async (userId) => {
    try {
      const response = await api.post('/rooms/private', { userId });
      const room = response.data.room;
      
      setRooms(prev => {
        const exists = prev.find(r => r._id === room._id);
        if (exists) return prev;
        return [...prev, room];
      });
      
      return room;
    } catch (error) {
      console.error('Error creating private room:', error);
      throw error;
    }
  };

  const deleteRoom = async (roomId) => {
    try {
      await api.delete(`/rooms/${roomId}`);
      
      // Remove room from state
      setRooms(prev => prev.filter(r => r._id !== roomId));
      
      // Clear current room if it's the one being deleted
      if (currentRoom?._id === roomId) {
        setCurrentRoom(null);
      }
      
      // Clear messages for this room
      setMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[roomId];
        return newMessages;
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting room:', error);
      throw error;
    }
  };

  const value = {
    rooms,
    currentRoom,
    messages,
    onlineUsers,
    typingUsers,
    users,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendFileMessage,
    startTyping,
    stopTyping,
    createRoom,
    createPrivateRoom,
    deleteRoom,
    loadRooms,
    loadUsers,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
