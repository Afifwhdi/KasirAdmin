import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Suspense, lazy, useEffect } from "react";
import { isElectron } from "@/lib/utils";
import { transactionService } from "@/services/electron-db";

// LAZY LOAD PAGES
const Login = lazy(() => import("./pages/Login"));
const Index = lazy(() => import("./pages/Index"));
const POSPage = lazy(() => import("./pages/POSPage"));
const TransactionsPage = lazy(() => import("./pages/TransactionsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Optimized Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 menit
      gcTime: 10 * 60 * 1000, // 10 menit (dulu cacheTime)
      retry: 1, // Kurangi retry di 3G
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

const App = () => {
  // Cleanup old failed sync transactions on app start (Electron only)
  useEffect(() => {
    const cleanupOldSyncs = async () => {
      if (isElectron()) {
        try {
          // Clear transactions older than 1 day that failed to sync
          await transactionService.clearOldFailedSyncs(1);
        } catch (error) {
          console.error('Failed to cleanup old sync transactions:', error);
        }
      }
    };

    cleanupOldSyncs();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-right" />

        <HashRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Login Route */}
              <Route path="/login" element={<Login />} />

              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                }
              >
                <Route index element={<POSPage />} />
                <Route path="history" element={<TransactionsPage />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
