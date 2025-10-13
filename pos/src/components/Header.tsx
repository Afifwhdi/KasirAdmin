import { Search, Printer, User, Maximize, Minimize, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { API_CONFIG, API_ENDPOINTS } from "@/config/api";

export const Header = () => {
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [printerConnected, setPrinterConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const username = localStorage.getItem("username") || "User";

  // Check printer status on mount
  useEffect(() => {
    const printerDevice = localStorage.getItem('printerDevice');
    if (printerDevice) {
      setPrinterConnected(true);
    }
  }, []);

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

  const handleScanPrinter = async () => {
    if (isScanning) return;
    
    setIsScanning(true);
    toast.info("Mencari printer...", {
      icon: "🔍",
      duration: 2000,
    });

    try {
      // Fetch settings to check print mode
      const settingsResponse = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.SETTINGS}`);
      const settingsResult = await settingsResponse.json();

      if (settingsResult.status !== 'success') {
        throw new Error('Gagal mengambil pengaturan printer');
      }

      const settings = settingsResult.data;

      // For Bluetooth mode: Try Web Bluetooth first, fallback to local
      if (settings.print_via_bluetooth === 1) {
        try {
          // Try Web Bluetooth API (for printers that are NOT paired yet)
          await scanBluetoothPrinter();
        } catch (btError: any) {
          // If Bluetooth fails, use as local printer
          // This handles: Bluetooth printers already paired in Windows
          console.log('Bluetooth scan failed, using local mode:', btError.message);
          
          toast.info("Printer Bluetooth terdeteksi di sistem. Menggunakan mode lokal...", {
            icon: "ℹ️",
            duration: 2000,
          });
          
          const printerName = settings.name_printer_local || 'Bluetooth Printer';
          await checkLocalPrinter(printerName);
        }
      } else {
        // Local printer mode (USB, Network, or Bluetooth paired)
        await checkLocalPrinter(settings.name_printer_local);
      }
    } catch (error) {
      console.error('Printer scan error:', error);
      toast.error("Gagal scan printer: " + (error as Error).message, {
        icon: "❌",
        style: {
          background: '#ef4444',
          color: 'white',
        },
      });
    } finally {
      setIsScanning(false);
    }
  };

  const scanBluetoothPrinter = async () => {
    try {
      // Check if Web Bluetooth API is available
      if (!navigator.bluetooth) {
        throw new Error('Browser tidak support Bluetooth. Gunakan Chrome/Edge.');
      }

      toast.info("Pilih printer Bluetooth...", {
        icon: "📱",
        duration: 3000,
      });

      // Request Bluetooth device
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
      });

      const server = await device.gatt?.connect();
      if (!server) throw new Error('Gagal connect ke printer');

      // Save device info
      localStorage.setItem('printerDevice', JSON.stringify({
        name: device.name,
        id: device.id,
        type: 'bluetooth'
      }));

      setPrinterConnected(true);

      toast.success(`Printer "${device.name}" terhubung!`, {
        icon: "✓",
        style: {
          background: '#10b981',
          color: 'white',
        },
        duration: 3000,
      });

      // Disconnect after test
      device.gatt?.disconnect();
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        toast.error("Tidak ada printer yang dipilih", {
          icon: "ℹ️",
        });
      } else {
        throw error;
      }
    }
  };

  const checkLocalPrinter = async (printerName: string) => {
    try {
      if (!printerName) {
        // If no printer name, still allow but show warning
        toast.warning("Nama printer belum diatur. Akan menggunakan printer default sistem.", {
          icon: "⚠️",
          duration: 3000,
        });
        
        localStorage.setItem('printerDevice', JSON.stringify({
          name: 'Default Printer',
          type: 'local'
        }));
        
        setPrinterConnected(true);
        return;
      }

      // Check if browser supports printing
      if (!window.print) {
        throw new Error('Browser tidak support print');
      }

      // Save printer info
      localStorage.setItem('printerDevice', JSON.stringify({
        name: printerName,
        type: 'local'
      }));

      setPrinterConnected(true);

      toast.success(`Printer "${printerName}" siap digunakan!`, {
        icon: "✓",
        style: {
          background: '#10b981',
          color: 'white',
        },
        duration: 3000,
      });
    } catch (error) {
      throw error;
    }
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
        {/* Printer Button - Temporarily Disabled */}
        {/* <button 
          onClick={handleScanPrinter}
          disabled={isScanning}
          className="relative p-2 hover:bg-secondary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Scan Printer"
        >
          <Printer className={`w-5 h-5 ${printerConnected ? 'text-green-500' : 'text-foreground'} ${isScanning ? 'animate-pulse' : ''}`} />
          {printerConnected && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></span>
          )}
        </button> */}
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
