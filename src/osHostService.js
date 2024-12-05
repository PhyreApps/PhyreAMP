import fs from 'fs';
import os from 'os';

const HOSTS_FILE_PATH = process.platform === 'win32'
    ? 'C:\\Windows\\System32\\drivers\\etc\\hosts'
    : '/etc/hosts';
const START_MARKER = '# Start PhyreAMP Virtual Hosts';
const END_MARKER = '# End PhyreAMP Virtual Hosts';

const readHostsFile = () => {
    try {
        return fs.readFileSync(HOSTS_FILE_PATH, 'utf8');
    } catch (error) {
        console.error(`Error reading hosts file: ${error.message}`);
        throw new Error('Permission denied. Please run the application with elevated privileges.');
    }
};

const writeHostsFile = (content) => {
    try {
        fs.writeFileSync(HOSTS_FILE_PATH, content, 'utf8');
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

const addVirtualHostsToHostsFile = (virtualHosts) => {
    const hosts = readHostsFile().split(os.EOL);
    const existingEntries = extractVirtualHostEntries(hosts);

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

    writeHostsFile(updatedHosts.join(os.EOL));
};

const removeVirtualHostsFromHostsFile = () => {
    const hosts = readHostsFile().split(os.EOL);
    const startIndex = hosts.indexOf(START_MARKER);
    const endIndex = hosts.indexOf(END_MARKER);

    if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
        const updatedHosts = [
            ...hosts.slice(0, startIndex),
            ...hosts.slice(endIndex + 1)
        ];
        writeHostsFile(updatedHosts.join(os.EOL));
    }
};

export {
    addVirtualHostsToHostsFile,
    removeVirtualHostsFromHostsFile
};
