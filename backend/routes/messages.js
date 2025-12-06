const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Message = require('../models/Message');
const Room = require('../models/Room');
const authMiddleware = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|mp4|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Get messages for a room
router.get('/:roomId', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;

    // Verify user is in the room
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (!room.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to access this room' });
    }

    const messages = await Message.find({ room: roomId })
      .populate('sender', 'username email profilePicture')
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip);

    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a message (typically handled by Socket.io, but also available via REST)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { content, roomId } = req.body;

    if (!content || !roomId) {
      return res.status(400).json({ message: 'Content and room ID are required' });
    }

    // Verify user is in the room
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (!room.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to send messages to this room' });
    }

    const message = new Message({
      content,
      sender: req.user._id,
      room: roomId
    });

    await message.save();
    await message.populate('sender', 'username email profilePicture');

    // Update room's last activity
    room.lastActivity = new Date();
    await room.save();

    res.status(201).json({ message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload file/image message
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { roomId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!roomId) {
      return res.status(400).json({ message: 'Room ID is required' });
    }

    // Verify user is in the room
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (!room.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to send messages to this room' });
    }

    // Determine message type
    const messageType = req.file.mimetype.startsWith('image/') ? 'image' : 'file';
    
    const message = new Message({
      content: req.file.originalname,
      sender: req.user._id,
      room: roomId,
      messageType,
      fileUrl: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    });

    await message.save();
    await message.populate('sender', 'username email profilePicture');

    // Update room's last activity
    room.lastActivity = new Date();
    await room.save();

    res.status(201).json({ message });
  } catch (error) {
    console.error('Upload message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
