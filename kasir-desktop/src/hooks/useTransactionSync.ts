import { useState, useCallback } from 'react';
import { transactionsWrapper } from '@/services/transactions-wrapper';
import { transactionService } from '@/services/electron-db';
import { useToast } from './use-toast';

export interface SyncProgress {
  status: 'idle' | 'syncing' | 'success' | 'error';
  progress: number;
  currentItem?: string;
  stats: {
    total: number;
    current: number;
    synced: number;
    failed: number;
    updated: number;
    created: number;
  };
  message?: string;
  results?: {
    synced: any[];
    failed: any[];
    updated: any[];
    created: any[];
    summary: any;
  };
}

export const useTransactionSync = () => {
  const { toast } = useToast();
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    status: 'idle',
    progress: 0,
    stats: {
      total: 0,
      current: 0,
      synced: 0,
      failed: 0,
      updated: 0,
      created: 0,
    },
  });

  const updateProgress = useCallback((update: Partial<SyncProgress>) => {
    setSyncProgress((prev) => ({
      ...prev,
      ...update,
      stats: { ...prev.stats, ...update.stats },
    }));
  }, []);

  const syncTransactions = useCallback(async () => {
    try {
      updateProgress({
        status: 'syncing',
        progress: 0,
        message: 'Starting transaction sync...',
        stats: { total: 0, current: 0, synced: 0, failed: 0, updated: 0, created: 0 },
      });

      const unsyncedTransactions = await transactionsWrapper.getUnsynced();
      const totalCount = unsyncedTransactions.length;

      if (totalCount === 0) {
        updateProgress({
          status: 'success',
          progress: 100,
          message: 'All transactions are already synced',
          stats: { total: 0, current: 0, synced: 0, failed: 0, updated: 0, created: 0 },
        });
        
        toast({
          title: "✅ Sync Complete",
          description: "All transactions are already synced",
        });
        return;
      }

      updateProgress({
        stats: { total: totalCount, current: 0, synced: 0, failed: 0, updated: 0, created: 0 },
        message: `Found ${totalCount} unsynced transactions`,
      });

      // CRITICAL: Retry logic with exponential backoff (1s, 2s, 4s)
      let results;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          results = await transactionsWrapper.syncToServer();
          break;
        } catch (error) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw error;
          }
          const waitTime = Math.pow(2, retryCount - 1) * 1000;

          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }

      const finalProgress = {
        status: results.failed.length === 0 ? 'success' as const : 'error' as const,
        progress: 100,
        stats: {
          total: totalCount,
          current: totalCount,
          synced: results.synced.length,
          failed: results.failed.length,
          updated: results.updated?.length || 0,
          created: results.created?.length || 0,
        },
        results,
      };

      if (results.failed.length === 0) {
        finalProgress.message = `Successfully synced ${results.synced.length} transactions (${results.updated?.length || 0} updated, ${results.created?.length || 0} created)`;
        
        toast({
          title: "🎉 Sync Complete",
          description: finalProgress.message,
        });
      } else {
        finalProgress.message = `Synced ${results.synced.length}/${totalCount} transactions. ${results.failed.length} failed.`;
        
        toast({
          title: "⚠️ Sync Completed with Errors",
          description: finalProgress.message,
          variant: "destructive",
        });
      }

      updateProgress(finalProgress);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      updateProgress({
        status: 'error',
        message: `Sync failed: ${errorMessage}`,
      });

      toast({
        title: "❌ Sync Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [updateProgress, toast]);

  const resetSync = useCallback(() => {
    setSyncProgress({
      status: 'idle',
      progress: 0,
      stats: {
        total: 0,
        current: 0,
        synced: 0,
        failed: 0,
        updated: 0,
        created: 0,
      },
    });
  }, []);

  const getSyncStats = useCallback(async () => {
    try {
      return await transactionService.getSyncStats();
    } catch (error) {
      console.error('Failed to get sync stats:', error);
      return {
        total_transactions: 0,
        unsynced_count: 0,
        duplicate_uuids: 0,
      };
    }
  }, []);

  const cleanupDuplicates = useCallback(async () => {
    try {
      const removedCount = await transactionService.removeDuplicates();
      
      if (removedCount > 0) {
        toast({
          title: "🗑️ Cleanup Complete",
          description: `Removed ${removedCount} duplicate transactions`,
        });
      } else {
        toast({
          title: "✅ Database Clean",
          description: "No duplicate transactions found",
        });
      }
      
      return removedCount;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "❌ Cleanup Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  return {
    syncProgress,
    syncTransactions,
    resetSync,
    getSyncStats,
    cleanupDuplicates,
    isLoading: syncProgress.status === 'syncing',
  };
};
