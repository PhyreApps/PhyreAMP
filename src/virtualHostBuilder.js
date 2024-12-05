import fs from 'fs';
import path from 'path';
import { getVirtualHosts } from './database';
import { app } from 'electron';
import { addVirtualHostsToHostsFile, removeVirtualHostsFromHostsFile } from './osHostService';

const dockerApachePath =
    process.env.NODE_ENV === 'development'
        ? path.join(__dirname, '../../docker/apache')
        : path.join(process.resourcesPath, 'apache');

const generateHttpdConf = async () => {

    const virtualHosts = await getVirtualHosts();

    // Remove existing virtual hosts from the hosts file
    await removeVirtualHostsFromHostsFile();

    // Add new virtual hosts to the hosts file
    await addVirtualHostsToHostsFile(virtualHosts);

    // Apache working directory
    const userDataPath = app.getPath('userData');
    const apacheDataPath = path.join(userDataPath, 'apache');
    if (!fs.existsSync(apacheDataPath)) {
        fs.mkdirSync(apacheDataPath, { recursive: true });
    }

    // Read default HTTPD configuration file
    const defaultConfigPath = path.join(dockerApachePath, 'httpd.conf');
    console.log('defaultConfigPath:', defaultConfigPath);

    const defaultConfig = fs.readFileSync(defaultConfigPath, 'utf8');

    // Write default configuration to new file
    const newConfigPath = path.join(apacheDataPath, 'httpd.conf');
    fs.writeFileSync(newConfigPath, defaultConfig);
    console.log('httpd.conf file generated successfully.');


    try {
        let configContent = '';

        virtualHosts.forEach(host => {

            let publicFolder = host.public_folder;
            if (publicFolder === '/') {
                publicFolder = '';
            }

            configContent += `
<VirtualHost *:80>
    ServerName ${host.local_domain}
    DocumentRoot "/var/www/html/${host.local_domain}/${publicFolder}"
    <Directory "/var/www/html/${host.local_domain}/${publicFolder}">
    
        <FilesMatch ".+\\.ph(ar|p|tml)$"> 
            SetHandler "proxy:fcgi://phyreamp-php${host.php_version.replace('.', '')}-fpm:9000"
        </FilesMatch>
    
        AllowOverride All
        Require all granted
    </Directory> 
</VirtualHost>
`;
        });

        const configPath = path.join(apacheDataPath, 'virtualhosts.conf');

        console.log('configPath:', configPath);

        fs.writeFileSync(configPath, configContent);
        console.log('virtualhosts.conf file generated successfully.');
    } catch (error) {
        console.error('Error generating virtualhosts.conf:', error);
    }
};

export { generateHttpdConf };
