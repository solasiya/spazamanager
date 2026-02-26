import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import InventoryPage from "@/pages/inventory-page";
import SalesPage from "@/pages/sales-page";
import SuppliersPage from "@/pages/suppliers-page";
import ReportsPage from "@/pages/reports-page";
import UsersPage from "@/pages/users-page";
import SettingsPage from "@/pages/settings-page";
import CMSPage from "@/pages/cms-page";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/inventory" component={InventoryPage} roles={["owner", "stock_manager", "supervisor"]} />
      <ProtectedRoute path="/sales" component={SalesPage} roles={["cashier", "owner", "stock_manager", "supervisor"]} />
      <ProtectedRoute path="/suppliers" component={SuppliersPage} roles={["owner", "stock_manager", "supervisor"]} />
      <ProtectedRoute path="/reports" component={ReportsPage} roles={["owner", "supervisor"]} />
      <ProtectedRoute path="/users" component={UsersPage} roles={["owner", "supervisor"]} />
      <ProtectedRoute path="/settings" component={SettingsPage} roles={["owner", "supervisor"]} />
      <ProtectedRoute path="/cms" component={CMSPage} roles={["superuser"]} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <Router />
    </TooltipProvider>
  );
}

export default App;
