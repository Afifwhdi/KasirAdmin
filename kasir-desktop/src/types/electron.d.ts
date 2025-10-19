export interface ElectronAPI {
  db: {
    query: (sql: string, params?: unknown[]) => Promise<unknown[]>;
    run: (sql: string, params?: unknown[]) => Promise<unknown>;
    get: (sql: string, params?: unknown[]) => Promise<unknown>;
  };
  app: {
    getPath: (name: string) => Promise<string>;
    getDataDir: () => Promise<string>;
    setDbPath: (path: string) => Promise<{ success: boolean; message: string; newPath: string }>;
    getDbPath: () => Promise<string>;
    checkDbExists: () => Promise<boolean>;
    hasDbData: () => Promise<boolean>;
  };
  dialog: {
    selectFolder: () => Promise<{ canceled: boolean; folderPath?: string }>;
  };
  platform: string;
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
