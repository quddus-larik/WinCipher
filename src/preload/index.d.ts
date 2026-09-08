declare global {
  interface Window {
    electron: import('@electron-toolkit/preload').ElectronAPI
    api: {
      getScreenTime: () => Promise<{ totalScreenTimeMs: number; isIdle: boolean }>
      getDailyTime: () => Promise<{ date: string; totalMs: number }>
      clearTrackerStats: () => Promise<boolean>
    }
  }
}

export {}
