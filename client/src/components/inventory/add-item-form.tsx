import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertProductSchema } from "@shared/schema";
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
import { Category, Supplier } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Extend the insertion schema with additional validation
const formSchema = insertProductSchema.extend({
  purchasePrice: z.string().min(1, "Purchase price is required"),
  sellingPrice: z.string().min(1, "Selling price is required"),
  expiryDate: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddItemFormProps {
  onSuccess?: () => void;
}

export function AddItemForm({ onSuccess }: AddItemFormProps) {
  const { toast } = useToast();

  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: suppliers, isLoading: suppliersLoading, error: suppliersError } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      sku: "",
      categoryId: undefined,
      quantity: 0,
      alertThreshold: 10,
      purchasePrice: "",
      sellingPrice: "",
      expiryDate: "",
      supplierId: undefined,
    },
  });

  const addProductMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Convert string values to numbers for the API
      const payload = {
        ...values,
        purchasePrice: parseFloat(values.purchasePrice),
        sellingPrice: parseFloat(values.sellingPrice),
        categoryId: values.categoryId ? parseInt(values.categoryId.toString()) : undefined,
        supplierId: values.supplierId ? parseInt(values.supplierId.toString()) : undefined,
        quantity: parseInt(values.quantity.toString()),
        alertThreshold: parseInt(values.alertThreshold.toString()),
        expiryDate: values.expiryDate ? new Date(values.expiryDate) : undefined,
      };
      
      const res = await apiRequest("POST", "/api/products", payload);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product added",
        description: "The product has been added to your inventory",
      });
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "There was an error adding the product",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    addProductMutation.mutate(values);
  };

  // Show loading skeleton if data is still loading
  if (categoriesLoading || suppliersLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <div className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Product name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU</FormLabel>
                <FormControl>
                  <Input placeholder="Product SKU" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categoriesLoading ? (
                      <SelectItem value="" disabled>Loading categories...</SelectItem>
                    ) : categoriesError ? (
                      <SelectItem value="" disabled>Error loading categories</SelectItem>
                    ) : categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="supplierId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {suppliersLoading ? (
                      <SelectItem value="" disabled>Loading suppliers...</SelectItem>
                    ) : suppliersError ? (
                      <SelectItem value="" disabled>Error loading suppliers</SelectItem>
                    ) : suppliers?.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Initial Stock *</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="alertThreshold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Low Stock Alert</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="expiryDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expiry Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="purchasePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase Price (R) *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    placeholder="0.00" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sellingPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Selling Price (R) *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    placeholder="0.00" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              form.reset();
              if (onSuccess) onSuccess();
            }}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={addProductMutation.isPending || categoriesLoading || suppliersLoading}
          >
            {addProductMutation.isPending ? "Adding..." : "Add Product"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
