const Docker = require('dockerode');
const path = require('path');
import { getVirtualHosts } from './database.js';
var docker = new Docker();

const createPhpFpmContainer = async (phpVersion) => {
    try {
        const containerName = `phyreamp-php${phpVersion.replace('.', '')}-fpm`;
        const container = docker.getContainer(containerName);
        const data = await container.inspect();
        if (data) {
            return { success: true, message: `PHP-FPM container for PHP ${phpVersion} already exists.` };
        }
    } catch (error) {
        if (error.statusCode === 404) {
            try {
                await new Promise((resolve, reject) => {
                    docker.pull(`php:${phpVersion}-fpm`, (err, stream) => {
                        if (err) {
                            return reject(new Error(`Error pulling PHP-FPM image for PHP ${phpVersion}: ${err.message}`));
                        }
                        docker.modem.followProgress(stream, onFinished, onProgress);

                        function onFinished(err, output) {
                            if (err) {
                                return reject(new Error(`Error pulling PHP-FPM image for PHP ${phpVersion}: ${err.message}`));
                            }
                            resolve();
                        }

                        function onProgress(event) {
                            console.log(event);
                        }
                    });
                });

                const virtualHosts = await getVirtualHosts();
                const binds = virtualHosts.map(host => `${host.document_root}:/var/www/html/${host.name}`);

                const container = await docker.createContainer({
                    Image: `php:${phpVersion}-fpm`,
                    name: `phyreamp-php${phpVersion.replace('.', '')}-fpm`,
                    HostConfig: {
                        NetworkMode: 'phyreamp-network',
                        Binds: [
                            ...binds
                        ]
                    }
                });
                await container.start();
                return { success: true, message: `PHP-FPM container for PHP ${phpVersion} created and started successfully.` };
            } catch (createError) {
                return { success: false, error: `Error creating PHP-FPM container for PHP ${phpVersion}: ${createError.message}` };
            }
        }
        return { success: false, error: `Error checking PHP-FPM container for PHP ${phpVersion}: ${error.message}` };
    }
};

const deletePhpFpmContainer = async (phpVersion) => {
    try {
        const containerName = `phyreamp-php${phpVersion.replace('.', '')}-fpm`;
        const container = docker.getContainer(containerName);
        await container.remove({ force: true });
        return { success: true, message: `PHP-FPM container for PHP ${phpVersion} deleted successfully.` };
    } catch (error) {
        return { success: false, error: `Error deleting PHP-FPM container for PHP ${phpVersion}: ${error.message}` };
    }
};

const getPhpFpmContainerStatus = async (phpVersion) => {
    try {
        const containerName = `phyreamp-php${phpVersion.replace('.', '')}-fpm`;
        const container = docker.getContainer(containerName);
        const data = await container.inspect();
        if (data.State.Running) {
            return { success: true, message: `Running` };
        }
        return { success: true, message: `Stopped` };
    } catch (error) {
        return { success: false, error: `Error fetching status for PHP-FPM container for PHP ${phpVersion}: ${error.message}` };
    }
};
const startPhpFpmContainer = async (phpVersion) => {
    try {
        const containerName = `phyreamp-php${phpVersion.replace('.', '')}-fpm`;
        const container = docker.getContainer(containerName);
        await container.start();
        return { success: true, message: `PHP-FPM container for PHP ${phpVersion} started successfully.` };
    } catch (error) {
        return { success: false, error: `Error starting PHP-FPM container for PHP ${phpVersion}: ${error.message}` };
    }
};

const stopPhpFpmContainer = async (phpVersion) => {
    try {
        const containerName = `phyreamp-php${phpVersion.replace('.', '')}-fpm`;
        const container = docker.getContainer(containerName);
        await container.stop();
        return { success: true, message: `PHP-FPM container for PHP ${phpVersion} stopped successfully.` };
    } catch (error) {
        return { success: false, error: `Error stopping PHP-FPM container for PHP ${phpVersion}: ${error.message}` };
    }
};
const restartPhpFpmContainer = async (phpVersion) => {
    try {
        const containerName = `phyreamp-php${phpVersion.replace('.', '')}-fpm`;
        const container = docker.getContainer(containerName);
        await container.restart();
        return { success: true, message: `PHP-FPM container for PHP ${phpVersion} restarted successfully.` };
    } catch (error) {
        return { success: false, error: `Error restarting PHP-FPM container for PHP ${phpVersion}: ${error.message}` };
    }
};
export {
    createPhpFpmContainer,
    stopPhpFpmContainer,
    startPhpFpmContainer,
    deletePhpFpmContainer,
    getPhpFpmContainerStatus,
    restartPhpFpmContainer
};
