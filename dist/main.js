import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  shell,
  webFrame,
  //Menu,
} from "electron";
import path from "node:path";
import fs from "node:fs";

const createWindow = () => {
  // Create the browser window
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 600,
    autoHideMenuBar: true,
    // No minHeight

    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // and load the index.html of the app
  // In production, load the built index.html
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  } else {
    // In development, load from Vite dev server
    mainWindow.loadURL("http://localhost:5173"); // Assuming Vite runs on port 5173
  }
  webFrame.setZoomFactor(0.9);
  //mainWindow.webContents.openDevTools();
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    case ".bmp":
      return "image/bmp";
    case ".webp":
      return "image/webp";
    case ".mp4":
      return "video/mp4";
    case ".webm":
      return "video/webm";
    case ".ogg":
      return "video/ogg";
    case ".mov":
      return "video/quicktime";
    default:
      return "application/octet-stream";
  }
}

app.whenReady().then(() => {
  //Menu.setApplicationMenu(null);

  const dataPath = path.join(
    app.getPath("documents"),
    "RandomSelectorApp",
    "RandomSelector.json"
  );

  ipcMain.handle("dialog:openFolder", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
    if (canceled) {
      return;
    }
    return filePaths[0];
  });

  ipcMain.handle("fs:getFiles", (event, dirPath) => {
    try {
      const files = fs.readdirSync(dirPath);
      return files;
    } catch (error) {
      console.error("Error reading directory:", error);
      throw error;
    }
  });

  ipcMain.handle("fs:saveData", (event, data) => {
    try {
      fs.mkdirSync(path.dirname(dataPath), { recursive: true });
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Error saving data:", error);
      throw error;
    }
  });

  ipcMain.handle("shell:openFile", async (event, filePath) => {
    try {
      await shell.openPath(filePath);
    } catch (error) {
      console.error(`Failed to open file: ${filePath}`, error);
      throw error;
    }
  });

  ipcMain.handle("fs:loadData", () => {
    try {
      const data = fs.readFileSync(dataPath, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      if (error.code === "ENOENT") {
        return null;
      }
      console.error("Error loading data:", error);
      throw error;
    }
  });

  ipcMain.handle("path:join", (event, ...args) => {
    return path.join(...args);
  });

  ipcMain.handle("file:read", (event, filePath) => {
    try {
      const data = fs.readFileSync(filePath);
      const mimeType = getMimeType(filePath);
      return `data:${mimeType};base64,${data.toString("base64")}`;
    } catch (error) {
      console.error("Error reading file:", error);
      return null;
    }
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
