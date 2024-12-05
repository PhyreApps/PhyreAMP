import * as React from 'react';
import './DockerControl.css';

const DockerControl = () => {
    const [status, setStatus] = React.useState('Not running');
    const [httpdPort, setHttpdPort] = React.useState('80');
    const [isStopping, setIsStopping] = React.useState(false);
    const [isRestarting, setIsRestarting] = React.useState(false);
    const [isStarting, setIsStarting] = React.useState(false);
    const [dockerRunning, setDockerRunning] = React.useState(false);


    const isDockerRunning = async () => {
        try {
            const result = await window.electron.ipcRenderer.invoke('check-docker-process');
            return result.success;
        } catch {
            return false;
        }
    };

    const startApp = async () => {
        setIsStarting(true);

        await fetchSettings();

        await window.electron.ipcRenderer.invoke('start-docker-app');
        await window.electron.ipcRenderer.invoke('start-all-containers');
        setIsStarting(false);

        await fetchAllContainersStatuses();
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

    const fetchAllContainersStatuses = async () => {
        const result = await window.electron.ipcRenderer.invoke('all-containers-status');
        if (result && result.success) {
            setStatus(result.status);
        } else {
            setStatus(`Error fetching Docker status: ${result.error}`);
        }
    };

    return (
        <div className="docker-control">
            <div className="status">


                {status === 'Running' ? <div>

                        <div style={
                            {
                                display: 'flex',
                                flexDirection: 'column',
                                marginTop: '10px',
                                gap: '5px',
                            }
                        }>
                            <a onClick={() => window.electron.openExternal(`http://localhost${httpdPort === '8000' ? '' : `:${httpdPort}`}`)}
                               target="_blank">Running on http://localhost{httpdPort === '8000' ? '' : `:${httpdPort}`}</a>
                            <a onClick={() => window.electron.openExternal(`http://localhost:8081`)} target="_blank">Open
                                PhpMyAdmin</a>

                        </div>
                    </div>
                    : <div>{status}</div>

                }

            </div>
            <div className="buttons">

                {status === 'Not running' && (
                    <button className="button start-button" onClick={async()=> {
                        await startApp();
                    }}>
                        {isStarting ? 'Starting...' : 'Start'}
                    </button>
                )}

                {status === 'Running' && (
                    <>
                        <button className={`button stop-button ${isStopping ? 'stopping' : ''}`}
                                onClick={() => {

                                }}>
                            {isStopping ? 'Stopping...' : 'Stop'}
                        </button>
                        <button className="restart-button" onClick={() => {

                        }}>
                            {isRestarting ? 'Restarting...' : 'Restart'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default DockerControl;
