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

    const [formData, setFormData] = React.useState(() => ({
        name: props.host ? props.host.name : '',
        php_version: props.host ? props.host.php_version : '',
        local_domain: props.host ? props.host.local_domain : '',
        project_path: props.host ? props.host.project_path : '',
        public_folder: props.host ? props.host.public_folder : ''
    }));

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
                project_path: result.filePaths[0]
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

        if (!formData.project_path) {
            setIsLoading(false);
            alert('Please select a project path.');
            return;
        }

        const existingHosts = await ipcRenderer.invoke('get-virtual-hosts');
        const domainExists = existingHosts.some(host => host.local_domain === formData.local_domain && host.id !== (props.host ? props.host.id : null));

        if (domainExists) {
            setIsLoading(false);
            alert('The local domain already exists. Please choose a different domain.');
            return;
        }
        const result = props.host
            ? await ipcRenderer.invoke('update-virtual-host', { ...formData, id: props.host.id })
            : await ipcRenderer.invoke('save-virtual-host', formData);
        if (result.success) {
            await window.electron.ipcRenderer.invoke('window-reload');
            alert(`Virtual host ${props.host ? 'updated' : 'saved'} successfully!`);
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
                        {props.host ? 'Editing virtual host...' : 'Creating virtual host...'}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>

                        <div>
                            <label>
                                Name:
                                <input type="text" name="name" value={formData.name} onChange={handleChange} required
                                       placeholder="Enter name"/>
                            </label>
                        </div>
                        <div>
                            <label>
                                Project Path:
                            </label>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <input type="text" name="project_path" value={formData.project_path}
                                       onChange={handleChange} required placeholder="Select project path"/>
                                <button type="button"
                                        style={{
                                            width: '220px',
                                        }}
                                        className="button" onClick={handleFolderSelect}>Select Folder
                                </button>
                            </div>
                        </div>
                        <div>
                            <label>
                                Public Folder:
                                <input type="text" name="public_folder" value={formData.public_folder}
                                       onChange={handleChange} required placeholder="Enter public folder"/>
                            </label>
                        </div>
                        <div>
                            <label>
                                PHP Version:
                                <select name="php_version" value={formData.php_version} onChange={handleChange}
                                        required>
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
                                <input type="text" name="local_domain" value={formData.local_domain}
                                       onChange={handleChange} required placeholder="Enter local domain"/>
                            </label>
                        </div>
                        <button type="submit" className="button">
                            {props.host ? 'Update Virtual Host' : 'Create Virtual Host'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default VirtualHostForm;
