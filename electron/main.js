const { app, BrowserWindow, shell } = require('electron')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#0a0d14',
    title: 'SENTINEL',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false
  })

  mainWindow.loadURL('https://sentinel-two-beta.vercel.app')
  mainWindow.once('ready-to-show', () => mainWindow.show())
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(() => createWindow())

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
