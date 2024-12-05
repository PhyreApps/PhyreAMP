import * as React from 'react';

const ServiceStatus = () => {
    
    const [statuses, setStatuses] = React.useState({
        httpd: '',
        mysql: '',
        redis: '',
        phpmyadmin: '',
        phpfpms: ''
    });

    React.useEffect(() => {
        const fetchContainerStatuses = async () => {
            const httpdStatus = await window.electron.ipcRenderer.invoke('status-container', 'phyreamp-httpd') || {};
            const mysqlStatus = await window.electron.ipcRenderer.invoke('status-container', 'phyreamp-mysql') || {};
            const redisStatus = await window.electron.ipcRenderer.invoke('status-container', 'phyreamp-redis') || {};
            const phpmyadminStatus = await window.electron.ipcRenderer.invoke('status-container', 'phyreamp-phpmyadmin') || {};
            const phpfpmsStatus = await window.electron.ipcRenderer.invoke('phpfpm-container-status', '8.3') || {}; // Example PHP version

            setStatuses({
                httpd: httpdStatus.message || 'Unknown',
                mysql: mysqlStatus.message || 'Unknown',
                redis: redisStatus.message || 'Unknown',
                phpmyadmin: phpmyadminStatus.message || 'Unknown',
                phpfpms: phpfpmsStatus.message || 'Unknown'
            });
        };

        fetchContainerStatuses();
    }, []);

    return (
        <div>
            <div>HTTPD Status: <span className={statuses.httpd.includes('Running') ? 'status-success' : ''}>{statuses.httpd}</span></div>
            <div>MySQL Status: <span className={statuses.mysql.includes('Running') ? 'status-success' : ''}>{statuses.mysql}</span></div>
            <div>Redis Status: <span className={statuses.redis.includes('Running') ? 'status-success' : ''}>{statuses.redis}</span></div>
            <div>phpMyAdmin Status: <span className={statuses.phpmyadmin.includes('Running') ? 'status-success' : ''}>{statuses.phpmyadmin}</span></div>
            <div>PHP-FPM Status: <span className={statuses.phpfpms.includes('Running') ? 'status-success' : ''}>{statuses.phpfpms}</span></div>
        </div>
    );
};

export default ServiceStatus;
