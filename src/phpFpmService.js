const Docker = require('dockerode');
const path = require('path');
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

                const container = await docker.createContainer({
                    Image: `php:${phpVersion}-fpm`,
                    name: `phyreamp-php${phpVersion.replace('.', '')}-fpm`,
                    HostConfig: {
                        NetworkMode: 'phyreamp-network',
                        Binds: [
                            path.resolve(__dirname, '../docker/html') + ':/var/www/html'
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
        return { success: true, message: `Running` };
    } catch (error) {
        return { success: false, error: `Error fetching status for PHP-FPM container for PHP ${phpVersion}: ${error.message}` };
    }
};
export {
    createPhpFpmContainer,
    deletePhpFpmContainer,
    getPhpFpmContainerStatus
};
