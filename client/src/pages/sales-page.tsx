import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { PageHeader } from "@/components/layout/page-header";
import { SalesTable } from "@/components/sales/sales-table";
import { PlusCircle, FileText, BarChart2, TrendingUp, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddSaleForm } from "@/components/sales/add-sale-form";
import { useQuery } from "@tanstack/react-query";
import { Sale } from "@shared/schema";

export default function SalesPage() {
  const [isAddSaleDialogOpen, setIsAddSaleDialogOpen] = useState(false);
  
  const { data: sales, isLoading } = useQuery<Sale[]>({
    queryKey: ["/api/sales"],
  });

  // Calculate total sales for today, week, and month
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const todaySales = sales?.filter(sale => new Date(sale.date) >= startOfDay) || [];
  const weekSales = sales?.filter(sale => new Date(sale.date) >= startOfWeek) || [];
  const monthSales = sales?.filter(sale => new Date(sale.date) >= startOfMonth) || [];

  const calculateTotal = (items: Sale[]) => {
    return items.reduce((sum, sale) => sum + Number(sale.total), 0);
  };

  const todayTotal = calculateTotal(todaySales);
  const weekTotal = calculateTotal(weekSales);
  const monthTotal = calculateTotal(monthSales);

  return (
    <Layout>
      <PageHeader
        title="Sales"
        description="Record and track sales transactions, analyze sales data, and generate reports."
        actions={
          <Button 
            onClick={() => setIsAddSaleDialogOpen(true)}
            className="bg-accent hover:bg-accent/90 text-white flex items-center gap-1"
          >
            <PlusCircle className="h-4 w-4" /> Record Sale
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-primary flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" /> Today's Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R {isLoading ? "..." : todayTotal.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground flex justify-between">
              <span>{todaySales.length} transactions</span>
              <span className="text-success flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" /> 12%
              </span>
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-accent flex items-center gap-2 text-lg">
              <BarChart2 className="h-5 w-5" /> This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R {isLoading ? "..." : weekTotal.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground flex justify-between">
              <span>{weekSales.length} transactions</span>
              <span className="text-success flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" /> 8%
              </span>
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-secondary flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" /> This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R {isLoading ? "..." : monthTotal.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground flex justify-between">
              <span>{monthSales.length} transactions</span>
              <span className="text-success flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" /> 15%
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-lg shadow-sm mb-6 p-4">
        <div className="flex flex-wrap justify-between items-center mb-4">
          <h2 className="text-xl font-heading font-bold">Sales History</h2>
          <div className="flex gap-2">
            <select className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-accent focus:border-accent">
              <option>All Time</option>
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
              <option>Last Month</option>
              <option>Custom Range</option>
            </select>
            <Button variant="outline" size="sm">Filter</Button>
          </div>
        </div>
        
        <SalesTable />
      </div>

      {/* Add Sale Dialog */}
      <Dialog open={isAddSaleDialogOpen} onOpenChange={setIsAddSaleDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Record New Sale</DialogTitle>
          </DialogHeader>
          <AddSaleForm onSuccess={() => setIsAddSaleDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
