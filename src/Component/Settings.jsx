import * as React from 'react';

const phpVersions = ['php7.3', 'php7.4', 'php8.1', 'php8.2', 'php8.3'];

const Settings = () => {
    const [settings, setSettings] = React.useState(null);

    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const result = await window.electron.ipcRenderer.invoke('get-settings');
                if (result.success && result.settings) {
                    setSettings(result.settings);
                } else {
                    setSettings({
                        redisPort: '6379',
                        mysqlPort: '3306',
                        httpdPort: '80',
                        mysqlRootPassword: '',
                        allowedPhpVersions: phpVersions.reduce((acc, version) => ({...acc, [version]: true}), {}),
                    });
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
            }
        };

        fetchSettings();
    }, []);

    const handleChange = (e) => {
        const {name, value, type, checked} = e.target;
        if (phpVersions.includes(name)) {
            setSettings(prevSettings => ({
                ...prevSettings,
                allowedPhpVersions: {
                    ...prevSettings.allowedPhpVersions,
                    [name]: checked
                }
            }));
        } else {
            setSettings(prevSettings => ({
                ...prevSettings,
                [name]: type === 'checkbox' ? checked : value
            }));
            setIsSaving(false);
        }
    };
    const [isSaving, setIsSaving] = React.useState(false);

    const [isResetting, setIsResetting] = React.useState(false);

    const resetToDefault = async () => {
        setIsResetting(true);
        try {
            let defaultSettings = {
                redisPort: '6379',
                mysqlPort: '3306',
                httpdPort: '80',
                allowedPhpVersions: phpVersions.reduce((acc, version) => ({...acc, [version]: true}), {})
            };
            setSettings(defaultSettings);
            await saveSettings(defaultSettings);

        } catch (error) {
            console.error('Error resetting to default:', error);
            setIsResetting(false);
        }
    };

    const saveSettings = async (settings) => {
        setIsSaving(true);
        try {
            const result = await window.electron.ipcRenderer.invoke('save-settings', settings);
            if (result.success) {
                await window.electron.ipcRenderer.invoke('rebuild-containers').then(async (result) => {
                    if (result.success) {
                        await window.electron.ipcRenderer.invoke('window-reload');
                    } else {
                        alert(`Error rebuilding containers: ${result.error}`);
                    }
                    setIsSaving(false);
                });
            }
        } catch (error) {
            alert(`Error saving settings: ${error.message}`);
        }
    }

    const handleSave = async () => {
        await saveSettings(settings);
    };

    if (!settings) {
        return <div>Loading settings...</div>;
    }

    return (
        <form>
            <div>
                <label>
                    Redis Port:
                    <input type="text" name="redisPort" value={settings.redisPort} onChange={handleChange}/>
                </label>
            </div>
            <div>
                <label>
                    MySQL Port:
                    <input type="text" name="mysqlPort" value={settings.mysqlPort} onChange={handleChange}/>
                </label>
            </div>
            <div>
                <label>
                    MySQL Root Password:
                    <input type="text" name="mysqlRootPassword" value={settings.mysqlRootPassword}
                           onChange={handleChange}/>
                </label>
            </div>
            <div>
                <label>
                    HTTPD Port:
                    <input type="text" name="httpdPort" value={settings.httpdPort} onChange={handleChange}/>
                </label>
            </div>
            <div>
                <label>Allowed PHP Versions:</label>
                {phpVersions.map(version => (
                    <div key={version}>
                        <label>
                            <input
                                type="checkbox"
                                name={version}
                                checked={settings.allowedPhpVersions[version]}
                                onChange={handleChange}
                            />
                            {version.toUpperCase()}
                        </label>
                    </div>
                ))}
            </div>
            <button type="button" onClick={handleSave} className="button" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
            {!isResetting && (
                <button type="button" onClick={resetToDefault} className="button" style={{marginLeft: '10px'}}>
                    Reset to Default
                </button>
            )}
        </form>
    );
}
;

export default Settings;
