import { app, shell, BrowserWindow, screen, Tray, Menu, nativeImage, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

const WIDGET_WIDTH = 320

// Panel Height Percentages (Collapsed vs Expanded)
const COLLAPSED_HEIGHT_PERCENT = 0.2 // 20% height for handler strip
const EXPANDED_HEIGHT_PERCENT = 0.7 // 70% height when expanded

function getCollapsedHeight(): number {
  const { workArea } = screen.getPrimaryDisplay()
  return Math.max(120, Math.round(workArea.height * COLLAPSED_HEIGHT_PERCENT))
}

function getExpandedHeight(): number {
  const { workArea } = screen.getPrimaryDisplay()
  return Math.max(400, Math.round(workArea.height * EXPANDED_HEIGHT_PERCENT))
}

// Calculate centered Y position for any given height
function getWidgetY(height: number): number {
  const { workArea } = screen.getPrimaryDisplay()
  return Math.round(workArea.y + (workArea.height - height) / 2)
}

function setWidgetHeight(targetHeight: number): void {
  if (!mainWindow || mainWindow.isDestroyed()) return

  const targetY = getWidgetY(targetHeight)
  const bounds = mainWindow.getBounds()

  // Update bounds with both height AND recalibrated Y center
  mainWindow.setBounds({
    x: bounds.x,
    y: targetY,
    width: bounds.width,
    height: targetHeight
  })
}

function createWindow(): void {
  const workArea = screen.getPrimaryDisplay().workArea
  const initialHeight = getCollapsedHeight()

  mainWindow = new BrowserWindow({
    width: WIDGET_WIDTH,
    height: initialHeight,
    x: workArea.x, // Anchored to far left screen boundary
    y: getWidgetY(initialHeight),
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
    focusable: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.setAlwaysOnTop(true, 'screen-saver')
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  mainWindow.setIgnoreMouseEvents(true, { forward: true })

  ipcMain.on('widget:set-ignore-mouse', (_event, ignore: boolean) => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    if (ignore) {
      mainWindow.setIgnoreMouseEvents(true, { forward: true })
    } else {
      mainWindow.setIgnoreMouseEvents(false)
    }
  })

  // Expand and collapse handlers updating height and Y position
  ipcMain.on('widget:expand', () => setWidgetHeight(getExpandedHeight()))
  ipcMain.on('widget:collapse', () => setWidgetHeight(getCollapsedHeight()))

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

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

function createTray(): void {
  const trayIcon = nativeImage.createFromPath(icon).resize({ width: 16, height: 16 })

  tray = new Tray(trayIcon.isEmpty() ? nativeImage.createEmpty() : trayIcon)
  tray.setToolTip('Winland')

  const menu = Menu.buildFromTemplate([
    {
      label: 'Toggle Widget',
      click: () => {
        if (!mainWindow) {
          createWindow()
        } else if (mainWindow.isVisible()) {
          mainWindow.hide()
        } else {
          mainWindow.show()
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => app.quit()
    }
  ])

  tray.setContextMenu(menu)
  tray.on('click', () => {
    if (!mainWindow) return
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
    }
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  createTray()
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  app.quit()
})
