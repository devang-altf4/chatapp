# ChatFlow - Technical Architecture

## System Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│  React Frontend │◄───────►│  Express + WS   │◄───────►│    MongoDB      │
│   (Port 5173)   │  HTTP/  │  (Port 3000)    │  Mongoose│   Database      │
│                 │  Socket │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

## Component Architecture

### Frontend (React)

```
App.jsx (Router & AuthProvider)
│
├── Login/Register Pages (Public Routes)
│   ├── Login.jsx
│   └── Register.jsx
│
└── Home Page (Protected Route)
    └── ChatProvider
        ├── Sidebar.jsx
        │   ├── Room List
        │   └── User List
        │
        └── ChatRoom.jsx
            ├── MessageList.jsx
            └── MessageInput.jsx
```

### Context Providers

**AuthContext**
- Manages user authentication state
- Handles login/register/logout
- Stores JWT token
- Initializes Socket.io connection

**ChatContext**
- Manages chat state (rooms, messages, users)
- Handles Socket.io events
- Provides chat operations (send message, typing, etc.)
- Tracks online users and typing indicators

### Backend (Node.js + Express)

```
index.js (Main Server)
│
├── HTTP Server (Express)
│   ├── CORS Middleware
│   ├── JSON Parser
│   └── Routes
│       ├── /api/auth (Authentication)
│       ├── /api/rooms (Room Management)
│       ├── /api/messages (Message Operations)
│       └── /api/users (User Operations)
│
└── WebSocket Server (Socket.io)
    ├── Authentication Middleware
    ├── Connection Handler
    └── Event Handlers
        ├── join_rooms
        ├── join_room
        ├── send_message
        ├── typing_start
        ├── typing_stop
        └── disconnect
```

## Data Models

### User Model
```javascript
{
  _id: ObjectId,
  username: String (unique, required),
  email: String (unique, required),
  password: String (hashed),
  isOnline: Boolean,
  lastSeen: Date,
  createdAt: Date
}
```

### Room Model
```javascript
{
  _id: ObjectId,
  name: String,
  isPrivate: Boolean,
  participants: [ObjectId] (ref: User),
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  lastActivity: Date
}
```

### Message Model
```javascript
{
  _id: ObjectId,
  content: String,
  sender: ObjectId (ref: User),
  room: ObjectId (ref: Room),
  timestamp: Date,
  readBy: [ObjectId] (ref: User)
}
```

## Authentication Flow

```
1. User Registration/Login
   ├── Client sends credentials to /api/auth/register or /api/auth/login
   ├── Server validates input
   ├── Password is hashed (bcrypt)
   ├── JWT token is generated
   └── Token returned to client

2. Token Storage
   ├── Client stores token in localStorage
   └── Client stores user data in localStorage

3. Authenticated Requests
   ├── Client includes token in Authorization header
   ├── Server validates token via authMiddleware
   ├── User object attached to request
   └── Request proceeds to route handler

4. Socket.io Authentication
   ├── Client connects with token in auth handshake
   ├── Server validates token in Socket.io middleware
   ├── User ID and username attached to socket
   └── Connection established
```

## Real-Time Communication Flow

### Sending a Message

```
1. User types message and clicks Send
   ├── MessageInput captures text
   └── Calls sendMessage() from ChatContext

2. Client emits 'send_message' event
   ├── Content and roomId sent to server
   └── Via Socket.io

3. Server receives event
   ├── Validates user and room
   ├── Creates Message document in MongoDB
   ├── Updates room lastActivity
   └── Emits 'new_message' to all room participants

4. All clients in room receive event
   ├── ChatContext updates messages state
   └── MessageList re-renders with new message
```

### Typing Indicators

```
1. User starts typing
   ├── MessageInput onChange event
   └── Calls startTyping()

2. Server receives 'typing_start'
   ├── Tracks user in typingUsers Map
   └── Broadcasts 'typing_update' to room

3. Clients receive update
   ├── ChatContext updates typingUsers state
   └── "User is typing..." appears

4. After 1 second of inactivity
   ├── Client calls stopTyping()
   ├── Server removes user from typingUsers
   └── Typing indicator disappears
```

### User Presence

```
1. User connects
   ├── Socket.io connection established
   ├── Server updates User.isOnline to true
   └── Broadcasts 'user_status_change' to all clients

2. User disconnects
   ├── Socket.io disconnect event fires
   ├── Server updates User.isOnline to false
   ├── Sets User.lastSeen to current time
   └── Broadcasts 'user_status_change' to all clients

3. Clients receive status change
   ├── Updates onlineUsers Map in ChatContext
   └── UI shows green (online) or gray (offline) indicator
```

## State Management

### Frontend State

**AuthContext State**
- `user`: Current authenticated user
- `token`: JWT authentication token
- `loading`: Authentication loading state
- `isAuthenticated`: Boolean authentication status

**ChatContext State**
- `rooms`: Array of user's rooms
- `currentRoom`: Currently active room
- `messages`: Object mapping roomId to messages array
- `onlineUsers`: Map of userId to online status
- `typingUsers`: Object mapping roomId to typing users
- `users`: Array of all users

### Backend State

**Socket.io State**
- `onlineUsers`: Map of socketId to userId
- `userSockets`: Map of userId to Set of socketIds
- `typingUsers`: Map of roomId to Set of userIds

