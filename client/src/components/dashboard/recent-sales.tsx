import { useQuery } from "@tanstack/react-query";
import { Receipt } from "lucide-react";
import { Sale } from "@shared/schema";
import { format } from "date-fns";

export function RecentSales() {
  const { data: sales, isLoading } = useQuery<Sale[]>({
    queryKey: ["/api/sales"],
  });

  // Get most recent sales first
  const recentSales = sales?.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  }).slice(0, 5);

  // Calculate today's total sales
  const todaySales = sales?.filter(sale => {
    const saleDate = new Date(sale.date);
    const today = new Date();
    return saleDate.getDate() === today.getDate() &&
      saleDate.getMonth() === today.getMonth() &&
      saleDate.getFullYear() === today.getFullYear();
  });

  const todayTotal = todaySales?.reduce((acc, sale) => acc + Number(sale.total), 0) || 0;
  const todayCount = todaySales?.length || 0;

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-5 h-[400px] animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-4">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="mt-4 h-24 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-heading font-bold">Recent Sales</h2>
        <button className="text-accent hover:text-accent/80">
          View All <span className="ml-1">→</span>
        </button>
      </div>
      
      <div className="space-y-3">
        {recentSales && recentSales.length > 0 ? (
          recentSales.map(sale => {
            const itemsCount = Array.isArray(sale.items) ? sale.items.length : 0;
            const saleDate = new Date(sale.date);
            const formattedTime = format(saleDate, "hh:mm a");
            const formattedDate = format(saleDate, "dd MMM yyyy");
            const isToday = format(saleDate, "dd MMM yyyy") === format(new Date(), "dd MMM yyyy");
            
            return (
              <div key={sale.id} className="border-b border-gray-100 pb-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent mr-3">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium">Sale #{sale.id}</h4>
                      <p className="text-xs text-gray-500">
                        {isToday ? `Today, ${formattedTime}` : formattedDate}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">R {Number(sale.total).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{itemsCount} items</p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center text-gray-500">No sales recorded yet</div>
        )}
      </div>
      
      <div className="mt-4 p-3 bg-light rounded-lg flex justify-between items-center">
        <div>
          <p className="font-bold">Today's Total Sales</p>
          <p className="text-sm text-gray-600">{todayCount} transactions</p>
        </div>
        <p className="text-xl font-bold font-heading">R {todayTotal.toFixed(2)}</p>
      </div>
    </div>
  );
}
