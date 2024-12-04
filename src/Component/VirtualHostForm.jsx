import * as React from 'react';
const { ipcRenderer } = window.electron;

const VirtualHostForm = () => {
    const phpVersions = ['php7.3', 'php7.4', 'php8.1', 'php8.2', 'php8.3'];

    const [formData, setFormData] = React.useState({
        name: '',
        document_root: '',
        php_version: '',
        local_domain: ''
    });

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

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateDomain(formData.local_domain)) {
            alert('Please enter a valid domain format.');
            return;
        }
        console.log('Form submitted:', formData);
        alert('Form submitted! Check the console for the form data.');
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label>
                    Name:
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                </label>
            </div>
            <div>
                <label>
                    Document Root:
                    <input type="text" name="document_root" value={formData.document_root} readOnly required />
                    <button type="button" onClick={handleFolderSelect}>Select Folder</button>
                </label>
            </div>
            <div>
                <label>
                    PHP Version:
                    <select name="php_version" value={formData.php_version} onChange={handleChange} required>
                        <option value="">Select PHP Version</option>
                        {phpVersions.map(version => (
                            <option key={version} value={version}>{version.toUpperCase()}</option>
                        ))}
                    </select>
                </label>
            </div>
            <div>
                <label>
                    Local Domain:
                    <input type="text" name="local_domain" value={formData.local_domain} onChange={handleChange} required />
                </label>
            </div>
            <button type="submit">Create Virtual Host</button>
        </form>
    );
};

export default VirtualHostForm;
