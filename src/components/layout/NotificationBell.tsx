import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Check, CheckCheck, X } from "lucide-react";
import {
  getMyNotifications,
  getNotificationCount,
  markAllNotificationsRead,
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

function typeAccent(type: string | null) {
  switch (type) {
    case "ALERT":   return "bg-danger-bg text-danger";
    case "SUCCESS": return "bg-success-bg text-success";
    case "WARNING": return "bg-warning-bg text-warning";
    default:        return "bg-brand-soft text-brand";
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const pollCount = useCallback(async () => {
    try { setUnread(await getNotificationCount()); } catch { /* badge is non-critical */ }
  }, []);

  useEffect(() => {
    void pollCount();
    const id = setInterval(pollCount, 30000);
    return () => clearInterval(id);
  }, [pollCount]);

  const loadList = useCallback(async () => {
    try {
      const data = await getMyNotifications();
      setNotifications(data);
      setUnread(data.filter(n => !n.isRead).length);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { if (open) void loadList(); }, [open, loadList]);

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

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnread(0);
    } catch { /* ignore */ }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        title="Notifications"
        className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-edge text-ink-3 transition-colors hover:bg-brand-soft hover:text-brand"
      >
        <Bell size={14} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-0.5 text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-72 overflow-hidden rounded-2xl border border-edge bg-surface shadow-overlay">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-edge px-4 py-2.5">
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-bold text-ink">Notifications</h3>
              {unread > 0 && (
                <span className="rounded-full bg-danger-soft px-1.5 py-0.5 text-[11px] font-bold text-danger">
                  {unread} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  title="Mark all as read"
                  className="flex h-6 w-6 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-brand-soft hover:text-brand"
                >
                  <CheckCheck size={13} />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-surface-muted"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[320px] divide-y divide-edge-2 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell size={20} className="mx-auto mb-2 text-ink-4" />
                <p className="text-xs font-medium text-ink-3">No notifications yet</p>
              </div>
            ) : (
              notifications.slice(0, 15).map(n => (
                <div
                  key={n.id}
                  className={`flex cursor-pointer gap-2.5 px-3 py-2.5 transition-colors hover:bg-surface-raised ${!n.isRead ? "bg-brand-soft/30" : ""}`}
                  onClick={() => { if (!n.isRead) void handleMarkRead(n.id); }}
                >
                  <div className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-[9px] font-bold ${typeAccent(n.type)}`}>
                    {(n.type ?? "SYS").slice(0, 3)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-1">
                      <p className={`text-[11.5px] leading-snug ${!n.isRead ? "font-bold text-ink" : "font-medium text-ink-3"}`}>
                        {n.title}
                      </p>
                      {!n.isRead && <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand" />}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[10.5px] leading-snug text-ink-3">{n.message}</p>
                    <p className="mt-1 text-2xs text-ink-4">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.isRead && (
                    <button
                      onClick={e => { e.stopPropagation(); void handleMarkRead(n.id); }}
                      title="Mark as read"
                      className="mt-1 flex-shrink-0 text-ink-4 transition-colors hover:text-brand"
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
