const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Room = require('../models/Room');
const authMiddleware = require('../middleware/auth');

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
      .populate('sender', 'username email')
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
    await message.populate('sender', 'username email');

    // Update room's last activity
    room.lastActivity = new Date();
    await room.save();

    res.status(201).json({ message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
