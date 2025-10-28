import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Store, Menu, X, Plus, LayoutDashboard, Package, Coins, MoreHorizontal } from "lucide-react";
import { Sidebar } from "./sidebar";

export function MobileNav() {
  const [showSidebar, setShowSidebar] = useState(false);
  const [location] = useLocation();

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const closeSidebar = () => {
    setShowSidebar(false);
  };

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <>
      {/* Mobile header */}
      <div className="bg-secondary p-3 flex justify-between items-center md:hidden">
        <div className="flex items-center">
          <div className="bg-accent rounded-lg p-1 mr-2">
            <Store className="text-white h-5 w-5" />
          </div>
          <h1 className="text-white text-lg font-heading font-bold">SPAZA MANAGER</h1>
        </div>
        <button onClick={toggleSidebar} className="text-white">
          {showSidebar ? <X /> : <Menu />}
        </button>
      </div>
      
      {/* Mobile sidebar */}
      {showSidebar && (
        <div className="md:hidden">
          <Sidebar isOpen={showSidebar} onClose={closeSidebar} />
        </div>
      )}
      
      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
        <div className="flex justify-between px-4">
          <Link href="/">
            <a className={`flex flex-col items-center py-2 px-3 ${isActive("/") ? "text-accent" : "text-gray-600"}`}>
              <LayoutDashboard className="h-5 w-5" />
              <span className="text-xs">Dashboard</span>
            </a>
          </Link>
          <Link href="/inventory">
            <a className={`flex flex-col items-center py-2 px-3 ${isActive("/inventory") ? "text-accent" : "text-gray-600"}`}>
              <Package className="h-5 w-5" />
              <span className="text-xs">Inventory</span>
            </a>
          </Link>
          <div className="flex flex-col items-center py-2 px-3 text-gray-600">
            <button className="bg-accent rounded-full w-12 h-12 flex items-center justify-center -mt-4 text-white">
              <Plus className="h-6 w-6" />
            </button>
            <span className="text-xs mt-1">Add</span>
          </div>
          <Link href="/sales">
            <a className={`flex flex-col items-center py-2 px-3 ${isActive("/sales") ? "text-accent" : "text-gray-600"}`}>
              <Coins className="h-5 w-5" />
              <span className="text-xs">Sales</span>
            </a>
          </Link>
          <Link href="#more">
            <a className="flex flex-col items-center py-2 px-3 text-gray-600">
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-xs">More</span>
            </a>
          </Link>
        </div>
      </nav>
    </>
  );
}
