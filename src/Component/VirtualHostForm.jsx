import * as React from 'react';
const { ipcRenderer } = window.electron;

const VirtualHostForm = () => {
    const [formData, setFormData] = React.useState({
        name: '',
        document_root: '',
        php_version: '',
        local_domain: ''
    });

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
        console.log('Form submitted:', formData);
        // Here you would typically handle the form submission, e.g., send data to a server
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
                    <input type="text" name="php_version" value={formData.php_version} onChange={handleChange} required />
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
