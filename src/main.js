import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { saveVirtualHost, getVirtualHosts, removeVirtualHost } from './database';
import path from 'node:path';
import started from 'electron-squirrel-startup';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  return result;
});
ipcMain.handle('save-virtual-host', async (event, formData) => {
  try {
    const id = await saveVirtualHost(formData);
    return { success: true, id };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-virtual-hosts', async () => {
  try {
    const hosts = await getVirtualHosts();
    return hosts;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('remove-virtual-host', async (event, id) => {
  try {
    await removeVirtualHost(id);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

console.log('👋 This message is being logged by "main.js"');

