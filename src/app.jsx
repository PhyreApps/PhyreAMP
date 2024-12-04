import * as React from 'react';
import { createRoot } from 'react-dom/client';
import './Component/Tabs.css';
import VirtualHostForm from './Component/VirtualHostForm.jsx';
import VirtualHostTable from './Component/VirtualHostTable.jsx';
import DockerControl from './Component/DockerControl.jsx';

const root = createRoot(document.getElementById('app'));
const App = () => {
    const [activeTab, setActiveTab] = React.useState('form');

    return (
        <div style={{ padding: '20px' }}>
            <DockerControl />
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
                {activeTab === 'table' && <VirtualHostTable />}
            </div>
        </div>
    );
};

root.render(<App />);

