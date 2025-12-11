import React from 'react';
import { Bell, Check, Info, AlertCircle, X, Trash2 } from 'lucide-react';

interface NotificationItem {
  id: number;
  title: string;
  msg: string;
  type: 'success' | 'info' | 'warning';
  time: string;
}

interface NotificationsProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onClearAll: () => void;
}

const Notifications: React.FC<NotificationsProps> = ({ isOpen, onClose, notifications, onClearAll }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose}></div>
      <div className="absolute top-16 right-6 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800 text-sm">Notifications</h3>
            {notifications.length > 0 && (
                <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-bold">
                    {notifications.length} New
                </span>
            )}
        </div>
        <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                    <div className="flex justify-center mb-2"><Bell className="w-8 h-8 opacity-20" /></div>
                    No new notifications
                </div>
            ) : (
                notifications.map(n => (
                    <div key={n.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-start gap-3">
                        <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${n.type === 'success' ? 'bg-emerald-500' : n.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-slate-800">{n.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5 font-mono bg-slate-100 p-1 rounded inline-block">{n.msg}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
                        </div>
                    </div>
                ))
            )}
        </div>
        {notifications.length > 0 && (
            <button 
                onClick={onClearAll}
                className="w-full py-2 text-center text-xs font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors border-t border-slate-100 flex items-center justify-center"
            >
                <Trash2 className="w-3 h-3 mr-2" /> Clear All
            </button>
        )}
      </div>
    </>
  );
};

export default Notifications;