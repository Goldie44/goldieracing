import path from 'node:path';
import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron';
import { createBudgetStorage, type BudgetStorage } from './storage';
import { callAtrVisionApi } from './aiVision';

const isDev = !app.isPackaged;
const DEV_URL = process.env.WEB_DEV_URL ?? 'http://localhost:5173';
const PROD_INDEX = path.resolve(__dirname, '../../web/index.html');

let mainWindow: BrowserWindow | null = null;
let budgetStorage: BudgetStorage | null = null;

function registerBudgetHandlers(storage: BudgetStorage): void {
  ipcMain.handle('budget-spent-totals:load', () => storage.loadSpentTotals());
  ipcMain.handle('budget-spent-totals:save', (_event, values: Record<string, number>) => {
    storage.saveSpentTotals(values);
  });
  ipcMain.handle('budget-allocated-totals:load', () => storage.loadAllocatedTotals());
  ipcMain.handle('budget-allocated-totals:save', (_event, values: Record<string, number>) => {
    storage.saveAllocatedTotals(values);
  });
  ipcMain.handle('budget-total-budget:load', () => storage.loadTotalBudget());
  ipcMain.handle('budget-total-budget:save', (_event, value: number) => {
    storage.saveTotalBudget(value);
  });
}

function registerAtrVisionHandlers(storage: BudgetStorage): void {
  ipcMain.handle('atr-vision-api-key:load', () => storage.loadVisionApiKey());
  ipcMain.handle('atr-vision-api-key:save', (_event, value: string) => {
    storage.saveVisionApiKey(value);
  });
  ipcMain.handle(
    'atr-vision:extract',
    async (_event, imageBase64: string, mediaType: string) => {
      const apiKey = storage.loadVisionApiKey();
      if (!apiKey) {
        throw new Error("Aucune clé API configurée. Ajoutez-en une dans Paramètres.");
      }
      return callAtrVisionApi(imageBase64, mediaType, apiKey);
    },
  );
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
    icon: path.resolve(__dirname, '../build/icon.png'),
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
  Menu.setApplicationMenu(null);

  budgetStorage = createBudgetStorage(
    path.join(app.getPath('userData'), 'goldie-racing.json'),
  );
  registerBudgetHandlers(budgetStorage);
  registerAtrVisionHandlers(budgetStorage);

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  budgetStorage?.close();
  budgetStorage = null;
});
