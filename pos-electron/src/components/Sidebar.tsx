import { ShoppingCart, History, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    {
      icon: ShoppingCart,
      label: "Halaman Kasir",
      path: "/",
    },
    {
      icon: History,
      label: "Riwayat Transaksi",
      path: "/history",
    },
  ];

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="w-16 border-r bg-card flex flex-col items-center py-4">
        <nav className="flex-1 flex flex-col gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center justify-center w-12 h-12 rounded-lg transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-secondary"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
        <div className="border-t pt-4 w-full flex justify-center">
          <Tooltip>
            <TooltipContent side="right">
              <p>Keluar</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
};
