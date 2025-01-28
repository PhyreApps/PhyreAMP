import fs from "fs";

const Docker = require('dockerode');
const path = require("node:path");
import { getSettings, getVirtualHosts } from './database.js';
import {app} from "electron";

var docker = new Docker();

const startHttpdContainer = async () => {
    try {

        const container = docker.getContainer('phyreamp-httpd');
        await container.start();
        return { success: true, message: 'HTTPD container started successfully.' };
    } catch (error) {
        return { success: false, error: `Error starting HTTPD container: ${error.message}` };
    }
};

const stopHttpdContainer = async () => {
    try {

        const container = docker.getContainer('phyreamp-httpd');
        await container.stop();
        return { success: true, message: 'HTTPD container stopped successfully.' };
    } catch (error) {
        return { success: false, error: `Error stopping HTTPD container: ${error.message}` };
    }
};

const restartHttpdContainer = async () => {
    try {

        const container = docker.getContainer('phyreamp-httpd');
        await container.restart();
        return { success: true, message: 'HTTPD container restarted successfully.' };
    } catch (error) {
        return { success: false, error: `Error restarting HTTPD container: ${error.message}` };
    }
};

const getHttpdContainerStatus = async () => {
    try {

        const container = docker.getContainer('phyreamp-httpd');
        const data = await container.inspect();
        if (data.State.Running) {
            return { success: true, message: `Running` };
        }
        return { success: true, message: `Stopped` };
    } catch (error) {
        return { success: false, error: `Error fetching status for HTTPD container: ${error.message}` };
    }
};

const createHttpdContainer = async () => {


    docker.ping(function(err, data) {
        console.log('docker.ping:', err, data);
    });

    try {
        const container = docker.getContainer('phyreamp-httpd');
        const data = await container.inspect();
        if (data) {
            return { success: true, message: 'HTTPD container already exists.' };
        }
    } catch (error) {

        console.log('createHttpdContainer error:', error);

        try {
            await new Promise((resolve, reject) => {
                docker.pull('httpd:latest', (err, stream) => {
                    if (err) {
                        return reject(new Error(`Error pulling HTTPD image: ${err.message}`));
                    }
                    docker.modem.followProgress(stream, onFinished, onProgress);

                    function onFinished(err, output) {
                        if (err) {
                            return reject(new Error(`Error pulling HTTPD image: ${err.message}`));
                        }
                        resolve();
                    }

                    function onProgress(event) {
                        console.log(event);
                    }
                });
            });
            const settings = await getSettings();

            const virtualHosts = await getVirtualHosts();
            const binds = virtualHosts.map(host => `${host.project_path}:/var/www/html/${host.local_domain}`);

            const appPath = app.getAppPath();
            const appDataPath = app.getPath('appData');
            const userDataPath = app.getPath('userData');
            const dockerDataPath = path.join(appPath, 'docker/');

            // Apache working directory
            //const apacheDataPath = path.join(dockerDataPath, 'apache');
            const apacheDataPath = path.join(userDataPath, 'apache');

            const newApacheConfigPath = path.join(apacheDataPath, 'httpd.conf');
            if (fs.existsSync(newApacheConfigPath)) {
                binds.push(`${newApacheConfigPath}:/usr/local/apache2/conf/httpd.conf`);
            }

            const newApacheVirtualHostsPath = path.join(apacheDataPath, 'virtualhosts.conf');
            if (fs.existsSync(newApacheVirtualHostsPath)) {
                binds.push(`${newApacheVirtualHostsPath}:/usr/local/apache2/conf/virtualhosts.conf`);
            }

            console.log('binds:', binds);

            const extraHosts = virtualHosts.map(host => `${host.local_domain}:127.0.0.1`);

            const container = await docker.createContainer({
                Image: 'httpd:latest',
                name: 'phyreamp-httpd',
                HostConfig: {
                    NetworkMode: 'phyreamp-network',
                    PortBindings: {
                        '80/tcp': [{ HostPort: (settings.httpdPort || '80').toString() }]
                    },
                    Binds: binds,
                    ExtraHosts: extraHosts
                }
            });
            await container.start();
            return { success: true, message: 'HTTPD container created and started successfully.' };
        } catch (createError) {
            return { success: false, error: `Error creating HTTPD container: ${createError.message}` };
        }

        return { success: false, error: `Error checking HTTPD container: ${error.message}` };
    }
};

const deleteHttpdContainer = async () => {
    try {

        const container = docker.getContainer('phyreamp-httpd');
        await container.remove({ force: true });
        return { success: true, message: 'HTTPD container deleted successfully.' };
    } catch (error) {
        return { success: false, error: `Error deleting HTTPD container: ${error.message}` };
    }
};

export {
    startHttpdContainer,
    stopHttpdContainer,
    restartHttpdContainer,
    getHttpdContainerStatus,
    createHttpdContainer,
    deleteHttpdContainer
};
