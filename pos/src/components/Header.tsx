import { Search, Bell, User, Maximize, Minimize, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const Header = () => {
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const username = localStorage.getItem("username") || "User";

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("username");
    toast.success("Logout berhasil!", {
      icon: "✓",
      style: {
        background: '#10b981',
        color: 'white',
        border: 'none',
      },
      duration: 2000,
    });
    navigate("/login");
  };

  return (
    <header className="h-16 border-b bg-card flex items-center px-6 gap-6">
      <div className="flex-1 max-w-2xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Cari produk, pelanggan, atau transaksi..." 
            className="pl-10 bg-background"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4 ml-auto">
        <button 
          onClick={toggleFullscreen}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
        >
          {isFullscreen ? (
            <Minimize className="w-5 h-5 text-foreground" />
          ) : (
            <Maximize className="w-5 h-5 text-foreground" />
          )}
        </button>
        <button className="relative p-2 hover:bg-secondary rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full"></span>
        </button>
        <div className="flex items-center gap-2 p-2 hover:bg-secondary rounded-lg transition-colors">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <User className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-medium hidden sm:block">{username}</span>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
