import React, { useState, Fragment } from 'react';
import { useAuth } from '../App';
import { DashboardIcon, ChatIcon, AdminIcon, SettingsIcon, LogoutIcon, SchoolIcon, CalendarIcon, MenuIcon } from './Icons';
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
    className={`relative flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 group ${
      isActive
        ? 'bg-gray-800 text-white'
        : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
    }`}
  >
    <span className={`absolute left-0 top-0 h-full w-1 rounded-r-full bg-blue-500 transition-transform duration-300 ease-in-out ${isActive ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-50'}`}></span>
    {icon}
    <span className="ml-4 font-semibold">{label}</span>
  </button>
);

const SidebarContent: React.FC<{
    currentView: View;
    setCurrentView: (view: View) => void;
    onNavItemClick: () => void;
}> = ({ currentView, setCurrentView, onNavItemClick }) => {
    const { profile, logout } = useAuth();

    const handleViewChange = (view: View) => {
        setCurrentView(view);
        onNavItemClick();
    };

    return (
        <div className="flex flex-col h-full p-4 bg-gray-900">
            <div className="flex items-center mb-10 px-2">
                <SchoolIcon className="w-8 h-8 text-blue-500" />
                <span className="ml-3 text-xl font-bold">OSIS Portal</span>
            </div>
            <nav className="flex-1 space-y-2">
                <NavItem
                    icon={<DashboardIcon className="w-5 h-5" />}
                    label="Dashboard"
                    isActive={currentView === 'dashboard'}
                    onClick={() => handleViewChange('dashboard')}
                />
                <NavItem
                    icon={<ChatIcon className="w-5 h-5" />}
                    label="Chat"
                    isActive={currentView === 'chat'}
                    onClick={() => handleViewChange('chat')}
                />
                <NavItem
                    icon={<CalendarIcon className="w-5 h-5" />}
                    label="Events"
                    isActive={currentView === 'events'}
                    onClick={() => handleViewChange('events')}
                />
                {profile?.role === 'admin' && (
                    <NavItem
                        icon={<AdminIcon className="w-5 h-5" />}
                        label="Admin Panel"
                        isActive={currentView === 'admin'}
                        onClick={() => handleViewChange('admin')}
                    />
                )}
                <NavItem
                    icon={<SettingsIcon className="w-5 h-5" />}
                    label="Settings"
                    isActive={currentView === 'settings'}
                    onClick={() => handleViewChange('settings')}
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
        </div>
    );
};

export default function Layout() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

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
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      {/* Sidebar for mobile */}
      <div className={`fixed inset-0 z-40 transition-transform duration-300 md:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <aside className="w-64 h-full">
             <SidebarContent currentView={currentView} setCurrentView={setCurrentView} onNavItemClick={() => setSidebarOpen(false)}/>
        </aside>
      </div>
      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setSidebarOpen(false)}></div>}
      
      {/* Sidebar for desktop */}
      <aside className="w-64 border-r border-gray-800 flex-col hidden md:flex">
          <SidebarContent currentView={currentView} setCurrentView={setCurrentView} onNavItemClick={() => {}}/>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header for mobile view */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900">
            <button onClick={() => setSidebarOpen(true)} className="p-2">
                <MenuIcon className="w-6 h-6"/>
            </button>
            <span className="text-lg font-bold capitalize">{currentView}</span>
            <div className="w-8"></div>
        </header>
        {renderView()}
      </main>
    </div>
  );
}