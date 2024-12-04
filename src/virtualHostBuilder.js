import fs from 'fs';
import path from 'path';
import { getVirtualHosts } from './database';

const generateHttpdConf = async () => {
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

        const configPath = path.join(__dirname, 'httpd.conf');
        fs.writeFileSync(configPath, configContent);
        console.log('httpd.conf file generated successfully.');
    } catch (error) {
        console.error('Error generating httpd.conf:', error);
    }
};

export { generateHttpdConf };
