import {app} from "electron";
import {appConfig} from './config';

const Docker = require('dockerode');
const path = require('path');
import {getSettings} from './database.js';

const docker = new Docker();

const startMariaDBContainer = async () => {
    try {
        const container = docker.getContainer(appConfig.prefix + '-mariadb');
        await container.start();
        return {success: true, message: 'MariaDB container started successfully.'};
    } catch (error) {
        return {success: false, error: `Error starting MariaDB container: ${error.message}`};
    }
};

const stopMariaDBContainer = async () => {
    try {
        const container = docker.getContainer(appConfig.prefix + '-mariadb');
        await container.stop();
        return {success: true, message: 'MariaDB container stopped successfully.'};
    } catch (error) {
        return {success: false, error: `Error stopping MariaDB container: ${error.message}`};
    }
};

const restartMariaDBContainer = async () => {
    try {
        const container = docker.getContainer(appConfig.prefix + '-mariadb');
        await container.restart();
        return {success: true, message: 'MariaDB container restarted successfully.'};
    } catch (error) {
        return {success: false, error: `Error restarting MariaDB container: ${error.message}`};
    }
};

const getMariaDBContainerStatus = async () => {
    try {
        const container = docker.getContainer(appConfig.prefix + '-mariadb');
        const data = await container.inspect();
        if (data.State.Running) {
            return {success: true, message: `Running`};
        }
        return {success: true, message: `Stopped`};
    } catch (error) {
        return {success: false, error: `Error fetching status for MariaDB container: ${error.message}`};
    }
};

const createMariaDBContainer = async () => {
    try {
        const container = docker.getContainer(appConfig.prefix + '-mariadb');
        const data = await container.inspect();
        if (data) {
            return {success: true, message: 'MariaDB container already exists.'};
        }
    } catch (error) {
        if (error.statusCode === 404) {
            try {
                await new Promise((resolve, reject) => {
                    docker.pull('mariadb:11.6', (err, stream) => {
                        if (err) {
                            return reject(new Error(`Error pulling MariaDB image: ${err.message}`));
                        }
                        docker.modem.followProgress(stream, onFinished, onProgress);

                        function onFinished(err, output) {
                            if (err) {
                                return reject(new Error(`Error pulling MariaDB image: ${err.message}`));
                            }
                            resolve();
                        }

                        function onProgress(event) {
                            console.log(event);
                        }
                    });
                });
                const settings = await getSettings();
                const container = await docker.createContainer({
                    Image: 'mariadb:11.6',
                    name: appConfig.prefix + '-mariadb',
                    Env: [
                        `MARIADB_ROOT_PASSWORD=${settings.mysqlRootPassword || 'root'}`,
                        'MARIADB_DATABASE=' + appConfig.prefix + '',
                        'MARIADB_USER=' + appConfig.prefix + '',
                        'MARIADB_PASSWORD=' + appConfig.prefix + ''
                    ],
                    HostConfig: {
                        NetworkMode: appConfig.prefix + '-network',
                        PortBindings: {
                            '3306/tcp': [{HostPort: (settings.mysqlPort || '3306').toString()}]
                        },
                        Binds: [path.join(app.getPath('userData'), 'mariadb-data') + ':/var/lib/mysql']
                    }
                });
                await container.start();
                return {success: true, message: 'MariaDB container created and started successfully.'};
            } catch (createError) {
                return {success: false, error: `Error creating MariaDB container: ${createError.message}`};
            }
        }
        return {success: false, error: `Error checking MariaDB container: ${error.message}`};
    }
};

const deleteMariaDBContainer = async () => {
    try {
        const container = docker.getContainer(appConfig.prefix + '-mariadb');
        await container.remove({force: true});
        return {success: true, message: 'MariaDB container deleted successfully.'};
    } catch (error) {
        return {success: false, error: `Error deleting MariaDB container: ${error.message}`};
    }
};


export {
    startMariaDBContainer,
    stopMariaDBContainer,
    restartMariaDBContainer,
    getMariaDBContainerStatus,
    createMariaDBContainer,
    deleteMariaDBContainer
};