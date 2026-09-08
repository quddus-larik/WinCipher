import { app, shell, BrowserWindow, screen, Tray, Menu, nativeImage, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, is } from '@electron-toolkit/utils'
import { screenTracker } from './tracker'
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

ipcMain.handle('tracker:get-screen', () => {
  return screenTracker.getScreenStats()
})

ipcMain.handle('tracker:get-daily', () => {
  return screenTracker.getDailyData()
})

ipcMain.handle('tracker:clear-stats', () => {
  screenTracker.clearStats()
  return true
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
  screenTracker.start()
  createTray()
  createWindow()

  mainWindow?.on('close', () => {
    screenTracker.saveToFile()
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  screenTracker.saveToFile()
  app.quit()
})
