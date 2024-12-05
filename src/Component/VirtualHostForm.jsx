import * as React from 'react';
import './VirtualHostForm.css';
import './Modal.css';
const { ipcRenderer } = window.electron;

const VirtualHostForm = (props) => {
    const phpVersions = {
        '7.3': 'PHP 7.3',
        '7.4': 'PHP 7.4',
        '8.1': 'PHP 8.1',
        '8.2': 'PHP 8.2',
        '8.3': 'PHP 8.3'
    };

    const [formData, setFormData] = React.useState({
        name: '',
        document_root: '',
        php_version: '',
        local_domain: ''
    });

    const [isLoading, setIsLoading] = React.useState(false);

    const validateDomain = (domain) => {
        const domainPattern = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,6}$/;
        return domainPattern.test(domain);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleFolderSelect = async () => {
        const result = await ipcRenderer.invoke('select-folder');
        if (!result.canceled) {
            setFormData({
                ...formData,
                document_root: result.filePaths[0]
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        if (!validateDomain(formData.local_domain)) {
            setIsLoading(false);
            alert('Please enter a valid domain format.');
            return;
        }
        const result = await ipcRenderer.invoke('save-virtual-host', formData);
        if (result.success) {
            await window.electron.ipcRenderer.invoke('window-reload');
            alert('Virtual host saved successfully!');
        } else {
            alert(`Error saving virtual host: ${result.error}`);
            setIsLoading(false);
        }
    };

    const modalRef = React.useRef(null);

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                props.onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [props]);

    return (
        <div className="modal">
            <div className="modal-content" ref={modalRef}>
                <span className="close" onClick={props.onClose}>&times;</span>
                {isLoading ? (
                    <div style={{ color: 'white' }}>
                        Creating virtual host...
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div>
                            <label>
                                Name:
                                <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Enter name" />
                            </label>
                        </div>
                        <div>
                            <label>
                                Document Root:
                                <input type="text" name="document_root" value={formData.document_root} onChange={handleChange} required placeholder="Select document root" />
                                <button type="button" className="button" onClick={handleFolderSelect}>Select Folder</button>
                            </label>
                        </div>
                        <div>
                            <label>
                                PHP Version:
                                <select name="php_version" value={formData.php_version} onChange={handleChange} required>
                                    <option value="">Select PHP Version</option>
                                    {Object.entries(phpVersions).map(([key, value]) => (
                                        <option key={key} value={key}>{value}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        <div>
                            <label>
                                Local Domain:
                                <input type="text" name="local_domain" value={formData.local_domain} onChange={handleChange} required placeholder="Enter local domain" />
                            </label>
                        </div>
                        <button type="submit" className="button">Create Virtual Host</button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default VirtualHostForm;
