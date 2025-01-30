import {appConfig} from "./config";

const Docker = require('dockerode');
import { getSettings } from './database.js';
var docker = new Docker();

const startRedisContainer = async () => {
    try {
        const container = docker.getContainer(appConfig.prefix + '-redis');
        await container.start();
        return { success: true, message: 'Redis container started successfully.' };
    } catch (error) {
        return { success: false, error: `Error starting Redis container: ${error.message}` };
    }
};

const stopRedisContainer = async () => {
    try {
        const container = docker.getContainer(appConfig.prefix + '-redis');
        await container.stop();
        return { success: true, message: 'Redis container stopped successfully.' };
    } catch (error) {
        return { success: false, error: `Error stopping Redis container: ${error.message}` };
    }
};

const getRedisContainerStatus = async () => {
    try {
        const container = docker.getContainer(appConfig.prefix + '-redis');
        const data = await container.inspect();
        if (data.State.Running) {
            return { success: true, message: `Running` };
        }
        return { success: true, message: `Stopped` };
    } catch (error) {
        return { success: false, error: `Error fetching status for Redis container: ${error.message}` };
    }
};

const createRedisContainer = async () => {
    try {
        const container = docker.getContainer(appConfig.prefix + '-redis');
        const data = await container.inspect();
        if (data) {
            return { success: true, message: 'Redis container already exists.' };
        }
    } catch (error) {
        if (error.statusCode === 404) {
            try {
                await new Promise((resolve, reject) => {
                    docker.pull('redis:latest', (err, stream) => {
                        if (err) {
                            return reject(new Error(`Error pulling Redis image: ${err.message}`));
                        }
                        docker.modem.followProgress(stream, onFinished, onProgress);

                        function onFinished(err, output) {
                            if (err) {
                                return reject(new Error(`Error pulling Redis image: ${err.message}`));
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
                    Image: 'redis:latest',
                    name: appConfig.prefix + '-redis',
                    HostConfig: {
                        NetworkMode: appConfig.prefix + '-network',
                        PortBindings: {
                            '6379/tcp': [{ HostPort: (settings.redisPort || '6379').toString() }]
                        }
                    }
                });
                await container.start();
                return { success: true, message: 'Redis container created and started successfully.' };
            } catch (createError) {
                return { success: false, error: `Error creating Redis container: ${createError.message}` };
            }
        }
        return { success: false, error: `Error checking Redis container: ${error.message}` };
    }
};

const deleteRedisContainer = async () => {
    try {
        const container = docker.getContainer(appConfig.prefix + '-redis');
        await container.remove({ force: true });
        return { success: true, message: 'Redis container deleted successfully.' };
    } catch (error) {
        return { success: false, error: `Error deleting Redis container: ${error.message}` };
    }
};

const restartRedisContainer = async () => {
    try {
        const container = docker.getContainer(appConfig.prefix + '-redis');
        await container.restart();
        return { success: true, message: 'Redis container restarted successfully.' };
    } catch (error) {
        return { success: false, error: `Error restarting Redis container: ${error.message}` };
    }
};

export {
    startRedisContainer,
    stopRedisContainer,
    getRedisContainerStatus,
    createRedisContainer,
    deleteRedisContainer,
    restartRedisContainer
};
