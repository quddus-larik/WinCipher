import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  getScreenTime: () => ipcRenderer.invoke('tracker:get-screen'),
  getDailyTime: () => ipcRenderer.invoke('tracker:get-daily'),
  clearTrackerStats: () => ipcRenderer.invoke('tracker:clear-stats')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
