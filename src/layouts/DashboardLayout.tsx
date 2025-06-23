// src/layouts/DashboardLayout.tsx
import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Settings,
  Monitor,
  Users,
  KeyRound,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import clsx from "clsx";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  /** tailwind classes for nav items */
  const linkCls = ({ isActive }: { isActive: boolean }) =>
    clsx(
      "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
      isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
    );

  const isAdmin = user?.roles.includes("Admin");

  return (
    <div className="min-h-screen flex flex-col">
      {/* ─────────────── header / top-bar ─────────────── */}
      <header className="bg-background border-b px-4 py-2 flex items-center justify-between">
        {/* brand + burger */}
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

        {/* nav – collapses on < md */}
        <nav
          className={clsx(
            "space-x-4 md:flex absolute md:static bg-background left-0 right-0 top-full md:top-auto px-4 md:px-0",
            open ? "block" : "hidden"
          )}
          onClick={() => setOpen(false)} /* close menu on link click */
        >
          <NavLink to="/devices"   className={linkCls}>
            <LayoutDashboard className="h-5 w-5" />
            Devices
          </NavLink>

          <NavLink to="/telemetry" className={linkCls}>
            <Monitor className="h-5 w-5" />
            Telemetry
          </NavLink>

          <NavLink to="/settings"  className={linkCls}>
            <Settings className="h-5 w-5" />
            Settings
          </NavLink>

          {/* self-service password reset */}
          <NavLink to="/reset" className={linkCls}>
            <KeyRound className="h-5 w-5" />
            New password
          </NavLink>

          {isAdmin && (
            <NavLink to="/users" className={linkCls}>
              <Users className="h-5 w-5" />
              Users
            </NavLink>
          )}
        </nav>

        {/* right-side profile / logout */}
        <div className="flex items-center gap-4">
          <span className="whitespace-nowrap">
            {user?.userName ?? "—"}
          </span>
          <button
            onClick={logout}
            className="text-sm text-muted-foreground hover:underline"
          >
            Logout
          </button>
        </div>
      </header>

      {/* routed pages */}
      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  );
}
