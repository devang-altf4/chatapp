import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ChatRoom from '../components/ChatRoom';
import { ChatProvider } from '../context/ChatContext';

const Home = () => {
  const [activeView, setActiveView] = useState('chats');

  return (
    <ChatProvider>
      <div className="home-container">
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
        <ChatRoom activeView={activeView} />
      </div>
    </ChatProvider>
  );
};

export default Home;
