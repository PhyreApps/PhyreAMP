import * as React from 'react';
import { createRoot } from 'react-dom/client';
import Button from './Component/Button.jsx';

const root = createRoot(document.getElementById('app'));
root.render(
    <>
        <h1>Hello, Electron!</h1>
        <p>I hope you enjoy using basic-electron-react-boilerplate to start your dev off right!</p>
        <Button onClick={() => alert('Button clicked!')}>Click me!</Button>
    </>
);

