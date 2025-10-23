import {
  Printer,
  User,
  Maximize,
  Minimize,
  LogOut,
  Clock,
  Calendar,
  Database,
  RefreshCw,
  Download,
  Settings,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { API_CONFIG, API_ENDPOINTS } from "@/config/api";
import { isElectron } from "@/services/electron-db";
import { transactionsWrapper } from "@/services/transactions-wrapper";
import { syncService } from "@/services/sync-service";
import { authService } from "@/services/auth-service";
import { SyncProgressDialog } from "@/components/SyncProgressDialog";
import { DatabaseSettingsDialog } from "@/components/DatabaseSettingsDialog";
import { BluetoothActivationDialog } from "@/components/BluetoothActivationDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onDataDownloaded?: () => void;
}

export const Header = ({ onDataDownloaded }: HeaderProps = {}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [printerConnected, setPrinterConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showBluetoothDialog, setShowBluetoothDialog] = useState(false);
  const [bluetoothError, setBluetoothError] = useState("");
  const [isSyncingDownload, setIsSyncingDownload] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dbPath, setDbPath] = useState<string>("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [showDbSettingsDialog, setShowDbSettingsDialog] = useState(false);
  const [syncProgress, setSyncProgress] = useState({
    progress: 0,
    currentItem: "",
    status: "idle" as "idle" | "downloading" | "processing" | "success" | "error",
    message: "",
    stats: { total: 0, current: 0, synced: 0, failed: 0 },
  });
  const username = localStorage.getItem("username") || "User";


  useEffect(() => {
    if (isElectron()) {
      window.electronAPI?.app
        .getDbPath()
        .then((path) => {
          setDbPath(path);
        })
        .catch(() => {});
    }
  }, []);


  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);


  useEffect(() => {

    const checkServerConnection = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout


        const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.PRODUCTS}?page=1&limit=1`, {
          method: "GET",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const isConnected = response.ok;
        setIsOnline(isConnected);
        return isConnected;
      } catch (error) {
        setIsOnline(false);
        return false;
      }
    };


    checkServerConnection();


    const intervalId = setInterval(checkServerConnection, 10000);


    const handleOnline = () => {

      checkServerConnection(); // Verify with server ping
    };

    const handleOffline = () => {

      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);


  useEffect(() => {
    const printerDevice = localStorage.getItem("printerDevice");
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
    authService.logout();
    toast.success("Logout berhasil!", {
      icon: "✓",
      style: {
        background: "#10b981",
        color: "white",
        border: "none",
      },
      duration: 2000,
    });
    navigate("/login");
  };

  const handleSyncToServer = async () => {
    if (isSyncing || !isElectron() || !isOnline) {
      if (!isOnline) {
        toast.error("Tidak bisa sync saat offline. Nyalakan internet terlebih dahulu.", {
          icon: "❌",
          duration: 3000,
        });
      }
      return;
    }

    setIsSyncing(true);
    toast.info("Memulai sinkronisasi data...", {
      icon: "🔄",
      duration: 2000,
    });

    try {
      const result = await transactionsWrapper.syncToServer();


      if (result.synced.length > 0) {
        toast.success(`Berhasil sync ${result.synced.length} transaksi`, {
          icon: "✓",
          duration: 2000,
        });



        
        try {
          await syncService.syncProductsFromServer();

          

          queryClient.invalidateQueries({ queryKey: ["products"] });
        } catch (syncError) {

        }
      }


      if (result.failed.length > 0) {
        toast.error(`${result.failed.length} transaksi gagal di-sync`, {
          icon: "❌",
          duration: 3000,
        });
      }
    } catch (error) {
      toast.error("Gagal sync ke server", {
        icon: "❌",
        duration: 2000,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncFromServer = async () => {
    if (isSyncingDownload || !isElectron() || !isOnline) {
      if (!isOnline) {
        toast.error("Tidak bisa download data saat offline. Nyalakan internet terlebih dahulu.", {
          icon: "❌",
          duration: 3000,
        });
      }
      return;
    }

    setIsSyncingDownload(true);
    setShowProgressDialog(true);
    setSyncProgress({
      progress: 0,
      currentItem: "",
      status: "downloading",
      message: "Menghubungi server...",
      stats: { total: 0, current: 0, synced: 0, failed: 0 },
    });

    try {
      const result = await syncService.syncAllFromServer((progress) => {
        setSyncProgress({
          progress: progress.percentage,
          currentItem: progress.currentItem || "",
          status: "processing",
          message: `Memproses ${progress.type === "products" ? "produk" : "kategori"}...`,
          stats: {
            total: progress.total,
            current: progress.current,
            synced: progress.synced,
            failed: progress.failed,
          },
        });
      });

      const totalSynced =
        result.products.synced.length +
        result.categories.synced.length +
        result.transactions.synced.length;
      const totalFailed =
        result.products.failed.length +
        result.categories.failed.length +
        result.transactions.failed.length;


      setSyncProgress({
        progress: 100,
        currentItem: "",
        status: "success",
        message: `Berhasil: ${result.products.synced.length} produk, ${
          result.categories.synced.length
        } kategori, ${result.transactions.synced.length} transaksi. ${
          totalFailed > 0 ? `Gagal: ${totalFailed}` : ""
        }`,
        stats: {
          total: totalSynced + totalFailed,
          current: totalSynced + totalFailed,
          synced: totalSynced,
          failed: totalFailed,
        },
      });


      setTimeout(() => {
        setShowProgressDialog(false);
        if (totalSynced > 0) {

          onDataDownloaded?.();

          window.location.reload();
        }
      }, 2000);
    } catch (error) {


      setSyncProgress({
        progress: 0,
        currentItem: "",
        status: "error",
        message: "Gagal download: " + (error as Error).message,
        stats: { total: 0, current: 0, synced: 0, failed: 0 },
      });


      setTimeout(() => {
        setShowProgressDialog(false);
      }, 3000);
    } finally {
      setIsSyncingDownload(false);
    }
  };


  const formatDate = (date: Date) => {
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];

    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${dayName}, ${day} ${month} ${year}`;
  };

  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${hours}:${minutes}:${seconds} WIB`;
  };

  const handleScanPrinter = async () => {
    if (isScanning) return;

    setIsScanning(true);

    try {

      if (!navigator.bluetooth) {
        setBluetoothError("Browser tidak support Bluetooth. Gunakan Chrome atau Edge.");
        setShowBluetoothDialog(true);
        setIsScanning(false);
        return;
      }

      toast.info("Mencari printer Bluetooth...", {
        icon: "🔍",
        duration: 3000,
        description: "Pastikan lampu printer BERKEDIP CEPAT (mode pairing)",
      });


      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ["000018f0-0000-1000-8000-00805f9b34fb"] }],
        optionalServices: ["000018f0-0000-1000-8000-00805f9b34fb"],
      });

      const server = await device.gatt?.connect();
      if (!server) throw new Error("Gagal connect ke printer");


      localStorage.setItem(
        "printerDevice",
        JSON.stringify({
          name: device.name,
          id: device.id,
          type: "bluetooth",
        })
      );

      setPrinterConnected(true);

      toast.success(`Printer "${device.name}" terhubung!`, {
        icon: "✓",
        style: {
          background: "#10b981",
          color: "white",
        },
        duration: 3000,
      });


      device.gatt?.disconnect();
    } catch (err) {
      const error = err as { name: string; message: string };
      
      if (error.name === "NotFoundError") {
        toast.warning("Tidak ada printer yang dipilih", {
          icon: "⚠️",
          description: "Pastikan printer dalam mode pairing (lampu berkedip)",
          duration: 5000,
        });
      } else if (error.name === "NotAllowedError") {
        toast.error("Permission ditolak. Coba lagi dan izinkan akses Bluetooth.", {
          icon: "❌",
          duration: 4000,
        });
      } else if (error.message.includes("Bluetooth adapter not available") || 
                 error.message.includes("not available")) {
        setBluetoothError("Bluetooth tidak aktif atau tidak tersedia di perangkat Anda. Aktifkan Bluetooth di Windows Settings (Win + I).");
        setShowBluetoothDialog(true);
      } else if (error.message.includes("User cancelled") || 
                 error.name === "NotSupportedError") {


      } else {

        toast.error("Gagal scan printer. Pastikan: 1) Printer dalam mode pairing (lampu berkedip), 2) Printer tidak paired di Windows, 3) Bluetooth aktif", {
          icon: "❌",
          style: {
            background: "#ef4444",
            color: "white",
          },
          duration: 6000,
        });
      }
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <>
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

      <BluetoothActivationDialog
        open={showBluetoothDialog}
        onOpenChange={setShowBluetoothDialog}
        errorMessage={bluetoothError}
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

          {/* Online/Offline Status Indicator & Sync Menu */}
          {isElectron() && (
            <div className="flex items-center gap-3">
              {/* Status Badge */}
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                  isOnline
                    ? "bg-green-500/10 border border-green-500/20"
                    : "bg-red-500/10 border border-red-500/20"
                }`}
              >
                <Database className={`w-4 h-4 ${isOnline ? "text-green-500" : "text-red-500"}`} />
                <span
                  className={`text-xs font-semibold ${
                    isOnline ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {isOnline ? "ONLINE" : "OFFLINE"}
                </span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    disabled={!isOnline || isSyncing || isSyncingDownload}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isOnline && !isSyncing && !isSyncingDownload
                        ? "bg-green-500/10 border-green-500/20 hover:bg-green-500/20"
                        : "bg-gray-500/10 border-gray-500/20"
                    }`}
                    title={isOnline ? "Sinkronisasi data" : "Tidak bisa sync saat offline"}
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${
                        isOnline && !isSyncing && !isSyncingDownload
                          ? "text-green-500"
                          : "text-gray-500"
                      } ${isSyncing || isSyncingDownload ? "animate-spin" : ""}`}
                    />
                    <span
                      className={`text-xs font-semibold ${
                        isOnline && !isSyncing && !isSyncingDownload
                          ? "text-green-500"
                          : "text-gray-500"
                      }`}
                    >
                      {isSyncing ? "Upload..." : isSyncingDownload ? "Download..." : "Sync"}
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
                      <span className="text-xs text-muted-foreground">
                        Kirim transaksi lokal ke server
                      </span>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={handleSyncFromServer} disabled={isSyncingDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="font-medium">Download Data</span>
                      <span className="text-xs text-muted-foreground">
                        Ambil produk, kategori & transaksi
                      </span>
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
                    <span className="truncate" title={dbPath}>
                      {dbPath || "Loading..."}
                    </span>
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

          {/* Printer Bluetooth Button */}
          <button
            onClick={handleScanPrinter}
            disabled={isScanning}
            className="relative p-2 hover:bg-secondary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Scan Printer Bluetooth"
          >
            <Printer
              className={`w-5 h-5 ${printerConnected ? "text-green-500" : "text-foreground"} ${
                isScanning ? "animate-pulse" : ""
              }`}
            />
            {printerConnected && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></span>
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
