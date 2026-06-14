import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('app', {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
  budgetSpentTotals: {
    load: () => ipcRenderer.invoke('budget-spent-totals:load'),
    save: (values: Record<string, number>) => ipcRenderer.invoke('budget-spent-totals:save', values),
  },
});
