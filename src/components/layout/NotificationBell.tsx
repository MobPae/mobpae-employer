import { useEffect, useRef, useState, useCallback } from "react";
import { Bell, Check, CheckCheck, X } from "lucide-react";
import {
  getMyNotifications,
  getNotificationCount,
  markNotificationRead,
  type Notification,
} from "../../services/notification.service";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function typeColor(type: string | null) {
  switch (type) {
    case "ALERT":   return "bg-red-100 text-red-600";
    case "SUCCESS": return "bg-[#ECEBFF] text-[#7679FF]";
    case "WARNING": return "bg-amber-100 text-amber-600";
    default:        return "bg-[#ECEBFF] text-[#7679FF]";
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  // Lightweight badge poll: /notifications/me/count every 30s
  const pollCount = useCallback(async () => {
    try {
      const count = await getNotificationCount();
      setUnread(count);
    } catch { /* ignore — badge is non-critical */ }
  }, []);

  useEffect(() => {
    void pollCount();
    const interval = setInterval(pollCount, 30000);
    return () => clearInterval(interval);
  }, [pollCount]);

  // Full list: loaded only when dropdown opens
  const loadList = useCallback(async () => {
    try {
      const data = await getMyNotifications();
      setNotifications(data);
      setUnread(data.filter(n => !n.isRead).length);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (open) void loadList();
  }, [open, loadList]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  const handleMarkAllRead = () => {
    notifications.filter(n => !n.isRead).forEach(n => void handleMarkRead(n.id));
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        title="Notifications"
        className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-[#6b7280] hover:text-[#7679FF] hover:bg-[#ECEBFF] relative"
        style={{ border: "1px solid #e2e8f0" }}
      >
        <Bell size={14} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-0.5 rounded-full bg-red-500 text-white text-[9px] font-[700] flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-72 bg-white rounded-2xl z-50 overflow-hidden"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)", border: "1px solid #e2e8f0" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#E4E4EF]">
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-[700] text-[#191A2E]">Notifications</h3>
              {unread > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 text-[11px] font-[700]">{unread} new</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  title="Mark all as read"
                  className="w-6 h-6 flex items-center justify-center rounded-md text-[#62657A] hover:text-[#7679FF] hover:bg-[#ECEBFF] transition-colors"
                >
                  <CheckCheck size={13} />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="w-6 h-6 flex items-center justify-center rounded-md text-[#62657A] hover:text-[#62657A] hover:bg-[#F0F0F8] transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[320px] overflow-y-auto divide-y divide-[#F0F0F8]">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell size={20} className="mx-auto text-[#62657A] mb-2" />
                <p className="text-[12px] text-[#62657A] font-[500]">No notifications yet</p>
              </div>
            ) : (
              notifications.slice(0, 15).map(n => (
                <div
                  key={n.id}
                  className={`flex gap-2.5 px-3 py-2.5 hover:bg-[#F7F7FB] transition-colors cursor-pointer ${!n.isRead ? "bg-[#ECEBFF]/30" : ""}`}
                  onClick={() => { if (!n.isRead) void handleMarkRead(n.id); }}
                >
                  <div className={`mt-0.5 w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-[9px] font-[700] ${typeColor(n.type)}`}>
                    {(n.type ?? "SYS").slice(0, 3)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <p className={`text-[11.5px] leading-snug ${!n.isRead ? "font-[700] text-[#191A2E]" : "font-[500] text-[#62657A]"}`}>
                        {n.title}
                      </p>
                      {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-[#7679FF] flex-shrink-0 mt-1.5" />}
                    </div>
                    <p className="text-[10.5px] text-[#62657A] mt-0.5 line-clamp-2 leading-snug">{n.message}</p>
                    <p className="text-[11px] text-[#62657A] mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.isRead && (
                    <button
                      onClick={e => { e.stopPropagation(); void handleMarkRead(n.id); }}
                      title="Mark as read"
                      className="flex-shrink-0 text-[#62657A] hover:text-[#7679FF] transition-colors mt-1"
                    >
                      <Check size={12} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
