export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function notificationTypeAccent(type: string | null) {
  switch (type) {
    case "ALERT":   return "bg-danger-bg text-danger";
    case "SUCCESS": return "bg-success-bg text-success";
    case "WARNING": return "bg-warning-bg text-warning";
    default:        return "bg-brand-soft text-brand";
  }
}
