import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Analyzer from './components/Analyzer';
import IntegrationPanel from './components/IntegrationPanel';
import History from './components/History';
import SchemaViewer from './components/SchemaViewer';
import AdminPanel from './components/AdminPanel';
import Notifications from './components/Notifications';
import { AnalysisResult, Tab, SentimentType, User } from './types';
import { Menu, Bell } from 'lucide-react';

const STORAGE_KEY = 'emosense_history';

// Default User - Full Access
const DEFAULT_USER: User = {
  email: 'admin@emosense.io',
  fullName: 'System Administrator',
  passwordHash: '',
  plan: 'Enterprise',
  role: 'admin',
  isVerified: true,
  createdAt: new Date().toISOString()
};

const App: React.FC = () => {
  // App State - Default to Logged In
  const [currentUser] = useState<User>(DEFAULT_USER);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [initialized, setInitialized] = useState(false);
  
  // Notification State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Listen for system notifications (emails/codes)
  useEffect(() => {
    const handleSystemNotification = (e: any) => {
        setNotifications(prev => [e.detail, ...prev]);
    };

    window.addEventListener('emosense-notification', handleSystemNotification);
    return () => window.removeEventListener('emosense-notification', handleSystemNotification);
  }, []);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp) // Rehydrate dates
        }));
        setHistory(parsed);
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    } else {
      // Initial mock data if storage is empty
      const mockData: AnalysisResult[] = [
        {
          id: 'mock-1',
          text: 'I absolutely love the new interface update! It makes my workflow so much faster.',
          timestamp: new Date(Date.now() - 86400000), // 1 day ago
          source: 'Zendesk',
          sentiment: SentimentType.POSITIVE,
          confidence: 0.95,
          emotions: [{ name: 'Joy', score: 0.9 }, { name: 'Trust', score: 0.6 }],
          summary: 'User praises the new UI update for improving workflow efficiency.',
          actionItem: 'Share feedback with the product design team.',
          pcaPoint: { x: 0.8, y: 0.7 },
          personalityType: 'The Enthusiast'
        },
        {
          id: 'mock-2',
          text: 'The billing system is confusing and I was charged twice. Fix this immediately.',
          timestamp: new Date(Date.now() - 172800000), // 2 days ago
          source: 'Email',
          sentiment: SentimentType.NEGATIVE,
          confidence: 0.98,
          emotions: [{ name: 'Anger', score: 0.95 }, { name: 'Frustration', score: 0.8 }],
          summary: 'Customer reports double charge and confusion with billing.',
          actionItem: 'Escalate to billing support immediately and issue a refund.',
          pcaPoint: { x: -0.8, y: 0.8 },
          personalityType: 'The Challenger'
        }
      ];
      setHistory(mockData);
    }
    setInitialized(true);
  }, []);

  // Save to localStorage whenever history changes
  useEffect(() => {
    if (initialized) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }
  }, [history, initialized]);

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setHistory((prev) => [result, ...prev]);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard data={history} />;
      case 'analyze':
        return <Analyzer onAnalyzeComplete={handleAnalysisComplete} />;
      case 'integrations':
        return <IntegrationPanel />;
      case 'history':
        return <History data={history} />;
      case 'schema':
        return <SchemaViewer />;
      case 'admin':
        return <AdminPanel />;
      default:
        return <Dashboard data={history} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        user={currentUser}
        onLogout={() => {}} 
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 z-10 shrink-0">
          <div className="flex items-center">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg mr-4"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-semibold text-slate-800 hidden md:block capitalize">
              {activeTab === 'schema' ? 'Database Design' : activeTab === 'admin' ? 'Administration' : activeTab}
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
                <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative transition-colors"
                >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                )}
                </button>
                <Notifications 
                    isOpen={showNotifications} 
                    onClose={() => setShowNotifications(false)} 
                    notifications={notifications}
                    onClearAll={() => setNotifications([])}
                />
            </div>
            
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                <div className="text-right hidden md:block">
                    <p className="text-sm font-bold text-slate-800">{currentUser.fullName}</p>
                    <p className="text-xs text-slate-500">{currentUser.plan} Plan</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm">
                {currentUser.fullName.charAt(0).toUpperCase()}
                </div>
            </div>
          </div>
        </header>

        {/* Main Content Scroll Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
           {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;