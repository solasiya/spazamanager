import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { PageHeader } from "@/components/layout/page-header";
import { ReportCard } from "@/components/reports/report-card";
import { 
  BarChart, 
  PieChart, 
  TrendingUp, 
  Clock, 
  ShoppingBag, 
  DollarSign, 
  Package, 
  Truck,
  Download,
  Printer,
  RefreshCw
} from "lucide-react";
import { Product, Sale, Restock, Category } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { exportToCSV, printPage } from "@/lib/export-utils";
import { useToast } from "@/hooks/use-toast";

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("week");
  const { toast } = useToast();
  
  const { data: products, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const handleRefresh = async () => {
    await queryClient.invalidateQueries();
    toast({ title: "Refreshed", description: "Reports data has been updated." });
  };

  const handleExport = () => {
    // Generate a summary report
    const summaryData = [
      { Metric: "Total Sales", Value: `R ${totalSalesVal.toFixed(2)}` },
      { Metric: "Profit Margin", Value: `${profitMargin}%` },
      { Metric: "Items Sold", Value: totalItemsSold },
      { Metric: "Transactions", Value: numTransactions },
      { Metric: "Period", Value: dateRange }
    ];
    exportToCSV(summaryData, `Business_Summary_Report_${dateRange}`);
    toast({ title: "Export Started", description: "Your summary report is downloading..." });
  };
  
  const { data: sales, isLoading: isLoadingSales } = useQuery<Sale[]>({
    queryKey: ["/api/sales"],
  });

  const { data: restocks, isLoading: isLoadingRestocks } = useQuery<Restock[]>({
    queryKey: ["/api/restocks"],
  });

  const { data: categories, isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const isLoading = isLoadingProducts || isLoadingSales || isLoadingRestocks || isLoadingCategories;

  // Filter data by date range
  const getFilteredData = () => {
    if (!sales || !restocks) return { filteredSales: [], filteredRestocks: [] };
    
    const now = new Date();
    let startDate = new Date();
    
    switch (dateRange) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case "custom":
        // Default to all for now
        startDate = new Date(0);
        break;
      default:
        startDate = new Date(0);
    }

    const filteredSales = sales.filter(s => s.date && new Date(s.date) >= startDate);
    const filteredRestocks = restocks.filter(r => r.date && new Date(r.date) >= startDate);
    
    return { filteredSales, filteredRestocks };
  };

  const { filteredSales, filteredRestocks } = getFilteredData();

  // Calculations
  const totalSalesVal = filteredSales.reduce((sum, sale) => sum + Number(sale.total), 0);
  
  const totalItemsSold = filteredSales.reduce((sum, sale) => {
    const items = (sale.items as any[]) || [];
    return sum + items.reduce((iSum, item) => iSum + Number(item.quantity), 0);
  }, 0);

  const totalCost = filteredSales.reduce((sum, sale) => {
    const items = (sale.items as any[]) || [];
    return sum + items.reduce((iSum, item) => {
      const product = products?.find(p => p.id === item.productId);
      return iSum + (Number(product?.purchasePrice || 0) * Number(item.quantity));
    }, 0);
  }, 0);

  const profitMargin = totalSalesVal > 0 ? ((totalSalesVal - totalCost) / totalSalesVal * 100).toFixed(1) : "0.0";
  const numTransactions = filteredSales.length;

  return (
    <Layout>
      <PageHeader
        title="Reports"
        description="Generate and view reports on sales, inventory, and other business metrics."
        actions={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            <Button 
              variant="outline" 
              onClick={printPage}
              className="flex items-center gap-1"
            >
              <Printer className="h-4 w-4" /> Print
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExport}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" /> Export Summary
            </Button>
          </div>
        }
      />

      <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-heading font-bold">Report Period</h2>
          <select 
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-accent focus:border-accent"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
            <option value="custom">All Time</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-primary flex items-center gap-2 text-base">
                <ShoppingBag className="h-4 w-4" /> Total Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R {totalSalesVal.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground capitalize">
                {dateRange === "custom" ? "Total across all time" : `${dateRange} period`}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-accent flex items-center gap-2 text-base">
                <DollarSign className="h-4 w-4" /> Profit Margin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profitMargin}%</div>
              <p className="text-xs text-muted-foreground">
                Margin based on cost price
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-success flex items-center gap-2 text-base">
                <Package className="h-4 w-4" /> Items Sold
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItemsSold}</div>
              <p className="text-xs text-muted-foreground">
                {numTransactions} transactions
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-warning flex items-center gap-2 text-base">
                <Truck className="h-4 w-4" /> Supplier Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredRestocks.length}</div>
              <p className="text-xs text-muted-foreground">
                Receiving orders
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="sales" className="mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="sales">Sales Analytics</TabsTrigger>
            <TabsTrigger value="inventory">Inventory Status</TabsTrigger>
            <TabsTrigger value="products">Top Products</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sales">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ReportCard 
                title="Sales Volume"
                icon={<BarChart className="h-5 w-5" />}
                content={
                  <div className="h-64 flex flex-col items-center justify-center bg-gray-50 rounded-lg p-6">
                    <div className="text-center w-full">
                      <BarChart className="h-12 w-12 mx-auto text-primary mb-2 opacity-50" />
                      <p className="text-sm font-semibold">Sales Statistics</p>
                      <div className="mt-4 space-y-3">
                        <div className="flex justify-between text-xs p-2 bg-white rounded border border-gray-100">
                          <span className="text-muted-foreground">Highest Sale</span>
                          <span className="font-bold whitespace-nowrap ml-2">R {filteredSales.length > 0 ? Math.max(...filteredSales.map(s => Number(s.total))).toFixed(2) : "0.00"}</span>
                        </div>
                        <div className="flex justify-between text-xs p-2 bg-white rounded border border-gray-100">
                          <span className="text-muted-foreground">Average Order Value</span>
                          <span className="font-bold whitespace-nowrap ml-2">R {numTransactions > 0 ? (totalSalesVal / numTransactions).toFixed(2) : "0.00"}</span>
                        </div>
                        <div className="flex justify-between text-xs p-2 bg-white rounded border border-gray-100">
                          <span className="text-muted-foreground">Total Transactions</span>
                          <span className="font-bold whitespace-nowrap ml-2">{numTransactions}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              />
              <ReportCard 
                title="Daily Activity"
                icon={<PieChart className="h-5 w-5" />}
                content={
                  <div className="h-64 flex flex-col items-center justify-center bg-gray-50 rounded-lg p-6">
                    {filteredSales.length > 0 ? (
                      <div className="w-full h-full flex flex-col justify-center">
                        <p className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Sales Activity by Day</p>
                        <div className="flex items-end justify-between h-32 gap-1 px-2">
                           {(() => {
                             const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                             const today = new Date();
                             const last7Days = Array.from({length: 7}, (_, i) => {
                               const d = new Date();
                               d.setDate(today.getDate() - (6 - i));
                               return d;
                             });
                             
                             const daySales = last7Days.map(d => {
                               const total = filteredSales
                                 .filter(s => s.date && new Date(s.date).toDateString() === d.toDateString())
                                 .reduce((sum, s) => sum + Number(s.total), 0);
                               return { day: days[d.getDay()], total };
                             });
                             
                             const max = Math.max(...daySales.map(d => d.total), 1);
                             
                             return daySales.map((d, i) => (
                               <div key={i} className="flex-1 flex flex-col items-center">
                                 <div 
                                   className="w-full bg-primary rounded-t-sm transition-all duration-500 hover:bg-primary/80 cursor-help" 
                                   style={{ height: `${(d.total / max * 100)}%` }}
                                   title={`R ${d.total.toFixed(2)}`}
                                 ></div>
                                 <span className="text-[10px] mt-1 text-muted-foreground font-bold">{d.day}</span>
                               </div>
                             ));
                           })()}
                        </div>
                        <p className="text-[10px] text-center mt-4 text-muted-foreground italic">Last 7 days of activity</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Clock className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm text-muted-foreground">No recent sales activity to visualize.</p>
                      </div>
                    )}
                  </div>
                }
              />
            </div>
          </TabsContent>
          
          <TabsContent value="inventory">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ReportCard 
                title="Stock Level Summary"
                icon={<Package className="h-5 w-5" />}
                content={
                  <div className="h-64 flex flex-col items-center justify-center bg-gray-50 rounded-lg p-6">
                    <div className="text-center w-full space-y-4">
                      <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                        <span className="text-sm font-medium">Out of Stock</span>
                        <span className="text-xl font-bold text-primary">{products?.filter(p => p.quantity === 0).length || 0}</span>
                      </div>
                      <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                        <span className="text-sm font-medium">Low Stock</span>
                        <span className="text-xl font-bold text-warning">{products?.filter(p => p.quantity > 0 && p.quantity <= (p.alertThreshold || 5)).length || 0}</span>
                      </div>
                      <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                        <span className="text-sm font-medium">In Stock</span>
                        <span className="text-xl font-bold text-success">{products?.filter(p => p.quantity > (p.alertThreshold || 5)).length || 0}</span>
                      </div>
                    </div>
                  </div>
                }
              />
              <ReportCard 
                title="Inventory Assets"
                icon={<DollarSign className="h-5 w-5" />}
                content={
                  <div className="h-64 flex flex-col items-center justify-center bg-gray-50 rounded-lg p-6">
                    <div className="text-center">
                      <DollarSign className="h-12 w-12 mx-auto text-primary mb-2" />
                      <p className="text-sm font-semibold">Total Assets Value</p>
                      <p className="text-2xl font-bold mt-2">R {(products?.reduce((sum, p) => sum + (Number(p.purchasePrice) * p.quantity), 0) || 0).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground mt-2">Combined value of all items currently in stock at purchase price.</p>
                    </div>
                  </div>
                }
              />
            </div>
          </TabsContent>
          
          <TabsContent value="products">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ReportCard 
                title="Top Selling Products"
                icon={<TrendingUp className="h-5 w-5" />}
                content={
                  <div className="h-64 overflow-auto">
                    {filteredSales.length > 0 ? (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Product</th>
                            <th className="text-center py-2">Qty Sold</th>
                            <th className="text-right py-2">Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const productSales: Record<number, { name: string, qty: number, revenue: number }> = {};
                            filteredSales.forEach(sale => {
                              (sale.items as any[]).forEach(item => {
                                const product = products?.find(p => p.id === item.productId);
                                if (!productSales[item.productId]) {
                                  productSales[item.productId] = { name: product?.name || "Unknown", qty: 0, revenue: 0 };
                                }
                                productSales[item.productId].qty += Number(item.quantity);
                                productSales[item.productId].revenue += Number(item.price) * Number(item.quantity);
                              });
                            });
                            return Object.values(productSales)
                              .sort((a, b) => b.revenue - a.revenue)
                              .slice(0, 5)
                              .map((ps, i) => (
                                <tr key={i} className="border-b">
                                  <td className="py-2">{ps.name}</td>
                                  <td className="text-center">{ps.qty}</td>
                                  <td className="text-right">R {ps.revenue.toFixed(2)}</td>
                                </tr>
                              ));
                          })()}
                        </tbody>
                      </table>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <Package className="h-8 w-8 mb-2 opacity-20" />
                        <p>No sales data recorded yet.</p>
                      </div>
                    )}
                  </div>
                }
              />
              <ReportCard 
                title="Inventory Health"
                icon={<BarChart className="h-5 w-5" />}
                content={
                  <div className="h-64 flex flex-col items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center p-4">
                      <TrendingUp className="h-12 w-12 mx-auto text-primary mb-2" />
                      <p className="text-sm font-medium">Inventory vs Sales Data</p>
                      <p className="text-xs text-muted-foreground mt-1">Real-time tracking of stock movements and profit yields per item.</p>
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="bg-white p-2 rounded shadow-sm border border-gray-100">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">In Stock</p>
                          <p className="text-lg font-bold">{products?.reduce((sum, p) => sum + p.quantity, 0) || 0}</p>
                        </div>
                        <div className="bg-white p-2 rounded shadow-sm border border-gray-100">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Sales</p>
                          <p className="text-lg font-bold">{numTransactions}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              />
            </div>
          </TabsContent>
          
          <TabsContent value="categories">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ReportCard 
                title="Sales Distribution"
                icon={<PieChart className="h-5 w-5" />}
                content={
                  <div className="h-64 flex flex-col items-center justify-center bg-gray-50 rounded-lg p-4">
                    <PieChart className="h-12 w-12 mx-auto text-primary mb-2 opacity-50" />
                    <p className="text-sm font-medium">Category Market Share</p>
                    <div className="mt-4 w-full space-y-2">
                      {(() => {
                        const catSales: Record<number, number> = {};
                        filteredSales.forEach(sale => {
                          (sale.items as any[]).forEach(item => {
                            const product = products?.find(p => p.id === item.productId);
                            if (product?.categoryId) {
                              catSales[product.categoryId] = (catSales[product.categoryId] || 0) + (Number(item.price) * Number(item.quantity));
                            }
                          });
                        });
                        return Object.entries(catSales)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 3)
                          .map(([id, rev], i) => {
                            const cat = categories?.find(c => c.id === Number(id));
                            const percent = totalSalesVal > 0 ? (rev / totalSalesVal * 100).toFixed(0) : 0;
                            return (
                              <div key={i} className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">{cat?.name || "Misc"}</span>
                                <div className="flex-1 mx-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-primary" style={{ width: `${percent}%` }}></div>
                                </div>
                                <span className="font-bold">{percent}%</span>
                              </div>
                            );
                          });
                      })()}
                    </div>
                  </div>
                }
              />
              <ReportCard 
                title="Category Performance"
                icon={<BarChart className="h-5 w-5" />}
                content={
                  <div className="h-64 overflow-auto">
                    {filteredSales.length > 0 ? (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Category</th>
                            <th className="text-center py-2">Items Sold</th>
                            <th className="text-right py-2">Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const catPerf: Record<number, { name: string, qty: number, revenue: number }> = {};
                            filteredSales.forEach(sale => {
                              (sale.items as any[]).forEach(item => {
                                const product = products?.find(p => p.id === item.productId);
                                const categoryId = product?.categoryId || 0;
                                if (!catPerf[categoryId]) {
                                  const cat = categories?.find(c => c.id === categoryId);
                                  catPerf[categoryId] = { name: cat?.name || "Uncategorized", qty: 0, revenue: 0 };
                                }
                                catPerf[categoryId].qty += Number(item.quantity);
                                catPerf[categoryId].revenue += Number(item.price) * Number(item.quantity);
                              });
                            });
                            return Object.values(catPerf)
                              .sort((a, b) => b.revenue - a.revenue)
                              .map((cp, i) => (
                                <tr key={i} className="border-b">
                                  <td className="py-2">{cp.name}</td>
                                  <td className="text-center">{cp.qty}</td>
                                  <td className="text-right">R {cp.revenue.toFixed(2)}</td>
                                </tr>
                              ));
                          })()}
                        </tbody>
                      </table>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <BarChart className="h-8 w-8 mb-2 opacity-20" />
                        <p>No category data available.</p>
                      </div>
                    )}
                  </div>
                }
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ReportCard 
            title="Recent Supplier Activity"
            icon={<Truck className="h-5 w-5" />}
            content={
              <div className="h-64 overflow-auto">
                {filteredRestocks.length > 0 ? (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Product/Activity</th>
                        <th className="text-center py-2">Quantity</th>
                        <th className="text-right py-2">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRestocks.slice(0, 5).map((r, i) => (
                        <tr key={i} className="border-b">
                          <td className="py-2">Restock Session #{r.id}</td>
                          <td className="text-center">{(() => {
                            const items = (r.items as any[]) || [];
                            return items.reduce((sum, item) => sum + Number(item.quantity), 0);
                          })()}</td>
                          <td className="text-right">R {Number(r.total).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Truck className="h-8 w-8 mb-2 opacity-20" />
                    <p>No supplier orders in this period.</p>
                  </div>
                )}
              </div>
            }
          />
          <ReportCard 
            title="Expired Inventory Risk"
            icon={<Clock className="h-5 w-5" />}
            content={
              <div className="h-64 flex flex-col items-center justify-center bg-gray-50 rounded-lg p-6">
                <div className="text-center">
                  <Clock className="h-12 w-12 mx-auto text-primary mb-2" />
                  <p className="text-sm font-semibold">Loss Prevention Tracking</p>
                  <p className="text-xs text-muted-foreground mt-1 text-center">Identifying products nearing expiration to minimize potential losses through discounting or returns.</p>
                  <div className="mt-4 p-3 bg-white rounded-lg border border-gray-100 shadow-sm w-full">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Potential Loss</p>
                    <p className="text-2xl font-bold text-primary">R {
                      products?.filter(p => p.expiryDate && new Date(p.expiryDate) < new Date())
                        .reduce((sum, p) => sum + (Number(p.purchasePrice) * p.quantity), 0).toFixed(2) || "0.00"
                    }</p>
                  </div>
                </div>
              </div>
            }
          />
        </div>
      </div>
    </Layout>
  );
}
