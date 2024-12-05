import './app.css';
import './Component/Tabs.css';

import * as React from 'react';
import { createRoot } from 'react-dom/client';
import VirtualHostForm from './Component/VirtualHostForm.jsx';
import VirtualHostTable from './Component/VirtualHostTable.jsx';
import DockerControl from './Component/DockerControl.jsx';
import PhyreAMPLogo from './Icons/PhyreAMPLogo.jsx';

const root = createRoot(document.getElementById('app'));
const App = () => {
    const [activeTab, setActiveTab] = React.useState('table');

    return (
        <div style={{padding: '20px'}}>
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '20px',
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
                <button onClick={() => setActiveTab('form')} className={activeTab === 'form' ? 'active' : 'inactive'}>
                    Create Virtual Host
                </button>
            </div>
            <div className="tab-content">
                {activeTab === 'form' && <VirtualHostForm/>}
                {activeTab === 'table' && <VirtualHostTable/>}
            </div>
        </div>
    );
};

root.render(<App/>);

