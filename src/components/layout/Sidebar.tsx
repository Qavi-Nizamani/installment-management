"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Settings,
  UserCheck,
  PiggyBank,
  Menu,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Customers",
    href: "/dashboard/customers",
    icon: Users,
  },
  {
    name: "Installment Plans",
    href: "/dashboard/installment-plans",
    icon: CreditCard,
  },
  {
    name: "Installments",
    href: "/dashboard/installments",
    icon: Calendar,
  },
  {
    name: "Revenue",
    href: "/dashboard/revenue",
    icon: TrendingUp,
  },
  {
    name: "Expenses",
    href: "/dashboard/expenses",
    icon: TrendingDown,
  },
  {
    name: "Profit Analysis",
    href: "/dashboard/profit",
    icon: BarChart3,
  },
  {
    name: "Financial Overview",
    href: "/dashboard/financial",
    icon: PiggyBank,
  },
  {
    name: "Members",
    href: "/dashboard/members",
    icon: UserCheck,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

// Reusable sidebar content component
function SidebarContent({ 
  isExpanded, 
  pathname, 
  onNavigate,
  showTooltips = false
}: { 
  isExpanded: boolean; 
  pathname: string; 
  onNavigate?: () => void;
  showTooltips?: boolean;
}) {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center lg:justify-center h-16 border-b border-gray-200 px-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          {isExpanded && (
            <span className="text-xl font-bold text-gray-900 animate-in slide-in-from-left duration-200">
              InstallTrack
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          const navItem = (
            <Link 
              href={item.href} 
              key={item.name} 
              onClick={onNavigate}
            >
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start relative",
                  isExpanded ? "px-4" : "px-3",
                  isActive && "bg-blue-50 text-blue-700 border-blue-200"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0",
                    isActive ? "text-blue-700" : "text-gray-500",
                    isExpanded ? "mr-3" : "mr-0"
                  )}
                />
                {isExpanded && (
                  <span className="animate-in slide-in-from-left duration-200 truncate">
                    {item.name}
                  </span>
                )}
                {isActive && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-600 rounded-l-full" />
                )}
              </Button>
            </Link>
          );

          if (showTooltips && !isExpanded) {
            return (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>{navItem}</TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                  {item.name}
                </TooltipContent>
              </Tooltip>
            );
          }

          return navItem;
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-200 p-2">
        <div className="flex items-center space-x-3 p-2">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700">JD</span>
          </div>
          {isExpanded && (
            <div className="flex-1 animate-in slide-in-from-left duration-200">
              <p className="text-sm font-medium text-gray-900">John Doe</p>
              <p className="text-xs text-gray-500">john@example.com</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function Sidebar() {
  const [isHovered, setIsHovered] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const pathname = usePathname();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const handleMobileNavigate = () => {
    setSheetOpen(false);
  };

  if (!isDesktop) {
    // Mobile: Use Sheet component
    return (
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="fixed top-4 left-2 z-50 lg:hidden"
          >
            <Menu className="h-8 w-8" />
          </Button>
        </SheetTrigger>
        <SheetContent 
          side="left" 
          className="w-64 p-0 bg-white border-r border-gray-200"
        >
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <div className="flex flex-col h-full">
            <SidebarContent 
              isExpanded={true} 
              pathname={pathname} 
              onNavigate={handleMobileNavigate}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Original hover behavior
  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          "fixed left-0 top-0 h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out z-50",
          isHovered ? "w-52 shadow-lg" : "w-16"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <SidebarContent 
          isExpanded={isHovered} 
          pathname={pathname} 
          showTooltips={true} 
        />
      </div>
    </TooltipProvider>
  );
}
 