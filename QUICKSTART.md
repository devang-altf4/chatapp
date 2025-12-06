# ChatFlow - Quick Start Guide

## 🚀 Your ChatFlow application is ready!

Both servers are currently running:
- **Backend**: http://localhost:3000
- **Frontend**: http://localhost:5173

## ✅ What's Been Set Up

### Backend (Port 3000)
✓ Express.js server with Socket.io
✓ MongoDB connection established
✓ JWT authentication system
✓ User, Message, and Room models
✓ Real-time messaging with Socket.io
✓ Typing indicators
✓ User presence tracking
✓ All REST API endpoints

### Frontend (Port 5173)
✓ React app with React Router
✓ Authentication pages (Login/Register)
✓ Main chat interface
✓ Real-time Socket.io integration
✓ Typing indicators
✓ Online/offline status
✓ Private & group chats
✓ Responsive design with custom CSS

## 🎯 Getting Started

1. **Open your browser** and navigate to: http://localhost:5173

2. **Register a new account**:
   - Click "Register here" 
   - Enter username, email, and password
   - Click "Register"

3. **Start chatting**:
   - Create a group room by clicking the "+" button
   - Or start a private chat by clicking on a user in the "Users" tab
   - Type your message and hit Send or press Enter

4. **Test with multiple users**:
   - Open another browser (or incognito window)
   - Register a different user
   - Start a conversation between the users
   - See real-time messages, typing indicators, and online status!

## 📋 Key Features to Test

### Authentication
- [x] Register new users
- [x] Login with credentials
- [x] Automatic redirect to chat after login
- [x] Logout functionality

### Messaging
- [x] Send messages in real-time
- [x] Messages appear instantly for all participants
- [x] Message timestamps
- [x] Sender identification

### Real-Time Features
- [x] Typing indicators ("User is typing...")
- [x] Online/offline status (green/gray dots)
- [x] Instant message delivery
- [x] Live updates when users join/leave

### Rooms
- [x] Create group chat rooms
- [x] Start private conversations
- [x] View participant count
- [x] See room activity

## 🔧 Configuration

### Backend Environment Variables (.env)
```
MONGO_URL=mongodb+srv://chatapp:devang123@cluster0.vurisq3.mongodb.net/chatflow?appName=Cluster0
PORT=3000
JWT_SECRET=your_super_secret_jwt_key_change_in_production
```

### Frontend Environment Variables (.env)
```
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

## 🐛 Troubleshooting

### Backend not connecting to MongoDB?
- Check your MongoDB connection string in `backend/.env`
- Ensure your IP is whitelisted in MongoDB Atlas
- Verify your username and password

### Frontend can't connect to backend?
- Ensure backend is running on port 3000
- Check CORS settings in `backend/index.js`
- Verify environment variables in `frontend/.env`

### Socket.io connection issues?
- Check browser console for errors
- Ensure JWT token is valid
- Verify Socket.io server is running (check backend terminal)

## 📦 Production Deployment Tips

1. **Security**:
   - Change JWT_SECRET to a strong, unique value
   - Use environment-specific .env files
   - Enable HTTPS
   - Add rate limiting

2. **Database**:
   - Use MongoDB Atlas for production
   - Set up proper indexes
   - Regular backups

3. **Frontend**:
   - Build for production: `npm run build`
   - Update VITE_API_URL to production backend URL
   - Deploy to Vercel, Netlify, or similar

4. **Backend**:
   - Use PM2 or similar for process management
   - Set up logging
   - Deploy to Heroku, Railway, or similar
   - Configure proper CORS origins

## 🎨 Customization

### Change Colors
Edit CSS variables in `frontend/my-project/src/App.css`:
```css
:root {
  --primary-color: #4f46e5;
  --secondary-color: #10b981;
  --danger-color: #ef4444;
  /* ... more variables */
}
```

### Add Features
- File uploads (images, documents)
- Message reactions (emojis)
- Message editing/deletion
- User profiles with avatars
- Read receipts
- Voice/video calls
- Message search
- Notifications

## 📚 API Documentation

Full API documentation is available in the main README.md file.

## 🎉 Enjoy Your Chat Application!

You now have a fully functional real-time chat application with:
- User authentication
- Private & group messaging
- Real-time updates
- Typing indicators
- User presence
- Message history
- And much more!

Happy chatting! 💬
