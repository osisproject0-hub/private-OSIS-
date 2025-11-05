import React, { useState } from 'react';
import { useAuth } from '../App';
import { DashboardIcon, ChatIcon, AdminIcon, SettingsIcon, LogoutIcon, SchoolIcon, CalendarIcon } from './Icons';
import Dashboard from './Dashboard';
import Chat from './Chat';
import Admin from './Admin';
import Settings from './Settings';
import Events from './Events';

type View = 'dashboard' | 'chat' | 'admin' | 'settings' | 'events';

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-blue-600/20 text-blue-400'
        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
    }`}
  >
    {icon}
    <span className="ml-4 font-medium">{label}</span>
  </button>
);

export default function Layout() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const { profile, logout } = useAuth();

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'chat':
        return <Chat />;
      case 'admin':
        return <Admin />;
      case 'settings':
        return <Settings />;
      case 'events':
        return <Events />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col p-4">
        <div className="flex items-center mb-10 px-2">
            <SchoolIcon className="w-8 h-8 text-blue-500" />
            <span className="ml-3 text-xl font-bold">OSIS Portal</span>
        </div>
        <nav className="flex-1 space-y-2">
          <NavItem
            icon={<DashboardIcon className="w-5 h-5" />}
            label="Dashboard"
            isActive={currentView === 'dashboard'}
            onClick={() => setCurrentView('dashboard')}
          />
          <NavItem
            icon={<ChatIcon className="w-5 h-5" />}
            label="Chat"
            isActive={currentView === 'chat'}
            onClick={() => setCurrentView('chat')}
          />
          <NavItem
            icon={<CalendarIcon className="w-5 h-5" />}
            label="Events"
            isActive={currentView === 'events'}
            onClick={() => setCurrentView('events')}
          />
          {profile?.role === 'admin' && (
            <NavItem
              icon={<AdminIcon className="w-5 h-5" />}
              label="Admin Panel"
              isActive={currentView === 'admin'}
              onClick={() => setCurrentView('admin')}
            />
          )}
          <NavItem
            icon={<SettingsIcon className="w-5 h-5" />}
            label="Settings"
            isActive={currentView === 'settings'}
            onClick={() => setCurrentView('settings')}
          />
        </nav>
        <div className="mt-auto">
            <div className="p-3 bg-gray-800/50 rounded-lg flex items-center mb-4">
                <img src={profile?.avatar_url} alt={profile?.full_name} className="w-10 h-10 rounded-full object-cover" />
                <div className="ml-3 overflow-hidden">
                    <p className="font-semibold text-sm text-gray-200 truncate">{profile?.full_name}</p>
                    <p className="text-xs text-gray-400 capitalize">{profile?.role}</p>
                </div>
            </div>
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-3 rounded-lg text-gray-400 hover:bg-red-600/20 hover:text-red-400 transition-colors duration-200"
          >
            <LogoutIcon className="w-5 h-5" />
            <span className="ml-4 font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {renderView()}
      </main>
    </div>
  );
}
