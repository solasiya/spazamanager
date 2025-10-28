import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertSupplierSchema, Supplier } from "@shared/schema";
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
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Category } from "@shared/schema";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

// Extend the insertion schema
const formSchema = insertSupplierSchema;

type FormValues = z.infer<typeof formSchema>;

interface AddSupplierFormProps {
  supplier?: Supplier;
  onSuccess?: () => void;
}

export function AddSupplierForm({ supplier, onSuccess }: AddSupplierFormProps) {
  const { toast } = useToast();
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    supplier?.categories || []
  );

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: supplier?.name || "",
      contactPerson: supplier?.contactPerson || "",
      phone: supplier?.phone || "",
      email: supplier?.email || "",
      address: supplier?.address || "",
      categories: supplier?.categories || [],
    },
  });

  const addSupplierMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (supplier) {
        // Update existing supplier
        const res = await apiRequest("PUT", `/api/suppliers/${supplier.id}`, values);
        return await res.json();
      } else {
        // Add new supplier
        const res = await apiRequest("POST", "/api/suppliers", values);
        return await res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: supplier ? "Supplier updated" : "Supplier added",
        description: supplier 
          ? `${supplier.name} has been updated successfully` 
          : "The supplier has been added successfully",
      });
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${supplier ? "update" : "add"} supplier`,
        variant: "destructive",
      });
    },
  });

  const handleCategorySelect = (category: string) => {
    if (!selectedCategories.includes(category)) {
      const newCategories = [...selectedCategories, category];
      setSelectedCategories(newCategories);
      form.setValue("categories", newCategories);
    }
  };

  const removeCategory = (category: string) => {
    const newCategories = selectedCategories.filter(c => c !== category);
    setSelectedCategories(newCategories);
    form.setValue("categories", newCategories);
  };

  const onSubmit = (values: FormValues) => {
    addSupplierMutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supplier Name *</FormLabel>
              <FormControl>
                <Input placeholder="Supplier name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="contactPerson"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Person</FormLabel>
                <FormControl>
                  <Input placeholder="Contact name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="Phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Email address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Supplier address" 
                  {...field} 
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categories"
          render={() => (
            <FormItem>
              <FormLabel>Categories</FormLabel>
              <div className="mb-2">
                <Select onValueChange={handleCategorySelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedCategories.map((category) => (
                  <Badge key={category} variant="secondary" className="flex items-center gap-1">
                    {category}
                    <button 
                      type="button" 
                      onClick={() => removeCategory(category)}
                      className="rounded-full hover:bg-gray-200 p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {selectedCategories.length === 0 && (
                  <span className="text-sm text-gray-500">No categories selected</span>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
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
            disabled={addSupplierMutation.isPending}
          >
            {addSupplierMutation.isPending 
              ? (supplier ? "Updating..." : "Adding...") 
              : (supplier ? "Update Supplier" : "Add Supplier")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
