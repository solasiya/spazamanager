import { Plus, ShoppingCart, Truck, FileText } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddItemForm } from "@/components/inventory/add-item-form";
import { AddSaleForm } from "@/components/sales/add-sale-form";

export function QuickActions() {
  const [_, navigate] = useLocation();
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  const actions = [
    {
      title: "Add New Item",
      icon: <Plus className="text-accent" />,
      bgColor: "bg-accent/10",
      onClick: () => setOpenDialog("add-item")
    },
    {
      title: "Record Sale",
      icon: <ShoppingCart className="text-primary" />,
      bgColor: "bg-primary/10",
      onClick: () => setOpenDialog("record-sale")
    },
    {
      title: "Receive Stock",
      icon: <Truck className="text-success" />,
      bgColor: "bg-success/10",
      onClick: () => navigate("/inventory?action=restock")
    },
    {
      title: "Generate Report",
      icon: <FileText className="text-warning" />,
      bgColor: "bg-warning/10",
      onClick: () => navigate("/reports")
    }
  ];

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm p-5">
        <h2 className="text-xl font-heading font-bold mb-4">Quick Actions</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {actions.map((action, index) => (
            <button
              key={index}
              className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-light transition-colors"
              onClick={action.onClick}
            >
              <div className={`w-12 h-12 rounded-full ${action.bgColor} flex items-center justify-center mb-2`}>
                {action.icon}
              </div>
              <span className="text-center">{action.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Add Item Dialog */}
      <Dialog open={openDialog === "add-item"} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Inventory Item</DialogTitle>
          </DialogHeader>
          <AddItemForm onSuccess={() => setOpenDialog(null)} />
        </DialogContent>
      </Dialog>

      {/* Record Sale Dialog */}
      <Dialog open={openDialog === "record-sale"} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Record New Sale</DialogTitle>
          </DialogHeader>
          <AddSaleForm onSuccess={() => setOpenDialog(null)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
