import { Bell, Check, CheckCheck } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
} from "../../services/notification.service";
import { getApiErrorMessage } from "../../services/api-errors";
import { useToast } from "../../hooks/useToast";
import { notificationTypeAccent, timeAgo } from "../../utils/notifications";
import { Button } from "../../components/ui/Button";

type Filter = "ALL" | "UNREAD";

export function NotificationsPage() {
  const toast = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("ALL");

  useEffect(() => {
    getMyNotifications()
      .then(setNotifications)
      .catch(err => toast.error("Failed to load notifications", getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const filtered = filter === "UNREAD" ? notifications.filter(n => !n.isRead) : notifications;

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      toast.error("Failed to mark as read", getApiErrorMessage(err));
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success("All caught up");
    } catch (err) {
      toast.error("Failed to mark all as read", getApiErrorMessage(err));
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Notifications</h1>
          <p className="mt-1.5 text-sm text-ink-3">Updates about your employees, requests, and settlements</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="md" icon={<CheckCheck size={14} />} onClick={() => void handleMarkAllRead()}>
            Mark all as read
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {([
          { id: "ALL" as const, label: "All" },
          { id: "UNREAD" as const, label: "Unread" },
        ]).map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-colors ${
              filter === f.id ? "bg-ink text-white" : "border border-edge bg-surface text-ink-3 hover:bg-surface-raised"
            }`}
          >
            {f.label}
            {f.id === "UNREAD" && unreadCount > 0 && (
              <span className={`text-2xs font-bold ${filter === f.id ? "text-white/60" : "text-ink-4"}`}>{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-edge bg-surface shadow-card">
        {loading ? (
          <div>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-3 border-b border-edge-2 px-5 py-4 last:border-0">
                <div className="h-8 w-8 flex-shrink-0 animate-pulse rounded-lg bg-surface-muted" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <div className="h-2.5 w-48 animate-pulse rounded-md bg-surface-muted" />
                  <div className="h-2 w-64 animate-pulse rounded-md bg-surface-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : !filtered.length ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
              <Bell size={18} className="text-brand" />
            </div>
            <p className="text-sm font-medium text-ink-3">
              {filter === "UNREAD" ? "No unread notifications" : "No notifications yet"}
            </p>
            <p className="mt-1 text-xs text-ink-4">You'll see updates about your team's activity here.</p>
          </div>
        ) : (
          <div className="divide-y divide-edge-2">
            {filtered.map(n => (
              <div
                key={n.id}
                className={`flex cursor-pointer items-start gap-3.5 px-5 py-4 transition-colors hover:bg-surface-raised ${!n.isRead ? "bg-brand-soft/20" : ""}`}
                onClick={() => { if (!n.isRead) void handleMarkRead(n.id); }}
              >
                <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-2xs font-bold ${notificationTypeAccent(n.type)}`}>
                  {(n.type ?? "SYS").slice(0, 3)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-snug ${!n.isRead ? "font-bold text-ink" : "font-medium text-ink-3"}`}>{n.title}</p>
                    {!n.isRead && <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand" />}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-ink-3">{n.message}</p>
                  <p className="mt-1.5 text-2xs text-ink-4">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && (
                  <button
                    onClick={e => { e.stopPropagation(); void handleMarkRead(n.id); }}
                    title="Mark as read"
                    aria-label={`Mark "${n.title}" as read`}
                    className="mt-1 flex-shrink-0 text-ink-4 transition-colors hover:text-brand"
                  >
                    <Check size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
