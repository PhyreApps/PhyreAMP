const Docker = require('dockerode');
var docker = new Docker();

const startRedisContainer = async () => {
    try {
        const container = docker.getContainer('phyreamp-redis');
        await container.start();
        return { success: true, message: 'Redis container started successfully.' };
    } catch (error) {
        return { success: false, error: `Error starting Redis container: ${error.message}` };
    }
};

const stopRedisContainer = async () => {
    try {
        const container = docker.getContainer('phyreamp-redis');
        await container.stop();
        return { success: true, message: 'Redis container stopped successfully.' };
    } catch (error) {
        return { success: false, error: `Error stopping Redis container: ${error.message}` };
    }
};

const getRedisContainerStatus = async () => {
    try {
        const container = docker.getContainer('phyreamp-redis');
        const data = await container.inspect();
        return { success: true, message: `Redis container is ${data.State.Status}.` };
    } catch (error) {
        return { success: false, error: `Error fetching status for Redis container: ${error.message}` };
    }
};

const createRedisContainer = async () => {
    try {
        const container = docker.getContainer('phyreamp-redis');
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
                const container = await docker.createContainer({
                    Image: 'redis:latest',
                    name: 'phyreamp-redis',
                    HostConfig: {
                        NetworkMode: 'phyreamp-network',
                        PortBindings: {
                            '6379/tcp': [{ HostPort: '6379' }]
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
        const container = docker.getContainer('phyreamp-redis');
        await container.remove({ force: true });
        return { success: true, message: 'Redis container deleted successfully.' };
    } catch (error) {
        return { success: false, error: `Error deleting Redis container: ${error.message}` };
    }
};

module.exports = {
    startRedisContainer,
    stopRedisContainer,
    getRedisContainerStatus,
    createRedisContainer,
    deleteRedisContainer
};
