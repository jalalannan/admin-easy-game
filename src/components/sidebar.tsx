"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Users, 
  BarChart3, 
  Settings, 
  FileText, 
  ShoppingCart, 
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  GraduationCap,
  Database,
  UserCog,
  Bell,
  Ticket
} from "lucide-react";
import { useFirebaseAuthStore } from "@/stores/firebase-auth-store";

interface SidebarProps {
  className?: string;
}

const getNavigationItems = (hasPermission: (resource: string, action: string) => boolean) => [
  { name: "Dashboard", href: "/dashboard", icon: Home, permission: null },
  { 
    name: "Users", 
    href: "/dashboard/users", 
    icon: Users, 
    permission: { resource: 'users', action: 'read' } 
  },
  { 
    name: "Students", 
    href: "/dashboard/students", 
    icon: GraduationCap, 
    permission: { resource: 'students', action: 'read' } 
  },
  { 
    name: "Tutors", 
    href: "/dashboard/tutors", 
    icon: UserCog, 
    permission: { resource: 'tutors', action: 'read' } 
  },
  { 
    name: "Requests", 
    href: "/dashboard/requests", 
    icon: FileText, 
    permission: { resource: 'tutors', action: 'read' } 
  },
  { 
    name: "Notifications", 
    href: "/dashboard/notifications", 
    icon: Bell, 
    permission: { resource: 'notifications', action: 'read' } 
  },
  { 
    name: "Resources", 
    href: "/dashboard/resources", 
    icon: Database, 
    permission: { resource: 'resources', action: 'read' } 
  },
  { 
    name: "Promo Codes", 
    href: "/dashboard/promo-codes", 
    icon: Ticket, 
    permission: { resource: 'promo_codes', action: 'read' } 
  },
  { 
    name: "Analytics", 
    href: "/dashboard/analytics", 
    icon: BarChart3, 
    permission: { resource: 'analytics', action: 'read' } 
  },
  { 
    name: "Roles", 
    href: "/dashboard/roles", 
    icon: Shield, 
    permission: { resource: 'roles', action: 'read' } 
  },
  { name: "Logout", href: "/dashboard/logout", icon: LogOut, permission: null },
];

export function Sidebar({ className }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, logout, hasPermission } = useFirebaseAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      // Use replace to prevent back navigation to dashboard
      router.replace("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      // Still redirect even if logout fails
      router.replace("/login");
    }
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    setIsMobileOpen(false); // Close mobile menu after navigation
  };

  // Get navigation items based on user permissions
  const navigation = getNavigationItems(hasPermission);

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="bg-white shadow-md"
        >
          {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out",
          // Mobile styles
          "lg:relative lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop width based on expansion
          isExpanded ? "w-64" : "w-16",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h1 
            className={cn(
              "font-bold text-xl text-gray-900 transition-opacity duration-300",
              isExpanded ? "opacity-100" : "opacity-0 lg:opacity-0"
            )}
          >
            Admin Panel
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="hidden lg:flex"
          >
            {isExpanded ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navigation.filter(item => 
            !item.permission || hasPermission(item.permission.resource, item.permission.action)
          ).map((item) => {
            const Icon = item.icon;
            const isLogout = item.name === "Logout";
            
            return (
              <button
                key={item.name}
                onClick={() => isLogout ? handleLogout() : handleNavigation(item.href)}
                className={cn(
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 w-full text-left",
                  "text-gray-700 hover:text-gray-900 hover:bg-gray-100",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500",
                  "cursor-pointer"
                )}
              >
                <Icon 
                  className={cn(
                    "flex-shrink-0 h-5 w-5 transition-colors duration-200",
                    "text-gray-500 group-hover:text-gray-700"
                  )} 
                />
                <span
                  className={cn(
                    "ml-3 transition-all duration-300",
                    isExpanded ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2 lg:opacity-0"
                  )}
                >
                  {item.name}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
            </div>
            <div 
              className={cn(
                "ml-3 transition-all duration-300",
                isExpanded ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2 lg:opacity-0"
              )}
            >
              <p className="text-sm font-medium text-gray-900">
                {user?.displayName || user?.email || 'Admin User'}
              </p>
              <p className="text-xs text-gray-500">
                {user?.email || 'admin@example.com'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 