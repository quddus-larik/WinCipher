import { app, shell, BrowserWindow, screen, Tray, Menu, nativeImage, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

const WIDGET_WIDTH = 110 // Fixed width for panel + shadow padding

function getExpandedHeight(): number {
  const { workArea } = screen.getPrimaryDisplay()
  return Math.max(400, Math.round(workArea.height * 0.7))
}

function getWidgetY(height: number): number {
  const { workArea } = screen.getPrimaryDisplay()
  return Math.round(workArea.y + (workArea.height - height) / 2)
}

function createWindow(): void {
  const workArea = screen.getPrimaryDisplay().workArea
  const fixedHeight = getExpandedHeight()

  mainWindow = new BrowserWindow({
    width: WIDGET_WIDTH,
    height: fixedHeight,
    x: workArea.x,
    y: getWidgetY(fixedHeight),
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    fullscreenable: false,
    maximizable: false,
    minimizable: false,
    hasShadow: false,
    focusable: false, // Prevents window from stealing focus from external apps
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // Ensure window stays pinned above all background applications
  mainWindow.setAlwaysOnTop(true, 'screen-saver')
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  // Initialize mouse click-through with forward: true
  mainWindow.setIgnoreMouseEvents(true, { forward: true })

  mainWindow.on('ready-to-show', () => mainWindow?.show())
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Single IPC event handler registered once globally
ipcMain.on('widget:set-ignore-mouse', (_event, ignore: boolean) => {
  if (!mainWindow || mainWindow.isDestroyed()) return
  mainWindow.setIgnoreMouseEvents(ignore, { forward: true })
})

function createTray(): void {
  const trayIcon = nativeImage.createFromPath(icon).resize({ width: 16, height: 16 })
  tray = new Tray(trayIcon.isEmpty() ? nativeImage.createEmpty() : trayIcon)
  tray.setToolTip('Winland')

  const menu = Menu.buildFromTemplate([
    {
      label: 'Toggle Widget',
      click: () => {
        if (!mainWindow) createWindow()
        else if (mainWindow.isVisible()) mainWindow.hide()
        else mainWindow.show()
      }
    },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ])

  tray.setContextMenu(menu)
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')
  createTray()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => app.quit())
