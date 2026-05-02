const { app, BrowserWindow, shell } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const http = require('http')

let mainWindow
let apiProcess

function waitForApi(retries = 30) {
  return new Promise((resolve, reject) => {
    const check = (n) => {
      http.get('http://localhost:5184/health', (res) => {
        if (res.statusCode === 200) resolve()
        else if (n > 0) setTimeout(() => check(n - 1), 1000)
        else reject(new Error('API did not start'))
      }).on('error', () => {
        if (n > 0) setTimeout(() => check(n - 1), 1000)
        else reject(new Error('API did not start'))
      })
    }
    check(retries)
  })
}

function startApi() {
  const apiPath = path.join(__dirname, '..', 'api')
  apiProcess = spawn('dotnet', ['run'], {
    cwd: apiPath,
    env: { ...process.env },
    stdio: 'ignore'
  })
  apiProcess.on('error', (err) => console.error('API error:', err))
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#0a0d14',
    titleBarStyle: 'hiddenInset',
    title: 'SENTINEL',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false
  })

  // Load the built frontend
  mainWindow.loadFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'))

  mainWindow.once('ready-to-show', () => mainWindow.show())

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(async () => {
  startApi()
  try {
    await waitForApi()
  } catch(e) {
    console.error('API failed to start:', e)
  }
  createWindow()
})

app.on('window-all-closed', () => {
  if (apiProcess) apiProcess.kill()
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
