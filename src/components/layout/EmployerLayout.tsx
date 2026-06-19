import {
  ArrowDownCircle,
  Bell,
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
        style={{ background: "linear-gradient(180deg, #022c22 0%, #065f46 45%, #047857 100%)" }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-4 h-[52px] border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-white font-[700] text-[12px] flex-shrink-0">M</div>
              <div>
                <p className="text-[13px] font-[600] text-white leading-none">MobPae</p>
                <p className="text-[9px] text-white/40 leading-none mt-0.5 uppercase tracking-[0.1em]">Employer</p>
              </div>
            </div>
            <button onClick={onClose} className="lg:hidden w-7 h-7 flex items-center justify-center text-white/50 hover:text-white rounded"><X size={15} /></button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
            {NAV.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to} to={to} onClick={onClose}
                className={({ isActive }) => `flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[12.5px] transition-colors ${isActive ? "bg-white/15 text-white font-[600]" : "text-white/55 font-[500] hover:text-white hover:bg-white/10"}`}
              >
                {({ isActive }) => (
                  <>
                    <Icon size={15} className={isActive ? "text-white" : "text-white/40"} />
                    {label}
                    {isActive && <ChevronRight size={12} className="ml-auto text-white/40" />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="px-3 py-3 border-t border-white/10">
            <div className="flex items-center gap-2.5 px-1 py-2">
              <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-[700] text-white">{user?.companyCode?.slice(0, 2).toUpperCase() ?? "MP"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-[600] text-white truncate leading-none">{user?.companyName ?? "Company"}</p>
                <p className="text-[10px] text-white/40 mt-0.5 truncate">{user?.companyCode}</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/change-password")}
              className="mt-1 w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] font-[500] text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <KeyRound size={13} />Change Password
            </button>
            <button onClick={handleLogout} className="mt-0.5 w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] font-[500] text-white/50 hover:text-red-300 hover:bg-red-900/30 transition-colors">
              <LogOut size={13} />Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] ?? "MobPae";

  return (
    <header className="sticky top-0 z-20 h-[52px] flex items-center justify-between px-5 bg-white" style={{ borderBottom: "1px solid #e2e8f0" }}>
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-[#6b7280] hover:bg-[#ecfdf5] hover:text-[#059669]" style={{ border: "1px solid #e2e8f0" }}>
          <Menu size={16} />
        </button>
        <h1 className="text-[14px] font-[600]" style={{ color: "#1a1a1a" }}>{pageTitle}</h1>
      </div>
      <div className="flex items-center gap-1.5">
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-[#6b7280] hover:text-[#059669] hover:bg-[#ecfdf5]" style={{ border: "1px solid #e2e8f0" }}>
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#059669]" />
        </button>
        <button
          onClick={() => navigate("/change-password")}
          title="Change Password"
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-[#6b7280] hover:text-[#059669] hover:bg-[#ecfdf5]"
          style={{ border: "1px solid #e2e8f0" }}
        >
          <KeyRound size={14} />
        </button>
        <div className="w-px h-4 mx-1" style={{ background: "#e8ddd5" }} />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#059669] flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-[700] text-white">{user ? initials(user.name) : "?"}</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-[12px] font-[600] leading-none" style={{ color: "#1a1a1a" }}>{user?.name}</p>
            <p className="text-[10px] mt-0.5" style={{ color: "#6b7280" }}>{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export function EmployerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-[220px] flex flex-col min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6"><Outlet /></main>
      </div>
    </div>
  );
}
