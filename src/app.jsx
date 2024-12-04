import * as React from 'react';
import { createRoot } from 'react-dom/client';

const root = createRoot(document.getElementById('app'));
root.render(
    <>
        <h1>Hello, Electron!</h1>
        <p>I hope you enjoy using basic-electron-react-boilerplate to start your dev off right!</p>
        <div>
            <button>Click me!</button>
        </div>
    </>
);

