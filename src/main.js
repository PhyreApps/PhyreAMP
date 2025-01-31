import {app, BrowserWindow, dialog, ipcMain, shell} from 'electron';
import {appConfig} from './config';
import {saveVirtualHost, getVirtualHosts, removeVirtualHost, saveSettings, getSettings, updateVirtualHost} from './database';
import {generateHttpdConf} from './virtualHostBuilder';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import {startContainer, stopContainer, restartContainer, getContainerStatus} from './dockerService';
import {
    startPhpMyAdminContainer,
    stopPhpMyAdminContainer,
    getPhpMyAdminContainerStatus,
    createPhpMyAdminContainer,
    deletePhpMyAdminContainer,
    restartPhpMyAdminContainer
} from './phpMyAdminService';
import {
    getPhpFpmContainerStatus,
    createPhpFpmContainer,
    deletePhpFpmContainer,
    stopPhpFpmContainer, restartPhpFpmContainer, startPhpFpmContainer
} from './phpFpmService';
import {
    startMySQLContainer,
    stopMySQLContainer,
    restartMySQLContainer,
    getMySQLContainerStatus,
    createMysqlContainer, deleteMysqlContainer
} from './mysqlService';
import {exec} from 'child_process';
import {
    startRedisContainer,
    stopRedisContainer,
    getRedisContainerStatus,
    createRedisContainer,
    deleteRedisContainer
} from './redisService';
import {
    createHttpdContainer,
    deleteHttpdContainer,
    getHttpdContainerStatus, restartHttpdContainer,
    startHttpdContainer,
    stopHttpdContainer
} from "./httpdService";
import * as http from "node:http";

const Docker = require('dockerode');
const docker = new Docker();

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
            sandbox: true,
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
    return {success: true};
});

ipcMain.handle('save-settings', async (event, settings) => {
    try {
        await saveSettings(settings);
        return {success: true};
    } catch (error) {
        return {success: false, error: error.message};
    }
});

ipcMain.handle('get-settings', async () => {
    try {
        const settings = await getSettings();
        return {success: true, settings};
    } catch (error) {
        return {success: false, error: error.message};
    }
});

ipcMain.handle('check-docker-process', async () => {
    return new Promise((resolve) => {
        exec('docker info', (error, stdout) => {
            if (error) {
                resolve({success: false});
            } else {
                resolve({success: stdout.includes('Server Version')});
            }
        });
    });
});

