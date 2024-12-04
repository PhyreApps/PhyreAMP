import * as React from 'react';

const DockerControl = () => {
    const [containerName, setContainerName] = React.useState('');
    const [status, setStatus] = React.useState('');

    const handleInputChange = (e) => {
        setContainerName(e.target.value);
    };

    const executeCommand = async (command) => {
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
