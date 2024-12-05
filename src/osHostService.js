import fs from 'fs';
import os from 'os';
import path from 'path';
import sudo from 'sudo-prompt';

const SUDO_OPTIONS = {
    name: 'PhyreAMP',
};

const HOSTS_FILE_PATH = process.platform === 'win32'
    ? 'C:\\Windows\\System32\\drivers\\etc\\hosts'
    : '/etc/hosts';
const START_MARKER = '# Start PhyreAMP Virtual Hosts';
const END_MARKER = '# End PhyreAMP Virtual Hosts';

const readHostsFile = async() => {
    try {
        return new Promise(async (resolve, reject) => {
            await sudo.exec(`cat ${HOSTS_FILE_PATH}`, SUDO_OPTIONS, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error reading hosts file: ${stderr}`);
                    reject(new Error('Permission denied. Please run the application with elevated privileges.'));
                } else {
                    resolve(stdout);
                }
            });
        });
    } catch (error) {
        console.error(`Error reading hosts file: ${error.message}`);
        throw new Error('Permission denied. Please run the application with elevated privileges.');
    }
};

const writeHostsFile = async(content) => {
    try {
        return new Promise((resolve, reject) => {
            const tempFilePath = path.join(os.tmpdir(), 'hosts.tmp');
            fs.writeFileSync(tempFilePath, content, 'utf8');

            const command = `mv ${tempFilePath} ${HOSTS_FILE_PATH}`;
            sudo.exec(command, SUDO_OPTIONS, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error writing to hosts file: ${stderr}`);
                    reject(new Error('Permission denied. Please run the application with elevated privileges.'));
                } else {
                    resolve();
                }
            });
        });
    } catch (error) {
        console.error(`Error writing to hosts file: ${error.message}`);
        throw new Error('Permission denied. Please run the application with elevated privileges.');
    }
};

const extractVirtualHostEntries = (hosts) => {
    const startIndex = hosts.indexOf(START_MARKER);
    const endIndex = hosts.indexOf(END_MARKER);
    if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
        return hosts.slice(startIndex + 1, endIndex);
    }
    return [];
};

const addVirtualHostsToHostsFile = async (virtualHosts) => {

    const hostFileContent = await readHostsFile();
    const hosts = hostFileContent.split(os.EOL);

    const newEntries = virtualHosts.map(host => `127.0.0.1 ${host.local_domain}`);
    const startIndex = hosts.indexOf(START_MARKER);
    const endIndex = hosts.indexOf(END_MARKER);

    let updatedHosts;
    if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
        updatedHosts = [
            ...hosts.slice(0, startIndex + 1),
            ...newEntries,
            ...hosts.slice(endIndex)
        ];
    } else {
        updatedHosts = [
            ...hosts,
            START_MARKER,
            ...newEntries,
            END_MARKER
        ];
    }

    await writeHostsFile(updatedHosts.join(os.EOL));
};

const removeVirtualHostsFromHostsFile = async() => {

    const hostFileContent = await readHostsFile();
    const hosts = hostFileContent.split(os.EOL);

    const startIndex = hosts.indexOf(START_MARKER);
    const endIndex = hosts.indexOf(END_MARKER);

    if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
        const updatedHosts = [
            ...hosts.slice(0, startIndex),
            ...hosts.slice(endIndex + 1)
        ];
        await writeHostsFile(updatedHosts.join(os.EOL));
    }
};

export {
    addVirtualHostsToHostsFile,
    removeVirtualHostsFromHostsFile
};
