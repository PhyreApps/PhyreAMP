import * as React from 'react';
import './DockerControl.css';

const DockerControl = () => {
    const [status, setStatus] = React.useState('');
    const [httpdPort, setHttpdPort] = React.useState('80');
    const [isStopping, setIsStopping] = React.useState(false);
    const [isRestarting, setIsRestarting] = React.useState(false);
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

        const fetchSettings = async () => {
            try {
                const result = await window.electron.ipcRenderer.invoke('get-settings');
                if (result.success && result.settings) {
                    setHttpdPort(result.settings.httpdPort || '80');
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
            }
        };


        const fetchDockerStatus = async () => {

            await fetchSettings();
            await checkDockerRunning();

            const result = await window.electron.ipcRenderer.invoke('all-containers-status');
            if (result && result.success) {
                setStatus(result.status);
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
        try {
            let result;
            if (command === 'stop-all-containers') {
                setIsStopping(true);
                result = await window.electron.ipcRenderer.invoke(command);
                setIsStopping(false);
            } else if (command === 'restart-all-containers') {
                setIsRestarting(true);
                result = await window.electron.ipcRenderer.invoke(command);
                setIsRestarting(false);
            } else {
                result = await window.electron.ipcRenderer.invoke(command);
            }
            if (result && result.success) {
                alert(result.message);
                if (command === 'all-containers-status') {
                    setStatus(result.message);
                }
            } else {
                alert(`Error executing ${command}: ${result.error}`);
            }
        } catch (error) {
            alert(`Error executing ${command}: ${error.message}`);
        }
    };

    return (
        <div className="docker-control">
            <div className="status">

                {dockerRunning ? <>
                    <div style={
                        {
                            display: 'flex',
                            flexDirection: 'column',
                            marginTop: '10px',
                            gap: '5px',
                        }
                    }>
                        <a onClick={() => window.electron.openExternal(`http://localhost${httpdPort === '8000' ? '' : `:${httpdPort}`}`)} target="_blank">Running on http://localhost{httpdPort === '8000' ? '' : `:${httpdPort}`}</a>
                        <a onClick={() => window.electron.openExternal(`http://localhost:8081`)} target="_blank">Open PhpMyAdmin</a>
                    </div></> : <div>Docker is not running.</div>
                }

            </div>
            <div className="buttons">
                {!dockerRunning && !isStopping && !isRestarting && (
                    <button className="button" onClick={() => executeCommand('start-all-containers')}>
                        {isStopping ? 'Stopping...' : isRestarting ? 'Restarting...' : 'Start'}
                    </button>
                )}
                {status === 'running' || (dockerRunning) && (
                    <>
                        <button className={`button stop-button ${isStopping ? 'stopping' : ''}`} onClick={() => executeCommand('stop-all-containers')}>
                            {isStopping ? 'Stopping...' : 'Stop'}
                        </button>
                        <button className="restart-button" onClick={() => executeCommand('restart-all-containers')}>
                            {isRestarting ? 'Restarting...' : 'Restart'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default DockerControl;
