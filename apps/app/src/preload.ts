import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('app', {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
});
