import * as React from 'react';
import './VirtualHostTable.css';
import PHPIcon from "../Icons/PHPIcon.jsx";
import VirtualHostForm from "./VirtualHostForm.jsx";

const columnOptions = [
    { key: 'application', label: 'Application' },
    { key: 'document_root', label: 'Document Root' },
    { key: 'php_version', label: 'PHP Version' },
    { key: 'local_domain', label: 'Local Domain' },
    { key: 'actions', label: 'Actions' }
];

const VirtualHostTable = () => {
    const [visibleColumns, setVisibleColumns] = React.useState(columnOptions.map(col => col.key).filter(key => key !== 'document_root' && key !== 'name'));
    const [virtualHosts, setVirtualHosts] = React.useState([]);

    const [searchQuery, setSearchQuery] = React.useState('');
    const [dropdownOpen, setDropdownOpen] = React.useState(false);

    const dropdownRef = React.useRef(null);

    const fetchVirtualHosts = async () => {
        const hosts = await window.electron.ipcRenderer.invoke('get-virtual-hosts');
        setVirtualHosts(hosts);
    };

    React.useEffect(() => {
        fetchVirtualHosts();
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    const filteredHosts = virtualHosts.filter(host => {
        const regex = new RegExp(searchQuery.split(' ').map(term => `(?=.*${term})`).join(''), 'i');
        return regex.test(`${host.name} ${host.document_root} ${host.php_version} ${host.local_domain}`);
    });
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

    const [isModalOpen, setIsModalOpen] = React.useState(false);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    return (
        <div className="virtual-host-table-wrapper">
            <div>
                <button  className="button" onClick={openModal}>
                    Create Virtual Host
                </button>
                {isModalOpen && <VirtualHostForm onClose={closeModal} />}
            </div>
            <div className="search-and-columns">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                />
                <div className="dropdown" ref={dropdownRef}>
                <button onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="dropdown-button outlined"
                        style={{ width: '150px' }}
                >
                    Show Columns
                </button>
                {dropdownOpen && (
                    <div className="dropdown-content">
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
                )}
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        {visibleColumns.includes('application') && <th>Application</th>}
                        {visibleColumns.includes('document_root') && <th>Document Root</th>}
                        {visibleColumns.includes('php_version') && <th>PHP Version</th>}
                        {visibleColumns.includes('local_domain') && <th>Local Domain</th>}
                        {visibleColumns.includes('actions') && <th>Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {filteredHosts.map((host) => (
                        <tr key={host.id}>
                            {visibleColumns.includes('application') && <td><PHPIcon /></td>}
                            {visibleColumns.includes('document_root') && <td>{host.document_root}</td>}
                            {visibleColumns.includes('php_version') && <td> {host.php_version} </td>}
                            {visibleColumns.includes('local_domain') && (
                                <td>
                                    <a href="#" onClick={() => window.electron.openExternal(`http://${host.local_domain}`)}>
                                        {host.local_domain}
                                    </a>
                                </td>
                            )}
                            {visibleColumns.includes('actions') && (
                                <td>
                                    <div style={{
                                        width: '25px',
                                        display: 'flex',
                                        gap: '10px'
                                    }}>
                                    <button className="edit-button" onClick={() => handleEdit(host.id)}>
                                        Edit
                                    </button>
                                    <button className="delete-button" onClick={() => handleRemove(host.id)}>
                                        Delete
                                    </button>
                                    </div>
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
