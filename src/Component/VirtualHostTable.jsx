import * as React from 'react';
import './VirtualHostTable.css';
const columnOptions = [
    { key: 'name', label: 'Name' },
    { key: 'document_root', label: 'Document Root' },
    { key: 'php_version', label: 'PHP Version' },
    { key: 'local_domain', label: 'Local Domain' },
    { key: 'actions', label: 'Actions' }
];

const VirtualHostTable = () => {
    const [visibleColumns, setVisibleColumns] = React.useState(columnOptions.map(col => col.key));
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
    const toggleColumnVisibility = (key) => {
        setVisibleColumns(prev =>
            prev.includes(key) ? prev.filter(col => col !== key) : [...prev, key]
        );
    };

    return (
        <div>
            <div>
                {columnOptions.map(option => (
                    <label key={option.key}>
                        <input
                            type="checkbox"
                            checked={visibleColumns.includes(option.key)}
                            onChange={() => toggleColumnVisibility(option.key)}
                        />
                        {option.label}
                    </label>
                ))}
            </div>
        <table>
            <thead>
                <tr>
                    {visibleColumns.includes('name') && <th>Name</th>}
                    {visibleColumns.includes('document_root') && <th>Document Root</th>}
                    {visibleColumns.includes('php_version') && <th>PHP Version</th>}
                    {visibleColumns.includes('local_domain') && <th>Local Domain</th>}
                    {visibleColumns.includes('actions') && <th>Actions</th>}
                </tr>
            </thead>
            <tbody>
                {virtualHosts.map((host) => (
                    <tr key={host.id}>
                        {visibleColumns.includes('name') && <td>{host.name}</td>}
                        {visibleColumns.includes('document_root') && <td>{host.document_root}</td>}
                        {visibleColumns.includes('php_version') && <td>{host.php_version}</td>}
                        {visibleColumns.includes('local_domain') && (
                            <td>
                                <a href="#" onClick={() => window.electron.openExternal(`http://${host.local_domain}`)}>
                                    {host.local_domain}
                                </a>
                            </td>
                        )}
                        {visibleColumns.includes('actions') && (
                            <td>
                                <button onClick={() => handleRemove(host.id)}>Remove</button>
                            </td>
                        )}
                    </tr>
                ))}
            </tbody>
        </table>
        </div>
    );
};

export default VirtualHostTable;
