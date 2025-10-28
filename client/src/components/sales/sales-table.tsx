import { useQuery } from "@tanstack/react-query";
import { Sale } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Receipt, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function SalesTable() {
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  
  const { data: sales, isLoading } = useQuery<Sale[]>({
    queryKey: ["/api/sales"],
  });

  // Sort sales by date (most recent first)
  const sortedSales = sales ? [...sales].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  }) : [];

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!sortedSales || sortedSales.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="bg-gray-100 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-3">
          <Receipt className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium">No sales recorded yet</h3>
        <p className="text-gray-500 mb-4">
          Start recording your sales to track your business performance
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sale ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSales.map((sale) => {
              const saleDate = new Date(sale.date);
              const items = Array.isArray(sale.items) ? sale.items : [];
              const itemsCount = items.length;
              
              return (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">#{sale.id}</TableCell>
                  <TableCell>{format(saleDate, "dd MMM yyyy")}</TableCell>
                  <TableCell>{format(saleDate, "hh:mm a")}</TableCell>
                  <TableCell>{itemsCount} {itemsCount === 1 ? "item" : "items"}</TableCell>
                  <TableCell className="text-right">R {Number(sale.total).toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedSale(sale)}
                    >
                      <Eye className="h-4 w-4 mr-1" /> Details
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Sale Details Dialog */}
      <Dialog open={!!selectedSale} onOpenChange={() => setSelectedSale(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sale Details #{selectedSale?.id}</DialogTitle>
          </DialogHeader>
          
          {selectedSale && (
            <div>
              <div className="flex justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Date & Time</p>
                  <p>{format(new Date(selectedSale.date), "dd MMM yyyy, hh:mm a")}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-xl font-bold">R {Number(selectedSale.total).toFixed(2)}</p>
                </div>
              </div>
              
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(selectedSale.items) && selectedSale.items.map((item: any, index) => (
                      <TableRow key={index}>
                        <TableCell>Product #{item.productId}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">R {Number(item.price).toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          R {(Number(item.price) * item.quantity).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="mt-4 flex justify-between pt-2 border-t">
                <p className="text-gray-500">Cashier ID: {selectedSale.userId}</p>
                <Button variant="outline" size="sm" onClick={() => setSelectedSale(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
