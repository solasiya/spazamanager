import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { PageHeader } from "@/components/layout/page-header";
import { PlusCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddSupplierForm } from "@/components/suppliers/add-supplier-form";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Supplier } from "@shared/schema";
import { SupplierCard } from "@/components/suppliers/supplier-card";

export default function SuppliersPage() {
  const [isAddSupplierDialogOpen, setIsAddSupplierDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: suppliers, isLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const filteredSuppliers = suppliers?.filter(supplier => 
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.categories?.some(cat => cat.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Layout>
      <PageHeader
        title="Suppliers"
        description="Manage your suppliers, track contact information, and monitor order history."
        actions={
          <Button 
            onClick={() => setIsAddSupplierDialogOpen(true)}
            className="bg-accent hover:bg-accent/90 text-white flex items-center gap-1"
          >
            <PlusCircle className="h-4 w-4" /> Add Supplier
          </Button>
        }
      />

      <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              className="pl-9"
              placeholder="Search suppliers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <option value="all">All Categories</option>
              <option value="beverages">Beverages</option>
              <option value="bakery">Bakery</option>
              <option value="dairy">Dairy</option>
              <option value="canned">Canned Goods</option>
              <option value="cleaning">Cleaning</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-lg"></div>
            ))}
          </div>
        ) : filteredSuppliers && filteredSuppliers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSuppliers.map((supplier) => (
              <SupplierCard key={supplier.id} supplier={supplier} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="bg-gray-100 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-3">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium">No suppliers found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery 
                ? "Try adjusting your search query or filters" 
                : "Add your first supplier to get started"}
            </p>
            <Button 
              onClick={() => setIsAddSupplierDialogOpen(true)}
              className="bg-accent hover:bg-accent/90 text-white"
            >
              Add Supplier
            </Button>
          </div>
        )}
      </div>

      {/* Add Supplier Dialog */}
      <Dialog open={isAddSupplierDialogOpen} onOpenChange={setIsAddSupplierDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
          </DialogHeader>
          <AddSupplierForm onSuccess={() => setIsAddSupplierDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
