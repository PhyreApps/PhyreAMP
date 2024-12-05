const Docker = require('dockerode');
const path = require('path');
var docker = new Docker();

const startMySQLContainer = async () => {
    try {
        const container = docker.getContainer('phyreamp-mysql');
        await container.start();
        return { success: true, message: 'MySQL container started successfully.' };
    } catch (error) {
        return { success: false, error: `Error starting MySQL container: ${error.message}` };
    }
};

const stopMySQLContainer = async () => {
    try {
        const container = docker.getContainer('phyreamp-mysql');
        await container.stop();
        return { success: true, message: 'MySQL container stopped successfully.' };
    } catch (error) {
        return { success: false, error: `Error stopping MySQL container: ${error.message}` };
    }
};

const restartMySQLContainer = async () => {
    try {
        const container = docker.getContainer('phyreamp-mysql');
        await container.restart();
        return { success: true, message: 'MySQL container restarted successfully.' };
    } catch (error) {
        return { success: false, error: `Error restarting MySQL container: ${error.message}` };
    }
};

const getMySQLContainerStatus = async () => {
    try {
        const container = docker.getContainer('phyreamp-mysql');
        const data = await container.inspect();
        return { success: true, message: `MySQL container is ${data.State.Status}.` };
    } catch (error) {
        return { success: false, error: `Error fetching status for MySQL container: ${error.message}` };
    }
};

const createMysqlContainer = async () => {
    try {
        const container = docker.getContainer('phyreamp-mysql');
        const data = await container.inspect();
        if (data) {
            return { success: true, message: 'MySQL container already exists.' };
        }
    } catch (error) {
        if (error.statusCode === 404) {
            try {
                await docker.pull('mysql:8.0', (err, stream) => {
                    if (err) {
                        throw new Error(`Error pulling MySQL image: ${err.message}`);
                    }
                    docker.modem.followProgress(stream, onFinished, onProgress);

                    function onFinished(err, output) {
                        if (err) {
                            throw new Error(`Error pulling MySQL image: ${err.message}`);
                        }
                    }

                    function onProgress(event) {
                        console.log(event);
                    }
                });

                const container = await docker.createContainer({
                    Image: 'mysql:8.0',
                    name: 'phyreamp-mysql',
                    Env: [
                        'MYSQL_ROOT_PASSWORD=root',
                        'MYSQL_DATABASE=phyreamp',
                        'MYSQL_USER=phyreamp',
                        'MYSQL_PASSWORD=phyreamp'
                    ],
                    HostConfig: {
                        NetworkMode: 'phyreamp-network',
                        PortBindings: {
                            '3306/tcp': [{ HostPort: '3306' }]
                        },
                        Binds: [path.resolve(__dirname, '../docker/mysql-data') + ':/var/lib/mysql']
                    }
                });
                await container.start();
                return { success: true, message: 'MySQL container created and started successfully.' };
            } catch (createError) {
                return { success: false, error: `Error creating MySQL container: ${createError.message}` };
            }
        }
        return { success: false, error: `Error checking MySQL container: ${error.message}` };
    }
};

const deleteMysqlContainer = async () => {
    try {
        const container = docker.getContainer('phyreamp-mysql');
        await container.remove({ force: true });
        return { success: true, message: 'MySQL container deleted successfully.' };
    } catch (error) {
        return { success: false, error: `Error deleting MySQL container: ${error.message}` };
    }
};


module.exports = {
    startMySQLContainer,
    stopMySQLContainer,
    restartMySQLContainer,
    getMySQLContainerStatus,
    createMysqlContainer,
    deleteMysqlContainer
};
