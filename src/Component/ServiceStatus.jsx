import * as React from 'react';
import './ServiceStatus.css';

const ServiceStatus = () => {

    const [settings, setSettings] = React.useState({});
    const [statuses, setStatuses] = React.useState({
        httpd: '',
        mysql: '',
        redis: '',
        phpmyadmin: '',
        phpfpms: {}
    });

    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const result = await window.electron.ipcRenderer.invoke('get-settings');
                if (result.success) {
                    setSettings(result.settings);
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
            }
        };

        const fetchVirtualHosts = async () => {
            try {
                const hosts = await window.electron.ipcRenderer.invoke('get-virtual-hosts');
                return hosts;
            } catch (error) {
                console.error('Error fetching virtual hosts:', error);
                return [];
            }
        };

        const fetchContainerStatuses = async () => {
            let virtualHosts = await fetchVirtualHosts();
            await fetchSettings();
            const httpdStatus = await window.electron.ipcRenderer.invoke('status-container', 'phyreamp-httpd') || {};
            const mysqlStatus = await window.electron.ipcRenderer.invoke('status-container', 'phyreamp-mysql') || {};
            const redisStatus = await window.electron.ipcRenderer.invoke('status-container', 'phyreamp-redis') || {};
            const phpmyadminStatus = await window.electron.ipcRenderer.invoke('status-container', 'phyreamp-phpmyadmin') || {};
            const phpfpmsStatuses = {};
            for (const host of virtualHosts) {
                const status = await window.electron.ipcRenderer.invoke('phpfpm-container-status', host.php_version) || {};
                phpfpmsStatuses[host.php_version] = status.message || 'Unknown';
            }

            setStatuses({
                httpd: httpdStatus.message || 'Unknown',
                mysql: mysqlStatus.message || 'Unknown',
                redis: redisStatus.message || 'Unknown',
                phpmyadmin: phpmyadminStatus.message || 'Unknown',
                phpfpms: phpfpmsStatuses
            });
        };

        fetchContainerStatuses();
    }, []);

    return (
        <div className="service-status">
            <div>HTTPD Status: <span className={statuses.httpd.includes('Running') ? 'status-success' : 'status-failure'}>{statuses.httpd}</span> (Port: {settings.httpdPort || '80'})</div>
            <div>MySQL Status: <span className={statuses.mysql.includes('Running') ? 'status-success' : 'status-failure'}>{statuses.mysql}</span> (Port: {settings.mysqlPort || '3306'})</div>
            <div>Redis Status: <span className={statuses.redis.includes('Running') ? 'status-success' : 'status-failure'}>{statuses.redis}</span> (Port: {settings.redisPort || '6379'})</div>
            <div>phpMyAdmin Status: <span className={statuses.phpmyadmin.includes('Running') ? 'status-success' : 'status-failure'}>{statuses.phpmyadmin}</span> (Port: {settings.phpmyadminPort || '8081'})</div>
            {Object.entries(statuses.phpfpms).map(([version, status]) => (
                <div key={version}>PHP-FPM {version} Status: <span className={status.includes('Running') ? 'status-success' : 'status-failure'}>{status}</span></div>
            ))}
        </div>
    );
};

export default ServiceStatus;
