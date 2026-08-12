import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Bell, 
  Pin, 
  PinOff, 
  Check, 
  CheckCheck, 
  Search, 
  Trash2, 
  Sparkles, 
  MessageSquare, 
  ShieldCheck, 
  AlertCircle, 
  Tag, 
  Calendar,
  ExternalLink
} from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationCenterProps {
  onClose?: () => void;
  compact?: boolean;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onClose, compact = false }) => {
  const { 
    notifications, 
    markNotificationRead, 
    togglePinNotification, 
    clearAllNotifications, 
    requestNotificationPermission 
  } = useAuth();

  const [filter, setFilter] = useState<'all' | 'unread' | 'read' | 'pinned'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter logic
  const filteredNotifs = notifications.filter(item => {
    // Search matching
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchBody = item.body.toLowerCase().includes(q);
      if (!matchTitle && !matchBody) return false;
    }

    // Filter matching
    if (filter === 'unread') return !item.read;
    if (filter === 'read') return item.read;
    if (filter === 'pinned') return item.pinned;
    return true;
  });

  // Sorting: Pinned notifications stay at top, then by timestamp descending
  const sortedNotifs = [...filteredNotifs].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const readCount = notifications.filter(n => n.read).length;
  const pinnedCount = notifications.filter(n => n.pinned).length;

  const getTypeIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'inspection_update':
        return <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'new_listing':
        return <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'price_change':
        return <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-slate-700 dark:text-slate-300" />;
      case 'agent_verification':
        return <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
    }
  };

  return (
    <div className={`flex flex-col bg-white dark:bg-slate-900 ${compact ? 'w-full' : 'max-w-lg w-full rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg'}`}>
      
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-200">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Notification Center
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold">
                  {unreadCount} unread
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Updates, inspections, and platform alerts</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={requestNotificationPermission}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition-colors"
            title="Enable Push Notifications"
          >
            Enable Push
          </button>
          <button
            onClick={clearAllNotifications}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            title="Mark All as Read"
          >
            <CheckCheck className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2.5">
        
        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-slate-400 dark:focus:border-slate-600"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-xs font-semibold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              filter === 'all'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <span>All</span>
            <span className="text-[10px] opacity-75">({notifications.length})</span>
          </button>

          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              filter === 'unread'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <span>Unread</span>
            <span className={`text-[10px] ${unreadCount > 0 ? 'text-emerald-500 font-bold' : 'opacity-75'}`}>
              ({unreadCount})
            </span>
          </button>

          <button
            onClick={() => setFilter('read')}
            className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              filter === 'read'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <span>Read</span>
            <span className="text-[10px] opacity-75">({readCount})</span>
          </button>

          <button
            onClick={() => setFilter('pinned')}
            className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              filter === 'pinned'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <Pin className="w-3 h-3" />
            <span>Pinned</span>
            <span className="text-[10px] opacity-75">({pinnedCount})</span>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto p-2 space-y-1.5">
        {sortedNotifs.length === 0 ? (
          <div className="text-center py-10 px-4 space-y-1">
            <Bell className="w-6 h-6 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {filter === 'unread' ? 'No unread notifications' : filter === 'pinned' ? 'No pinned notifications' : 'No notifications found'}
            </p>
          </div>
        ) : (
          sortedNotifs.map(item => (
            <div
              key={item.id}
              className={`p-3 rounded-xl border transition-all flex items-start gap-3 relative group ${
                item.pinned 
                  ? 'border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-950/20' 
                  : item.read 
                    ? 'border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400' 
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
              }`}
            >
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                {getTypeIcon(item.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 pr-12">
                  <h4 className="text-xs font-bold truncate flex items-center gap-1.5">
                    {item.title}
                    {item.pinned && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0">
                        Pinned
                      </span>
                    )}
                  </h4>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug break-words">
                  {item.body}
                </p>

                <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                  <span>{new Date(item.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                  {!item.read && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">• New</span>
                  )}
                </div>
              </div>

              {/* Pin & Read action controls */}
              <div className="absolute right-2 top-2 flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePinNotification(item.id);
                  }}
                  className={`p-1.5 rounded-lg transition-colors ${
                    item.pinned
                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/60'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title={item.pinned ? 'Unpin notification' : 'Pin to top'}
                >
                  {item.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markNotificationRead(item.id);
                  }}
                  className={`p-1.5 rounded-lg transition-colors ${
                    item.read
                      ? 'text-slate-300 dark:text-slate-600'
                      : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                  }`}
                  title={item.read ? 'Read' : 'Mark as read'}
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
