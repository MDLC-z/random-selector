const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  openFolder: () => ipcRenderer.invoke("dialog:openFolder"),
  getFiles: (path) => ipcRenderer.invoke("fs:getFiles", path),
  saveData: (data) => ipcRenderer.invoke("fs:saveData", data),
  loadData: () => ipcRenderer.invoke("fs:loadData"),
  openFile: (filePath) => ipcRenderer.invoke("shell:openFile", filePath),
  joinPath: (...paths) => ipcRenderer.invoke("path:join", ...paths),
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),
});