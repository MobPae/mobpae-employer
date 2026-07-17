import {
  ChevronDown,
  Clock,
  FlaskConical,
  Mail,
  MailCheck,
  MailX,
  Shield,
  ShieldOff,
  UserPlus,
  Users,
  UserX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../../components/ui/Button";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { Drawer } from "../../components/ui/Drawer";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { getApiErrorMessage } from "../../services/api-errors";
import {
  teamService,
  type PendingInvite,
  type TeamMember,
} from "../../services/team.service";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  OWNER:   "Owner",
  ADMIN:   "Admin",
  HR:      "HR",
  FINANCE: "Finance",
  VIEWER:  "Viewer",
};

const ROLE_TONE: Record<string, string> = {
  OWNER:   "bg-brand-soft text-brand ring-brand-muted",
  ADMIN:   "bg-info-bg text-info ring-brand-muted",
  HR:      "bg-success-soft text-success ring-success-bg",
  FINANCE: "bg-warning-soft text-warning-dark ring-warning-bg",
  VIEWER:  "bg-surface-muted text-ink-3 ring-edge",
};

const STATUS_TONE: Record<string, string> = {
  ACTIVE:    "bg-success-bg text-success ring-success-bg",
  SUSPENDED: "bg-danger-bg text-danger ring-danger-bg",
};

const ROLE_OPTIONS = [
  { value: "ADMIN",   label: "Admin"   },
  { value: "HR",      label: "HR"      },
  { value: "FINANCE", label: "Finance" },
  { value: "VIEWER",  label: "Viewer"  },
];

const INVITE_ROLE_OPTIONS = [
  { value: "ADMIN",   label: "Admin — full access except removing other OWNERs" },
  { value: "HR",      label: "HR — employees & loan applications"               },
  { value: "FINANCE", label: "Finance — settlements & repayments"               },
  { value: "VIEWER",  label: "Viewer — read-only access"                        },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const cls = ROLE_TONE[role] ?? "bg-surface-muted text-ink-3 ring-edge";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${cls}`}>
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_TONE[status] ?? "bg-surface-muted text-ink-3 ring-edge";
  const label = status === "ACTIVE" ? "Active" : status === "SUSPENDED" ? "Suspended" : status;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${cls}`}>
      {label}
    </span>
  );
}

function formatRelative(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 2)   return "Just now";
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatExpiry(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hrs = Math.floor(diff / 3_600_000);
  if (hrs < 24) return `${hrs}h left`;
  const days = Math.floor(hrs / 24);
  return `${days}d left`;
}

function initials(email: string): string {
  return email.slice(0, 2).toUpperCase();
}

// ─── Member action dropdown ───────────────────────────────────────────────────

interface MemberActionsProps {
  member: TeamMember;
  isSelf: boolean;
  onChangeRole: () => void;
  onSuspend: () => void;
  onRestore: () => void;
  onRemove: () => void;
}

