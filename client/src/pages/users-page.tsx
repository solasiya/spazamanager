import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { PageHeader } from "@/components/layout/page-header";
import { UsersTable } from "@/components/users/users-table";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddUserForm } from "@/components/users/add-user-form";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

export default function UsersPage() {
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const { user } = useAuth();

  // Redirect if not an owner, supervisor or superuser
  if (user && user.role !== "owner" && user.role !== "superuser" && user.role !== "supervisor") {
    return <Redirect to="/" />;
  }

  return (
    <Layout>
      <PageHeader
        title="Users"
        description="Manage user accounts and permissions for your Spaza shop."
        actions={
          <Button 
            onClick={() => setIsAddUserDialogOpen(true)}
            className="bg-accent hover:bg-accent/90 text-white flex items-center gap-1"
          >
            <PlusCircle className="h-4 w-4" /> Add User
          </Button>
        }
      />

      <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
        <h2 className="text-xl font-heading font-bold mb-6">User Accounts</h2>
        
        <UsersTable />
      </div>

      {/* Add User Dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <AddUserForm onSuccess={() => setIsAddUserDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
