const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {

    getItems: () => ipcRenderer.invoke("getItems"),

    addItem: (name, type, cls, fields, parent) =>
        ipcRenderer.invoke("addItem", name, type, cls, fields, parent),

    removeItem: (id) =>
        ipcRenderer.invoke("removeItem", id),

    loanItem: (id, friend) =>
        ipcRenderer.invoke("loanItem", id, friend),

    returnItem: (id) =>
        ipcRenderer.invoke("returnItem", id),

    getConfig: () => ipcRenderer.invoke("getConfig"),

    addType: (type) =>
        ipcRenderer.invoke("addType", type),

    addClass: (name) =>
        ipcRenderer.invoke("addClass", name),

    removeClass: (name) =>
        ipcRenderer.invoke("removeClass", name)
});