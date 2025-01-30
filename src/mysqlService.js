import {app} from "electron";
import {appConfig} from './config';

const Docker = require('dockerode');
const path = require('path');
import {getSettings} from './database.js';

const docker = new Docker();

const startMySQLContainer = async () => {
    try {
        const container = docker.getContainer(appConfig.prefix + '-mysql');
        await container.start();
        return {success: true, message: 'MySQL container started successfully.'};
    } catch (error) {
        return {success: false, error: `Error starting MySQL container: ${error.message}`};
    }
};

const stopMySQLContainer = async () => {
    try {
        const container = docker.getContainer(appConfig.prefix + '-mysql');
        await container.stop();
        return {success: true, message: 'MySQL container stopped successfully.'};
    } catch (error) {
        return {success: false, error: `Error stopping MySQL container: ${error.message}`};
    }
};

const restartMySQLContainer = async () => {
    try {
        const container = docker.getContainer(appConfig.prefix + '-mysql');
        await container.restart();
        return {success: true, message: 'MySQL container restarted successfully.'};
    } catch (error) {
        return {success: false, error: `Error restarting MySQL container: ${error.message}`};
    }
};

const getMySQLContainerStatus = async () => {
    try {
        const container = docker.getContainer(appConfig.prefix + '-mysql');
        const data = await container.inspect();
        if (data.State.Running) {
            return {success: true, message: `Running`};
        }
        return {success: true, message: `Stopped`};
    } catch (error) {
        return {success: false, error: `Error fetching status for MySQL container: ${error.message}`};
    }
};

const createMysqlContainer = async () => {
    try {
        const container = docker.getContainer(appConfig.prefix + '-mysql');
        const data = await container.inspect();
        if (data) {
            return {success: true, message: 'MySQL container already exists.'};
        }
    } catch (error) {
        if (error.statusCode === 404) {
            try {
                await new Promise((resolve, reject) => {
                    docker.pull('mysql:8.0', (err, stream) => {
                        if (err) {
                            return reject(new Error(`Error pulling MySQL image: ${err.message}`));
                        }
                        docker.modem.followProgress(stream, onFinished, onProgress);

                        function onFinished(err, output) {
                            if (err) {
                                return reject(new Error(`Error pulling MySQL image: ${err.message}`));
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
                    Image: 'mysql:8.0',
                    name: appConfig.prefix + '-mysql',
                    Env: [
                        `MYSQL_ROOT_PASSWORD=${settings.mysqlRootPassword || 'root'}`,
                        'MYSQL_DATABASE=' + appConfig.prefix + '',
                        'MYSQL_USER=' + appConfig.prefix + '',
                        'MYSQL_PASSWORD=' + appConfig.prefix + ''
                    ],
                    HostConfig: {
                        NetworkMode: appConfig.prefix + '-network',
                        PortBindings: {
                            '3306/tcp': [{HostPort: (settings.mysqlPort || '3306').toString()}]
                        },
                        Binds: [path.join(app.getPath('userData'), 'mysql-data') + ':/var/lib/mysql']
                    }
                });
                await container.start();
                return {success: true, message: 'MySQL container created and started successfully.'};
            } catch (createError) {
                return {success: false, error: `Error creating MySQL container: ${createError.message}`};
            }
        }
        return {success: false, error: `Error checking MySQL container: ${error.message}`};
    }
};

const deleteMysqlContainer = async () => {
    try {
        const container = docker.getContainer(appConfig.prefix + '-mysql');
        await container.remove({force: true});
        return {success: true, message: 'MySQL container deleted successfully.'};
    } catch (error) {
        return {success: false, error: `Error deleting MySQL container: ${error.message}`};
    }
};


export {
    startMySQLContainer,
    stopMySQLContainer,
    restartMySQLContainer,
    getMySQLContainerStatus,
    createMysqlContainer,
    deleteMysqlContainer
};
