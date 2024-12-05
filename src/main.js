import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import { saveVirtualHost, getVirtualHosts, removeVirtualHost, saveSettings, getSettings } from './database';
import { generateHttpdConf } from './virtualHostBuilder';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { startContainer, stopContainer, restartContainer, getContainerStatus } from './dockerService';
import { startPhpMyAdminContainer, stopPhpMyAdminContainer, getPhpMyAdminContainerStatus, createPhpMyAdminContainer, deletePhpMyAdminContainer } from './phpMyAdminService';
import { getPhpFpmContainerStatus } from './phpFpmService';
import {
  startMySQLContainer,
  stopMySQLContainer,
  restartMySQLContainer,
  getMySQLContainerStatus,
  createMysqlContainer, deleteMysqlContainer
} from './mysqlService';
import { exec } from 'child_process';
import {
  startRedisContainer,
  stopRedisContainer,
  getRedisContainerStatus,
  createRedisContainer,
  deleteRedisContainer
} from './redisService';
import {createHttpdContainer, deleteHttpdContainer, startHttpdContainer} from "./httpdService";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
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

ipcMain.handle('phpfpm-container-status', async (event, phpVersion) => {
  return await getPhpFpmContainerStatus(phpVersion);
});

ipcMain.handle('window-reload', async () => {
  const windows = BrowserWindow.getAllWindows();
  if (windows.length > 0) {
    windows[0].reload();
  }
  return { success: true };
});

ipcMain.handle('save-settings', async (event, settings) => {
  try {
    await saveSettings(settings);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-settings', async () => {
  try {
    const settings = await getSettings();
    return { success: true, settings };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('check-docker-process', async () => {
  return new Promise((resolve) => {
    exec('docker info', (error, stdout) => {
      if (error) {
        resolve({ success: false });
      } else {
        resolve({ success: stdout.includes('Server Version') });
      }
    });
  });
});

ipcMain.handle('start-docker-app', async () => {
  return new Promise((resolve, reject) => {
    exec('open -a Docker', (error) => {
      if (error) {
        reject(new Error('Failed to start Docker app.'));
      } else {
        resolve();
      }
    });
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

ipcMain.on('open-external-url', (event, url) => {
  shell.openExternal(url, {
    activate: true,
  });
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

ipcMain.handle('start-container', async (event, containerName) => {
  if (containerName === 'phyreamp-phpmyadmin') {
    return await startPhpMyAdminContainer();
  }
  try {
    const output = await startMySQLContainer();
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stop-container', async (event, containerName) => {
  if (containerName === 'phyreamp-mysql') {
    return await stopMySQLContainer();
  } else if (containerName === 'phyreamp-phpmyadmin') {
    return await stopPhpMyAdminContainer();
  }
  try {
    const output = await stopContainer(containerName);
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('restart-container', async (event, containerName) => {
  if (containerName === 'phyreamp-mysql') {
    return await restartMySQLContainer();
  } else if (containerName === 'phyreamp-phpmyadmin') {
    return await restartContainer(containerName);
  }
  try {
    const output = await restartContainer(containerName);
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('generate-httpd-conf', async () => {
  try {
    await generateHttpdConf();
    return { success: true, message: 'httpd.conf file generated successfully.' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('status-container', async (event, containerName) => {
  if (containerName === 'phyreamp-phpmyadmin') {
    return await getPhpMyAdminContainerStatus();
  }
});

ipcMain.handle('all-containers-status', async (event) => {

    return await getMySQLContainerStatus();

})

ipcMain.handle('rebuild-containers', async (event) => {

  const { getNetworkStatus, createNetwork } = require('./dockerService');

  const networkStatus = await getNetworkStatus('phyreamp-network');
  if (!networkStatus.success) {
    const createNetworkResult = await createNetwork('phyreamp-network');
    if (!createNetworkResult.success) {
      return { success: false, error: createNetworkResult.error };
    }
  }

  await deletePhpMyAdminContainer();
  await createPhpMyAdminContainer();

  await deleteRedisContainer();
  await createRedisContainer().then((log) => {
    console.log(log);
    startRedisContainer();
  });

  await deleteHttpdContainer();
  await createHttpdContainer().then((log) => {
    console.log(log);
    startHttpdContainer();
  });

  await deleteMysqlContainer();

  return await createMysqlContainer();

})

console.log('👋 This message is being logged by "main.js"');

