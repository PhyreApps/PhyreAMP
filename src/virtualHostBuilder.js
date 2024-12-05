import fs from 'fs';
import path from 'path';
import { getVirtualHosts } from './database';
import { app } from 'electron';

const generateHttpdConf = async () => {

    // Read default HTTPD configuration file
    const defaultConfigPath = path.join(app.getAppPath(), 'docker/apache/httpd.conf');
    console.log('defaultConfigPath:', defaultConfigPath);

    const defaultConfig = fs.readFileSync(defaultConfigPath, 'utf8');

    // Write default configuration to new file
    const newConfigPath = path.join(__dirname, 'httpd.conf');
    fs.writeFileSync(newConfigPath, defaultConfig);
    console.log('httpd.conf file generated successfully.');

    try {
        const virtualHosts = await getVirtualHosts();
        let configContent = '';

        virtualHosts.forEach(host => {
            configContent += `
<VirtualHost *:80>
    ServerName ${host.local_domain}
    DocumentRoot "${host.document_root}"
    <Directory "${host.document_root}">
        AllowOverride All
        Require all granted
    </Directory>
    ErrorLog "logs/${host.name}-error.log"
    CustomLog "logs/${host.name}-access.log" common
</VirtualHost>
`;
        });

        const configPath = path.join(__dirname, 'virtualhosts.conf');

        console.log('configPath:', configPath);

        fs.writeFileSync(configPath, configContent);
        console.log('virtualhosts.conf file generated successfully.');
    } catch (error) {
        console.error('Error generating virtualhosts.conf:', error);
    }
};

export { generateHttpdConf };
