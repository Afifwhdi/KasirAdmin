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
        // Check if first-time setup was completed
        const setupDone = localStorage.getItem("pos_first_time_setup_done") === "true";

        if (!setupDone) {
          // Belum pernah setup sama sekali
          setShowFirstTimeSetup(true);
          setIsCheckingSetup(false);
          return;
        }

        // Check if database file exists
        const dbExists = await window.electronAPI!.app.checkDbExists();

        if (!dbExists) {
          // Database hilang, minta setup ulang
          localStorage.removeItem("pos_first_time_setup_done");
          setShowFirstTimeSetup(true);
          setIsCheckingSetup(false);
          return;
        }

        // Database check removed - no more empty database alert
        console.log("[Index] Setup check complete");

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
      await window.electronAPI!.app.setDbPath(dbPath);
      localStorage.setItem("pos_first_time_setup_done", "true");
      setShowFirstTimeSetup(false);

      // Download langsung setelah setup
      toast.info("Setup berhasil! Memulai download data...", {
        icon: "📥",
        duration: 2000,
      });

      // Delay kecil agar toast terlihat
      setTimeout(() => {
        handleDownloadData();
      }, 500);
    } catch (error) {
      console.error("Setup error:", error);
      toast.error("Gagal setup: " + (error as Error).message);
    }
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadData = async () => {
    setIsDownloading(true);
    toast.info("Memulai download data dari server...", {
      icon: "📥",
      duration: 2000,
    });

    try {
      // Download products
      await syncService.syncProductsFromServer();

      // Download categories
      await syncService.syncCategoriesFromServer();

      // Download transactions
      await syncService.syncTransactionsFromServer();

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
      console.error("Download error:", error);
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
