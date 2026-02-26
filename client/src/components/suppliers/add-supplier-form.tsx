import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertSupplierSchema, Supplier, Category } from "@shared/schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

// Update the form schema to include categories
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email address"),
  address: z.string().min(1, "Address is required"),
  categories: z.array(z.string()).min(1, "At least one category is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface AddSupplierFormProps {
  supplier?: Supplier;
  onSuccess?: () => void;
}

// Add these predefined categories
const PREDEFINED_CATEGORIES = [
  "Beverages",
  "Bakery",
  "Dairy",
  "Canned Goods",
  "Cleaning",
];

export function AddSupplierForm({ supplier, onSuccess }: AddSupplierFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    (supplier?.categories as string[]) || []
  );

  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/categories");
      return await res.json();
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: supplier?.name || "",
      contactPerson: supplier?.contactPerson || "",
      phone: supplier?.phone || "",
      email: supplier?.email || "",
      address: supplier?.address || "",
      categories: (supplier?.categories as string[]) || [],
    },
  });

  const addSupplierMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        name: values.name,
        contactPerson: values.contactPerson,
        phone: values.phone,
        email: values.email,
        address: values.address,
        categories: selectedCategories, // Use the selectedCategories state
      };
      // log payload to help debug server 500
      console.debug("[AddSupplier] payload:", payload);

      if (supplier) {
        return await apiRequest(
          "PUT",
          `/api/suppliers/${supplier.id}`,
          payload
        );
      }
      return await apiRequest("POST", "/api/suppliers", payload);
    },
    onSuccess: () => {
      // invalidate supplier list cache
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: supplier ? "Supplier updated" : "Supplier created",
        description: `Successfully ${supplier ? "updated" : "added"} supplier`,
      });
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      // show detailed error info in console and toast (if available)
      console.error(
        "[AddSupplier] mutation error:",
        error,
        (error as any)?.body
      );
      const serverDetail =
        (error as any)?.body?.message ||
        (error as any)?.body ||
        (error as any)?.message;
      toast({
        title: "Error",
        description: serverDetail || "Failed to save supplier",
        variant: "destructive",
      });
    },
  });

  const handleCategorySelect = (category: string) => {
    if (!selectedCategories.includes(category)) {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const removeCategory = (category: string) => {
    setSelectedCategories(selectedCategories.filter((c) => c !== category));
  };

  const onSubmit = (values: FormValues) => {
    // Validate categories
    if (selectedCategories.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one category",
        variant: "destructive",
      });
      return;
    }

    addSupplierMutation.mutate(values);
  };

  // show a small loading/disabled state for the category select
  if (categoriesLoading) {
    // keep the form UI responsive — you can return a small skeleton or disable submit
  }

  // Update form field for categories to use selectedCategories
  useEffect(() => {
    form.setValue("categories", selectedCategories);
  }, [selectedCategories, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supplier Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter supplier name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Add Category Selection */}
        <FormField
          control={form.control}
          name="categories"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categories</FormLabel>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedCategories.map((category) => (
                  <Badge
                    key={category}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {category}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeCategory(category)}
                    />
                  </Badge>
                ))}
              </div>
              <Select onValueChange={handleCategorySelect} value="">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {PREDEFINED_CATEGORIES.map((category) => (
                    <SelectItem
                      key={category}
                      value={category}
                      disabled={selectedCategories.includes(category)}
                    >
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <Textarea placeholder="Supplier address" {...field} rows={3} />
              </FormControl>
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
          <Button type="submit" disabled={addSupplierMutation.isPending}>
            {addSupplierMutation.isPending
              ? supplier
                ? "Updating..."
                : "Adding..."
              : supplier
              ? "Update Supplier"
              : "Add Supplier"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
