import path from 'node:path';
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { createBudgetSpentTotalStorage, type BudgetSpentTotalStorage } from './storage';

const isDev = !app.isPackaged;
const DEV_URL = process.env.WEB_DEV_URL ?? 'http://localhost:5173';
const PROD_INDEX = path.resolve(__dirname, '../../web/dist/index.html');

let mainWindow: BrowserWindow | null = null;
let budgetSpentTotalStorage: BudgetSpentTotalStorage | null = null;

function registerBudgetSpentTotalHandlers(storage: BudgetSpentTotalStorage): void {
  ipcMain.handle('budget-spent-totals:load', () => storage.load());
  ipcMain.handle('budget-spent-totals:save', (_event, values: Record<string, number>) => {
    storage.save(values);
  });
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: '#0f1118',
    show: false,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev) {
    void mainWindow.loadURL(DEV_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    void mainWindow.loadFile(PROD_INDEX);
  }
}

app.whenReady().then(() => {
  budgetSpentTotalStorage = createBudgetSpentTotalStorage(
    path.join(app.getPath('userData'), 'goldie-racing.sqlite'),
  );
  registerBudgetSpentTotalHandlers(budgetSpentTotalStorage);

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  budgetSpentTotalStorage?.close();
  budgetSpentTotalStorage = null;
});
