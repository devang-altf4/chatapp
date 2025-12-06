import { useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';

const MessageList = () => {
  const { currentRoom, messages, typingUsers } = useChat();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentRoom]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!currentRoom) {
    return (
      <div className="no-room-selected">
        <div className="no-room-content">
          <div className="welcome-illustration">
            <svg width="300" height="200" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="50" y="40" width="80" height="120" rx="4" fill="#E5E7EB"/>
              <rect x="60" y="50" width="60" height="4" rx="2" fill="#9CA3AF"/>
              <rect x="60" y="60" width="40" height="4" rx="2" fill="#9CA3AF"/>
              <rect x="60" y="75" width="50" height="30" rx="2" fill="#4F46E5" opacity="0.2"/>
              <rect x="60" y="110" width="50" height="4" rx="2" fill="#9CA3AF"/>
              <rect x="60" y="120" width="35" height="4" rx="2" fill="#9CA3AF"/>
              <circle cx="190" cy="80" r="30" fill="#4F46E5" opacity="0.2"/>
              <path d="M190 70 L190 90 M180 80 L200 80" stroke="#4F46E5" strokeWidth="3" strokeLinecap="round"/>
              <rect x="160" y="120" width="90" height="40" rx="4" fill="#E5E7EB"/>
              <rect x="170" y="130" width="70" height="4" rx="2" fill="#9CA3AF"/>
              <rect x="170" y="140" width="50" height="4" rx="2" fill="#9CA3AF"/>
            </svg>
          </div>
          <h2>Welcome to ChatFlow</h2>
          <p>Start connecting. Select a room or start a new chat.</p>
          <div className="welcome-actions">
            <button className="btn-welcome-action">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Create New Room
            </button>
            <button className="btn-welcome-action secondary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.3503 17.623 3.8507 18.1676 4.55231C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Find Users
            </button>
          </div>
        </div>
      </div>
    );
  }

  const roomMessages = messages[currentRoom._id] || [];
  const roomTypingUsers = typingUsers[currentRoom._id] || [];

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="message-list">
      {roomMessages.length === 0 ? (
        <div className="no-messages">
          <p>No messages yet. Start the conversation!</p>
        </div>
      ) : (
        roomMessages.map((msg) => {
          const isOwnMessage = msg.sender._id === user.id || msg.sender.id === user.id;
          
          return (
            <div 
              key={msg._id} 
              className={`message ${isOwnMessage ? 'own-message' : 'other-message'}`}
            >
              {!isOwnMessage && (
                <div className="message-sender">{msg.sender.username}</div>
              )}
              <div className="message-content">
                <span className="message-text">{msg.content}</span>
                <span className="message-time">{formatTime(msg.timestamp)}</span>
              </div>
            </div>
          );
        })
      )}
      
      {roomTypingUsers.length > 0 && (
        <div className="typing-indicator">
          <span>
            {roomTypingUsers.map(u => u.username).join(', ')} 
            {roomTypingUsers.length === 1 ? ' is' : ' are'} typing...
          </span>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
