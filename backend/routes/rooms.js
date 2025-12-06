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
    .populate('participants', 'username email isOnline profilePicture')
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
    await room.populate('participants', 'username email isOnline profilePicture');

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
    }).populate('participants', 'username email isOnline profilePicture');

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
      await room.populate('participants', 'username email isOnline profilePicture');
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
    await room.populate('participants', 'username email isOnline profilePicture');

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
      .populate('participants', 'username email isOnline profilePicture')
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

// Add participants to a room
router.put('/:roomId/participants', authMiddleware, async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'User IDs are required' });
    }

    const room = await Room.findById(req.params.roomId);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is a participant
    if (!room.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to add participants' });
    }

    // Don't allow adding users to private chats
    if (room.isPrivate) {
      return res.status(400).json({ message: 'Cannot add users to private chats' });
    }

    // Add new participants (avoid duplicates)
    userIds.forEach(userId => {
      if (!room.participants.some(p => p.toString() === userId)) {
        room.participants.push(userId);
      }
    });

    await room.save();
    await room.populate('participants', 'username email isOnline profilePicture');

    res.json({ room });
  } catch (error) {
    console.error('Add participants error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a room
router.delete('/:roomId', authMiddleware, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is the creator or a participant
    const isCreator = room.createdBy.toString() === req.user._id.toString();
    const isParticipant = room.participants.some(p => p.toString() === req.user._id.toString());

    if (!isCreator && !isParticipant) {
      return res.status(403).json({ message: 'Not authorized to delete this room' });
    }

    // Delete all messages in the room
    await Message.deleteMany({ room: req.params.roomId });

    // Delete the room
    await Room.findByIdAndDelete(req.params.roomId);

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
