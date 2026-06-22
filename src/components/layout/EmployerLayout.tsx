import {
  ArrowDownCircle,
  CalendarDays,
  ChevronRight,
  ClipboardList,
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
  { label: "Payroll",         to: "/payroll",          icon: CalendarDays     },
  { label: "Settlements",     to: "/settlements",      icon: Landmark         },
  { label: "Settings",        to: "/settings",         icon: Settings         },
];

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":       "Dashboard",
  "/employees":       "Employees",
  "/salary-requests": "Salary Requests",
  "/recoveries":      "Recoveries",
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
        className={`fixed inset-y-0 left-0 z-40 flex w-[220px] flex-col transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
        style={{ background: "#F0F0F8", borderRight: "1px solid #E4E4EF" }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-4 h-[52px]" style={{ borderBottom: "1px solid #E4E4EF" }}>
            <div className="flex items-center gap-2.5">
              <svg width="26" height="26" viewBox="0 0 100 100" fill="none" aria-hidden="true" style={{flexShrink:0}}>
                <defs><clipPath id="emp-sb-clip"><rect width="100" height="100" rx="20" ry="20"/></clipPath></defs>
                <rect width="100" height="100" rx="20" ry="20" fill="#7679FF"/>
                <g clipPath="url(#emp-sb-clip)">
                  <polygon points="6,100 18,100 68,0 56,0" fill="white" opacity="0.95"/>
                  <polygon points="30,100 42,100 92,0 80,0" fill="white" opacity="0.95"/>
                  <polygon points="54,100 66,100 100,32 100,8" fill="white" opacity="0.95"/>
                </g>
              </svg>
              <div>
                <p className="text-[13px] font-[700] leading-none tracking-[-0.02em]" style={{ color: "#191A2E" }}>MobPae</p>
                <p className="text-[9px] leading-none mt-0.5 uppercase font-[600]" style={{ color: "#8D90A3", letterSpacing: "0.08em" }}>Employer</p>
              </div>
            </div>
            <button aria-label="Close navigation" onClick={onClose} className="lg:hidden w-7 h-7 flex items-center justify-center rounded" style={{ color: "#8D90A3" }}><X size={15} /></button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
            {NAV.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to} to={to} onClick={onClose}
                className={({ isActive }) => `flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[12.5px] transition-colors ${isActive ? "font-[600]" : "font-[500] hover:bg-black/[0.05]"}`}
                style={({ isActive }) => isActive
                  ? { background: "rgba(118,121,255,0.12)", color: "#5659D9" }
                  : { color: "#62657A" }
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={15} style={{ color: isActive ? "#7679FF" : "#8D90A3" }} />
                    {label}
                    {isActive && <ChevronRight size={12} className="ml-auto" style={{ color: "#7679FF" }} />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="px-3 py-3" style={{ borderTop: "1px solid #E4E4EF" }}>
            <div className="flex items-center gap-2.5 px-1 py-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#7679FF" }}>
                <span className="text-[11px] font-[700] text-white">{user?.companyCode?.slice(0, 2).toUpperCase() ?? "MP"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-[600] truncate leading-none" style={{ color: "#191A2E" }}>{user?.companyName ?? "Company"}</p>
                <p className="text-[11px] mt-0.5 truncate" style={{ color: "#8D90A3" }}>{user?.companyCode}</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/change-password")}
              className="mt-1 w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] font-[500] transition-colors hover:bg-black/[0.05]"
              style={{ color: "#62657A" }}
            >
              <KeyRound size={13} />Change Password
            </button>
            <button onClick={() => setConfirmLogout(true)} className="mt-0.5 w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] font-[500] transition-colors hover:bg-red-50 hover:text-red-500" style={{ color: "#62657A" }}>
              <LogOut size={13} />Sign out
            </button>
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
    : user?.companyName || "Employer admin";

  return (
    <header className="sticky top-0 z-20 h-[52px] flex items-center justify-between px-5 bg-white" style={{ borderBottom: "1px solid #E4E4EF" }}>
      <div className="flex items-center gap-3">
        <button aria-label="Open navigation" onClick={onMenuClick} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg transition-colors" style={{ border: "1px solid #E4E4EF", color: "#8D90A3" }}>
          <Menu size={16} />
        </button>
        <h1 className="text-[14px] font-[600]" style={{ color: "#191A2E" }}>{pageTitle}</h1>
      </div>
      <div className="flex items-center gap-1.5">
        <NotificationBell />
        <button
          onClick={() => navigate("/change-password")}
          title="Change Password"
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
          style={{ border: "1px solid #E4E4EF", color: "#8D90A3" }}
        >
          <KeyRound size={14} />
        </button>
        <div className="w-px h-4 mx-1" style={{ background: "#E4E4EF" }} />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#7679FF" }}>
            <span className="text-[11px] font-[700] text-white">{user ? initials(displayName) : "?"}</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-[12px] font-[600] leading-none" style={{ color: "#191A2E" }}>{displayName}</p>
            <p className="text-[11px] mt-0.5" style={{ color: "#8D90A3" }}>{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export function EmployerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="employer-portal min-h-screen" style={{ background: "#F7F7FB" }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-[220px] flex flex-col min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6"><Outlet /></main>
      </div>
    </div>
  );
}
