import fs from 'fs';
import path from 'path';
import { getVirtualHosts } from './database';
import { app } from 'electron';
import { addVirtualHostsToHostsFile, removeVirtualHostsFromHostsFile } from './osHostService';

const dockerApachePath =
    process.env.NODE_ENV === 'development'
        ? path.join(__dirname, '../../docker/apache')
        : path.join(process.resourcesPath, 'apache');

const dockerPHPPath =
    process.env.NODE_ENV === 'development'
        ? path.join(__dirname, '../../docker/php')
        : path.join(process.resourcesPath, 'php');

const generateHttpdConf = async () => {

    const virtualHosts = await getVirtualHosts();

    // Remove existing virtual hosts from the hosts file
    await removeVirtualHostsFromHostsFile();

    // Add new virtual hosts to the hosts file
    await addVirtualHostsToHostsFile(virtualHosts);

    const userDataPath = app.getPath('userData');


    // Apache working directory
    const apacheDataPath = path.join(userDataPath, 'apache');
    if (!fs.existsSync(apacheDataPath)) {
        fs.mkdirSync(apacheDataPath, { recursive: true });
    }

    // Read default HTTPD configuration file
    const defaultConfigPath = path.join(dockerApachePath, 'httpd.conf');
    // console.log('defaultConfigPath:', defaultConfigPath);

    const defaultConfigContent = fs.readFileSync(defaultConfigPath, 'utf8');

    // Write default configuration to new file
    const newApacheConfigPath = path.join(apacheDataPath, 'httpd.conf');
    fs.writeFileSync(newApacheConfigPath, defaultConfigContent);
    // console.log('httpd.conf file generated successfully.');
    // console.log('newApacheConfigPath:', newApacheConfigPath);


    // php fpm
    const phpDataPath = path.join(userDataPath, 'php');
    if (!fs.existsSync(phpDataPath)) {
        fs.mkdirSync(phpDataPath, { recursive: true });
    }

    // this is from source
    const defaultPHPConfigPath = path.join(dockerPHPPath, 'php.ini');
    // console.log('defaultPHPConfigPath:', defaultPHPConfigPath);

    const defaultPHPConfigContent = fs.readFileSync(defaultPHPConfigPath, 'utf8');

    // this is to container
    const newPHPConfigPath = path.join(phpDataPath, 'php.ini');
    fs.writeFileSync(newPHPConfigPath, defaultPHPConfigContent);
    // console.log('php.ini file generated successfully.');
    // console.log('newPHPConfigPath:', newPHPConfigPath);


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
    
        Options Indexes FollowSymLinks MultiViews
        AllowOverride All
        Order allow,deny
        allow from all
        Require all granted

        <FilesMatch ".+\\.ph(ar|p|tml)$"> 
            SetHandler "proxy:fcgi://phyreamp-php${host.php_version.replace('.', '')}-fpm:9000"
        </FilesMatch>
    
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
