# ChatFlow - Real-Time Chat Application

A modern, real-time chat application built with React, Node.js, Express, Socket.io, and MongoDB.

## Features

### ✅ User Authentication
- JWT-based registration and login system
- Secure password hashing with bcrypt
- Protected routes on both frontend and backend
- Persistent authentication with local storage

### ✅ Real-Time Messaging
- One-on-one private messaging
- Group chat rooms (create, join, leave)
- Socket.io for bidirectional real-time communication
- Message persistence in MongoDB
- Instant message delivery

### ✅ User Presence & Status
- Online/offline status indicators
- Real-time typing indicators ("User is typing...")
- Active users list
- Live user status updates

### ✅ Chat History
- Persistent message storage in MongoDB
- Load previous messages when joining a room
- Message timestamps
- Sender information with each message

## Tech Stack

### Frontend
- React 18+ (JSX)
- Socket.io-client for WebSocket connections
- Axios for HTTP requests
- React Router for navigation
- CSS for styling

### Backend
- Node.js with Express.js framework
- Socket.io for WebSocket server
- MongoDB with Mongoose ODM
- JWT (jsonwebtoken) for authentication
- bcryptjs for password hashing
- CORS middleware
- dotenv for environment variables

## Project Structure

```
chatapp/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── middleware/
│   │   └── auth.js               # JWT authentication middleware
│   ├── models/
│   │   ├── User.js               # User schema
│   │   ├── Message.js            # Message schema
│   │   └── Room.js               # Room schema
│   ├── routes/
│   │   ├── auth.js               # Authentication routes
│   │   ├── messages.js           # Message routes
│   │   ├── rooms.js              # Room routes
│   │   └── users.js              # User routes
│   ├── index.js                  # Main server file with Socket.io
│   ├── package.json
│   └── .env
│
└── frontend/
    └── my-project/
        ├── src/
        │   ├── components/
        │   │   ├── ChatRoom.jsx       # Main chat interface
        │   │   ├── MessageInput.jsx   # Message input with typing indicators
        │   │   ├── MessageList.jsx    # Message display
        │   │   ├── Sidebar.jsx        # Rooms and users sidebar
        │   │   └── ProtectedRoute.jsx # Route protection
        │   ├── context/
        │   │   ├── AuthContext.jsx    # Authentication state
        │   │   └── ChatContext.jsx    # Chat state & Socket.io
        │   ├── pages/
        │   │   ├── Home.jsx           # Main chat page
        │   │   ├── Login.jsx          # Login page
        │   │   └── Register.jsx       # Registration page
        │   ├── utils/
        │   │   ├── api.js             # Axios configuration
        │   │   └── socket.js          # Socket.io client setup
        │   ├── App.jsx
        │   ├── App.css
        │   ├── main.jsx
        │   └── index.css
        ├── package.json
        └── .env
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB installation
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `.env`:
```env
MONGO_URL=mongodb+srv://your-username:your-password@cluster.mongodb.net/chatflow?appName=Cluster0
PORT=3000
JWT_SECRET=your_super_secret_jwt_key_change_in_production
```

4. Start the backend server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The backend will run on `http://localhost:3000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend/my-project
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `frontend/.env`:
```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Usage

1. **Register**: Create a new account with username, email, and password
2. **Login**: Sign in with your credentials
3. **Create Room**: Click the "+" button to create a new group chat room
4. **Start Private Chat**: Go to the "Users" tab and click on any user to start a private conversation
5. **Send Messages**: Type your message and press Enter or click Send
6. **Real-Time Updates**: See typing indicators, online status, and messages in real-time

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/logout` - Logout user (protected)

### Rooms
- `GET /api/rooms` - Get all user's rooms (protected)
- `POST /api/rooms` - Create a new room (protected)
- `POST /api/rooms/private` - Create/get private room (protected)
- `GET /api/rooms/:roomId` - Get room details (protected)
- `POST /api/rooms/:roomId/join` - Join a room (protected)
- `POST /api/rooms/:roomId/leave` - Leave a room (protected)

### Messages
- `GET /api/messages/:roomId` - Get room messages (protected)
- `POST /api/messages` - Send a message (protected)

### Users
- `GET /api/users` - Get all users (protected)
- `GET /api/users/search?query=username` - Search users (protected)

## Socket.io Events

### Client → Server
- `join_rooms` - Join all user's rooms on connection
- `join_room` - Join a specific room
- `leave_room` - Leave a room
- `send_message` - Send a message to a room
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator

### Server → Client
- `new_message` - Receive a new message
- `typing_update` - Typing status update
- `user_status_change` - User online/offline status change
- `user_joined_room` - User joined a room
- `user_left_room` - User left a room
- `room_joined` - Confirmation of room join
- `error` - Error message

## Features in Detail

### Authentication Flow
1. User registers with username, email, and password
2. Password is hashed using bcrypt
3. JWT token is generated and returned
4. Token is stored in localStorage
5. Token is included in all API requests via Authorization header
6. Socket.io connection is authenticated using the same token

### Real-Time Communication
- Socket.io establishes WebSocket connection upon login
- All real-time events are handled through Socket.io
- Rooms are used for message broadcasting
- User presence is tracked through connection/disconnection events

### Message Persistence
- All messages are stored in MongoDB
- Messages are loaded when joining a room
- Message history is preserved indefinitely

### Typing Indicators
- Typing events are sent while user is typing
- Timeout automatically stops typing indicator after 1 second of inactivity
- Displays "User is typing..." for other participants

## Security Features

- Password hashing with bcrypt (10 salt rounds)
- JWT tokens with 7-day expiration
- Protected API routes using authentication middleware
- Socket.io authentication
- CORS configuration
- Input validation on both frontend and backend

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License

## Author

Built with ❤️ using React, Node.js, Socket.io, and MongoDB
