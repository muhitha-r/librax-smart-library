import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Bookmark,
  BookOpenCheck,
  CalendarClock,
  Clock,
  AlertTriangle,
  Receipt,
  Info,
  Trash2,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../services/api';

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const loadNotifications = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await fetchNotifications({ limit: 10 });
      if (res?.data) {
        setNotifications(res.data);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      // silently handle transient network errors
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(() => loadNotifications(), 45000); // 45s periodic refresh
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleItemClick = async (n) => {
    const isRead = n.read !== undefined ? n.read : !!n.isRead;
    if (!isRead) {
      try {
        await markNotificationAsRead(n._id);
        setNotifications((prev) =>
          prev.map((item) =>
            item._id === n._id ? { ...item, read: true, isRead: true } : item
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark notification as read', err);
      }
    }

    if (n.link) {
      setIsOpen(false);
      navigate(n.link);
    }
  };

  const handleMarkAsRead = async (id, e) => {
    e?.stopPropagation();
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      await markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, isRead: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      loadNotifications();
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'RESERVATION_CONFIRMATION':
      case 'Reservation':
        return <Bookmark className="w-4 h-4 text-[#D97706]" />;
      case 'BOOK_AVAILABLE':
        return <BookOpenCheck className="w-4 h-4 text-[#1B4332]" />;
      case 'DUE_DATE_REMINDER':
      case 'Reminder':
        return <CalendarClock className="w-4 h-4 text-[#D97706]" />;
      case 'FINE_ALERT':
      case 'Overdue':
      case 'Fine':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      default:
        return <Info className="w-4 h-4 text-[#2D6A4F]" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        id="notification-bell-btn"
        onClick={() => {
          const nextState = !isOpen;
          setIsOpen(nextState);
          if (nextState) loadNotifications(true);
        }}
        className="relative p-2 rounded-xl text-white/90 hover:text-white hover:bg-[#143527] transition-colors cursor-pointer"
        title="Notifications"
        aria-label="Open notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-[#D97706] rounded-full shadow-sm ring-2 ring-[#1B4332] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown / Popover Panel */}
      {isOpen && (
        <div
          id="notification-dropdown-panel"
          className="absolute right-0 mt-2.5 w-[calc(100vw-2rem)] max-w-sm sm:w-96 bg-white border border-[#E5E7EB] rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
        >
          {/* Header styled in Deep Forest Pine (#1B4332) */}
          <div className="px-4 py-3 bg-[#1B4332] border-b border-[#143527] flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-wide">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#D97706] text-white">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="text-xs font-semibold text-[#FEF3C7] hover:text-white transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {markingAll ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5 text-[#D97706]" />
                )}
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#E5E7EB]">
            {loading && notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#6B7280]">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#D97706]" />
                <p>Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#6B7280] px-4">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="font-semibold text-[#1F2937]">No notifications yet</p>
                <p className="text-[11px] text-[#6B7280] mt-1">You're all caught up with books and holds!</p>
              </div>
            ) : (
              notifications.map((n) => {
                const isRead = n.read !== undefined ? n.read : !!n.isRead;
                return (
                  <div
                    key={n._id}
                    onClick={() => handleItemClick(n)}
                    className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer group ${
                      !isRead
                        ? 'bg-[#FFFBEB] border-l-4 border-[#D97706]'
                        : 'border-l-4 border-transparent hover:bg-[#F9F9F6]'
                    }`}
                  >
                    <div className="mt-0.5 p-1.5 rounded-lg bg-[#F9F9F6] border border-[#E5E7EB] shrink-0">
                      {getTypeIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4
                          className={`text-xs font-semibold truncate ${
                            !isRead ? 'text-[#1F2937] font-bold' : 'text-[#6B7280]'
                          }`}
                        >
                          {n.title}
                        </h4>
                        {!isRead && (
                          <span
                            className="w-2 h-2 rounded-full bg-[#D97706] shrink-0"
                            title="Unread"
                          />
                        )}
                      </div>
                      <p className="text-[11px] text-[#6B7280] mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <div className="flex items-center justify-between mt-1 text-[10px] text-[#6B7280]">
                        <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                        <div className="flex items-center gap-1.5">
                          {n.link && (
                            <span className="text-[10px] text-[#D97706] font-semibold flex items-center gap-0.5">
                              View <ExternalLink className="w-2.5 h-2.5" />
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleDelete(n._id, e)}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-0.5 cursor-pointer"
                            title="Delete notification"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-[#F9F9F6] border-t border-[#E5E7EB] text-center">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-[#D97706] hover:text-[#B45309] hover:underline flex items-center justify-center gap-1"
            >
              <span>View full notification center</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
