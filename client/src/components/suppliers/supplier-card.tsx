import { Supplier } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { 
  Building, 
  Phone, 
  ShoppingCart, 
  User, 
  Mail, 
  MapPin,
  Calendar,
  Edit,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddSupplierForm } from "./add-supplier-form";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";

interface SupplierCardProps {
  supplier: Supplier;
}

export function SupplierCard({ supplier }: SupplierCardProps) {
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const deleteSupplierMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/suppliers/${supplier.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: "Supplier deleted",
        description: `${supplier.name} has been removed from your suppliers`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete supplier",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    deleteSupplierMutation.mutate();
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <Card className="p-4 hover:shadow-md transition-shadow">
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
        
        <div className="space-y-2 text-sm mb-3">
          {supplier.contactPerson && (
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2 text-gray-400" />
              <span>{supplier.contactPerson}</span>
            </div>
          )}
          
          {supplier.phone && (
            <div className="flex items-center">
              <Phone className="h-4 w-4 mr-2 text-gray-400" />
              <span>{supplier.phone}</span>
            </div>
          )}
          
          {supplier.email && (
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-2 text-gray-400" />
              <span>{supplier.email}</span>
            </div>
          )}
          
          {supplier.address && (
            <div className="flex items-start">
              <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-1" />
              <span>{supplier.address}</span>
            </div>
          )}
          
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
            <span>
              Last Order: {supplier.lastOrderDate 
                ? formatDistanceToNow(new Date(supplier.lastOrderDate), { addSuffix: true }) 
                : "Never"}
            </span>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between">
          <div className="space-x-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-blue-600"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit className="h-4 w-4 mr-1" /> Edit
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-red-600"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          </div>
          <Button 
            size="sm" 
            className="bg-accent hover:bg-accent/90 text-white"
          >
            <ShoppingCart className="h-4 w-4 mr-1" /> Order
          </Button>
        </div>
      </Card>

      {/* Edit Supplier Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
          </DialogHeader>
          <AddSupplierForm 
            supplier={supplier} 
            onSuccess={() => setIsEditDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {supplier.name} from your suppliers.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
              disabled={deleteSupplierMutation.isPending}
            >
              {deleteSupplierMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
