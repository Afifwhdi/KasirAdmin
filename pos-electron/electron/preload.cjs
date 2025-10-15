const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  db: {
    query: (sql, params) => ipcRenderer.invoke('db:query', sql, params),
    run: (sql, params) => ipcRenderer.invoke('db:run', sql, params),
    get: (sql, params) => ipcRenderer.invoke('db:get', sql, params),
  },
  app: {
    getPath: (name) => ipcRenderer.invoke('app:getPath', name),
    getDataDir: () => ipcRenderer.invoke('app:getDataDir'),
    setDbPath: (path) => ipcRenderer.invoke('app:setDbPath', path),
    getDbPath: () => ipcRenderer.invoke('app:getDbPath'),
  },
  platform: process.platform,
  isElectron: true,
});
