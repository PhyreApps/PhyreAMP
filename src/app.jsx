import './app.css';
import './Component/Tabs.css';

import * as React from 'react';
import { createRoot } from 'react-dom/client';
import VirtualHostTable from './Component/VirtualHostTable.jsx';
import DockerControl from './Component/DockerControl.jsx';
import PhyreAMPLogo from './Icons/PhyreAMPLogo.jsx';
import Settings from "./Component/Settings.jsx";
import ServiceStatus from "./Component/ServiceStatus.jsx";

const root = createRoot(document.getElementById('app'));
const App = () => {
    const [activeTab, setActiveTab] = React.useState('table');

    return (
        <div style={{padding: '20px'}}>
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '30px',
            }}>
                <PhyreAMPLogo/>
            </div>

            <div>
                <DockerControl/>
            </div>

            <div className="tabs">
                <button onClick={() => setActiveTab('table')} className={activeTab === 'table' ? 'active' : 'inactive'}>
                    Virtual Hosts
                </button>
                <button onClick={() => setActiveTab('services')} className={activeTab === 'services' ? 'active' : 'inactive'}>
                    Service Statuses
                </button>
                <button onClick={() => setActiveTab('settings')}
                        className={activeTab === 'settings' ? 'active' : 'inactive'}>
                    Settings
                </button>

            </div>
            <div className="tab-content">
                {activeTab === 'table' && <VirtualHostTable/>}
                {activeTab === 'services' && <ServiceStatus/>}
                {activeTab === 'settings' && <Settings/>}
            </div>
        </div>
    );
};

root.render(<App/>);

