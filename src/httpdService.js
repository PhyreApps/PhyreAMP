const Docker = require('dockerode');
const path = require("node:path");
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
        return { success: true, message: `HTTPD container is ${data.State.Status}.` };
    } catch (error) {
        return { success: false, error: `Error fetching status for HTTPD container: ${error.message}` };
    }
};

const createHttpdContainer = async () => {
    try {
        const container = docker.getContainer('phyreamp-httpd');
        const data = await container.inspect();
        if (data) {
            return { success: true, message: 'HTTPD container already exists.' };
        }
    } catch (error) {
        if (error.statusCode === 404) {
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
                const container = await docker.createContainer({
                    Image: 'httpd:latest',
                    name: 'phyreamp-httpd',
                    HostConfig: {
                        NetworkMode: 'phyreamp-network',
                        PortBindings: {
                            '80/tcp': [{ HostPort: '80' }]
                        },
                        Binds: [
                        //    path.resolve(__dirname, '../docker/html') + ':/var/www/html',
                      //      path.resolve(__dirname, '../docker/apache') + '/httpd.conf:/usr/local/apache2/conf/httpd.conf',
                        ]
                    }
                });
                await container.start();
                return { success: true, message: 'HTTPD container created and started successfully.' };
            } catch (createError) {
                return { success: false, error: `Error creating HTTPD container: ${createError.message}` };
            }
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

module.exports = {
    startHttpdContainer,
    stopHttpdContainer,
    restartHttpdContainer,
    getHttpdContainerStatus,
    createHttpdContainer,
    deleteHttpdContainer
};
