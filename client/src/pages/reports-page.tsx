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
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("week");
  
  const { data: products } = useQuery({
    queryKey: ["/api/products"],
  });
  
  const { data: sales } = useQuery({
    queryKey: ["/api/sales"],
  });

  return (
    <Layout>
      <PageHeader
        title="Reports"
        description="Generate and view reports on sales, inventory, and other business metrics."
        actions={
          <Button variant="outline" className="flex items-center gap-1">
            <Download className="h-4 w-4" /> Export Reports
          </Button>
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
            <option value="custom">Custom Range</option>
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
              <div className="text-2xl font-bold">R 12,580.45</div>
              <p className="text-xs text-muted-foreground">
                {dateRange === "today" ? "Today" : 
                 dateRange === "week" ? "This week" :
                 dateRange === "month" ? "This month" : 
                 dateRange === "quarter" ? "This quarter" : 
                 dateRange === "year" ? "This year" : "Custom period"}
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
              <div className="text-2xl font-bold">32.4%</div>
              <p className="text-xs text-success flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" /> 2.1% increase
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
              <div className="text-2xl font-bold">648</div>
              <p className="text-xs text-muted-foreground">
                98 transactions
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-warning flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" /> Avg. Sale Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.5 min</div>
              <p className="text-xs text-success flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" /> 0.3 min faster
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
                title="Sales Trend"
                icon={<BarChart className="h-5 w-5" />}
                content={
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <BarChart className="h-16 w-16 mx-auto text-gray-300" />
                      <p className="mt-2 text-gray-500">Sales trend chart would appear here</p>
                    </div>
                  </div>
                }
              />
              <ReportCard 
                title="Payment Methods"
                icon={<PieChart className="h-5 w-5" />}
                content={
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <PieChart className="h-16 w-16 mx-auto text-gray-300" />
                      <p className="mt-2 text-gray-500">Payment methods chart would appear here</p>
                    </div>
                  </div>
                }
              />
            </div>
          </TabsContent>
          
          <TabsContent value="inventory">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ReportCard 
                title="Stock Level Overview"
                icon={<Package className="h-5 w-5" />}
                content={
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <Package className="h-16 w-16 mx-auto text-gray-300" />
                      <p className="mt-2 text-gray-500">Stock level chart would appear here</p>
                    </div>
                  </div>
                }
              />
              <ReportCard 
                title="Inventory Value"
                icon={<DollarSign className="h-5 w-5" />}
                content={
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <DollarSign className="h-16 w-16 mx-auto text-gray-300" />
                      <p className="mt-2 text-gray-500">Inventory value chart would appear here</p>
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
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Product</th>
                          <th className="text-center py-2">Qty Sold</th>
                          <th className="text-right py-2">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2">Coca-Cola 300ml</td>
                          <td className="text-center">158</td>
                          <td className="text-right">R 2,528.00</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">White Bread</td>
                          <td className="text-center">112</td>
                          <td className="text-right">R 1,400.00</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Fresh Milk 1L</td>
                          <td className="text-center">95</td>
                          <td className="text-right">R 1,899.05</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Sunlight Soap</td>
                          <td className="text-center">78</td>
                          <td className="text-right">R 663.00</td>
                        </tr>
                        <tr>
                          <td className="py-2">Lucky Star Pilchards</td>
                          <td className="text-center">67</td>
                          <td className="text-right">R 1,540.33</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                }
              />
              <ReportCard 
                title="Least Profitable Products"
                icon={<TrendingUp className="h-5 w-5 rotate-180" />}
                content={
                  <div className="h-64 overflow-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Product</th>
                          <th className="text-center py-2">Profit Margin</th>
                          <th className="text-right py-2">Profit</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2">Bread Rolls (6pk)</td>
                          <td className="text-center">8.5%</td>
                          <td className="text-right">R 102.00</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Sugar 2kg</td>
                          <td className="text-center">9.2%</td>
                          <td className="text-right">R 157.40</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Eggs (12pk)</td>
                          <td className="text-center">11.3%</td>
                          <td className="text-right">R 180.80</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Cooking Oil 1L</td>
                          <td className="text-center">12.8%</td>
                          <td className="text-right">R 205.12</td>
                        </tr>
                        <tr>
                          <td className="py-2">Washing Powder</td>
                          <td className="text-center">14.2%</td>
                          <td className="text-right">R 233.60</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                }
              />
            </div>
          </TabsContent>
          
          <TabsContent value="categories">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ReportCard 
                title="Sales by Category"
                icon={<PieChart className="h-5 w-5" />}
                content={
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <PieChart className="h-16 w-16 mx-auto text-gray-300" />
                      <p className="mt-2 text-gray-500">Category sales chart would appear here</p>
                    </div>
                  </div>
                }
              />
              <ReportCard 
                title="Category Performance"
                icon={<BarChart className="h-5 w-5" />}
                content={
                  <div className="h-64 overflow-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Category</th>
                          <th className="text-center py-2">Items Sold</th>
                          <th className="text-right py-2">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2">Beverages</td>
                          <td className="text-center">235</td>
                          <td className="text-right">R 4,582.50</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Bakery</td>
                          <td className="text-center">187</td>
                          <td className="text-right">R 2,340.20</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Dairy</td>
                          <td className="text-center">153</td>
                          <td className="text-right">R 2,950.75</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Canned Goods</td>
                          <td className="text-center">98</td>
                          <td className="text-right">R 2,156.00</td>
                        </tr>
                        <tr>
                          <td className="py-2">Cleaning</td>
                          <td className="text-center">67</td>
                          <td className="text-right">R 1,251.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                }
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ReportCard 
            title="Supplier Orders"
            icon={<Truck className="h-5 w-5" />}
            content={
              <div className="h-64 overflow-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Supplier</th>
                      <th className="text-center py-2">Last Order</th>
                      <th className="text-right py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">SuperWholesale</td>
                      <td className="text-center">3 days ago</td>
                      <td className="text-right">R 4,250.00</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Fresh Foods</td>
                      <td className="text-center">Yesterday</td>
                      <td className="text-right">R 1,750.50</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Budget Basics</td>
                      <td className="text-center">1 week ago</td>
                      <td className="text-right">R 2,300.00</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Beverage Direct</td>
                      <td className="text-center">2 days ago</td>
                      <td className="text-right">R 3,120.75</td>
                    </tr>
                    <tr>
                      <td className="py-2">Cleaning Supplies Co.</td>
                      <td className="text-center">5 days ago</td>
                      <td className="text-right">R 985.30</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            }
          />
          <ReportCard 
            title="Expiring Products Value"
            icon={<Clock className="h-5 w-5" />}
            content={
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <Clock className="h-16 w-16 mx-auto text-gray-300" />
                  <p className="mt-2 text-gray-500">Expiring products value chart would appear here</p>
                  <p className="font-bold mt-2">Total Value: R 1,865.50</p>
                </div>
              </div>
            }
          />
        </div>
      </div>
    </Layout>
  );
}
