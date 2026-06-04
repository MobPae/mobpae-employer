import {
  LayoutDashboard,
  Users,
  Receipt,
  CalendarDays,
  Building2,
  BarChart3,
  LogOut,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

const menuItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },

  {
    label: "Employees",
    path: "/employees",
    icon: Users,
  },

  {
    label: "Salary Requests",
    path: "/salary-requests",
    icon: Receipt,
  },

  {
    label: "Payroll Settings",
    path: "/payroll-settings",
    icon: CalendarDays,
  },

  {
    label: "Company Profile",
    path: "/company-profile",
    icon: Building2,
  },

  {
    label: "Reports",
    path: "/reports",
    icon: BarChart3,
  },
];

export default function Sidebar() {
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
      <div className="h-16 px-6 flex items-center border-b border-slate-100">
        <div>
          <h1 className="text-xl font-bold text-blue-600">MobPae</h1>

          <p className="text-[11px] text-slate-500">Employer Portal</p>
        </div>
      </div>

      <div className="flex-1 p-4">
        <div className="mb-3 px-3 text-[11px] font-semibold text-slate-400 uppercase">
          Main
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `
                    flex items-center gap-3
                    px-3 py-2.5
                    rounded-xl
                    text-sm
                    transition-all
                    ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50"
                    }
                  `
                }
              >
                <Icon size={18} />

                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-100">
        <div className="mb-3">
          <p className="text-xs text-slate-500">Logged in as</p>

          <p className="text-sm font-medium truncate">{user?.email}</p>
        </div>

        <button
          onClick={handleLogout}
          className="
              w-full
              flex items-center
              justify-center
              gap-2
              px-3 py-2.5
              rounded-xl
              border
              border-slate-200
              text-sm
              hover:bg-slate-50
            "
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
