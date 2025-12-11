import React from 'react';
import { LayoutDashboard, Search, Link2, History, Activity, Database, LogOut, Shield } from 'lucide-react';
import { Tab, User } from '../types';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: User | null;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, setIsOpen, user, onLogout }) => {
  const menuItems = [
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analyze' as Tab, label: 'Analyze Text', icon: Search },
    { id: 'history' as Tab, label: 'History', icon: History },
    { id: 'integrations' as Tab, label: 'Integrations', icon: Link2 },
    { id: 'schema' as Tab, label: 'Database Schema', icon: Database },
  ];

  // Add Admin Tab if user is admin
  if (user?.role === 'admin') {
      menuItems.push({ id: 'admin' as Tab, label: 'Admin Panel', icon: Shield });
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 left-0 z-30 h-full w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 flex flex-col justify-between
      `}>
        <div>
            <div className="p-6 border-b border-slate-700 flex items-center space-x-3">
            <div className="bg-indigo-500 p-2 rounded-lg">
                <Activity className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">EmoSense</h1>
            </div>

            <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                <button
                    key={item.id}
                    onClick={() => {
                    setActiveTab(item.id);
                    if (window.innerWidth < 768) setIsOpen(false);
                    }}
                    className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                    `}
                >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                </button>
                );
            })}
            </nav>
        </div>

        <div className="p-4 space-y-4">
          {/* Plan Info */}
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Current Plan</h3>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{user?.plan || 'Starter'}</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">Active</span>
            </div>
            <div className="mt-3 w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div className={`bg-indigo-500 h-full ${user?.plan === 'Enterprise' ? 'w-full' : user?.plan === 'Pro' ? 'w-1/2' : 'w-1/4'}`}></div>
            </div>
            <p className="text-xs text-slate-500 mt-2">API Usage</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;