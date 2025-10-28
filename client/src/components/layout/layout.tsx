import { ReactNode, useState } from "react";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      {/* Mobile Navigation */}
      <MobileNav />
      
      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6 bg-gray-100">
        {children}
      </main>
    </div>
  );
}
