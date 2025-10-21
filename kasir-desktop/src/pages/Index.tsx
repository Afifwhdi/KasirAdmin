import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { syncService } from "@/services/sync-service";
import { FirstTimeSetupDialog } from "@/components/FirstTimeSetupDialog";
import { isElectron } from "@/services/electron-db";

const Index = () => {
  const [showFirstTimeSetup, setShowFirstTimeSetup] = useState(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);

  // Check first-time setup AFTER login
  useEffect(() => {
    const checkFirstTimeSetup = async () => {
      if (!isElectron()) {
        setIsCheckingSetup(false);
        return;
      }

      try {
        // Check if config exists (dbPath sudah di-set)
        const hasConfig = await window.electronAPI!.app.hasConfig();

        if (!hasConfig) {
          // Belum setup, tampilkan dialog
          console.log("[Index] No config found, showing first time setup");
          setShowFirstTimeSetup(true);
          setIsCheckingSetup(false);
          return;
        }

        // Config ada, check apakah database file exists
        const dbExists = await window.electronAPI!.app.checkDbExists();

        if (!dbExists) {
          // Database hilang, minta setup ulang
          console.warn("[Index] Config exists but database missing, showing setup");
          setShowFirstTimeSetup(true);
          setIsCheckingSetup(false);
          return;
        }

        console.log("[Index] Setup check complete, database ready");
        setIsCheckingSetup(false);
      } catch (error) {
        console.error("Error checking setup:", error);
        setIsCheckingSetup(false);
      }
    };

    checkFirstTimeSetup();
  }, []);

  const handleFirstTimeSetupComplete = async (dbPath: string) => {
    try {
      console.log("[Index] Setting database path:", dbPath);
      
      const result = await window.electronAPI!.app.setDbPath(dbPath);
      
      if (!result.success) {
        toast.error(`Gagal setup database: ${result.message}`, {
          icon: "❌",
          duration: 4000,
        });
        return;
      }

      console.log("[Index] Database created at:", result.newPath);
      setShowFirstTimeSetup(false);

      // Download langsung setelah setup
      toast.success("Database berhasil dibuat! Memulai download data...", {
        icon: "📥",
        duration: 2000,
      });

      // Delay kecil agar toast terlihat
      setTimeout(() => {
        handleDownloadData();
      }, 500);
    } catch (error) {
      console.error("Setup error:", error);
      toast.error("Gagal setup: " + (error as Error).message, {
        icon: "❌",
        duration: 4000,
      });
    }
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadData = async () => {
    setIsDownloading(true);
    console.log("📥 ========== DOWNLOAD DATA STARTED ==========");
    
    toast.info("Memulai download data dari server...", {
      icon: "📥",
      duration: 2000,
    });

    try {
      // Download products
      console.log("📦 Step 1/3: Downloading products...");
      toast.info("Mengunduh produk...", { icon: "📦", duration: 1500 });
      const productsResult = await syncService.syncProductsFromServer();
      console.log(`✅ Products synced: ${productsResult.synced.length} success, ${productsResult.failed.length} failed`);

      // Download categories
      console.log("📂 Step 2/3: Downloading categories...");
      toast.info("Mengunduh kategori...", { icon: "📂", duration: 1500 });
      const categoriesResult = await syncService.syncCategoriesFromServer();
      console.log(`✅ Categories synced: ${categoriesResult.synced.length} success, ${categoriesResult.failed.length} failed`);

      // Download transactions
      console.log("💰 Step 3/3: Downloading transactions...");
      toast.info("Mengunduh transaksi...", { icon: "💰", duration: 1500 });
      const transactionsResult = await syncService.syncTransactionsFromServer();
      console.log(`✅ Transactions synced: ${transactionsResult.synced.length} success, ${transactionsResult.failed.length} failed`);

      console.log("✅ ========== DOWNLOAD COMPLETED ==========");
      toast.success("Data berhasil didownload! Aplikasi akan reload...", {
        icon: "✓",
        style: {
          background: "#10b981",
          color: "white",
        },
        duration: 2000,
      });

      // Reload page untuk refresh data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("❌ Download error:", error);
      toast.error("Gagal download data: " + (error as Error).message, {
        icon: "❌",
        style: {
          background: "#ef4444",
          color: "white",
        },
        duration: 3000,
      });
      setIsDownloading(false);
    }
  };

  // Show loading while checking setup
  if (isCheckingSetup) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <FirstTimeSetupDialog open={showFirstTimeSetup} onComplete={handleFirstTimeSetupComplete} />

      <div className="min-h-screen flex flex-col w-full">
        <Header />
        <div className="flex flex-1 w-full">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
};

export default Index;
