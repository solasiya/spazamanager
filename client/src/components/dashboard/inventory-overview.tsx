import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { Product, Category } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function InventoryOverview() {
  const [selectedCategory, setSelectedCategory] = useState<number | "all">("all");

  const { data: products, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: categories, isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (products) {
      if (selectedCategory === "all") {
        setFilteredProducts(products.slice(0, 5));
      } else {
        const filtered = products.filter(p => p.categoryId === selectedCategory);
        setFilteredProducts(filtered.slice(0, 5));
      }
    }
  }, [products, selectedCategory]);

  const getStatusBadge = (product: Product) => {
    if (product.quantity <= 0) {
      return (
        <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
          Out of Stock
        </span>
      );
    } else if (product.quantity <= (product.alertThreshold ?? 0)) {
      return (
        <span className="bg-warning/10 text-warning px-2 py-1 rounded text-xs">
          Low Stock
        </span>
      );
    } else {
      return (
        <span className="bg-success/10 text-success px-2 py-1 rounded text-xs">
          In Stock
        </span>
      );
    }
  };

  if (isLoadingProducts || isLoadingCategories) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-5 h-[400px] animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-10 bg-gray-200 rounded w-full mb-4"></div>
        <div className="space-y-4">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-heading font-bold">Inventory Overview</h2>
        <div className="flex gap-2">
          <Select 
            value={selectedCategory.toString()} 
            onValueChange={(value) => setSelectedCategory(value === "all" ? "all" : parseInt(value))}
          >
            <SelectTrigger className="w-[180px]">
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
          <button className="text-accent hover:text-accent/80 text-sm">
            More <span className="ml-1">→</span>
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-data">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 font-semibold">Product</th>
              <th className="text-center py-3 font-semibold">Stock</th>
              <th className="text-center py-3 font-semibold">Status</th>
              <th className="text-right py-3 font-semibold">Price</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => (
                <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded bg-gray-200 mr-2 flex items-center justify-center">
                        <Package className="text-gray-500 h-4 w-4" />
                      </div>
                      <span>{product.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-center">{product.quantity}</td>
                  <td className="py-3 text-center">
                    {getStatusBadge(product)}
                  </td>
                  <td className="py-3 text-right">R {Number(product.sellingPrice).toFixed(2)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-500">
                  No products found in this category
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
