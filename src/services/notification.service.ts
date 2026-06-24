import { httpClient } from "./http-client";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string | null;
  isRead: boolean;
  createdAt: string;
  userId: string;
}

export async function getMyNotifications(): Promise<Notification[]> {
  const { data } = await httpClient.get("/notifications/me");
  if (Array.isArray(data)) return data as Notification[];
  if (data && typeof data === "object" && Array.isArray((data as Record<string, unknown>).data))
    return (data as Record<string, unknown[]>).data as Notification[];
  return [];
}

export async function markNotificationRead(id: string): Promise<void> {
  await httpClient.post(`/notifications/${id}/read`);
}

export async function getNotificationCount(): Promise<number> {
  const { data } = await httpClient.get("/notifications/me/count");
  const d = data as Record<string, unknown>;
  return typeof d.unread === "number" ? d.unread : 0;
}

export async function markAllNotificationsRead(): Promise<void> {
  await httpClient.post("/notifications/me/read-all");
}
