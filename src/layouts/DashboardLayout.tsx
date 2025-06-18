import { Outlet, NavLink } from "react-router-dom";
import { LayoutDashboard, Settings, Monitor, Users, KeyRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import clsx from "clsx";
import { useState } from "react";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    clsx(
      "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
      isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
    );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-background border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            className="md:hidden p-2"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            ☰
          </button>
          <span className="font-semibold text-xl">IoT Dashboard</span>
        </div>

        <nav
          className={clsx(
            "space-x-4 md:flex absolute md:static bg-background left-0 right-0 top-full md:top-auto px-4 md:px-0",
            open ? "block" : "hidden"
          )}
        >
          <NavLink to="/devices" className={linkCls}>
            <LayoutDashboard className="h-5 w-5" /> Devices
          </NavLink>
          <NavLink to="/telemetry" className={linkCls}>
            <Monitor className="h-5 w-5" /> Telemetry
          </NavLink>
          <NavLink to="/settings" className={linkCls}>
            <Settings className="h-5 w-5" /> Settings
          </NavLink>
           <NavLink
            to="/reset"
            className={linkCls}
          >
            <KeyRound className="h-5 w-5" />
            {user?.mustChangePwd ? "Set password" : "Change password"}
          </NavLink>
          {user?.role === "admin" && (
            <NavLink to="/users" className={linkCls}>
              <Users className="h-5 w-5" /> Users
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-4">
          <span className="whitespace-nowrap">{user?.name}</span>
          <button
            onClick={logout}
            className="text-sm text-muted-foreground hover:underline"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  );
}