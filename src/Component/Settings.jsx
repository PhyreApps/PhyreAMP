import * as React from 'react';

const phpVersions = ['php7.3', 'php7.4', 'php8.1', 'php8.2', 'php8.3'];

const Settings = () => {
    const [settings, setSettings] = React.useState({
        redisPort: '6379',
        mysqlPort: '3306',
        httpdPort: '80',
        allowedPhpVersions: phpVersions.reduce((acc, version) => ({ ...acc, [version]: true }), {})
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prevSettings => ({
            ...prevSettings,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    return (
        <form>
            <div>
                <label>
                    Redis Port:
                    <input type="text" name="redisPort" value={settings.redisPort} onChange={handleChange} />
                </label>
            </div>
            <div>
                <label>
                    MySQL Port:
                    <input type="text" name="mysqlPort" value={settings.mysqlPort} onChange={handleChange} />
                </label>
            </div>
            <div>
                <label>
                    HTTPD Port:
                    <input type="text" name="httpdPort" value={settings.httpdPort} onChange={handleChange} />
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
        </form>
    );
};

export default Settings;