## API Endpoints

### Authentication Endpoints
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Authenticate user
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/logout` - Logout user (protected)

### Room Endpoints
- `GET /api/rooms` - Get user's rooms (protected)
- `POST /api/rooms` - Create group room (protected)
- `POST /api/rooms/private` - Create/get private room (protected)
- `GET /api/rooms/:roomId` - Get room details (protected)
- `POST /api/rooms/:roomId/join` - Join room (protected)
- `POST /api/rooms/:roomId/leave` - Leave room (protected)

### Message Endpoints
- `GET /api/messages/:roomId` - Get room messages (protected)
- `POST /api/messages` - Send message (protected)

### User Endpoints
- `GET /api/users` - Get all users (protected)
- `GET /api/users/search` - Search users (protected)

## Socket.io Events

### Client → Server Events
| Event | Payload | Description |
|-------|---------|-------------|
| `join_rooms` | - | Join all user's rooms on connect |
| `join_room` | `roomId` | Join specific room |
| `leave_room` | `roomId` | Leave room |
| `send_message` | `{content, roomId}` | Send message to room |
| `typing_start` | `{roomId}` | Start typing in room |
| `typing_stop` | `{roomId}` | Stop typing in room |

### Server → Client Events
| Event | Payload | Description |
|-------|---------|-------------|
| `new_message` | `{message}` | New message received |
| `typing_update` | `{roomId, userId, username, isTyping}` | Typing status changed |
| `user_status_change` | `{userId, username, isOnline}` | User online status changed |
| `user_joined_room` | `{roomId, userId, username}` | User joined room |
| `user_left_room` | `{roomId, userId, username}` | User left room |
| `room_joined` | `{roomId}` | Confirmation of room join |
| `error` | `{message}` | Error occurred |

## Security Measures

### Authentication Security
- Passwords hashed with bcrypt (10 salt rounds)
- JWT tokens with 7-day expiration
- Tokens stored in localStorage
- Automatic token refresh on API calls
- Automatic logout on 401 responses

### API Security
- CORS configured for specific origin
- All sensitive routes protected with authMiddleware
- JWT verification on each protected request
- User authorization checks for room access

### Socket.io Security
- Authentication middleware validates JWT on connection
- User verification before emitting events
- Room participation verification before message send
- Sanitized error messages to clients

## Performance Optimizations

### Database
- Indexes on frequently queried fields
- Efficient populate() queries
- Pagination support for messages
- Connection pooling with Mongoose

### Frontend
- React context to avoid prop drilling
- Efficient re-rendering with proper keys
- Debounced typing indicators
- Lazy loading for message history

### Socket.io
- Room-based broadcasting (not global)
- Efficient user tracking with Maps
- Connection cleanup on disconnect
- Automatic reconnection handling

## Scalability Considerations

### Current Limitations
- Single server instance
- In-memory state for Socket.io
- No horizontal scaling support

### Future Improvements
- Redis adapter for Socket.io (multi-server)
- Message queue (RabbitMQ/Kafka)
- Load balancer
- Microservices architecture
- CDN for static assets
- Database sharding
- Caching layer (Redis)

## Testing Strategy

### Unit Tests
- User model validation
- Password hashing/comparison
- JWT token generation/verification
- Message creation and validation

### Integration Tests
- Authentication flow
- Room creation and joining
- Message sending and receiving
- User presence tracking

### E2E Tests
- Complete user registration and login
- Creating and joining rooms
- Sending and receiving messages
- Real-time features (typing, presence)

## Monitoring & Logging

### Recommended Tools
- **Application Monitoring**: New Relic, DataDog
- **Error Tracking**: Sentry
- **Logging**: Winston, Morgan
- **Analytics**: Google Analytics, Mixpanel

### Key Metrics to Track
- Active connections
- Message delivery time
- API response times
- Error rates
- User engagement
- Database query performance

## Deployment Architecture

### Production Setup

```
┌─────────────┐
│   CDN       │ (Static Assets)
└──────┬──────┘
       │
┌──────▼──────┐
│ Load        │
│ Balancer    │
└──────┬──────┘
       │
   ┌───┴───┬────────┬────────┐
   │       │        │        │
┌──▼──┐ ┌──▼──┐ ┌───▼──┐ ┌──▼──┐
│App 1│ │App 2│ │App 3 │ │App N│
└──┬──┘ └──┬──┘ └───┬──┘ └──┬──┘
   │       │        │       │
   └───┬───┴────────┴───┬───┘
       │                │
   ┌───▼───┐        ┌───▼────┐
   │ Redis │        │MongoDB │
   │Adapter│        │Cluster │
   └───────┘        └────────┘
```

## Environment Variables

### Backend (.env)
```env
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/chatflow
PORT=3000
JWT_SECRET=your_secret_key
NODE_ENV=production
```

### Frontend (.env)
```env
VITE_API_URL=https://api.yourapp.com
VITE_SOCKET_URL=https://api.yourapp.com
```

## Code Quality

### Linting
- ESLint for JavaScript/JSX
- Prettier for code formatting

### Best Practices
- Consistent naming conventions
- Proper error handling
- Input validation
- Comment complex logic
- Follow RESTful principles
- Use async/await over callbacks
- Proper TypeScript types (if migrating)

---

This architecture provides a solid foundation for a production-ready chat application with room for growth and scalability.
