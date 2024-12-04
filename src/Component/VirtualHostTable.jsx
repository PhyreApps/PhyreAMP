import * as React from 'react';

const VirtualHostTable = () => {
    const [virtualHosts, setVirtualHosts] = React.useState([]);

    const fetchVirtualHosts = async () => {
        const hosts = await window.electron.ipcRenderer.invoke('get-virtual-hosts');
        setVirtualHosts(hosts);
    };

    React.useEffect(() => {
        fetchVirtualHosts();
    }, []);
    return (
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Document Root</th>
                    <th>PHP Version</th>
                    <th>Local Domain</th>
                </tr>
            </thead>
            <tbody>
                {virtualHosts.map((host) => (
                    <tr key={host.id}>
                        <td>{host.name}</td>
                        <td>{host.document_root}</td>
                        <td>{host.php_version}</td>
                        <td>{host.local_domain}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default VirtualHostTable;
