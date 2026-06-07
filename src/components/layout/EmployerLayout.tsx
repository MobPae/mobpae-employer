import {
  Bell,
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  UsersRound,
  WalletCards,
  X
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Employees", to: "/employees", icon: UsersRound },
  { label: "Salary Requests", to: "/salary-requests", icon: ClipboardList },
  { label: "Repayments", to: "/repayments", icon: CreditCard },
  { label: "Payroll", to: "/payroll", icon: CalendarDays },
  { label: "Settings", to: "/settings", icon: Settings }
];

export function EmployerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white px-4 py-4 shadow-xl transition-transform lg:translate-x-0 lg:shadow-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 px-2">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-white">
              <WalletCards size={21} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-950">MobPae</p>
              <p className="text-xs font-medium text-slate-500">Employer Portal</p>
            </div>
          </div>
          <button className="grid h-9 w-9 place-items-center rounded-md text-slate-500 hover:bg-slate-100 lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav className="mt-8 grid gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-semibold transition ${
                    isActive ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  }`
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-slate-700">
            <Building2 size={16} />
            <span className="text-xs font-bold uppercase tracking-normal">{user?.companyCode}</span>
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-950">{user?.companyName}</p>
          <button className="mt-4 flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50" onClick={handleLogout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {sidebarOpen ? <button aria-label="Close sidebar" className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden" onClick={() => setSidebarOpen(false)} /> : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/88 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <button className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 text-slate-600 lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu size={18} />
            </button>
            <div>
              <p className="text-xs font-semibold text-slate-500">Company</p>
              <p className="text-sm font-bold text-slate-950">{user?.companyName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="relative grid h-9 w-9 place-items-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50" aria-label="Notifications">
              <Bell size={17} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-teal-500" />
            </button>
            <button className="flex min-h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-slate-950 text-xs text-white">AM</span>
              <span className="hidden sm:inline">{user?.name}</span>
              <ChevronDown size={15} />
            </button>
          </div>
        </header>

        <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
