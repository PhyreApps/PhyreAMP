const Docker = require('dockerode');
var docker = new Docker();

const startContainer = async (containerName) => {
    try {
        const container = docker.getContainer(containerName);
        await container.start();
        return { success: true, message: `Container ${containerName} started successfully.` };
    } catch (error) {
        return { success: false, error: `Error starting container ${containerName}: ${error.message}` };
    }
};

const stopContainer = async (containerName) => {
    try {
        const container = docker.getContainer(containerName);
        await container.stop();
        return { success: true, message: `Container ${containerName} stopped successfully.` };
    } catch (error) {
        return { success: false, error: `Error stopping container ${containerName}: ${error.message}` };
    }
};

const restartContainer = async (containerName) => {
    try {
        const container = docker.getContainer(containerName);
        await container.restart();
        return { success: true, message: `Container ${containerName} restarted successfully.` };
    } catch (error) {
        return { success: false, error: `Error restarting container ${containerName}: ${error.message}` };
    }
};

const getContainerStatus = async (containerName) => {
    try {
        const container = docker.getContainer(containerName);
        const data = await container.inspect();
        return { success: true, message: `Container ${containerName} is ${data.State.Status}.` };
    } catch (error) {
        return { success: false, error: `Error fetching status for container ${containerName}: ${error.message}` };
    }
};

module.exports = {
    startContainer,
    stopContainer,
    restartContainer,
    getContainerStatus
};
