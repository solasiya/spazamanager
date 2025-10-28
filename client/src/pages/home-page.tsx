import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { PageHeader } from "@/components/layout/page-header";
import { useAuth } from "@/hooks/use-auth";
import { StatCard } from "@/components/dashboard/stat-card";
import { AlertsSection } from "@/components/dashboard/alerts-section";
import { InventoryOverview } from "@/components/dashboard/inventory-overview";
import { RecentSales } from "@/components/dashboard/recent-sales";
import { SuppliersSection } from "@/components/dashboard/suppliers-section";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ShoppingCart, AlertTriangle, Calendar, Tags } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  
  const { data: dashboardStats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  return (
    <Layout>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user?.fullName || user?.full_name || 'User'}! Here's your store overview.`}
        actions={
          <div className="flex mt-4 md:mt-0 gap-2">
            <button className="bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-lg flex items-center">
              <ShoppingCart className="mr-2 h-4 w-4" /> New Sale
            </button>
          </div>
        }
      />

      {/* Date range selector */}
      <div className="mb-6 flex flex-wrap items-center justify-between bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center mb-3 md:mb-0">
          <span className="mr-2 font-medium">Date Range:</span>
          <select 
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-accent focus:border-accent"
            defaultValue="Last 7 days"
          >
            <option>Today</option>
            <option>Yesterday</option>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>This month</option>
            <option>Custom range</option>
          </select>
        </div>
        <div className="flex space-x-2">
          <button className="bg-light hover:bg-gray-200 text-dark px-3 py-2 rounded-lg flex items-center text-sm">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
          <button className="bg-light hover:bg-gray-200 text-dark px-3 py-2 rounded-lg flex items-center text-sm">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
          <button className="bg-light hover:bg-gray-200 text-dark px-3 py-2 rounded-lg flex items-center text-sm">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Sales"
          value={isLoading ? "Loading..." : `R ${dashboardStats?.totalSales?.toFixed(2) || '0.00'}`}
          icon={<ShoppingCart className="h-5 w-5" />}
          trend={{
            value: "12% vs last week",
            isPositive: true
          }}
          borderColor="border-accent"
          bgColor="bg-accent/10"
          iconColor="text-accent"
        />
        <StatCard
          title="Low Stock Items"
          value={isLoading ? "Loading..." : `${dashboardStats?.lowStockCount || '0'}`}
          icon={<AlertTriangle className="h-5 w-5" />}
          trend={{
            value: "4 more than last week",
            isPositive: false
          }}
          borderColor="border-primary"
          bgColor="bg-primary/10"
          iconColor="text-primary"
        />
        <StatCard
          title="Items Expiring Soon"
          value={isLoading ? "Loading..." : `${dashboardStats?.expiringItemsCount || '0'}`}
          icon={<Calendar className="h-5 w-5" />}
          trend={{
            value: "Within 7 days",
            isPositive: false
          }}
          borderColor="border-warning"
          bgColor="bg-warning/10"
          iconColor="text-warning"
        />
        <StatCard
          title="Top Categories"
          value={isLoading ? "Loading..." : `${dashboardStats?.topCategory || 'None'}`}
          icon={<Tags className="h-5 w-5" />}
          trend={{
            value: "28% of sales",
            isPositive: true
          }}
          borderColor="border-success"
          bgColor="bg-success/10"
          iconColor="text-success"
        />
      </div>

      {/* Alerts */}
      <AlertsSection />

      {/* Two column layout for inventory and sales data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <InventoryOverview />
        <RecentSales />
      </div>

      {/* Suppliers Section */}
      <SuppliersSection />

      {/* Quick Actions */}
      <QuickActions />
    </Layout>
  );
}