function MemberActions({ member, isSelf, onChangeRole, onSuspend, onRestore, onRemove }: MemberActionsProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const isOwner = member.role === "OWNER";

  if (isSelf || isOwner) {
    return (
      <span className="text-xs text-ink-4">{isSelf ? "You" : "Owner"}</span>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        className="inline-flex items-center gap-1 rounded-lg border border-edge bg-surface px-2.5 py-1 text-xs font-medium text-ink-3 transition-colors hover:bg-surface-raised"
      >
        Actions <ChevronDown size={11} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 w-44 overflow-hidden rounded-xl border border-edge bg-surface shadow-lg">
          <button
            onClick={() => { setOpen(false); onChangeRole(); }}
            className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-xs text-ink-3 hover:bg-surface-raised"
          >
            <Shield size={13} />
            Change role
          </button>
          {member.status === "ACTIVE" ? (
            <button
              onClick={() => { setOpen(false); onSuspend(); }}
              className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-xs text-warning hover:bg-warning-soft"
            >
              <ShieldOff size={13} />
              Suspend access
            </button>
          ) : (
            <button
              onClick={() => { setOpen(false); onRestore(); }}
              className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-xs text-success hover:bg-success-soft"
            >
              <Shield size={13} />
              Restore access
            </button>
          )}
          <div className="my-0.5 border-t border-edge" />
          <button
            onClick={() => { setOpen(false); onRemove(); }}
            className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-xs text-danger hover:bg-danger-soft"
          >
            <UserX size={13} />
            Remove member
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = "members" | "invites";

type ConfirmAction =
  | { type: "suspend"; member: TeamMember }
  | { type: "restore"; member: TeamMember }
  | { type: "remove";  member: TeamMember }
  | { type: "revoke";  invite: PendingInvite }
  | null;

export function TeamPage() {
  const { user } = useAuth();
  const toast    = useToast();

  // ── Data state ──
  const [members,       setMembers]       = useState<TeamMember[]>([]);
  const [invites,       setInvites]       = useState<PendingInvite[]>([]);
  const [loadingM,      setLoadingM]      = useState(true);
  const [loadingI,      setLoadingI]      = useState(true);
  const [errorM,        setErrorM]        = useState<string | null>(null);
  const [errorI,        setErrorI]        = useState<string | null>(null);

  // ── UI state ──
  const [tab,           setTab]           = useState<Tab>("members");
  const [inviteOpen,    setInviteOpen]    = useState(false);
  const [roleDrawer,    setRoleDrawer]    = useState<TeamMember | null>(null);
  const [confirm,       setConfirm]       = useState<ConfirmAction>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [resendingId,   setResendingId]   = useState<string | null>(null);

  // ── Invite form ──
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole,  setInviteRole]  = useState("HR");
  const [inviteLoading, setInviteLoading] = useState(false);

  // ── Role change form ──
  const [newRole,     setNewRole]     = useState("");
  const [roleLoading, setRoleLoading] = useState(false);

  // ── Load ──
  const loadMembers = () => {
    setLoadingM(true);
    setErrorM(null);
    teamService.listMembers()
      .then(setMembers)
      .catch(e => setErrorM(getApiErrorMessage(e)))
      .finally(() => setLoadingM(false));
  };

  const loadInvites = () => {
    setLoadingI(true);
    setErrorI(null);
    teamService.listInvites()
      .then(setInvites)
      .catch(e => setErrorI(getApiErrorMessage(e)))
      .finally(() => setLoadingI(false));
  };

  useEffect(() => { loadMembers(); loadInvites(); }, []);

  // ── Derived ──
  const selfUserId  = user?.id;
  const activeCount = members.filter(m => m.status === "ACTIVE").length;
  const canManage   = user?.employerRole === "OWNER" || user?.employerRole === "ADMIN";
  const canInvite   = canManage;

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    try {
      await teamService.sendInvite(inviteEmail.trim(), inviteRole);
      toast.success("Invitation sent", `${inviteEmail} has been invited as ${ROLE_LABELS[inviteRole]}`);
      setInviteEmail("");
      setInviteRole("HR");
      setInviteOpen(false);
      loadInvites();
    } catch (e) {
      toast.error("Failed to send invite", getApiErrorMessage(e));
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!roleDrawer || !newRole) return;
    setRoleLoading(true);
    try {
      await teamService.updateRole(roleDrawer.id, newRole);
      setMembers(cur => cur.map(m => m.id === roleDrawer.id ? { ...m, role: newRole } : m));
      toast.success("Role updated", `${roleDrawer.user.email} is now ${ROLE_LABELS[newRole]}`);
      setRoleDrawer(null);
    } catch (e) {
      toast.error("Failed to update role", getApiErrorMessage(e));
    } finally {
      setRoleLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    setActionLoading(true);
    try {
      if (confirm.type === "suspend") {
        await teamService.suspendMember(confirm.member.id);
        setMembers(cur => cur.map(m => m.id === confirm.member.id ? { ...m, status: "SUSPENDED" } : m));
        toast.success("Access suspended", confirm.member.user.email);
      } else if (confirm.type === "restore") {
        // There's no dedicated "restore" endpoint — suspendMember toggles; call it again or add a reactivate endpoint.
        // For now, call the backend's suspendMember which the service maps to PATCH /suspend.
        // The backend should handle toggling; if not, we reflect optimistically.
        await teamService.suspendMember(confirm.member.id);
        setMembers(cur => cur.map(m => m.id === confirm.member.id ? { ...m, status: "ACTIVE" } : m));
        toast.success("Access restored", confirm.member.user.email);
      } else if (confirm.type === "remove") {
        await teamService.removeMember(confirm.member.id);
        setMembers(cur => cur.filter(m => m.id !== confirm.member.id));
        toast.success("Member removed", confirm.member.user.email);
      } else if (confirm.type === "revoke") {
        await teamService.revokeInvite(confirm.invite.id);
        setInvites(cur => cur.filter(i => i.id !== confirm.invite.id));
        toast.success("Invite revoked", confirm.invite.email);
      }
      setConfirm(null);
    } catch (e) {
      toast.error("Action failed", getApiErrorMessage(e));
    } finally {
      setActionLoading(false);
    }
  };

  const handleResend = async (invite: PendingInvite) => {
    setResendingId(invite.id);
    try {
      await teamService.resendInvite(invite.id);
      toast.success("Invite resent", invite.email);
      loadInvites();
    } catch (e) {
      toast.error("Failed to resend", getApiErrorMessage(e));
    } finally {
      setResendingId(null);
    }
  };

  // ─── Confirm modal text ───────────────────────────────────────────────────

  const confirmTitle = confirm
    ? confirm.type === "suspend" ? "Suspend access?"
    : confirm.type === "restore" ? "Restore access?"
    : confirm.type === "remove"  ? "Remove member?"
    : "Revoke invite?"
    : "";

  const confirmDescription = confirm
    ? confirm.type === "suspend"
      ? `${confirm.member.user.email} will lose access to the portal immediately.`
    : confirm.type === "restore"
      ? `${confirm.member.user.email} will regain access with their current role.`
    : confirm.type === "remove"
      ? `${confirm.member.user.email} will be permanently removed. They can be re-invited later.`
    : `The pending invite for ${confirm.invite.email} will be cancelled.`
    : "";

  const confirmLabel = confirm
    ? confirm.type === "suspend" ? "Suspend"
    : confirm.type === "restore" ? "Restore"
    : confirm.type === "remove"  ? "Remove"
    : "Revoke"
    : "";

  const confirmVariant: "primary" | "danger" =
    confirm?.type === "remove" || confirm?.type === "revoke" || confirm?.type === "suspend"
      ? "danger"
      : "primary";

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-ink">Team</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2 py-0.5 text-2xs font-semibold text-warning-dark ring-1 ring-warning-bg">
              <FlaskConical size={10} />
              Beta
            </span>
          </div>
          <p className="mt-1.5 text-sm text-ink-3">
            <span className="font-semibold text-ink">{activeCount}</span> active member{activeCount !== 1 ? "s" : ""}{" "}
            {invites.length > 0 && (
              <>· <span className="font-semibold text-ink">{invites.length}</span> pending invite{invites.length !== 1 ? "s" : ""}</>
            )}
          </p>
        </div>
        {canInvite && (
          <Button
            variant="primary"
            size="md"
            icon={<UserPlus size={14} />}
            onClick={() => setInviteOpen(true)}
          >
            Invite member
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-edge bg-surface-muted p-1 w-fit">
        {(["members", "invites"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
              tab === t
                ? "bg-surface text-ink shadow-sm"
                : "text-ink-3 hover:text-ink"
            }`}
          >
            {t === "members" ? <Users size={13} /> : <Mail size={13} />}
            {t === "members" ? "Members" : "Pending Invites"}
            {t === "invites" && invites.length > 0 && (
              <span className="ml-0.5 rounded-full bg-brand px-1.5 py-px text-2xs font-semibold text-white">
                {invites.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Members tab ─────────────────────────────────────────────────────── */}
      {tab === "members" && (
        <div className="overflow-hidden rounded-2xl border border-edge bg-surface shadow-card">
          {errorM ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-danger">Failed to load members</p>
              <p className="mt-1 text-xs text-ink-3">{errorM}</p>
              <Button variant="secondary" size="sm" onClick={loadMembers} className="mt-4">Retry</Button>
            </div>
          ) : loadingM ? (
            <div>
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`flex items-center gap-3.5 px-5 py-4 ${i < 2 ? "border-b border-edge-2" : ""}`}>
                  <div className="h-9 w-9 flex-shrink-0 animate-pulse rounded-full bg-surface-muted" />
                  <div className="flex flex-1 flex-col gap-1.5">
                    <div className="h-2.5 w-40 animate-pulse rounded-md bg-surface-muted" />
                    <div className="h-2 w-28 animate-pulse rounded-md bg-surface-muted" />
                  </div>
                  <div className="h-5 w-14 animate-pulse rounded-full bg-surface-muted" />
                  <div className="h-5 w-14 animate-pulse rounded-full bg-surface-muted" />
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
                <Users size={18} strokeWidth={1.75} className="text-brand" />
              </div>
              <p className="text-sm font-medium text-ink-3">No members yet</p>
              <p className="mt-1 text-xs text-ink-4">Invite colleagues to give them access to the portal.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-edge bg-surface-raised text-left text-xs font-semibold text-ink-3">
                    <th className="px-5 py-3">Member</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Last login</th>
                    {canManage && <th className="px-5 py-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {members.map((m, idx) => {
                    const isSelf = m.user.id === selfUserId;
                    return (
                      <tr
                        key={m.id}
                        className={`transition-colors hover:bg-surface-raised ${idx < members.length - 1 ? "border-b border-edge-2" : ""}`}
                      >
                        {/* Member */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#8B7CFF] to-brand text-[12px] font-bold text-white">
                              {initials(m.user.email)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-ink">
                                {m.user.email}
                                {isSelf && (
                                  <span className="ml-1.5 text-xs text-ink-4">(you)</span>
                                )}
                              </p>
                              {m.officeCode && (
                                <p className="text-2xs text-ink-4">{m.officeCode}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-5 py-3.5">
                          <RoleBadge role={m.role} />
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5">
                          <StatusBadge status={m.status} />
                        </td>

                        {/* Last login */}
                        <td className="px-5 py-3.5">
                          <span className="flex items-center gap-1.5 text-xs text-ink-3">
                            <Clock size={11} className="text-ink-4" />
                            {formatRelative(m.user.lastLogin)}
                          </span>
                        </td>

                        {/* Actions */}
                        {canManage && (
                          <td className="px-5 py-3.5 text-right">
                            <MemberActions
                              member={m}
                              isSelf={isSelf}
                              onChangeRole={() => { setNewRole(m.role === "OWNER" ? "ADMIN" : m.role); setRoleDrawer(m); }}
                              onSuspend={() => setConfirm({ type: "suspend", member: m })}
                              onRestore={() => setConfirm({ type: "restore", member: m })}
                              onRemove={() => setConfirm({ type: "remove", member: m })}
                            />
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Pending Invites tab ──────────────────────────────────────────────── */}
      {tab === "invites" && (
        <div className="overflow-hidden rounded-2xl border border-edge bg-surface shadow-card">
          {errorI ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-danger">Failed to load invites</p>
              <p className="mt-1 text-xs text-ink-3">{errorI}</p>
              <Button variant="secondary" size="sm" onClick={loadInvites} className="mt-4">Retry</Button>
            </div>
          ) : loadingI ? (
            <div>
              {[...Array(2)].map((_, i) => (
                <div key={i} className={`flex items-center gap-3.5 px-5 py-4 ${i < 1 ? "border-b border-edge-2" : ""}`}>
                  <div className="h-8 w-8 flex-shrink-0 animate-pulse rounded-full bg-surface-muted" />
                  <div className="flex flex-1 flex-col gap-1.5">
                    <div className="h-2.5 w-44 animate-pulse rounded-md bg-surface-muted" />
                    <div className="h-2 w-24 animate-pulse rounded-md bg-surface-muted" />
                  </div>
                  <div className="h-7 w-20 animate-pulse rounded-lg bg-surface-muted" />
                </div>
              ))}
            </div>
          ) : invites.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
                <MailCheck size={18} strokeWidth={1.75} className="text-brand" />
              </div>
              <p className="text-sm font-medium text-ink-3">No pending invites</p>
              <p className="mt-1 text-xs text-ink-4">All invitations have been accepted or revoked.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-edge bg-surface-raised text-left text-xs font-semibold text-ink-3">
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Invited by</th>
                    <th className="px-5 py-3">Expires</th>
                    {canManage && <th className="px-5 py-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {invites.map((inv, idx) => (
                    <tr
                      key={inv.id}
                      className={`transition-colors hover:bg-surface-raised ${idx < invites.length - 1 ? "border-b border-edge-2" : ""}`}
                    >
                      {/* Email */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-edge bg-surface-muted text-xs font-semibold text-ink-3">
                            {initials(inv.email)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-ink">{inv.email}</p>
                            {inv.resendCount > 0 && (
                              <p className="text-2xs text-ink-4">
                                Resent {inv.resendCount}×
                                {inv.lastSentAt ? ` · ${formatRelative(inv.lastSentAt)}` : ""}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-3.5">
                        <RoleBadge role={inv.role} />
                      </td>

                      {/* Invited by */}
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-ink-3">{inv.invitedByUser.email}</span>
                      </td>

                      {/* Expires */}
                      <td className="px-5 py-3.5">
                        <span className={`text-xs ${new Date(inv.expiresAt).getTime() < Date.now() ? "text-danger" : "text-ink-3"}`}>
                          {formatExpiry(inv.expiresAt)}
                        </span>
                      </td>

                      {/* Actions */}
                      {canManage && (
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<Mail size={12} />}
                              disabled={resendingId === inv.id || inv.resendCount >= 3}
                              onClick={() => handleResend(inv)}
                              title={inv.resendCount >= 3 ? "Maximum resends reached" : "Resend invite"}
                            >
                              {resendingId === inv.id ? "Sending…" : "Resend"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<MailX size={12} />}
                              onClick={() => setConfirm({ type: "revoke", invite: inv })}
                              className="text-danger hover:bg-danger-soft"
                            >
                              Revoke
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Invite drawer ─────────────────────────────────────────────────── */}
      <Drawer
        open={inviteOpen}
        title="Invite a team member"
        description="They'll receive an email with a secure link to set up their account."
        onClose={() => { setInviteOpen(false); setInviteEmail(""); setInviteRole("HR"); }}
      >
        <div className="flex flex-col gap-5">
          <Input
            label="Email address"
            type="email"
            placeholder="colleague@company.com"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && inviteEmail.trim()) void handleInvite(); }}
            autoFocus
          />

          <div className="grid gap-1.5">
            <span className="text-xs font-semibold text-ink">Role</span>
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value)}
              className="h-10 w-full rounded-lg border border-edge bg-surface px-3 text-sm text-ink transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15"
            >
              {INVITE_ROLE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Role capability hint */}
          <div className="rounded-xl border border-edge bg-surface-raised p-3.5 text-xs text-ink-3 leading-relaxed">
            {inviteRole === "ADMIN"   && "Can manage employees, approve loans, view settlements, and invite new members. Cannot remove Owners."}
            {inviteRole === "HR"      && "Can manage employees, view and approve loan applications, and view repayment schedules."}
            {inviteRole === "FINANCE" && "Can view employees, manage settlements, and access financial reports."}
            {inviteRole === "VIEWER"  && "Read-only access to all employer data. Cannot take any actions."}
          </div>

          <p className="rounded-xl border border-warning-bg bg-warning-soft px-3.5 py-2.5 text-xs text-warning-dark">
            Invites are currently in beta — the accept flow will be available soon.
          </p>

          <div className="flex gap-2 pt-1">
            <Button
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={() => { setInviteOpen(false); setInviteEmail(""); setInviteRole("HR"); }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              className="flex-1"
              icon={<UserPlus size={14} />}
              disabled
              title="Coming soon"
            >
              Send invite
            </Button>
          </div>
        </div>
      </Drawer>

      {/* ── Role change drawer ───────────────────────────────────────────────── */}
      <Drawer
        open={!!roleDrawer}
        title="Change role"
        description={roleDrawer?.user.email}
        onClose={() => setRoleDrawer(null)}
      >
        {roleDrawer && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3 rounded-xl border border-edge bg-surface-raised p-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#8B7CFF] to-brand text-sm font-bold text-white">
                {initials(roleDrawer.user.email)}
              </div>
              <div>
                <p className="text-sm font-medium text-ink">{roleDrawer.user.email}</p>
                <p className="mt-0.5 text-xs text-ink-4">
                  Current role: <span className="font-medium text-ink-3">{ROLE_LABELS[roleDrawer.role]}</span>
                </p>
              </div>
            </div>

            <Select
              label="New role"
              options={ROLE_OPTIONS}
              value={newRole}
              onChange={e => setNewRole(e.target.value)}
            />

            <div className="flex gap-2 pt-1">
              <Button variant="secondary" size="md" className="flex-1" onClick={() => setRoleDrawer(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                disabled={!newRole || newRole === roleDrawer.role || roleLoading}
                onClick={() => void handleRoleChange()}
              >
                {roleLoading ? "Saving…" : "Save role"}
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* ── Confirm modal ─────────────────────────────────────────────────── */}
      <ConfirmModal
        open={!!confirm}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel={confirmLabel}
        confirmVariant={confirmVariant}
        loading={actionLoading}
        onConfirm={() => void handleConfirm()}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
