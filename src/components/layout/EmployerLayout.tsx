import {
  ClipboardList,
  CreditCard,
  KeyRound,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  UsersRound,
  X,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { NotificationBell } from "./NotificationBell";
import { ConfirmModal } from "../ui/ConfirmModal";

const NAV = [
  { label: "Dashboard",         to: "/dashboard",         icon: LayoutDashboard },
  { label: "Employees",         to: "/employees",         icon: UsersRound      },
  { label: "Loan Applications", to: "/loan-applications", icon: ClipboardList   },
  { label: "Repayments",        to: "/repayments",        icon: CreditCard      },
  { label: "Settlements",       to: "/settlements",       icon: Landmark        },
  { label: "Settings",          to: "/settings",          icon: Settings        },
];

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":         "Dashboard",
  "/employees":         "Employees",
  "/loan-applications": "Loan Applications",
  "/repayments":        "Repayments",
  "/settlements":       "Settlements",
  "/settings":          "Settings",
};

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const companyInitials = (user?.companyName ?? user?.companyCode ?? "MP")
    .split(" ").filter(Boolean).slice(0, 2).map((w: string) => w[0]).join("").toUpperCase() || "MP";

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      {open && (
        <button
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-ink/40 backdrop-blur-[2px] lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-edge bg-surface transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex h-[60px] flex-shrink-0 items-center justify-between border-b border-edge px-5">
          <div className="flex items-center gap-3">
            <img src="/logo-icon.svg" alt="MobPae" width="32" height="21" className="flex-shrink-0 object-contain" />
            <span className="text-[15px] font-bold tracking-tight text-ink">MobPae</span>
          </div>
          <button
            aria-label="Close navigation"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-4 transition-colors hover:bg-surface-muted lg:hidden"
          >
            <X size={15} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <div className="space-y-0.5">
            {NAV.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex h-10 items-center gap-3 rounded-xl px-3 text-[13.5px] font-medium transition-all ${
                    isActive
                      ? "bg-brand-soft font-semibold text-brand"
                      : "text-ink-3 hover:bg-surface-muted"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={16}
                      strokeWidth={isActive ? 2 : 1.75}
                      className={`flex-shrink-0 ${isActive ? "text-brand" : "text-ink-4"}`}
                    />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Footer — company info */}
        <div className="flex-shrink-0 border-t border-edge px-3 py-4">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#8B7CFF] to-brand text-[12px] font-bold text-white">
              {companyInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold leading-none text-ink" title={user?.companyName ?? "Company"}>
                {user?.companyName ?? "Company"}
              </p>
              <p className="mt-0.5 truncate text-2xs text-ink-4">{user?.companyCode}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate("/change-password")}
                title="Change password"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-4 transition-colors hover:bg-brand-soft hover:text-brand"
              >
                <KeyRound size={13} />
              </button>
              <button
                onClick={() => setConfirmLogout(true)}
                title="Sign out"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-4 transition-colors hover:bg-danger-soft hover:text-danger"
              >
                <LogOut size={13} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <ConfirmModal
        open={confirmLogout}
        title="Sign out of MobPae?"
        description="You will need to sign in again to manage employees and salary requests."
        confirmLabel="Sign out"
        loading={false}
        onConfirm={() => void handleLogout()}
        onCancel={() => setConfirmLogout(false)}
      />
    </>
  );
}

function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user } = useAuth();
  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] ?? "MobPae";
  const displayName = user?.name && !user.name.includes("@")
    ? user.name
    : user?.companyName || "Employer";
  const userInitials = displayName
    .split(" ").filter(Boolean).slice(0, 2).map((w: string) => w[0]).join("").toUpperCase() || "E";

  return (
    <header className="sticky top-0 z-20 flex h-[60px] items-center justify-between border-b border-edge bg-surface px-6">
      <div className="flex items-center gap-3">
        <button
          aria-label="Open navigation"
          onClick={onMenuClick}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-surface-muted lg:hidden"
        >
          <Menu size={16} />
        </button>
        <span className="text-[15px] font-semibold text-ink lg:hidden">{pageTitle}</span>
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell />
        <div className="mx-1 h-5 w-px bg-edge" />
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#8B7CFF] to-brand text-[12px] font-bold text-white"
            title={displayName}
          >
            {userInitials}
          </div>
          <div className="hidden sm:block">
            <p className="text-[13px] font-semibold leading-none text-ink">{displayName}</p>
            <p className="mt-0.5 text-2xs text-ink-4">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export function EmployerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-h-screen flex-col lg:pl-60">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
