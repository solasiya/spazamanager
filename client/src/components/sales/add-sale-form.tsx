import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertSaleSchema } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@shared/schema";
import { useEffect, useState } from "react";
import { X, Plus } from "lucide-react";

// Define the sale item structure
type SaleItem = {
  productId: number;
  quantity: number;
  price: number;
};

// Extend the insertion schema for form validation
const formSchema = z.object({
  items: z.array(
    z.object({
      productId: z.number().min(1, "Product is required"),
      quantity: z.number().min(1, "Quantity must be at least 1"),
      price: z.number().min(0, "Price cannot be negative"),
    })
  ).min(1, "At least one item is required"),
  total: z.number().min(0, "Total must be at least 0"),
});

type FormValues = z.infer<typeof formSchema>;

interface AddSaleFormProps {
  onSuccess?: () => void;
}

export function AddSaleForm({ onSuccess }: AddSaleFormProps) {
  const { toast } = useToast();
  const [saleItems, setSaleItems] = useState<SaleItem[]>([{ productId: 0, quantity: 1, price: 0 }]);
  const [total, setTotal] = useState<number>(0);

  const { data: products, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items: [{ productId: 0, quantity: 1, price: 0 }],
      total: 0,
    },
  });

  // Update the form when saleItems change
  useEffect(() => {
    form.setValue("items", saleItems);
  }, [saleItems, form]);

  // Update the total when saleItems change
  useEffect(() => {
    const newTotal = saleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setTotal(newTotal);
    form.setValue("total", newTotal);
  }, [saleItems, form]);

  const addSaleMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await apiRequest("POST", "/api/sales", values);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      toast({
        title: "Sale recorded",
        description: "The sale has been successfully recorded",
      });
      
      form.reset();
      setSaleItems([{ productId: 0, quantity: 1, price: 0 }]);
      setTotal(0);
      
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "There was an error recording the sale",
        variant: "destructive",
      });
    },
  });

  const handleProductChange = (index: number, productId: number) => {
    const product = products?.find(p => p.id === productId);
    
    if (product) {
      const newItems = [...saleItems];
      newItems[index] = {
        ...newItems[index],
        productId,
        price: Number(product.sellingPrice),
      };
      setSaleItems(newItems);
    }
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const newItems = [...saleItems];
    newItems[index] = {
      ...newItems[index],
      quantity,
    };
    setSaleItems(newItems);
  };

  const addItem = () => {
    setSaleItems([...saleItems, { productId: 0, quantity: 1, price: 0 }]);
  };

  const removeItem = (index: number) => {
    if (saleItems.length > 1) {
      const newItems = saleItems.filter((_, i) => i !== index);
      setSaleItems(newItems);
    }
  };

  const onSubmit = (values: FormValues) => {
    // Filter out any items with productId = 0 (not selected)
    const validItems = values.items.filter(item => item.productId > 0);
    
    if (validItems.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one product",
        variant: "destructive",
      });
      return;
    }
    
    const formData = {
      ...values,
      items: validItems,
    };
    
    addSaleMutation.mutate(formData);
  };

  if (isLoadingProducts) {
    return <div>Loading products...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="bg-gray-50 p-3 rounded-lg mb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Sale Items</h3>
            <Button 
              type="button" 
              onClick={addItem} 
              variant="outline" 
              size="sm"
              className="flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Item
            </Button>
          </div>
          
          {saleItems.map((item, index) => (
            <div key={index} className="flex flex-wrap gap-2 items-end mb-3 pb-3 border-b last:border-0">
              <div className="w-full md:w-[calc(50%-0.5rem)]">
                <FormLabel className={index !== 0 ? "sr-only" : ""}>Product</FormLabel>
                <Select
                  value={item.productId.toString()}
                  onValueChange={(value) => handleProductChange(index, parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map((product) => (
                      <SelectItem 
                        key={product.id} 
                        value={product.id.toString()}
                        disabled={product.quantity <= 0}
                      >
                        {product.name} {product.quantity <= 0 ? "(Out of stock)" : `(${product.quantity} in stock)`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-24">
                <FormLabel className={index !== 0 ? "sr-only" : ""}>Qty</FormLabel>
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                />
              </div>
              
              <div className="flex-1">
                <FormLabel className={index !== 0 ? "sr-only" : ""}>Price</FormLabel>
                <Input
                  type="text"
                  readOnly
                  value={`R ${item.price.toFixed(2)}`}
                  className="bg-gray-100"
                />
              </div>
              
              <div className="w-12 ml-2">
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="icon" 
                  onClick={() => removeItem(index)}
                  disabled={saleItems.length === 1}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          <div className="flex justify-between items-center pt-3 border-t mt-3">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-bold">R {total.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (onSuccess) onSuccess();
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={addSaleMutation.isPending}
          >
            {addSaleMutation.isPending ? "Processing..." : "Complete Sale"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
