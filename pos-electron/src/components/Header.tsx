import { Printer, User, Maximize, Minimize, LogOut, Clock, Calendar, Database, RefreshCw, Download, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { API_CONFIG, API_ENDPOINTS } from "@/config/api";
import { isElectron } from "@/services/electron-db";
import { transactionsWrapper } from "@/services/transactions-wrapper";
import { syncService } from "@/services/sync-service";
import { SyncProgressDialog } from "@/components/SyncProgressDialog";
import { DatabaseSettingsDialog } from "@/components/DatabaseSettingsDialog";
import { FirstTimeSetupDialog } from "@/components/FirstTimeSetupDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Header = () => {
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [printerConnected, setPrinterConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingDownload, setIsSyncingDownload] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dbPath, setDbPath] = useState<string>('');
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [showDbSettingsDialog, setShowDbSettingsDialog] = useState(false);
  const [showFirstTimeSetup, setShowFirstTimeSetup] = useState(false);
  const [syncProgress, setSyncProgress] = useState({
    progress: 0,
    currentItem: '',
    status: 'idle' as 'idle' | 'downloading' | 'processing' | 'success' | 'error',
    message: '',
    stats: { total: 0, current: 0, synced: 0, failed: 0 }
  });
  const username = localStorage.getItem("username") || "User";

  // Load DB path on mount & check first-time setup
  useEffect(() => {
    if (isElectron()) {
      window.electronAPI?.app.getDbPath().then((path) => {
        setDbPath(path);
        
        // Check if this is first-time setup
        const isFirstTime = localStorage.getItem('pos_first_time_setup_done') !== 'true';
        if (isFirstTime) {
          setTimeout(() => setShowFirstTimeSetup(true), 1000); // Delay 1 detik agar UI smooth
        }
      }).catch(console.error);
    }
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

  const handleSyncToServer = async () => {
    if (isSyncing || !isElectron()) return;
    
    setIsSyncing(true);
    toast.info("Memulai sinkronisasi data...", {
      icon: "🔄",
      duration: 2000,
    });

    try {
      const result = await transactionsWrapper.syncToServer();
      
      if (result.synced.length > 0) {
        toast.success(
          `Berhasil sync ${result.synced.length} transaksi ke server!`,
          {
            icon: "✓",
            style: {
              background: '#10b981',
              color: 'white',
              border: 'none',
            },
            duration: 3000,
          }
        );
      } else {
        toast.info("Tidak ada transaksi baru untuk di-sync", {
          icon: "ℹ️",
          duration: 2000,
        });
      }

      if (result.failed.length > 0) {
        toast.warning(
          `${result.failed.length} transaksi gagal di-sync. Cek koneksi server.`,
          {
            icon: "⚠️",
            style: {
              background: '#f59e0b',
              color: 'white',
            },
            duration: 4000,
          }
        );
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error("Gagal sync ke server: " + (error as Error).message, {
        icon: "❌",
        style: {
          background: '#ef4444',
          color: 'white',
        },
        duration: 3000,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFirstTimeSetupComplete = async (newDbPath: string) => {
    try {
      // Set new DB path
      await window.electronAPI!.app.setDbPath(newDbPath);
      setDbPath(newDbPath);
      
      // Mark setup as done
      localStorage.setItem('pos_first_time_setup_done', 'true');
      
      // Close first-time setup dialog
      setShowFirstTimeSetup(false);
      
      // Immediately start downloading data
      toast.info("Memulai download data dari server...", {
        icon: "📥",
        duration: 2000,
      });
      
      // Small delay untuk UX
      setTimeout(() => {
        handleSyncFromServer();
      }, 500);
    } catch (error) {
      console.error('First-time setup error:', error);
      toast.error('Gagal setup: ' + (error as Error).message);
    }
  };

  const handleSyncFromServer = async () => {
    if (isSyncingDownload || !isElectron()) return;
    
    setIsSyncingDownload(true);
    setShowProgressDialog(true);
    setSyncProgress({
      progress: 0,
      currentItem: '',
      status: 'downloading',
      message: 'Menghubungi server...',
      stats: { total: 0, current: 0, synced: 0, failed: 0 }
    });

    try {
      const result = await syncService.syncAllFromServer((progress) => {
        setSyncProgress({
          progress: progress.percentage,
          currentItem: progress.currentItem || '',
          status: 'processing',
          message: `Memproses ${progress.type === 'products' ? 'produk' : 'kategori'}...`,
          stats: {
            total: progress.total,
            current: progress.current,
            synced: progress.synced,
            failed: progress.failed
          }
        });
      });
      
      const totalSynced = result.products.synced.length + result.categories.synced.length + result.transactions.synced.length;
      const totalFailed = result.products.failed.length + result.categories.failed.length + result.transactions.failed.length;
      
      // Show success in dialog
      setSyncProgress({
        progress: 100,
        currentItem: '',
        status: 'success',
        message: `Berhasil: ${result.products.synced.length} produk, ${result.categories.synced.length} kategori, ${result.transactions.synced.length} transaksi. ${totalFailed > 0 ? `Gagal: ${totalFailed}` : ''}`,
        stats: {
          total: totalSynced + totalFailed,
          current: totalSynced + totalFailed,
          synced: totalSynced,
          failed: totalFailed
        }
      });

      // Auto close dialog after 2 seconds
      setTimeout(() => {
        setShowProgressDialog(false);
        if (totalSynced > 0) {
          // Reload page untuk refresh data
          window.location.reload();
        }
      }, 2000);
    } catch (error) {
      console.error('Sync from server error:', error);
      
      // Show error in dialog
      setSyncProgress({
        progress: 0,
        currentItem: '',
        status: 'error',
        message: "Gagal download: " + (error as Error).message,
        stats: { total: 0, current: 0, synced: 0, failed: 0 }
      });

      // Auto close dialog after 3 seconds
      setTimeout(() => {
        setShowProgressDialog(false);
      }, 3000);
    } finally {
      setIsSyncingDownload(false);
    }
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

  // Format date and time in Indonesian
  const formatDate = (date: Date) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${dayName}, ${day} ${month} ${year}`;
  };

  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${hours}:${minutes}:${seconds} WIB`;
  };

  return (
    <>
      <FirstTimeSetupDialog
        open={showFirstTimeSetup}
        onComplete={handleFirstTimeSetupComplete}
      />
      
      <SyncProgressDialog
        open={showProgressDialog}
        onOpenChange={setShowProgressDialog}
        title="Sinkronisasi Data"
        progress={syncProgress.progress}
        currentItem={syncProgress.currentItem}
        status={syncProgress.status}
        message={syncProgress.message}
        stats={syncProgress.stats}
      />
      
      <DatabaseSettingsDialog
        open={showDbSettingsDialog}
        onOpenChange={setShowDbSettingsDialog}
        currentPath={dbPath}
      />
      
      <header className="h-16 border-b bg-card flex items-center px-6 gap-6">
      {/* Date and Time Display */}
      <div className="flex-1 flex items-center gap-6">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="font-medium">{formatDate(currentTime)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-primary" />
          <span className="font-mono font-semibold text-lg">{formatTime(currentTime)}</span>
        </div>
        
        {/* Offline Mode Indicator & Sync Menu */}
        {isElectron() && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
              <Database className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-semibold text-blue-500">OFFLINE</span>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  disabled={isSyncing || isSyncingDownload}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Sinkronisasi data"
                >
                  <RefreshCw className={`w-4 h-4 text-green-500 ${(isSyncing || isSyncingDownload) ? 'animate-spin' : ''}`} />
                  <span className="text-xs font-semibold text-green-500">
                    {isSyncing ? 'Upload...' : isSyncingDownload ? 'Download...' : 'Sync'}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="text-xs">Sinkronisasi Data</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleSyncToServer} disabled={isSyncing}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">Upload Transaksi</span>
                    <span className="text-xs text-muted-foreground">Kirim transaksi lokal ke server</span>
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={handleSyncFromServer} disabled={isSyncingDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">Download Data</span>
                    <span className="text-xs text-muted-foreground">Ambil produk, kategori & transaksi</span>
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={() => setShowDbSettingsDialog(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">Pengaturan Database</span>
                    <span className="text-xs text-muted-foreground">Ubah lokasi penyimpanan</span>
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
                  <Database className="mr-2 h-3 w-3" />
                  <span className="truncate" title={dbPath}>{dbPath || 'Loading...'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
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
    </>
  );
};
