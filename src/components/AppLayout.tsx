import type React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { getSession, logout as clearAuthSession } from "@/lib/authStorage";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart3,
  ClipboardList,
  Home,
  LogOut,
  Shield,
  Users,
} from "lucide-react";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

function navLinkClass(isActive: boolean) {
  return isActive ? "font-medium" : "text-muted-foreground";
}

export default function AppLayout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = getSession()?.profile ?? null;

  const baseItems: NavItem[] = [{ to: "/dashboard", label: "Dashboard", icon: Home }];
  const candidateItems: NavItem[] = [
    { to: "/candidate/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/candidate/interviews", label: "Interviews", icon: ClipboardList },
  ];
  const expertItems: NavItem[] = [
    { to: "/expert/overview", label: "Overview", icon: BarChart3 },
    { to: "/expert/assignments", label: "Assignments", icon: Users },
  ];

  const items =
    user?.type === "candidate"
      ? [...baseItems, ...candidateItems]
      : user?.type === "expert"
        ? [...baseItems, ...expertItems]
        : baseItems;

  const handleLogout = () => {
    clearAuthSession();
    toast({
      title: "Logged out successfully",
      description: "Thank you for using DRDO RAC Interview System",
    });
    navigate("/login", { replace: true });
  };

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Shield className="h-5 w-5 text-primary" />
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-semibold leading-none">DRDO RAC</p>
              <p className="text-xs text-muted-foreground leading-none mt-1">Interview System</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Services</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild tooltip={item.label}>
                        <NavLink
                          to={item.to}
                          className={({ isActive }) => navLinkClass(isActive)}
                          end={item.to === "/dashboard"}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Logout">
                <button type="button" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="border-b bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <SidebarTrigger />
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">DRDO RAC Interview System</p>
                {user && (
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                )}
              </div>
            </div>
            {user && (
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="capitalize">
                  {user.type}
                </Badge>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

