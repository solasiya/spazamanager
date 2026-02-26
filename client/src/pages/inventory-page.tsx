import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { PageHeader } from "@/components/layout/page-header";
import { InventoryTable } from "@/components/inventory/inventory-table";
import {
  PlusCircle,
  Download,
  Upload,
  AlertTriangle,
  ClipboardList,
  Printer,
  RefreshCw,
} from "lucide-react";
import { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { exportToCSV, printPage, parseCSV } from "@/lib/export-utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddItemForm } from "@/components/inventory/add-item-form";

export default function InventoryPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const { data: products, refetch: refetchProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: lowStockProducts } = useQuery<Product[]>({
    queryKey: ["/api/products/low-stock"],
  });

  const { data: expiringProducts } = useQuery<Product[]>({
    queryKey: ["/api/products/expiring"],
  });

  const handleExport = () => {
    if (!products || products.length === 0) {
      toast({ title: "No data", description: "There is nothing to export.", variant: "destructive" });
      return;
    }
    
    exportToCSV(products, "Inventory_Stock", {
      name: "Product Name",
      sku: "SKU",
      quantity: "Quantity",
      purchasePrice: "Cost Price (R)",
      sellingPrice: "Selling Price (R)",
      expiryDate: "Expiry"
    });
    
    toast({ title: "Export Started", description: "Your inventory report is downloading..." });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseCSV(file);
      // In a real app, you'd send this to an /api/products/bulk endpoint
      // For now, we'll show success if parsing works
      toast({
        title: "Import Successful (Simulation)",
        description: `Parsed ${data.length} products from CSV. In a production environment, these would be synced to the database.`
      });
    } catch (err) {
      toast({
        title: "Import Failed",
        description: "Could not parse the CSV file. Please check the format.",
        variant: "destructive"
      });
    }
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    toast({ title: "Refreshed", description: "Inventory data has been updated." });
  };

  return (
    <Layout>
      <PageHeader
        title="Inventory"
        description="Manage your store inventory items, track stock levels, and monitor expiry dates."
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExport}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" /> Export
            </Button>
            <div className="relative">
              <Button variant="outline" className="flex items-center gap-1" onClick={() => document.getElementById('csv-import')?.click()}>
                <Upload className="h-4 w-4" /> Import
              </Button>
              <input 
                id="csv-import"
                type="file" 
                accept=".csv" 
                className="hidden" 
                onChange={handleImport}
              />
            </div>
            <Button 
              variant="outline" 
              onClick={printPage}
              className="flex items-center gap-1"
            >
              <Printer className="h-4 w-4" /> Print
            </Button>
            <Button
              type="button"
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-accent hover:bg-accent/90 text-white flex items-center gap-1"
            >
              <PlusCircle className="h-4 w-4" /> Add Product
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-warning flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Low Stock Items
            </CardTitle>
            <CardDescription>Items that need restocking soon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lowStockProducts?.length || 0} items
            </div>
            <p className="text-sm text-muted-foreground">
              {lowStockProducts && lowStockProducts.length > 0
                ? "These items require attention - restock them soon to avoid stockouts."
                : "All items are well-stocked. Good job!"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-danger flex items-center gap-2">
              <ClipboardList className="h-5 w-5" /> Expiring Soon
            </CardTitle>
            <CardDescription>
              Items that will expire in the next 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {expiringProducts?.length || 0} items
            </div>
            <p className="text-sm text-muted-foreground">
              {expiringProducts && expiringProducts.length > 0
                ? "Consider discounting these items to reduce waste."
                : "No items expiring in the next 7 days."}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Items</TabsTrigger>
          <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
          <TabsTrigger value="expiring">Expiring Soon</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <InventoryTable />
        </TabsContent>
        <TabsContent value="low-stock">
          <div className="bg-white rounded-lg shadow-sm p-5">
            <h2 className="text-xl font-heading font-bold mb-4">
              Low Stock Items
            </h2>
            <InventoryTable filterType="low-stock" />
          </div>
        </TabsContent>
        <TabsContent value="expiring">
          <div className="bg-white rounded-lg shadow-sm p-5">
            <h2 className="text-xl font-heading font-bold mb-4">
              Expiring Items
            </h2>
            <InventoryTable filterType="expiring" />
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px] min-h-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <AddItemForm onSuccess={() => setIsAddDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
