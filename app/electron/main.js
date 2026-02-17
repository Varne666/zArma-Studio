const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const net = require('net');

let mainWindow;
let backendProcess;
let ollamaCheckInterval;

// Check if port is in use
const checkPort = (port) => new Promise((resolve) => {
  const tester = net.createServer()
    .once('error', () => resolve(false))
    .once('listening', () => {
      tester.close();
      resolve(true);
    })
    .listen(port);
});

// Find Ollama binary
const findOllama = () => {
  const { execSync } = require('child_process');
  try {
    // Try to find ollama in PATH
    const result = execSync('which ollama', { encoding: 'utf8' });
    return result.trim();
  } catch (e) {
    // Common locations
    const commonPaths = [
      '/usr/local/bin/ollama',
      '/usr/bin/ollama',
      path.join(require('os').homedir(), '.local/bin/ollama'),
      'C:\\Program Files\\Ollama\\ollama.exe',
      path.join(require('os').homedir(), 'AppData\\Local\\Programs\\Ollama\\ollama.exe')
    ];
    return commonPaths.find(p => fs.existsSync(p)) || null;
  }
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../public/icon.png'),
    show: false,
    titleBarStyle: 'default'
  });

  // Load the built app
  const indexPath = path.join(__dirname, '../dist/index.html');
  
  if (fs.existsSync(indexPath)) {
    mainWindow.loadFile(indexPath);
  } else {
    mainWindow.loadURL('http://localhost:3000');
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    checkOllamaStatus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (backendProcess) {
      backendProcess.kill();
    }
  });
};

const checkOllamaStatus = () => {
  const ollamaPath = findOllama();
  if (!ollamaPath) {
    dialog.showWarningDialog(mainWindow, {
      type: 'warning',
      title: 'Ollama Not Found',
      message: 'Ollama is not installed or not in PATH.',
      detail: 'Please install Ollama from https://ollama.com first, then restart the app.',
      buttons: ['OK', 'Open Ollama Website']
    }).then(result => {
      if (result.response === 1) {
        require('electron').shell.openExternal('https://ollama.com');
      }
    });
  } else {
    // Check if Ollama is running
    const checkServer = () => {
      const http = require('http');
      const req = http.get('http://localhost:11434/api/tags', (res) => {
        if (res.statusCode === 200) {
          console.log('Ollama is running');
          clearInterval(ollamaCheckInterval);
        }
      }).on('error', () => {
        // Try to start Ollama
        try {
          spawn(ollamaPath, ['serve'], { detached: true, stdio: 'ignore' });
        } catch (e) {
          console.log('Could not auto-start Ollama');
        }
      });
      req.setTimeout(2000);
    };
    
    checkServer();
    ollamaCheckInterval = setInterval(checkServer, 5000);
  }
};

const startBackend = async () => {
  const isDev = !app.isPackaged;
  const backendPath = isDev 
    ? path.join(__dirname, '../backend/server.js')
    : path.join(process.resourcesPath, 'backend/server.js');
  
  // Check if backend port is free
  const portFree = await checkPort(3001);
  if (!portFree) {
    console.log('Backend already running on port 3001');
    return;
  }

  if (fs.existsSync(backendPath)) {
    console.log('Starting backend...');
    backendProcess = spawn('node', [backendPath], {
      stdio: 'pipe',
      env: { ...process.env, PORT: '3001' }
    });
    
    backendProcess.stdout.on('data', (data) => {
      console.log(`Backend: ${data}`);
    });
    
    backendProcess.stderr.on('data', (data) => {
      console.error(`Backend Error: ${data}`);
    });
  } else {
    console.error('Backend not found at:', backendPath);
  }
};

app.whenReady().then(async () => {
  await startBackend();
  createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});
