const { app, BrowserWindow, shell } = require('electron')
const path = require('path')
const http = require('http')

let mainWindow

function waitForApi(retries = 10) {
  return new Promise((resolve, reject) => {
    const check = (n) => {
      http.get('https://sentinel-production-b4c7.up.railway.app/health', (res) => {
        if (res.statusCode === 200) resolve()
        else if (n > 0) setTimeout(() => check(n - 1), 1000)
        else reject(new Error('API unreachable'))
      }).on('error', () => {
        if (n > 0) setTimeout(() => check(n - 1), 1000)
        else reject(new Error('API unreachable'))
      })
    }
    check(retries)
  })
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
      webSecurity: false
    },
    show: false
  })

  mainWindow.loadFile(path.join(__dirname, 'frontend-dist', 'index.html'))
  mainWindow.once('ready-to-show', () => mainWindow.show())
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(async () => {
  try { await waitForApi() } catch(e) { console.error('API unreachable:', e) }
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
