import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";

// React Router v7 Future Flags - Ready for future upgrade
const routerFutureConfig = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Suspense, lazy, useEffect } from "react";
import { isElectron } from "@/lib/utils";
import { transactionService } from "@/services/electron-db";


const Login = lazy(() => import("./pages/Login"));
const Index = lazy(() => import("./pages/Index"));
const POSPage = lazy(() => import("./pages/POSPage"));
const TransactionsPage = lazy(() => import("./pages/TransactionsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));


const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);


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

  useEffect(() => {
    const cleanupOldSyncs = async () => {
      if (isElectron()) {
        try {

          await transactionService.clearOldFailedSyncs(1);
        } catch (error) {
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

        <HashRouter future={routerFutureConfig}>
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
