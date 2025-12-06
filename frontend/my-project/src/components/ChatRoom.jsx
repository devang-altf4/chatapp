import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const ChatRoom = () => {
  const { currentRoom, onlineUsers } = useChat();
  const { user } = useAuth();

  const getRoomName = () => {
    if (!currentRoom) return '';
    
    if (!currentRoom.isPrivate) return currentRoom.name;
    
    const otherUser = currentRoom.participants.find(p => 
      (p._id || p.id) !== user.id
    );
    return otherUser ? otherUser.username : 'Private Chat';
  };

  const getOnlineCount = () => {
    if (!currentRoom) return 0;
    
    return currentRoom.participants.filter(p => 
      onlineUsers.get(p._id || p.id)
    ).length;
  };

  const getInitials = (name) => {
    return name?.charAt(0).toUpperCase() || '?';
  };

  return (
    <div className="chat-room">
      {currentRoom && (
        <div className="chat-header">
          <div className="chat-header-left">
            <div className="chat-room-avatar">
              {currentRoom.isPrivate ? getInitials(getRoomName()) : '👥'}
            </div>
            <div className="chat-header-info">
              <h2>{getRoomName()}</h2>
              <p className="online-count">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.3503 17.623 3.8507 18.1676 4.55231C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {currentRoom.participants.length} members
              </p>
            </div>
          </div>
          <div className="chat-header-actions">
            <button className="btn-header-action" title="Search">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="btn-header-action" title="More options">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 13C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11C18.4477 11 18 11.4477 18 12C18 12.5523 18.4477 13 19 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5 13C5.55228 13 6 12.5523 6 12C6 11.4477 5.55228 11 5 11C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}
      
      <MessageList />
      <MessageInput />
    </div>
  );
};

export default ChatRoom;
