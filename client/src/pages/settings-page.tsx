import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { PageHeader } from "@/components/layout/page-header";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({
    lowStock: true,
    expiringItems: true,
    salesAlerts: true,
    supplierUpdates: false,
  });

  return (
    <Layout>
      <PageHeader
        title="Settings"
        description="Configure your account and application preferences."
        actions={
          <Button 
            className="bg-accent hover:bg-accent/90 text-white flex items-center gap-1"
          >
            <Save className="h-4 w-4" /> Save Changes
          </Button>
        }
      />

      <Tabs defaultValue="account" className="mb-6">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="store">Store Information</TabsTrigger>
        </TabsList>
        
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Manage your account details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue={user?.fullName || user?.full_name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" defaultValue={user?.username} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" value={user?.role} readOnly className="bg-gray-50" />
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="text-lg font-medium mb-2">Change Password</h3>
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
                <Button className="mt-4">Update Password</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the appearance of your Spaza Manager
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <p className="text-sm text-gray-500">
                    Choose between light and dark mode
                  </p>
                </div>
                <select
                  id="theme"
                  className="w-32 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-accent focus:border-accent"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <Label>Text Size</Label>
                  <p className="text-sm text-gray-500">
                    Adjust the text size throughout the application
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">A-</Button>
                  <span className="text-sm font-medium">Medium</span>
                  <Button variant="outline" size="sm">A+</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure which notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b">
                <div>
                  <Label htmlFor="lowStock">Low Stock Alerts</Label>
                  <p className="text-sm text-gray-500">
                    Get notified when products are running low
                  </p>
                </div>
                <Switch 
                  id="lowStock" 
                  checked={notifications.lowStock} 
                  onCheckedChange={(checked) => setNotifications({...notifications, lowStock: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <Label htmlFor="expiringItems">Expiring Items Alerts</Label>
                  <p className="text-sm text-gray-500">
                    Get notified about items expiring soon
                  </p>
                </div>
                <Switch 
                  id="expiringItems" 
                  checked={notifications.expiringItems} 
                  onCheckedChange={(checked) => setNotifications({...notifications, expiringItems: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <Label htmlFor="salesAlerts">Sales Alerts</Label>
                  <p className="text-sm text-gray-500">
                    Get notified about daily sales summaries
                  </p>
                </div>
                <Switch 
                  id="salesAlerts" 
                  checked={notifications.salesAlerts} 
                  onCheckedChange={(checked) => setNotifications({...notifications, salesAlerts: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between pt-3">
                <div>
                  <Label htmlFor="supplierUpdates">Supplier Updates</Label>
                  <p className="text-sm text-gray-500">
                    Get notified about supplier order status
                  </p>
                </div>
                <Switch 
                  id="supplierUpdates" 
                  checked={notifications.supplierUpdates} 
                  onCheckedChange={(checked) => setNotifications({...notifications, supplierUpdates: checked})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="store">
          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
              <CardDescription>
                Update your store's details and business information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">Store Name</Label>
                <Input id="storeName" defaultValue="My Spaza Shop" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="storeAddress">Store Address</Label>
                <Input id="storeAddress" defaultValue="" placeholder="123 Main Street, Johannesburg" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="storePhone">Contact Number</Label>
                <Input id="storePhone" defaultValue="" placeholder="+27 123 456 7890" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="taxId">Tax/VAT ID (Optional)</Label>
                <Input id="taxId" defaultValue="" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-accent focus:border-accent"
                  defaultValue="ZAR"
                >
                  <option value="ZAR">South African Rand (R)</option>
                  <option value="USD">US Dollar ($)</option>
                  <option value="EUR">Euro (€)</option>
                  <option value="GBP">British Pound (£)</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
