import { useQuery } from "@tanstack/react-query";
import { Building, Phone, ShoppingCart } from "lucide-react";
import { Supplier } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

export function SuppliersSection() {
  const { data: suppliers, isLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  // Get top 3 suppliers
  const topSuppliers = suppliers?.slice(0, 3);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-5 mb-6 animate-pulse">
        <div className="flex justify-between items-center mb-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-8 bg-gray-200 rounded w-[120px]"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!suppliers || suppliers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-heading font-bold">Top Suppliers</h2>
          <Button size="sm" variant="secondary">
            Manage Suppliers
          </Button>
        </div>
        
        <div className="py-8 text-center text-gray-500">
          No suppliers added yet. Add your first supplier to manage your inventory better.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-heading font-bold">Top Suppliers</h2>
        <Button size="sm" variant="secondary">
          Manage Suppliers
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {topSuppliers?.map(supplier => (
          <div key={supplier.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-3">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                <Building className="text-gray-500" />
              </div>
              <div>
                <h3 className="font-bold">{supplier.name}</h3>
                <p className="text-sm text-gray-600">
                  {supplier.categories?.join(", ") || "No categories"}
                </p>
              </div>
            </div>
            <div className="flex justify-between text-sm mb-3">
              <p className="text-gray-600">Last Order:</p>
              <p>
                {supplier.lastOrderDate 
                  ? formatDistanceToNow(new Date(supplier.lastOrderDate), { addSuffix: true }) 
                  : "Never"}
              </p>
            </div>
            <div className="flex justify-between text-sm">
              <p className="text-gray-600">Contact:</p>
              <p>{supplier.phone || "No phone"}</p>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end gap-2">
              <Button variant="outline" size="sm" className="text-accent">
                <Phone className="mr-1 h-4 w-4" /> Call
              </Button>
              <Button size="sm" className="bg-accent hover:bg-accent/90 text-white">
                <ShoppingCart className="mr-1 h-4 w-4" /> Order
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
