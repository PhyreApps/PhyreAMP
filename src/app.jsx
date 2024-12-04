import * as React from 'react';
import { createRoot } from 'react-dom/client';
import VirtualHostForm from './Component/VirtualHostForm.jsx';
import VirtualHostTable from './Component/VirtualHostTable.jsx';
import DockerControl from './Component/DockerControl.jsx';

const root = createRoot(document.getElementById('app'));
root.render(
    <>
        <VirtualHostForm />
        <VirtualHostTable />
        <DockerControl />
    </>
);

