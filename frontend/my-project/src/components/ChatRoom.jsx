import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useState } from 'react';

const ChatRoom = () => {
  const { currentRoom, onlineUsers, deleteRoom } = useChat();
  const { user } = useAuth();
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteRoom = async () => {
    if (!currentRoom) return;
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${getRoomName()}"? This will permanently delete all messages in this room.`
    );
    
    if (!confirmDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteRoom(currentRoom._id);
      setShowOptionsMenu(false);
    } catch (error) {
      alert('Failed to delete room. Please try again.');
    } finally {
      setIsDeleting(false);
    }
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
            <div className="options-menu-container">
              <button 
                className="btn-header-action" 
                title="More options"
                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19 13C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11C18.4477 11 18 11.4477 18 12C18 12.5523 18.4477 13 19 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5 13C5.55228 13 6 12.5523 6 12C6 11.4477 5.55228 11 5 11C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showOptionsMenu && (
                <div className="options-menu">
                  <button 
                    className="menu-item danger"
                    onClick={handleDeleteRoom}
                    disabled={isDeleting}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 6H5H21M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M10 11V17M14 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {isDeleting ? 'Deleting...' : 'Delete Room'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <MessageList />
      <MessageInput />
    </div>
  );
};

export default ChatRoom;
