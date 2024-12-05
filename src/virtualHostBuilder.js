import fs from 'fs';
import path from 'path';
import { getVirtualHosts } from './database';
import { app } from 'electron';
import { addVirtualHostsToHostsFile, removeVirtualHostsFromHostsFile } from './osHostService';

const generateHttpdConf = async () => {

    // Apache working directory
    const apacheDir = path.join(__dirname, 'apache');
    if (!fs.existsSync(apacheDir)) {
        fs.mkdirSync(apacheDir);
    }

    // Read default HTTPD configuration file
    const defaultConfigPath = path.join(app.getAppPath(), 'docker/apache/httpd.conf');
    console.log('defaultConfigPath:', defaultConfigPath);

    const defaultConfig = fs.readFileSync(defaultConfigPath, 'utf8');

    // Write default configuration to new file
    const newConfigPath = path.join(__dirname, 'apache/httpd.conf');
    fs.writeFileSync(newConfigPath, defaultConfig);
    console.log('httpd.conf file generated successfully.');


    try {
        const virtualHosts = await getVirtualHosts();
        let configContent = '';

        // Remove existing virtual hosts from the hosts file
        removeVirtualHostsFromHostsFile();

        // Add new virtual hosts to the hosts file
        addVirtualHostsToHostsFile(virtualHosts);

        virtualHosts.forEach(host => {
            configContent += `
<VirtualHost *:80>
    ServerName ${host.local_domain}
    DocumentRoot "/var/www/html/${host.local_domain}/"
    <Directory "/var/www/html/${host.local_domain}/">
    
        <FilesMatch ".+\\.ph(ar|p|tml)$">
            SetHandler "proxy:fcgi://phyreamp-php${host.php_version.replace('.', '')}-fpm:9000"
        </FilesMatch>
    
        AllowOverride All
        Require all granted
    </Directory> 
</VirtualHost>
`;
        });

        const configPath = path.join(__dirname, 'apache/virtualhosts.conf');

        console.log('configPath:', configPath);

        fs.writeFileSync(configPath, configContent);
        console.log('virtualhosts.conf file generated successfully.');
    } catch (error) {
        console.error('Error generating virtualhosts.conf:', error);
    }
};

export { generateHttpdConf };
