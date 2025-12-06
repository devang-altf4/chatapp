require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Message = require('./models/Message');
const Room = require('./models/Room');

// Import routes
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const messageRoutes = require('./routes/messages');
const userRoutes = require('./routes/users');

const app = express();
const server = http.createServer(app);

// CORS configuration
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ChatFlow server is running' });
});

// Socket.io user tracking
const onlineUsers = new Map(); // socketId -> userId
const userSockets = new Map(); // userId -> Set of socketIds
const typingUsers = new Map(); // roomId -> Set of userIds

// Socket.io authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user._id.toString();
    socket.username = user.username;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Socket.io connection handling
io.on('connection', async (socket) => {
  console.log(`User connected: ${socket.username} (${socket.id})`);

  // Track user connection
  onlineUsers.set(socket.id, socket.userId);
  
  if (!userSockets.has(socket.userId)) {
    userSockets.set(socket.userId, new Set());
  }
  userSockets.get(socket.userId).add(socket.id);

  // Update user online status
  try {
    await User.findByIdAndUpdate(socket.userId, { 
      isOnline: true,
      lastSeen: new Date()
    });

    // Notify all users about online status change
    io.emit('user_status_change', {
      userId: socket.userId,
      username: socket.username,
      isOnline: true
    });
  } catch (error) {
    console.error('Error updating user status:', error);
  }

  // Join user's rooms
  socket.on('join_rooms', async () => {
    try {
      const rooms = await Room.find({ participants: socket.userId });
      rooms.forEach(room => {
        socket.join(room._id.toString());
      });
      console.log(`${socket.username} joined ${rooms.length} rooms`);
    } catch (error) {
      console.error('Error joining rooms:', error);
    }
  });

  // Join a specific room
  socket.on('join_room', async (roomId) => {
    try {
      const room = await Room.findById(roomId);
      
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (!room.participants.some(p => p.toString() === socket.userId)) {
        socket.emit('error', { message: 'Not authorized to join this room' });
        return;
      }

      socket.join(roomId);
      console.log(`${socket.username} joined room ${roomId}`);

      // Send room joined confirmation
      socket.emit('room_joined', { roomId });
      
      // Notify others in the room
      socket.to(roomId).emit('user_joined_room', {
        roomId,
        userId: socket.userId,
        username: socket.username
      });
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Error joining room' });
    }
  });

  // Leave a room
  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    console.log(`${socket.username} left room ${roomId}`);
    
    socket.to(roomId).emit('user_left_room', {
      roomId,
      userId: socket.userId,
      username: socket.username
    });
  });

  // Send message
  socket.on('send_message', async (data) => {
    try {
      const { content, roomId } = data;

      if (!content || !roomId) {
        socket.emit('error', { message: 'Content and room ID are required' });
        return;
      }

      // Verify user is in the room
      const room = await Room.findById(roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (!room.participants.some(p => p.toString() === socket.userId)) {
        socket.emit('error', { message: 'Not authorized to send messages to this room' });
        return;
      }

      // Create message
      const message = new Message({
        content,
        sender: socket.userId,
        room: roomId
      });

      await message.save();
      await message.populate('sender', 'username email isOnline');

      // Update room's last activity
      room.lastActivity = new Date();
      await room.save();

      // Send message to all users in the room
      io.to(roomId).emit('new_message', {
        message: {
          _id: message._id,
          content: message.content,
          sender: message.sender,
          room: message.room,
          timestamp: message.timestamp
        }
      });

      // Clear typing indicator for this user
      const typingInRoom = typingUsers.get(roomId);
      if (typingInRoom) {
        typingInRoom.delete(socket.userId);
        io.to(roomId).emit('typing_update', {
          roomId,
          typingUsers: Array.from(typingInRoom)
        });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Error sending message' });
    }
  });

  // Handle file upload broadcast
  socket.on('file_uploaded', async (data) => {
    try {
      const { message, roomId } = data;
      
      // Broadcast to other users in the room
      socket.to(roomId).emit('file_uploaded', {
        message
      });
    } catch (error) {
      console.error('Error broadcasting file upload:', error);
    }
  });

  // Typing indicator
  socket.on('typing_start', async ({ roomId }) => {
    try {
      if (!typingUsers.has(roomId)) {
        typingUsers.set(roomId, new Set());
      }
      
      typingUsers.get(roomId).add(socket.userId);
      
      socket.to(roomId).emit('typing_update', {
        roomId,
        userId: socket.userId,
        username: socket.username,
        isTyping: true
      });
    } catch (error) {
      console.error('Error handling typing start:', error);
    }
  });

  socket.on('typing_stop', async ({ roomId }) => {
    try {
      const typingInRoom = typingUsers.get(roomId);
      if (typingInRoom) {
        typingInRoom.delete(socket.userId);
        
        socket.to(roomId).emit('typing_update', {
          roomId,
          userId: socket.userId,
          username: socket.username,
          isTyping: false
        });
      }
    } catch (error) {
      console.error('Error handling typing stop:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    console.log(`User disconnected: ${socket.username} (${socket.id})`);

    // Remove socket from tracking
    onlineUsers.delete(socket.id);
    
    const userSocketSet = userSockets.get(socket.userId);
    if (userSocketSet) {
      userSocketSet.delete(socket.id);
      
      // If user has no more active connections, update status
      if (userSocketSet.size === 0) {
        userSockets.delete(socket.userId);
        
        try {
          await User.findByIdAndUpdate(socket.userId, { 
            isOnline: false,
            lastSeen: new Date()
          });

          // Notify all users about offline status
          io.emit('user_status_change', {
            userId: socket.userId,
            username: socket.username,
            isOnline: false
          });
        } catch (error) {
          console.error('Error updating user status on disconnect:', error);
        }
      }
    }

    // Clear typing indicators
    typingUsers.forEach((users, roomId) => {
      if (users.has(socket.userId)) {
        users.delete(socket.userId);
        io.to(roomId).emit('typing_update', {
          roomId,
          userId: socket.userId,
          username: socket.username,
          isTyping: false
        });
      }
    });
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`ChatFlow server running on port ${PORT}`);
});
