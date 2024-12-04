const Docker = require('dockerode');
const docker = new Docker();

const startContainer = async (containerName) => {
    try {
        const container = docker.getContainer(containerName);
        await container.start();
        return `Container ${containerName} started successfully.`;
    } catch (error) {
        throw new Error(`Error starting container ${containerName}: ${error.message}`);
    }
};

const stopContainer = async (containerName) => {
    try {
        const container = docker.getContainer(containerName);
        await container.stop();
        return `Container ${containerName} stopped successfully.`;
    } catch (error) {
        throw new Error(`Error stopping container ${containerName}: ${error.message}`);
    }
};

const restartContainer = async (containerName) => {
    try {
        const container = docker.getContainer(containerName);
        await container.restart();
        return `Container ${containerName} restarted successfully.`;
    } catch (error) {
        throw new Error(`Error restarting container ${containerName}: ${error.message}`);
    }
};

const getContainerStatus = async (containerName) => {
    try {
        const container = docker.getContainer(containerName);
        const data = await container.inspect();
        return `Container ${containerName} is ${data.State.Status}.`;
    } catch (error) {
        throw new Error(`Error getting status of container ${containerName}: ${error.message}`);
    }
};

module.exports = {
    startContainer,
    stopContainer,
    restartContainer,
    getContainerStatus
};
