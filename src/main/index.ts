import { app, shell, BrowserWindow, screen, Tray, Menu, nativeImage, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, is } from '@electron-toolkit/utils'
import { activeWindow } from 'get-windows'
import { windowTracker } from './tracker'
import icon from '../../resources/icon.png?asset'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

const WIDGET_HEIGHT = 120

function getExpandedWidth(): number {
  const { workArea } = screen.getPrimaryDisplay()
  return Math.max(400, Math.round(workArea.width * 0.7))
}

function getWidgetX(width: number): number {
  const { workArea } = screen.getPrimaryDisplay()
  return Math.round(workArea.x + (workArea.width - width) / 2)
}

function createWindow(): void {
  const workArea = screen.getPrimaryDisplay().workArea
  const fixedWidth = getExpandedWidth()

  mainWindow = new BrowserWindow({
    width: fixedWidth,
    height: WIDGET_HEIGHT,
    x: getWidgetX(fixedWidth),
    y: workArea.y,
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
    focusable: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.setAlwaysOnTop(true, 'screen-saver')
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

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

ipcMain.on('widget:set-ignore-mouse', (_event, ignore: boolean) => {
  if (!mainWindow || mainWindow.isDestroyed()) return
  mainWindow.setIgnoreMouseEvents(ignore, { forward: true })
})

ipcMain.handle('get-active-window', async () => {
  return await activeWindow()
})

ipcMain.handle('tracker:get-stats', () => {
  return windowTracker.getStats()
})

ipcMain.handle('tracker:clear-stats', () => {
  windowTracker.clearStats()
  return true
})

ipcMain.handle('tracker:get-screen', () => {
  return windowTracker.getScreenStats()
})

ipcMain.handle('tracker:get-open-stats', () => {
  return windowTracker.getOpenStats()
})

ipcMain.on('renderer:log', (_event, ...args: unknown[]) => {
  console.log('[renderer]', ...args)
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
  windowTracker.start()
  createTray()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('will-quit', () => {
  windowTracker.stop()
})

app.on('window-all-closed', () => app.quit())
