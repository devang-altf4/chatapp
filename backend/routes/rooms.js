const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const Message = require('../models/Message');
const authMiddleware = require('../middleware/auth');

// Get all rooms for a user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const rooms = await Room.find({
      participants: req.user._id
    })
    .populate('participants', 'username email isOnline')
    .populate('createdBy', 'username')
    .sort({ lastActivity: -1 });

    res.json({ rooms });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new room (group chat)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, participants } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Room name is required' });
    }

    // Add creator to participants if not already included
    const participantIds = [...new Set([req.user._id.toString(), ...(participants || [])])];

    const room = new Room({
      name,
      isPrivate: false,
      participants: participantIds,
      createdBy: req.user._id
    });

    await room.save();
    await room.populate('participants', 'username email isOnline');

    res.status(201).json({ room });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get or create a private room between two users
router.post('/private', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Check if private room already exists
    let room = await Room.findOne({
      isPrivate: true,
      participants: { $all: [req.user._id, userId], $size: 2 }
    }).populate('participants', 'username email isOnline');

    if (!room) {
      // Create new private room
      const participantIds = [req.user._id, userId];
      
      room = new Room({
        name: 'Private Chat',
        isPrivate: true,
        participants: participantIds,
        createdBy: req.user._id
      });

      await room.save();
      await room.populate('participants', 'username email isOnline');
    }

    res.json({ room });
  } catch (error) {
    console.error('Private room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Join a room
router.post('/:roomId/join', authMiddleware, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is already in the room
    if (room.participants.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already in this room' });
    }

    room.participants.push(req.user._id);
    await room.save();
    await room.populate('participants', 'username email isOnline');

    res.json({ room });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Leave a room
router.post('/:roomId/leave', authMiddleware, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    room.participants = room.participants.filter(
      p => p.toString() !== req.user._id.toString()
    );

    await room.save();

    res.json({ message: 'Left room successfully' });
  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get room details
router.get('/:roomId', authMiddleware, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId)
      .populate('participants', 'username email isOnline')
      .populate('createdBy', 'username');

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is a participant
    if (!room.participants.some(p => p._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to access this room' });
    }

    res.json({ room });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
