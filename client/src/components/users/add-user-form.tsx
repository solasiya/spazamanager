import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema, User } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Extend the insertion schema
const formSchema = insertUserSchema.extend({
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  // If password is provided for a new user or when updating a password
  if (data.password) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

interface AddUserFormProps {
  user?: User;
  onSuccess?: () => void;
}

export function AddUserForm({ user, onSuccess }: AddUserFormProps) {
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: user?.username || "",
              fullName: user?.fullName || user?.full_name || "",
      role: user?.role || "cashier",
      password: "",
      confirmPassword: "",
    },
  });

  const addUserMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Remove confirmPassword as it's not part of the user model
      const { confirmPassword, ...userData } = values;
      
      // If we're editing a user and no new password is provided, don't send it
      if (user && !userData.password) {
        delete userData.password;
      }
      
      if (user) {
        // Update existing user
        const res = await apiRequest("PUT", `/api/users/${user.id}`, userData);
        return await res.json();
      } else {
        // Create new user
        const res = await apiRequest("POST", "/api/register", userData);
        return await res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: user ? "User updated" : "User created",
        description: user 
          ? `${user.fullName || user.full_name} has been updated successfully` 
          : "The new user has been created successfully",
      });
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${user ? "update" : "create"} user`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    addUserMutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name *</FormLabel>
              <FormControl>
                <Input placeholder="Full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username *</FormLabel>
              <FormControl>
                <Input placeholder="Username" {...field} disabled={!!user} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Role *</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="owner" />
                    </FormControl>
                    <FormLabel className="font-normal">Owner</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="cashier" />
                    </FormControl>
                    <FormLabel className="font-normal">Cashier</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="stock_manager" />
                    </FormControl>
                    <FormLabel className="font-normal">Stock Manager</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{user ? "New Password (leave blank to keep current)" : "Password *"}</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{user ? "Confirm New Password" : "Confirm Password *"}</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Confirm password" {...field} />
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
          <Button 
            type="submit" 
            disabled={addUserMutation.isPending}
          >
            {addUserMutation.isPending 
              ? (user ? "Updating..." : "Creating...") 
              : (user ? "Update User" : "Create User")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
