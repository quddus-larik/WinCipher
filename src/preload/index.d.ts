import { ElectronAPI } from '@electron-toolkit/preload'
import { AppUsage } from '../main/tracker'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getActiveWindow: () => Promise<unknown>
      getTrackerStats: () => Promise<AppUsage[]>
      clearTrackerStats: () => Promise<boolean>
    }
  }
}

export {}
