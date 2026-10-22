import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../services/api';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  const loadNotifications = async (currentPage = 1, onlyUnread = unreadOnly) => {
    try {
      setLoading(true);
      const res = await fetchNotifications({
        page: currentPage,
        limit: 15,
        unreadOnly: onlyUnread ? 'true' : undefined,
      });
      if (res?.data) {
        setNotifications(res.data);
        setUnreadCount(res.unreadCount || 0);
        setTotalPages(res.pagination?.totalPages || 1);
        setPage(currentPage);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications(1, unreadOnly);
  }, [unreadOnly]);

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, isRead: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      loadNotifications(page, unreadOnly);
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'RESERVATION_CONFIRMATION':
      case 'Reservation':
        return <Bookmark className="w-5 h-5 text-[#D97706]" />;
      case 'BOOK_AVAILABLE':
        return <BookOpenCheck className="w-5 h-5 text-[#1B4332]" />;
      case 'DUE_DATE_REMINDER':
      case 'Reminder':
        return <CalendarClock className="w-5 h-5 text-sky-600" />;
      case 'FINE_ALERT':
      case 'Overdue':
      case 'Fine':
        return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      default:
        return <Info className="w-5 h-5 text-[#D97706]" />;
    }
  };

  const handleNavigate = (n) => {
    const isRead = n.read !== undefined ? n.read : !!n.isRead;
    if (!isRead) {
      handleMarkAsRead(n._id);
    }
    if (n.link) {
      navigate(n.link);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white/75 backdrop-blur-md rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-medium px-2.5 py-0.5 rounded-full text-xs mb-2 shadow-sm">
            <Bell className="w-3.5 h-3.5 text-emerald-600" />
            <span>Librax Alerts • Notification Dispatch</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A] flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#D97706]/15 text-[#D97706]">
              <Bell className="w-5 h-5" />
            </span>
            <span>Institutional Notices & Alerts</span>
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Official alerts for holds ready for pickup, textbook due date reminders, and fine statements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadNotifications(page, unreadOnly)}
            className="p-2.5 rounded-xl border border-[#E5E7EB] text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F9F9F6] transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#D97706]' : ''}`} />
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#D97706] hover:bg-[#B45309] shadow-md shadow-amber-600/20 transition-all cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark all read</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mt-6 mb-4">
        <button
          type="button"
          onClick={() => setUnreadOnly(false)}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            !unreadOnly
              ? 'bg-[#1B4332] text-white shadow-sm'
              : 'bg-white border border-[#E5E7EB] text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F9F9F6]'
          }`}
        >
          All Notifications
        </button>
        <button
          type="button"
          onClick={() => setUnreadOnly(true)}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            unreadOnly
              ? 'bg-[#1B4332] text-white shadow-sm'
              : 'bg-white border border-[#E5E7EB] text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F9F9F6]'
          }`}
        >
          <span>Unread</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#D97706] text-white font-bold">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications Container */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl shadow-sm overflow-hidden">
        {loading && notifications.length === 0 ? (
          <div className="py-16 text-center text-sm text-[#6B7280]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#D97706]" />
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center text-sm text-[#6B7280]">
            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <h3 className="text-base font-bold text-[#1F2937]">
              No notifications found
            </h3>
            <p className="text-xs text-[#6B7280] mt-1">
              {unreadOnly ? 'You have read all of your alerts!' : 'You currently have no activity alerts.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E7EB]">
            {notifications.map((n) => {
              const isRead = n.read !== undefined ? n.read : !!n.isRead;
              return (
                <div
                  key={n._id}
                  className={`p-5 flex items-start justify-between gap-4 transition-colors ${
                    !isRead
                      ? 'bg-amber-50/40 border-l-4 border-[#D97706]'
                      : 'border-l-4 border-transparent hover:bg-[#F9F9F6]/60'
                  }`}
                >
                  <div
                    className={`flex items-start gap-4 flex-1 ${n.link ? 'cursor-pointer' : ''}`}
                    onClick={() => n.link && handleNavigate(n)}
                  >
                    <div className="p-2.5 rounded-2xl bg-[#1B4332]/5 border border-[#1B4332]/10 shrink-0 mt-0.5">
                      {getTypeIcon(n.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3
                          className={`text-sm font-bold ${
                            !isRead ? 'text-[#1F2937]' : 'text-[#6B7280]'
                          }`}
                        >
                          {n.title}
                        </h3>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#F9F9F6] border border-[#E5E7EB] text-[#6B7280]">
                          {n.type}
                        </span>
                      </div>
                      <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                        {n.message}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[11px] text-[#6B7280]">
                          {new Date(n.createdAt).toLocaleString()}
                        </span>
                        {n.link && (
                          <span className="text-xs text-[#D97706] font-semibold flex items-center gap-1 hover:underline">
                            Open link <ExternalLink className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(n._id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-[#D97706] hover:bg-[#B45309] shadow-sm transition-colors cursor-pointer"
                      >
                        Mark read
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(n._id)}
                      className="p-1.5 text-[#6B7280] hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      title="Delete notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => loadNotifications(page - 1, unreadOnly)}
                className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-[#F9F9F6] disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => loadNotifications(page + 1, unreadOnly)}
                className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-[#F9F9F6] disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
