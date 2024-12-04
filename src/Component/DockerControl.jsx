import * as React from 'react';

const DockerControl = () => {
    const [containerName, setContainerName] = React.useState('');
    const [status, setStatus] = React.useState('');

    const handleInputChange = (e) => {
        setContainerName(e.target.value);
    };

    const isDockerRunning = async () => {
        try {
            const result = await window.electron.ipcRenderer.invoke('check-docker-process');
            return result.success;
        } catch {
            return false;
        }
    };

    const startDockerApp = async () => {
        try {
            await window.electron.ipcRenderer.invoke('start-docker-app');
            alert('Docker app started successfully.');
        } catch (error) {
            alert(`Error starting Docker app: ${error.message}`);
        }
    };

    React.useEffect(() => {
        const fetchDockerStatus = async () => {
            const result = await window.electron.ipcRenderer.invoke('status-container', 'phyrexamp-phpmyadmin');
            if (result.success) {
                setStatus(result.output);
            } else {
                setStatus(`Error fetching Docker status: ${result.error}`);
            }
        };
        fetchDockerStatus();
    }, []);
    const executeCommand = async (command) => {
        const dockerRunning = await isDockerRunning();
        alert(dockerRunning);

        if (!dockerRunning) {
            const startDocker = window.confirm('Docker is not running. Would you like to start it?');
            if (startDocker) {
                await startDockerApp();
            } else {
                return;
            }
        }
        const result = await window.electron.ipcRenderer.invoke(command, containerName);
        if (result.success) {
            alert(`${command} executed successfully!`);
            if (command === 'status-container') {
                setStatus(result.output);
            }
        } else {
            alert(`Error executing ${command}: ${result.error}`);
        }
    };

    return (
        <div>
            <input
                type="text"
                placeholder="Enter container name"
                value={containerName}
                onChange={handleInputChange}
            />
            <button onClick={() => executeCommand('start-container')}>Start</button>
            <button onClick={() => executeCommand('stop-container')}>Stop</button>
            <button onClick={() => executeCommand('restart-container')}>Restart</button>
            <button onClick={() => executeCommand('status-container')}>Status</button>
            {status && <p>Status: {status}</p>}
        </div>
    );
};

export default DockerControl;
