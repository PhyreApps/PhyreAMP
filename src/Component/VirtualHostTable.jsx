import * as React from 'react';
import './VirtualHostTable.css';
const VirtualHostTable = () => {
    const [virtualHosts, setVirtualHosts] = React.useState([]);

    const fetchVirtualHosts = async () => {
        const hosts = await window.electron.ipcRenderer.invoke('get-virtual-hosts');
        setVirtualHosts(hosts);
    };

    React.useEffect(() => {
        fetchVirtualHosts();
    }, []);
    const handleRemove = async (id) => {
        const confirmDelete = window.confirm("Are you sure you want to remove this virtual host?");
        if (confirmDelete) {
            const result = await window.electron.ipcRenderer.invoke('remove-virtual-host', id);
            if (result.success) {
                setVirtualHosts(virtualHosts.filter(host => host.id !== id));
            } else {
                alert(`Error removing virtual host: ${result.error}`);
            }
        }
    };
    return (
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Document Root</th>
                    <th>PHP Version</th>
                    <th>Local Domain</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {virtualHosts.map((host) => (
                    <tr key={host.id}>
                        <td>{host.name}</td>
                        <td>{host.document_root}</td>
                        <td>{host.php_version}</td>
                        <td>
                            <button onClick={() => window.electron.openExternal(`http://${host.local_domain}`)}>
                                {host.local_domain}
                            </button>
                        </td>
                        <td>
                            <button onClick={() => handleRemove(host.id)}>Remove</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default VirtualHostTable;
