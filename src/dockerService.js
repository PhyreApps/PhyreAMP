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
        return { success: true, message: `Running` };
    } catch (error) {
        return { success: false, error: `Error fetching status for container ${containerName}: ${error.message}` };
    }
};

const createNetwork = async (networkName) => {
    try {
        const network = await docker.createNetwork({
            Name: networkName,
            Driver: 'bridge'
        });
        return { success: true, message: `Network ${networkName} created successfully.` };
    } catch (error) {
        return { success: false, error: `Error creating network ${networkName}: ${error.message}` };
    }
};

const removeNetwork = async (networkName) => {
    try {
        const network = docker.getNetwork(networkName);
        await network.remove();
        return { success: true, message: `Network ${networkName} removed successfully.` };
    } catch (error) {
        return { success: false, error: `Error removing network ${networkName}: ${error.message}` };
    }
};

const getNetworkStatus = async (networkName) => {
    try {
        const network = docker.getNetwork(networkName);
        const data = await network.inspect();
        return { success: true, message: `Network ${networkName} is ${data ? 'available' : 'not available'}.` };
    } catch (error) {
        return { success: false, error: `Error fetching status for network ${networkName}: ${error.message}` };
    }
};

module.exports = {
    createNetwork,
    removeNetwork,
    getNetworkStatus,
    startContainer,
    stopContainer,
    restartContainer,
    getContainerStatus
};