ipcMain.handle('start-docker-app', async () => {
    return new Promise((resolve, reject) => {

        // check os type
        let command = 'open -a Docker';
        if (process.platform === 'win32') {
            command = 'start "" "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe"';
        } else if (process.platform === 'linux') {
            command = 'sudo systemctl start docker';
        } else if (process.platform === 'darwin') {
            command = 'open -a Docker';
        }

        exec(command, (error) => {
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
        await rebuildVirtualHostContainers();
        return {success: true, id};
    } catch (error) {
        return {success: false, error: error.message};
    }
});

ipcMain.handle('get-virtual-hosts', async () => {
    try {
        const hosts = await getVirtualHosts(true);
        return hosts;
    } catch (error) {
        return {success: false, error: error.message};
    }
});

ipcMain.handle('update-virtual-host', async (event, formData) => {
    try {
        const {id, name, project_path, public_folder, php_version, local_domain} = formData;
        await updateVirtualHost(id, {name, project_path, public_folder, php_version, local_domain});
        await rebuildVirtualHostContainers();
        return {success: true};
    } catch (error) {
        return {success: false, error: error.message};
    }
});
ipcMain.handle('remove-virtual-host', async (event, id) => {
    try {
        await removeVirtualHost(id);
        await rebuildVirtualHostContainers();
        return {success: true};
    } catch (error) {
        return {success: false, error: error.message};
    }
});

ipcMain.handle('start-container', async (event, containerName) => {
    if (containerName === appConfig.prefix + '-phpmyadmin') {
        return await startPhpMyAdminContainer();
    }
    try {
        const output = await startMySQLContainer();
        return {success: true, output};
    } catch (error) {
        return {success: false, error: error.message};
    }
});

ipcMain.handle('stop-container', async (event, containerName) => {
    if (containerName === appConfig.prefix + '-mysql') {
        return await stopMySQLContainer();
    } else if (containerName === appConfig.prefix + '-phpmyadmin') {
        return await stopPhpMyAdminContainer();
    }
    try {
        const output = await stopContainer(containerName);
        return {success: true, output};
    } catch (error) {
        return {success: false, error: error.message};
    }
});

ipcMain.handle('restart-container', async (event, containerName) => {
    if (containerName === appConfig.prefix + '-mysql') {
        return await restartMySQLContainer();
    } else if (containerName === appConfig.prefix + '-phpmyadmin') {
        return await restartContainer(containerName);
    }
    try {
        const output = await restartContainer(containerName);
        return {success: true, output};
    } catch (error) {
        return {success: false, error: error.message};
    }
});

ipcMain.handle('start-all-containers', async () => {
    try {
        const {checkContainerExists} = require('./dockerService');

        const httpdExists = await checkContainerExists(appConfig.prefix + '-httpd');
        if (!httpdExists.exists) {
            await rebuildVirtualHostContainers();
        }

        await startHttpdContainer();
        await startMySQLContainer();
        await startRedisContainer();
        await startPhpMyAdminContainer();

        const virtualHosts = await getVirtualHosts();
        for (const host of virtualHosts) {
            const start = await startPhpFpmContainer(host.php_version);
        }

        return {success: true, message: 'All containers started successfully.'};
    } catch (error) {
        return {success: false, error: error.message};
    }
});

ipcMain.handle('stop-all-containers', async () => {
    try {
        await stopHttpdContainer();
        await stopMySQLContainer();
        await stopRedisContainer();
        await stopPhpMyAdminContainer();

        const virtualHosts = await getVirtualHosts();
        for (const host of virtualHosts) {
            const stop = await stopPhpFpmContainer(host.php_version);
        }

        return {success: true, message: 'All containers stopped successfully.'};
    } catch (error) {
        return {success: false, error: error.message};
    }
});

async function restartRedisContainer() {

}

ipcMain.handle('restart-all-containers', async () => {
    try {
        await restartHttpdContainer();
        await restartMySQLContainer();
        await restartRedisContainer();
        await restartPhpMyAdminContainer();

        const virtualHosts = await getVirtualHosts();
        for (const host of virtualHosts) {
            const stop = await restartPhpFpmContainer(host.php_version);
        }

        return {success: true, message: 'All containers restarted successfully.'};
    } catch (error) {
        return {success: false, error: error.message};
    }
});

ipcMain.handle('generate-httpd-conf', async () => {
    try {
        await generateHttpdConf();
        return {success: true, message: 'httpd.conf file generated successfully.'};
    } catch (error) {
        return {success: false, error: error.message};
    }
});

ipcMain.handle('status-container', async (event, containerName) => {
    if (containerName === appConfig.prefix + '-phpmyadmin') {
        return await getPhpMyAdminContainerStatus();
    }
    if (containerName === appConfig.prefix + '-mysql') {
        return await getMySQLContainerStatus();
    }
    if (containerName === appConfig.prefix + '-redis') {
        return await getRedisContainerStatus();
    }
    if (containerName === appConfig.prefix + '-httpd') {
        return await getHttpdContainerStatus();
    }

    return await getContainerStatus(containerName);
});

ipcMain.handle('all-containers-status', async (event) => {
    try {
        const [httpdStatus, mysqlStatus, redisStatus, phpmyadminStatus, virtualHosts] = await Promise.all([
            getHttpdContainerStatus(),
            getMySQLContainerStatus(),
            getRedisContainerStatus(),
            getPhpMyAdminContainerStatus(),
            getVirtualHosts()
        ]);

        const phpfpmStatuses = await Promise.all(virtualHosts.map(async (host) => {
            const status = await getPhpFpmContainerStatus(host.php_version);
            return {version: host.php_version, message: status.message || 'Unknown'};
        }));

        const phpfpms = phpfpmStatuses.reduce((acc, {version, message}) => {
            acc[version] = message;
            return acc;
        }, {});

        return {
            success: true,
            message: 'Container statuses fetched successfully.',
            status: (httpdStatus.message == 'Running' && mysqlStatus.message == 'Running') ? 'Running' : 'Stopped',
            statuses: {
                httpd: httpdStatus.message || 'Unknown',
                mysql: mysqlStatus.message || 'Unknown',
                redis: redisStatus.message || 'Unknown',
                phpmyadmin: phpmyadminStatus.message || 'Unknown',
                phpfpms
            }
        };
    } catch (error) {
        return {success: false, error: `Error fetching container statuses: ${error.message}`};
    }
});

ipcMain.handle('rebuild-containers', async (event) => {

    const {getNetworkStatus, createNetwork} = require('./dockerService');

    const networkStatus = await getNetworkStatus(appConfig.prefix + '-network');
    if (!networkStatus.success) {
        const createNetworkResult = await createNetwork(appConfig.prefix + '-network');
        if (!createNetworkResult.success) {
            return {success: false, error: createNetworkResult.error};
        }
    }

    await deletePhpMyAdminContainer();
    await createPhpMyAdminContainer();

    await deleteRedisContainer();
    await createRedisContainer().then((log) => {
        console.log(log);
        startRedisContainer();
    });

    return await rebuildVirtualHostContainers();

})

async function rebuildVirtualHostContainers() {

    await generateHttpdConf();

    const virtualHosts = await getVirtualHosts();
    const phpVersions = [...new Set(virtualHosts.map(host => host.php_version))];


    // Get all existing PHP-FPM containers
    const containers = await docker.listContainers({all: true});
    const phpFpmContainers = containers.filter(container => container.Names.some(name => name.includes(appConfig.prefix + '-php')));

    // Determine which containers to delete
    const containersToDelete = phpFpmContainers.filter(container => {
        const phpContainerName = appConfig.prefix + '-php';
        //const version = container.Names[0].match(/phyreamp-php(\d+)/);
        const version = container.Names[0].match(/${phpContainerName}(\d+)/);
        return version && !phpVersions.includes(version[1].replace(/(\d)(\d)/, '$1.$2'));
    });

    // Delete old PHP-FPM containers
    for (const container of containersToDelete) {

        const containerName = container.Names[0].replace('/', '');

        const dockerContainer = docker.getContainer(containerName);
        await dockerContainer.remove({force: true}).then((log) => {
            console.log(`Deleted old container: ${containerName}`, log);
        });
    }

    // Create or recreate necessary PHP-FPM containers
    for (const phpVersion of phpVersions) {
        await deletePhpFpmContainer(phpVersion).then((log) => {
            console.log(log);
        });
        await createPhpFpmContainer(phpVersion).then((log) => {
            console.log(log);
        });
    }

    await createMysqlContainer();

    //Create or recreate phpMyAdmin container
    await deletePhpMyAdminContainer();
    await createPhpMyAdminContainer();

    //Create or recreate Redis container
    await deleteRedisContainer();
    await createRedisContainer();

    await deleteHttpdContainer();
    return await createHttpdContainer().then((log) => {
        console.log(log);
        startHttpdContainer();

        return {success: true, message: 'Containers rebuilt successfully.'};
    });
}


ipcMain.handle('rebuild-virtualhost-containers', async (event) => {
    return await rebuildVirtualHostContainers();
});

console.log('👋 This message is being logged by "main.js"');

