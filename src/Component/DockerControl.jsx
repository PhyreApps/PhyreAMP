import * as React from 'react';
import './DockerControl.css';

const DockerControl = () => {
    const [status, setStatus] = React.useState('');
    const [dockerRunning, setDockerRunning] = React.useState(false);


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
            setDockerRunning(true);
        } catch (error) {
            alert(`Error starting Docker app: ${error.message}`);
        }
    };

    React.useEffect(() => {
        const checkDockerRunning = async () => {
            const running = await isDockerRunning();
            setDockerRunning(running);
        };

        const fetchDockerStatus = async () => {
            await checkDockerRunning();
            const result = await window.electron.ipcRenderer.invoke('status-container', 'phyrexamp-phpmyadmin');
            if (result.success) {
                setStatus(result.message);
            } else {
                setStatus(`Error fetching Docker status: ${result.error}`);
            }

        };
        fetchDockerStatus();
    }, []);
    const executeCommand = async (command) => {
        const dockerRunning = await isDockerRunning();
        if (!dockerRunning) {
            const startDocker = window.confirm('Docker is not running. Would you like to start it?');
            if (startDocker) {
                await startDockerApp();
            } else {
                return;
            }
        }
        const result = await window.electron.ipcRenderer.invoke(command);
        if (result.success) {
            alert(result.message);
            if (command === 'status-container') {
                setStatus(result.message);
            }
        } else {
            alert(`Error executing ${command}: ${result.error}`);
        }
    };

    return (
        <div className="docker-control">
            <div className="status">
                {status && <div>Container Status: {status}</div>}

                {dockerRunning ? <>
                    <div style={
                        {
                            display: 'flex',
                            flexDirection: 'column',
                            marginTop: '10px',
                            gap: '5px',
                        }
                    }>
                        <a onClick={() => window.electron.openExternal(`http://localhost`)} target="_blank">Running on http://localhost</a>
                        <a onClick={() => window.electron.openExternal(`http://localhost:8081`)} target="_blank">Open PhpMyAdmin</a>
                    </div></> : <div>Docker is not running.</div>
                }

            </div>
            <div className="buttons">
                {!dockerRunning && <button className="button" onClick={() => executeCommand('start-container')}>Start</button>}
                {status === 'running' || dockerRunning && (
                    <>
                        <button className="button" onClick={() => executeCommand('stop-container')}>Stop</button>
                        <button className="restart-button" onClick={() => executeCommand('restart-container')}>Restart</button>
                    </>
                )}
            </div>
        </div>
    );
};

export default DockerControl;
