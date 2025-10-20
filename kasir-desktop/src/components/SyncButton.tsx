import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SyncProgressDialog } from './SyncProgressDialog';
import { useTransactionSync } from '@/hooks/useTransactionSync';
import { 
  RefreshCw, 
  Cloud, 
  AlertTriangle, 
  CheckCircle2, 
  Database,
  Trash2 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SyncButtonProps {
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg";
  showBadge?: boolean;
}

export const SyncButton = ({ 
  variant = "default", 
  size = "default",
  showBadge = true 
}: SyncButtonProps) => {
  const { 
    syncProgress, 
    syncTransactions, 
    resetSync, 
    getSyncStats, 
    cleanupDuplicates, 
    isLoading 
  } = useTransactionSync();
  
  const [showDialog, setShowDialog] = useState(false);
  const [stats, setStats] = useState({
    total_transactions: 0,
    unsynced_count: 0,
    duplicate_uuids: 0,
  });

  // Load stats on mount and periodically
  useEffect(() => {
    const loadStats = async () => {
      const currentStats = await getSyncStats();
      setStats(currentStats);
    };

    loadStats();
    const interval = setInterval(loadStats, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [getSyncStats]);

  // Show dialog when sync starts
  useEffect(() => {
    if (syncProgress.status === 'syncing') {
      setShowDialog(true);
    }
  }, [syncProgress.status]);

  const handleSync = async () => {
    resetSync();
    await syncTransactions();
  };

  const handleCleanup = async () => {
    try {
      await cleanupDuplicates();
      // Refresh stats after cleanup
      const newStats = await getSyncStats();
      setStats(newStats);
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  };

  const getSyncIcon = () => {
    if (isLoading) {
      return <RefreshCw className="w-4 h-4 animate-spin" />;
    }
    
    if (stats.unsynced_count > 0) {
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
    
    if (syncProgress.status === 'success') {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    }
    
    return <Cloud className="w-4 h-4" />;
  };

  const getSyncLabel = () => {
    if (isLoading) return 'Syncing...';
    if (stats.unsynced_count > 0) return `Sync (${stats.unsynced_count})`;
    return 'Sync';
  };

  const getDialogTitle = () => {
    if (syncProgress.status === 'success') return '✅ Sync Complete';
    if (syncProgress.status === 'error') return '❌ Sync Failed';
    return '🚀 Syncing Transactions';
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            disabled={isLoading}
            className="relative"
          >
            {getSyncIcon()}
            <span className="ml-2">{getSyncLabel()}</span>
            
            {/* Unsynced badge */}
            {showBadge && stats.unsynced_count > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {stats.unsynced_count > 99 ? '99+' : stats.unsynced_count}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-64">
          {/* Stats */}
          <div className="px-2 py-1 text-xs text-muted-foreground">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="flex items-center gap-1">
                <Database className="w-3 h-3" />
                <span>Total: {stats.total_transactions}</span>
              </div>
              <div className="flex items-center gap-1">
                <Cloud className="w-3 h-3" />
                <span>Unsynced: {stats.unsynced_count}</span>
              </div>
            </div>
            {stats.duplicate_uuids > 0 && (
              <div className="flex items-center gap-1 text-yellow-600">
                <AlertTriangle className="w-3 h-3" />
                <span>Duplicates: {stats.duplicate_uuids}</span>
              </div>
            )}
          </div>
          
          <DropdownMenuSeparator />
          
          {/* Actions */}
          <DropdownMenuItem onClick={handleSync} disabled={isLoading}>
            <Cloud className="w-4 h-4 mr-2" />
            <span>Sync to Server</span>
            {stats.unsynced_count > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {stats.unsynced_count}
              </Badge>
            )}
          </DropdownMenuItem>
          
          {stats.duplicate_uuids > 0 && (
            <DropdownMenuItem onClick={handleCleanup}>
              <Trash2 className="w-4 h-4 mr-2" />
              <span>Clean Duplicates</span>
              <Badge variant="destructive" className="ml-auto">
                {stats.duplicate_uuids}
              </Badge>
            </DropdownMenuItem>
          )}
          
          {/* Last sync info */}
          {syncProgress.status === 'success' && syncProgress.results && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-1 text-xs text-muted-foreground">
                <div>Last sync results:</div>
                <div className="mt-1 text-green-600">
                  ✓ {syncProgress.results.synced.length} synced
                  ({syncProgress.results.updated.length} updated, {syncProgress.results.created.length} created)
                </div>
                {syncProgress.results.failed.length > 0 && (
                  <div className="text-red-600">
                    ✗ {syncProgress.results.failed.length} failed
                  </div>
                )}
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sync Progress Dialog */}
      <SyncProgressDialog
        open={showDialog}
        onOpenChange={(open) => {
          setShowDialog(open);
          if (!open && syncProgress.status !== 'syncing') {
            resetSync();
          }
        }}
        title={getDialogTitle()}
        progress={syncProgress.progress}
        currentItem={syncProgress.currentItem}
        status={syncProgress.status === 'syncing' ? 'processing' : syncProgress.status}
        message={syncProgress.message}
        stats={syncProgress.stats}
      />
    </>
  );
};