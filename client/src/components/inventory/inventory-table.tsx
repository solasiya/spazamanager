import { useQuery } from "@tanstack/react-query";
import { Product, Category, Supplier } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Package, PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EditItemForm } from "./edit-item-form";
import { AddItemForm } from "./add-item-form";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function InventoryTable() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const { data: products, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: categories, isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: suppliers, isLoading: isLoadingSuppliers } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const getCategoryName = (categoryId?: number) => {
    if (!categoryId || !categories) return "Uncategorized";
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : "Uncategorized";
  };

  const getSupplierName = (supplierId?: number) => {
    if (!supplierId || !suppliers) return "Unknown";
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.name : "Unknown";
  };

  const filteredProducts = products?.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.categoryId?.toString() === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    
    try {
      await apiRequest("DELETE", `/api/products/${productToDelete.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product deleted",
        description: `${productToDelete.name} has been removed from inventory`,
      });
      setProductToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (product: Product) => {
    if (product.quantity <= 0) {
      return (
        <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
          Out of Stock
        </span>
      );
    } else if (product.quantity <= product.alertThreshold) {
      return (
        <span className="bg-warning/10 text-warning px-2 py-1 rounded text-xs">
          Low Stock ({product.quantity})
        </span>
      );
    } else {
      return (
        <span className="bg-success/10 text-success px-2 py-1 rounded text-xs">
          In Stock ({product.quantity})
        </span>
      );
    }
  };

  const isLoading = isLoadingProducts || isLoadingCategories || isLoadingSuppliers;

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-5 animate-pulse">
        <div className="h-10 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-2">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm p-5">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="w-full md:w-56">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map(category => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="md:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Purchase Price</TableHead>
                <TableHead>Selling Price</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts && filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded bg-gray-200 mr-2 flex items-center justify-center">
                          <Package className="text-gray-500 h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-semibold">{product.name}</div>
                          {product.sku && <div className="text-xs text-gray-500">SKU: {product.sku}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getCategoryName(product.categoryId)}</TableCell>
                    <TableCell>{getStatusBadge(product)}</TableCell>
                    <TableCell>{getSupplierName(product.supplierId)}</TableCell>
                    <TableCell>R {Number(product.purchasePrice).toFixed(2)}</TableCell>
                    <TableCell>R {Number(product.sellingPrice).toFixed(2)}</TableCell>
                    <TableCell>
                      {product.expiryDate 
                        ? format(new Date(product.expiryDate), "dd MMM yyyy") 
                        : "No expiry date"}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setEditingProduct(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => setProductToDelete(product)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    {products?.length === 0 
                      ? "No products in inventory. Add your first product to get started."
                      : "No products match your search criteria."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit Product Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <EditItemForm 
              product={editingProduct}
              onSuccess={() => setEditingProduct(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <AddItemForm onSuccess={() => setIsAddDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {productToDelete?.name} from your inventory.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
