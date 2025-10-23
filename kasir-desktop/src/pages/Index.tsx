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
  const [isDownloading, setIsDownloading] = useState(false);

  // Define handleDownloadData first (before useEffect)
  const handleDownloadData = async () => {
    if (isDownloading) return; // Prevent multiple downloads
    
    setIsDownloading(true);

    toast.info("Memulai download data dari server...", {
      icon: "📥",
      duration: 2000,
    });

    try {
      // 1. Download Products
      toast.info("Mengunduh produk...", { icon: "📦", duration: 1500 });
      const productsResult = await syncService.syncProductsFromServer((progress) => {
        // Optional: Show progress
        if (progress.current % 10 === 0) {
          toast.info(`Mengunduh produk: ${progress.current}/${progress.total}`, {
            icon: "📦",
            duration: 500,
          });
        }
      });

      toast.success(`✅ ${productsResult.synced.length} produk berhasil disimpan`, {
        duration: 2000,
      });

      // 2. Download Categories
      toast.info("Mengunduh kategori...", { icon: "📂", duration: 1500 });
      const categoriesResult = await syncService.syncCategoriesFromServer();

      toast.success(`✅ ${categoriesResult.synced.length} kategori berhasil disimpan`, {
        duration: 2000,
      });

      // 3. Download Transactions
      toast.info("Mengunduh transaksi...", { icon: "💰", duration: 1500 });
      const transactionsResult = await syncService.syncTransactionsFromServer();

      toast.success(`✅ ${transactionsResult.synced.length} transaksi berhasil disimpan`, {
        duration: 2000,
      });

      // Success summary
      toast.success(
        `✅ Download selesai!\n📦 ${productsResult.synced.length} produk\n📂 ${categoriesResult.synced.length} kategori\n💰 ${transactionsResult.synced.length} transaksi`,
        {
          icon: "🎉",
          style: {
            background: "#10b981",
            color: "white",
          },
          duration: 3000,
        }
      );

      // Reload to show data from SQLite
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      toast.error("Gagal download data: " + (error as Error).message, {
        icon: "❌",
        style: {
          background: "#ef4444",
          color: "white",
        },
        duration: 5000,
      });
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    const checkFirstTimeSetup = async () => {
      if (!isElectron()) {
        setIsCheckingSetup(false);
        return;
      }

      try {
        const hasConfig = await window.electronAPI!.app.hasConfig();

        if (!hasConfig) {
          setShowFirstTimeSetup(true);
          setIsCheckingSetup(false);
          return;
        }

        const dbExists = await window.electronAPI!.app.checkDbExists();

        if (!dbExists) {
          setShowFirstTimeSetup(true);
          setIsCheckingSetup(false);
          return;
        }

        // Check if database is empty (no products)
        const { productService } = await import("@/services/electron-db");
        const productsCount = await productService.countWithFilters({});
        
        if (productsCount === 0) {
          // Database exists but empty, auto-download data
          toast.info("Database kosong, mengunduh data dari server...", {
            icon: "📥",
            duration: 3000,
          });
          
          setIsCheckingSetup(false);
          
          // Trigger auto-download after a short delay
          setTimeout(() => {
            handleDownloadData();
          }, 500);
          return;
        }

        setIsCheckingSetup(false);
      } catch (error) {
        setIsCheckingSetup(false);
      }
    };

    checkFirstTimeSetup();
  }, []);

  const handleFirstTimeSetupComplete = async (dbPath: string) => {
    try {

      
      const result = await window.electronAPI!.app.setDbPath(dbPath);
      
      if (!result.success) {
        toast.error(`Gagal setup database: ${result.message}`, {
          icon: "❌",
          duration: 4000,
        });
        return;
      }


      setShowFirstTimeSetup(false);


      toast.success("Database berhasil dibuat! Memulai download data...", {
        icon: "📥",
        duration: 2000,
      });


      setTimeout(() => {
        handleDownloadData();
      }, 500);
    } catch (error) {

      toast.error("Gagal setup: " + (error as Error).message, {
        icon: "❌",
        duration: 4000,
      });
    }
  };




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
