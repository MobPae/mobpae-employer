import {
  ArrowDownCircle,
  Bell,
  CalendarDays,
  ChevronRight,
  ClipboardList,
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
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[220px] flex-col bg-[#0f1729] transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="pointer-events-none absolute inset-0 opacity-[0.035]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-4 h-[52px] border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center text-white font-[700] text-[12px] shadow-lg shadow-blue-500/30 flex-shrink-0">M</div>
              <div>
                <p className="text-[13px] font-[600] text-white leading-none">MobPae</p>
                <p className="text-[9px] text-white/30 leading-none mt-0.5 uppercase tracking-[0.1em]">Employer</p>
              </div>
            </div>
            <button onClick={onClose} className="lg:hidden w-7 h-7 flex items-center justify-center text-white/40 hover:text-white/70 rounded"><X size={15} /></button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
            {NAV.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to} to={to} onClick={onClose}
                className={({ isActive }) => `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] font-[500] transition-colors ${isActive ? "bg-white/10 text-white" : "text-white/45 hover:text-white/80 hover:bg-white/[0.06]"}`}
              >
                {({ isActive }) => (
                  <>
                    <Icon size={15} className={isActive ? "text-blue-400" : ""} />
                    {label}
                    {isActive && <ChevronRight size={12} className="ml-auto text-white/30" />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="px-3 py-3 border-t border-white/[0.06]">
            <div className="flex items-center gap-2.5 px-1 py-2">
              <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-[700] text-white/70">{user?.companyCode?.slice(0, 2).toUpperCase() ?? "MP"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-[600] text-white/80 truncate leading-none">{user?.companyName ?? "Company"}</p>
                <p className="text-[10px] text-white/30 mt-0.5 truncate">{user?.companyCode}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="mt-1 w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] font-[500] text-white/35 hover:text-red-400 hover:bg-red-500/10 transition-colors">
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
  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] ?? "MobPae";

  return (
    <header className="sticky top-0 z-20 h-[52px] flex items-center justify-between px-5 bg-white border-b border-slate-100">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">
          <Menu size={16} />
        </button>
        <h1 className="text-[14px] font-[600] text-slate-900">{pageTitle}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
        </button>
        <div className="flex items-center gap-2 pl-1">
          <div className="w-7 h-7 rounded-full bg-[#0f1729] flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-[700] text-white">{user ? initials(user.name) : "?"}</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-[12px] font-[600] text-slate-800 leading-none">{user?.name}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export function EmployerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-[220px] flex flex-col min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6"><Outlet /></main>
      </div>
    </div>
  );
}
