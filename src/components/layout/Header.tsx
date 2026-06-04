import { useLocation } from "react-router-dom";

export default function Header() {
  const location = useLocation();

  const pageTitles: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/employees": "Employees",
    "/salary-requests": "Salary Requests",
    "/payroll-settings": "Payroll Settings",
    "/company-profile": "Company Profile",
    "/reports": "Reports",
  };

  const title = pageTitles[location.pathname] || "Employer Portal";

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      </div>

      <div className="text-xs text-slate-500">MobPae Employer</div>
    </header>
  );
}
