import Sidebar from '../components/Sidebar';
import ChatRoom from '../components/ChatRoom';
import { ChatProvider } from '../context/ChatContext';

const Home = () => {
  return (
    <ChatProvider>
      <div className="home-container">
        <Sidebar />
        <ChatRoom />
      </div>
    </ChatProvider>
  );
};

export default Home;
