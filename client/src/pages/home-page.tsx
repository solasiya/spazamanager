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
import { ShoppingCart, AlertTriangle, Calendar, Tags, Printer, Download, RefreshCw } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { printPage, exportToCSV } from "@/lib/export-utils";
import { useToast } from "@/hooks/use-toast";

import { useState } from "react";
interface DashboardStats {
  totalSales: number;
  lowStockCount: number;
  expiringItemsCount: number;
  topCategory: string;
}

export default function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [range, setRange] = useState("today");
  
  const { data: dashboardStats, isLoading, refetch } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats", range],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/stats?range=${range}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    }
  });

  const handleRefresh = async () => {
    try {
      await queryClient.invalidateQueries();
      toast({
        title: "Data Refreshed",
        description: "The dashboard data has been updated with the latest information."
      });
    } catch (err) {
      toast({
        title: "Refresh Failed",
        description: "Could not update the latest data points.",
        variant: "destructive"
      });
    }
  };

  const handleExport = () => {
    if (!dashboardStats) return;
    const exportData = [
      { Metric: "Total Sales", Value: `R ${dashboardStats.totalSales.toFixed(2)}` },
      { Metric: "Low Stock Items", Value: dashboardStats.lowStockCount },
      { Metric: "Expiring Soon", Value: dashboardStats.expiringItemsCount },
      { Metric: "Top Category", Value: dashboardStats.topCategory }
    ];
    exportToCSV(exportData, "Dashboard_Report");
    toast({ title: "Export Started", description: "Your CSV report is downloading..." });
  };

  return (
    <Layout>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user?.fullName || 'User'}! Here's your store overview.`}
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
            value={range}
            onChange={(e) => setRange(e.target.value)}
          >
            <option value="today">Today</option>
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="year">Past Year</option>
          </select>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={printPage}
            className="bg-gray-100 hover:bg-gray-200 text-dark px-3 py-2 rounded-lg flex items-center text-sm transition-colors border border-gray-200"
          >
            <Printer className="w-4 h-4 mr-1" />
            Print
          </button>
          <button 
            onClick={handleExport}
            className="bg-gray-100 hover:bg-gray-200 text-dark px-3 py-2 rounded-lg flex items-center text-sm transition-colors border border-gray-200"
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </button>
          <button 
            onClick={handleRefresh}
            className="bg-gray-100 hover:bg-gray-200 text-dark px-3 py-2 rounded-lg flex items-center text-sm transition-colors border border-gray-200"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
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
          borderColor="border-accent"
          bgColor="bg-accent/10"
          iconColor="text-accent"
        />
        <StatCard
          title="Low Stock Items"
          value={isLoading ? "Loading..." : `${dashboardStats?.lowStockCount || '0'}`}
          icon={<AlertTriangle className="h-5 w-5" />}
          borderColor="border-primary"
          bgColor="bg-primary/10"
          iconColor="text-primary"
        />
        <StatCard
          title="Items Expiring Soon"
          value={isLoading ? "Loading..." : `${dashboardStats?.expiringItemsCount || '0'}`}
          icon={<Calendar className="h-5 w-5" />}
          borderColor="border-warning"
          bgColor="bg-warning/10"
          iconColor="text-warning"
        />
        <StatCard
          title="Top Categories"
          value={isLoading ? "Loading..." : `${dashboardStats?.topCategory || 'None'}`}
          icon={<Tags className="h-5 w-5" />}
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
