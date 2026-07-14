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
  budgetAllocatedTotals: {
    load: () => ipcRenderer.invoke('budget-allocated-totals:load'),
    save: (values: Record<string, number>) => ipcRenderer.invoke('budget-allocated-totals:save', values),
  },
  budgetTotalBudget: {
    load: () => ipcRenderer.invoke('budget-total-budget:load'),
    save: (value: number) => ipcRenderer.invoke('budget-total-budget:save', value),
  },
  atrVisionApiKey: {
    load: () => ipcRenderer.invoke('atr-vision-api-key:load'),
    save: (value: string) => ipcRenderer.invoke('atr-vision-api-key:save', value),
  },
  atrVision: {
    extract: (imageBase64: string, mediaType: string) =>
      ipcRenderer.invoke('atr-vision:extract', imageBase64, mediaType),
  },
});
