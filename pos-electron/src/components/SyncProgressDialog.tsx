import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Loader2, Download, CheckCircle, XCircle } from "lucide-react";

interface SyncProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  progress: number;
  currentItem?: string;
  status: 'idle' | 'downloading' | 'processing' | 'success' | 'error';
  message?: string;
  stats?: {
    total: number;
    current: number;
    synced: number;
    failed: number;
  };
}

export const SyncProgressDialog = ({
  open,
  onOpenChange,
  title,
  progress,
  currentItem,
  status,
  message,
  stats
}: SyncProgressDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {status === 'downloading' && <Download className="w-5 h-5 text-blue-500 animate-pulse" />}
            {status === 'processing' && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
            {status === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
            {status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
            <span>{title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Current Item */}
          {currentItem && (
            <div className="text-sm">
              <span className="text-muted-foreground">Processing: </span>
              <span className="font-medium truncate">{currentItem}</span>
            </div>
          )}

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between p-2 bg-secondary rounded">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-semibold">{stats.total}</span>
              </div>
              <div className="flex justify-between p-2 bg-secondary rounded">
                <span className="text-muted-foreground">Current:</span>
                <span className="font-semibold">{stats.current}</span>
              </div>
              <div className="flex justify-between p-2 bg-green-500/10 rounded">
                <span className="text-green-600">Synced:</span>
                <span className="font-semibold text-green-600">{stats.synced}</span>
              </div>
              <div className="flex justify-between p-2 bg-red-500/10 rounded">
                <span className="text-red-600">Failed:</span>
                <span className="font-semibold text-red-600">{stats.failed}</span>
              </div>
            </div>
          )}

          {/* Status Message */}
          {message && (
            <div className={`text-sm p-3 rounded ${
              status === 'success' ? 'bg-green-500/10 text-green-600' :
              status === 'error' ? 'bg-red-500/10 text-red-600' :
              'bg-blue-500/10 text-blue-600'
            }`}>
              {message}
            </div>
          )}

          {/* Loading Spinner */}
          {(status === 'downloading' || status === 'processing') && (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">
                {status === 'downloading' ? 'Downloading...' : 'Processing...'}
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
