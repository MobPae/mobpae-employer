import {
  ArrowDownCircle,
  CalendarDays,
  ClipboardList,
  CreditCard,
  Landmark,
  LayoutDashboard,
  KeyRound,
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
  { label: "Dashboard",       to: "/dashboard",       icon: LayoutDashboard  },
  { label: "Employees",       to: "/employees",       icon: UsersRound       },
  { label: "Salary Requests", to: "/salary-requests", icon: ClipboardList    },
  { label: "Recoveries",      to: "/recoveries",      icon: ArrowDownCircle  },
  { label: "Repayments",      to: "/repayments",       icon: CreditCard       },
  { label: "Payroll",         to: "/payroll",          icon: CalendarDays     },
  { label: "Settlements",     to: "/settlements",      icon: Landmark         },
  { label: "Settings",        to: "/settings",         icon: Settings         },
];

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":       "Dashboard",
  "/employees":       "Employees",
  "/salary-requests": "Salary Requests",
  "/recoveries":      "Recoveries",
  "/repayments":      "Repayments",
  "/payroll":         "Payroll",
  "/settlements":     "Settlements",
  "/settings":        "Settings",
};

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

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
        <button aria-label="Close sidebar" className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 bg-white`}
        style={{ borderRight: "1px solid #E5E7EB" }}
      >
        {/* Logo */}
        <div className="h-[60px] flex items-center justify-between px-5 flex-shrink-0" style={{ borderBottom: "1px solid #E5E7EB" }}>
          <div className="flex items-center gap-3">
            <img src="/logo-icon.svg" alt="MobPae" width="32" height="21" style={{ objectFit: "contain", flexShrink: 0 }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em", lineHeight: 1 }}>MobPae</span>
          </div>
          <button aria-label="Close navigation" onClick={onClose} className="lg:hidden w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors" style={{ color: "#9CA3AF" }}>
            <X size={15} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <div className="space-y-0.5">
            {NAV.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to} to={to} onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 rounded-xl transition-all ${isActive ? "" : "hover:bg-gray-50"}`
                }
                style={({ isActive }) => ({
                  height: 40,
                  background: isActive ? "#F3F0FF" : "transparent",
                  color: isActive ? "#6C4CFF" : "#6B7280",
                  fontWeight: isActive ? 600 : 500,
                  fontSize: 13.5,
                })}
              >
                {({ isActive }) => (
                  <>
                    <Icon size={16} style={{ color: isActive ? "#6C4CFF" : "#9CA3AF", flexShrink: 0 }} strokeWidth={isActive ? 2 : 1.75} />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Footer — company info */}
        <div className="px-3 py-4 flex-shrink-0" style={{ borderTop: "1px solid #E5E7EB" }}>
          <div className="flex items-center gap-3 px-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-[700] flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #8B7CFF 0%, #6C4CFF 100%)", color: "white" }}
            >
              {companyInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", lineHeight: 1 }} className="truncate">{user?.companyName ?? "Company"}</p>
              <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }} className="truncate">{user?.companyCode}</p>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => navigate("/change-password")}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[#F3F0FF]"
                title="Change password"
                style={{ color: "#9CA3AF" }}
              >
                <KeyRound size={13} />
              </button>
              <button
                onClick={() => setConfirmLogout(true)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-50 hover:text-red-500"
                title="Sign out"
                style={{ color: "#9CA3AF" }}
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
  const navigate = useNavigate();
  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] ?? "MobPae";
  const displayName = user?.name && !user.name.includes("@")
    ? user.name
    : user?.companyName || "Employer";
  const userInitials = displayName.split(" ").filter(Boolean).slice(0, 2).map((w: string) => w[0]).join("").toUpperCase() || "E";

  return (
    <header className="sticky top-0 z-20 h-[60px] flex items-center justify-between px-6 bg-white" style={{ borderBottom: "1px solid #E5E7EB" }}>
      <div className="flex items-center gap-3">
        <button aria-label="Open navigation" onClick={onMenuClick} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100" style={{ color: "#6B7280" }}>
          <Menu size={16} />
        </button>
        <h1 style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{pageTitle}</h1>
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell />
        <div className="w-px h-5 mx-1" style={{ background: "#E5E7EB" }} />
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-[700] flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #8B7CFF 0%, #6C4CFF 100%)", color: "white" }}
            title={navigate ? displayName : undefined}
          >
            {userInitials}
          </div>
          <div className="hidden sm:block">
            <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", lineHeight: 1 }}>{displayName}</p>
            <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export function EmployerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen" style={{ background: "#F9FAFB", fontFamily: "Inter, ui-sans-serif, sans-serif" }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-60 flex flex-col min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6"><Outlet /></main>
      </div>
    </div>
  );
}
