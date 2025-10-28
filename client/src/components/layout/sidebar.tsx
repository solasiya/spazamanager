import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Store,
  LayoutDashboard,
  Package,
  Coins,
  Truck,
  BarChart3,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavLinkProps = {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
};

const NavLink = ({ href, icon, children, onClick }: NavLinkProps) => {
  const [location] = useLocation();
  const isActive = location === href;

  return (
    <li className="mb-1">
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          "flex items-center p-3 rounded-lg text-gray-300 hover:bg-sky-800/30 transition-colors",
          isActive && "bg-sky-800/30 text-white"
        )}
      >
        {React.cloneElement(icon as React.ReactElement, {
          className: "mr-3 w-5 h-5",
        })}
        <span>{children}</span>
      </Link>
    </li>
  );
};

export function Sidebar({
  isOpen = true,
  onClose,
}: {
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const { user, logoutMutation } = useAuth();
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <aside
      className={cn(
        "bg-sidebar w-full md:w-64 md:min-h-screen md:flex flex-col fixed md:sticky top-0 z-30 transition-all duration-300 transform",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        "md:block"
      )}
      style={{ height: "100vh" }}
    >
      <div className="p-4 flex justify-center">
        {/* Logo */}
        <div className="flex items-center">
          {/* Removed bg-accent and padding from logo container */}
          <img
            src="https://iili.io/K2gOdEF.png"
            alt="Spaza Logo"
            style={{ width: "100px", height: "100px", background: "none" }}
            className="mr-2"
          />
          <h1 className="text-white text-xl font-heading font-bold">
            SPAZA MANAGER
          </h1>
        </div>
      </div>

      {/* User Info */}
      {user && (
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-light flex items-center justify-center text-secondary font-bold">
              {(user.fullName || user.full_name)
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "U"}
            </div>
            <div className="ml-3">
              <p className="text-white font-semibold">
                {user.fullName || user.full_name}
              </p>
              <p className="text-gray-300 text-sm capitalize">{user.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="p-2 overflow-y-auto flex-1">
        <ul>
          <NavLink href="/" icon={<LayoutDashboard />} onClick={onClose}>
            Dashboard
          </NavLink>
          <NavLink href="/inventory" icon={<Package />} onClick={onClose}>
            Inventory
          </NavLink>
          <NavLink href="/sales" icon={<Coins />} onClick={onClose}>
            Sales
          </NavLink>
          <NavLink href="/suppliers" icon={<Truck />} onClick={onClose}>
            Suppliers
          </NavLink>
          <NavLink href="/reports" icon={<BarChart3 />} onClick={onClose}>
            Reports
          </NavLink>
          {user?.role === "owner" && (
            <NavLink href="/users" icon={<Users />} onClick={onClose}>
              Users
            </NavLink>
          )}
          <NavLink href="/settings" icon={<Settings />} onClick={onClose}>
            Settings
          </NavLink>
        </ul>
      </nav>

      <div className="mt-auto p-4 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="flex items-center w-full p-2 rounded-lg text-gray-300 hover:bg-sky-800/30 transition-colors"
          disabled={logoutMutation.isPending}
        >
          <LogOut className="mr-3 h-5 w-5" />
          <span>{logoutMutation.isPending ? "Logging out..." : "Logout"}</span>
        </button>
      </div>
    </aside>
  );
}
