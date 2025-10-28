import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Clock, CheckCircle } from "lucide-react";
import { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";

interface Alert {
  id: number;
  type: "danger" | "warning" | "success";
  title: string;
  description: string;
  actionText: string;
  actionFn?: () => void;
}

export function AlertsSection() {
  const { data: lowStockProducts, isLoading: isLoadingLowStock } = useQuery<Product[]>({
    queryKey: ["/api/products/low-stock"],
  });

  const { data: expiringProducts, isLoading: isLoadingExpiring } = useQuery<Product[]>({
    queryKey: ["/api/products/expiring"],
  });

  if (isLoadingLowStock || isLoadingExpiring) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-heading font-bold">Important Alerts</h2>
          <button className="text-accent hover:text-accent/80">
            See all <span className="ml-1">→</span>
          </button>
        </div>
        <div className="space-y-3">
          <div className="h-20 bg-gray-100 animate-pulse rounded-lg"></div>
          <div className="h-20 bg-gray-100 animate-pulse rounded-lg"></div>
          <div className="h-20 bg-gray-100 animate-pulse rounded-lg"></div>
        </div>
      </div>
    );
  }

  // Generate alerts from products data
  const alerts: Alert[] = [];

  // Add low stock alerts
  if (lowStockProducts && lowStockProducts.length > 0) {
    lowStockProducts.slice(0, 3).forEach(product => {
      alerts.push({
        id: product.id,
        type: product.quantity === 0 ? "danger" : "warning",
        title: `${product.name} ${product.quantity === 0 ? 'is out of stock' : 'is low in stock'}`,
        description: product.quantity === 0 
          ? `This product is completely out of stock` 
          : `Only ${product.quantity} units remaining (below threshold of ${product.alertThreshold})`,
        actionText: "Order",
      });
    });
  }

  // Add expiring product alerts
  if (expiringProducts && expiringProducts.length > 0) {
    expiringProducts.slice(0, 3).forEach(product => {
      if (!alerts.some(a => a.id === product.id)) { // Avoid duplicates
        const daysToExpiry = product.expiryDate ? 
          Math.ceil((new Date(product.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
        
        alerts.push({
          id: product.id,
          type: "warning",
          title: `${product.name} expiring soon`,
          description: `Will expire in ${daysToExpiry} day${daysToExpiry !== 1 ? 's' : ''}`,
          actionText: "Discount",
        });
      }
    });
  }

  // Add a success alert if needed to fill the space
  if (alerts.length < 3) {
    alerts.push({
      id: 9999,
      type: "success",
      title: "Inventory updated",
      description: "Your inventory has been successfully updated",
      actionText: "View",
    });
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "danger":
        return <AlertCircle className="text-primary" />;
      case "warning":
        return <Clock className="text-warning" />;
      case "success":
        return <CheckCircle className="text-success" />;
      default:
        return <AlertCircle />;
    }
  };

  const getAlertBgClass = (type: string) => {
    switch (type) {
      case "danger":
        return "bg-primary/10";
      case "warning":
        return "bg-warning/10";
      case "success":
        return "bg-success/10";
      default:
        return "bg-gray-100";
    }
  };

  const getAlertIconBgClass = (type: string) => {
    switch (type) {
      case "danger":
        return "bg-primary/20";
      case "warning":
        return "bg-warning/20";
      case "success":
        return "bg-success/20";
      default:
        return "bg-gray-200";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-heading font-bold">Important Alerts</h2>
        <button className="text-accent hover:text-accent/80">
          See all <span className="ml-1">→</span>
        </button>
      </div>
      
      <div className="space-y-3">
        {alerts.map(alert => (
          <div key={alert.id} className={`flex items-center ${getAlertBgClass(alert.type)} p-3 rounded-lg`}>
            <div className={`rounded-full ${getAlertIconBgClass(alert.type)} p-2 mr-3`}>
              {getAlertIcon(alert.type)}
            </div>
            <div className="flex-1">
              <h4 className="font-medium">{alert.title}</h4>
              <p className="text-sm text-gray-600">{alert.description}</p>
            </div>
            <Button variant="outline" size="sm">
              {alert.actionText}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
