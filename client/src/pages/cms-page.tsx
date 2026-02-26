import { Layout } from "@/components/layout/layout";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Users, Database, Settings, Activity, ClipboardList, HardDrive, RefreshCcw } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";

interface SystemLog {
  id: number;
  event: string;
  details: string;
  timestamp: string;
}

interface SystemHealth {
  status: string;
  uptime: number;
  dbConnected: boolean;
  lastBackupAt: string | null;
}

export default function CMSPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: usersData } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: healthData } = useQuery<SystemHealth>({
    queryKey: ["/api/admin/health"],
    refetchInterval: 5000,
  });

  const { data: logsData } = useQuery<SystemLog[]>({
    queryKey: ["/api/admin/logs"],
  });

  const backupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/backup");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Backup Complete",
        description: "System backup has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/health"] });
    },
    onError: () => {
      toast({
        title: "Backup Failed",
        description: "An error occurred while creating a backup.",
        variant: "destructive",
      });
    },
  });

  const stats = [
    {
      title: "Total Users",
      value: usersData?.length || 0,
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
      description: "Active system accounts"
    },
    {
      title: "System Status",
      value: healthData?.status || "Healthy",
      icon: <Activity className={`h-4 w-4 ${healthData?.status === 'Healthy' ? 'text-success' : 'text-warning'}`} />,
      description: healthData ? `Uptime: ${Math.floor(healthData.uptime / 60)}m` : "Checking services..."
    },
    {
      title: "Database",
      value: healthData?.dbConnected ? "Connected" : "Disconnected",
      icon: <Database className="h-4 w-4 text-primary" />,
      description: "MySQL v8.0"
    }
  ];

  return (
    <Layout>
      <PageHeader
        title="CMS Panel"
        description="System-wide management and configuration."
        icon={<ShieldCheck className="h-8 w-8 text-primary" />}
      />

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>System Administration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div 
              onClick={() => setLocation("/users")}
              className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold">User Management</h3>
              </div>
              <p className="text-sm text-muted-foreground">Manage roles, permissions and account status for all users across the system.</p>
            </div>
            
            <div 
              onClick={() => setLocation("/settings")}
              className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3 mb-2">
                <Settings className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold">Global Settings</h3>
              </div>
              <p className="text-sm text-muted-foreground">Configure system-wide parameters, backup schedules and integration settings.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <CardTitle>Recent System Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {logsData?.map((log) => (
                <div key={log.id} className="flex gap-3 text-sm pb-3 border-b last:border-0 last:pb-0">
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div>
                    <p className="font-medium">{log.event}</p>
                    <p className="text-muted-foreground text-xs">{log.details}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {format(new Date(log.timestamp), "HH:mm:ss - dd MMM")}
                    </p>
                  </div>
                </div>
              ))}
              {!logsData?.length && <p className="text-muted-foreground text-sm py-4 text-center">No recent logs found.</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <HardDrive className="h-5 w-5 text-primary" />
            <CardTitle>Maintenance & Database</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Database Backup</span>
                <span className="text-xs text-muted-foreground">
                  Last: {healthData?.lastBackupAt ? formatDistanceToNow(new Date(healthData.lastBackupAt), { addSuffix: true }) : "Never"}
                </span>
              </div>
              <Button 
                onClick={() => backupMutation.mutate()}
                disabled={backupMutation.isPending}
                className="w-full bg-primary hover:bg-primary/90 text-white flex items-center gap-2"
              >
                {backupMutation.isPending ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                Run Backup Now
              </Button>
            </div>

            <div className="p-4 border rounded-lg bg-muted/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">System Health Check</span>
                <span className="text-xs text-success">Optimal</span>
              </div>
              <Button variant="outline" className="w-full flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Diagnostic Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
