const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        invoke: ipcRenderer.invoke.bind(ipcRenderer),
        on: ipcRenderer.on.bind(ipcRenderer),
        send: ipcRenderer.send.bind(ipcRenderer)
    }
});
