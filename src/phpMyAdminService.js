const Docker = require('dockerode');
import { getSettings } from './database.js';
var docker = new Docker();

const startPhpMyAdminContainer = async () => {
    try {
        const container = docker.getContainer('phyreamp-phpmyadmin');
        await container.start();
        return { success: true, message: 'phpMyAdmin container started successfully.' };
    } catch (error) {
        return { success: false, error: `Error starting phpMyAdmin container: ${error.message}` };
    }
};

const stopPhpMyAdminContainer = async () => {
    try {
        const container = docker.getContainer('phyreamp-phpmyadmin');
        await container.stop();
        return { success: true, message: 'phpMyAdmin container stopped successfully.' };
    } catch (error) {
        return { success: false, error: `Error stopping phpMyAdmin container: ${error.message}` };
    }
};

const getPhpMyAdminContainerStatus = async () => {
    try {
        const container = docker.getContainer('phyreamp-phpmyadmin');
        const data = await container.inspect();
        return { success: true, message: `Running` };
    } catch (error) {
        return { success: false, error: `Error fetching status for phpMyAdmin container: ${error.message}` };
    }
};

const createPhpMyAdminContainer = async () => {
    try {
        const container = docker.getContainer('phyreamp-phpmyadmin');
        const data = await container.inspect();
        if (data) {
            return { success: true, message: 'phpMyAdmin container already exists.' };
        }
    } catch (error) {
        if (error.statusCode === 404) {
            try {
                await new Promise((resolve, reject) => {
                    docker.pull('phpmyadmin/phpmyadmin', (err, stream) => {
                        if (err) {
                            return reject(new Error(`Error pulling phpMyAdmin image: ${err.message}`));
                        }
                        docker.modem.followProgress(stream, onFinished, onProgress);

                        function onFinished(err, output) {
                            if (err) {
                                return reject(new Error(`Error pulling phpMyAdmin image: ${err.message}`));
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
                    Image: 'phpmyadmin/phpmyadmin',
                    name: 'phyreamp-phpmyadmin',
                    Env: [
                        'PMA_HOST=phyreamp-mysql',
                        'PMA_PORT: 3306',
                        'MYSQL_ROOT_PASSWORD=root'
                    ],
                    HostConfig: {
                        NetworkMode: 'phyreamp-network',
                        PortBindings: {
                            '80/tcp': [{ HostPort: settings.phpmyadminPort || '8081' }]
                        }
                    }
                });
                await container.start();
                return { success: true, message: 'phpMyAdmin container created and started successfully.' };
            } catch (createError) {
                return { success: false, error: `Error creating phpMyAdmin container: ${createError.message}` };
            }
        }
        return { success: false, error: `Error checking phpMyAdmin container: ${error.message}` };
    }
};

const deletePhpMyAdminContainer = async () => {
    try {
        const container = docker.getContainer('phyreamp-phpmyadmin');
        await container.remove({ force: true });
        return { success: true, message: 'phpMyAdmin container deleted successfully.' };
    } catch (error) {
        return { success: false, error: `Error deleting phpMyAdmin container: ${error.message}` };
    }
};

export {
    startPhpMyAdminContainer,
    stopPhpMyAdminContainer,
    getPhpMyAdminContainerStatus,
    createPhpMyAdminContainer,
    deletePhpMyAdminContainer
};
