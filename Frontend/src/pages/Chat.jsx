import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useWorkspace } from '../context/WorkspaceContext';
import ChatBox from '../components/ChatBox';
import { MessageSquare, Users, Globe, Briefcase, Hash } from 'lucide-react';

/**
 * Chat Page
 * Tabbed chat: General, Workspace-level, Team-level.
 * Respects internship isolation (filtered server-side in production).
 */
const Chat = () => {
  const { user } = useAuth();
  const { activeWorkspace, getLeadingTeam } = useWorkspace();
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'workspace', label: 'Workspace', icon: Briefcase },
    { id: 'team', label: 'Team', icon: Hash },
  ];

  // Resolve room IDs
  const getRoomId = () => {
    if (activeTab === 'general') return 'general';
    if (activeTab === 'workspace' && activeWorkspace) return `ws_${activeWorkspace.id}`;
    if (activeTab === 'team' && user.teamId) return `team_${user.teamId}`;
    return null;
  };

  const roomId = getRoomId();

  const noRoomMessage = () => {
    if (activeTab === 'workspace' && !activeWorkspace) {
      return { title: 'No Active Workspace', desc: 'Join or create a workspace to use workspace chat.' };
    }
    if (activeTab === 'team' && !user.teamId) {
      return { title: 'No Team Assigned', desc: 'You need to be part of a team to access team chat.' };
    }
    return null;
  };

  const msg = noRoomMessage();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Chat</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Communicate with your peers in real-time</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-primary-700 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Chat area */}
      {msg ? (
        <div className="flex items-center justify-center h-[calc(100vh-16rem)]">
          <div className="text-center">
            <Users size={64} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">{msg.title}</h2>
            <p className="text-gray-600 dark:text-gray-400">{msg.desc}</p>
          </div>
        </div>
      ) : (
        <div className="h-[calc(100vh-16rem)]">
          <ChatBox roomId={roomId} />
        </div>
      )}

      {/* Guidelines */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <MessageSquare size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-medium mb-1">Chat Guidelines</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-400">
              <li>Be respectful and professional</li>
              <li>Keep conversations relevant to your channel</li>
              <li>Messages are visible to all members of this channel</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
