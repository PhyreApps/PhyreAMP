const appConfig = {
    'name': 'PhyreAMP',
    'prefix': 'phyreamp',
    'dockerHubRepo': 'selfworks/phyreamp', // pyovchevski/artavolo[-php${phpVersion}], selfworks/phyreamp[-php${phpVersion}]
    'defaultApp': {
        'name': 'PhyreAMP',
        'host': 'localhost.local',
        'phpVersion': '8.3',
        'folder': 'htdocs'
    }
};

export {
    appConfig
}