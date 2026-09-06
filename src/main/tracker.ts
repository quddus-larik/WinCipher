import { powerMonitor } from 'electron'
import { activeWindow, openWindows } from 'get-windows'

export interface AppUsage {
  ownerName: string
  title: string
  totalTimeMs: number
  lastSeen: number
}

export interface ScreenStats {
  totalScreenTimeMs: number
  lastSeen: number
  isIdle: boolean
}

const IDLE_THRESHOLD_SECONDS = 60

class WindowTracker {
  private activeTimeMap: Map<string, AppUsage> = new Map()
  private openTimeMap: Map<string, number> = new Map()
  private intervalId: NodeJS.Timeout | null = null
  private screenIntervalId: NodeJS.Timeout | null = null
  private activePollIntervalMs = 2000
  private screenPollIntervalMs = 1000
  private lastTimestamp = Date.now()
  private lastOpenPoll = Date.now()

  private totalScreenTimeMs = 0
  private lastScreenSeen = Date.now()
  private lastOpenSnapshot: Set<string> = new Set()

  public start(): void {
    if (this.intervalId || this.screenIntervalId) return

    this.lastTimestamp = Date.now()
    this.intervalId = setInterval(() => {
      void this.tick()
    }, this.activePollIntervalMs)

    this.screenIntervalId = setInterval(() => {
      this.tickScreenTime()
      void this.tickOpenApps()
    }, this.screenPollIntervalMs)
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    if (this.screenIntervalId) {
      clearInterval(this.screenIntervalId)
      this.screenIntervalId = null
    }
  }

  private async tick(): Promise<void> {
    try {
      const windowInfo = await activeWindow()
      const now = Date.now()
      const elapsed = now - this.lastTimestamp
      this.lastTimestamp = now

      if (!windowInfo) return

      const key = `${windowInfo.owner.name}:${windowInfo.title}`
      const existing = this.activeTimeMap.get(key)

      if (existing) {
        existing.totalTimeMs += elapsed
        existing.lastSeen = now
      } else {
        this.activeTimeMap.set(key, {
          ownerName: windowInfo.owner.name,
          title: windowInfo.title,
          totalTimeMs: elapsed,
          lastSeen: now
        })
      }
    } catch {
      // Ignore errors when desktop environment locks or active window cannot be fetched
    }
  }

  private tickScreenTime(): void {
    const now = Date.now()
    const elapsed = now - this.lastScreenSeen
    const idleSeconds = powerMonitor.getSystemIdleTime()

    if (idleSeconds < IDLE_THRESHOLD_SECONDS) {
      this.totalScreenTimeMs += elapsed
      this.lastScreenSeen = now
    } else {
      // Paused while idle/locked: reset the timer base so we resume cleanly
      this.lastScreenSeen = now
    }
  }

  private async tickOpenApps(): Promise<void> {
    try {
      const windows = await openWindows()
      const now = Date.now()

      const openOwners = new Set<string>()
      for (const win of windows) {
        if (win?.owner?.name) openOwners.add(win.owner.name)
      }

      const elapsed = now - this.lastOpenPoll
      this.lastOpenPoll = now

      // Accumulate time for every app still open since the last poll
      for (const ownerName of openOwners) {
        const prev = this.openTimeMap.get(ownerName) ?? 0
        this.openTimeMap.set(ownerName, prev + elapsed)
      }
      this.lastOpenSnapshot = openOwners
    } catch {
      // Ignore transient errors fetching open windows
    }
  }

  public getStats(): AppUsage[] {
    return Array.from(this.activeTimeMap.values())
  }

  public getScreenStats(): ScreenStats {
    const idleSeconds = powerMonitor.getSystemIdleTime()
    return {
      totalScreenTimeMs: this.totalScreenTimeMs,
      lastSeen: this.lastScreenSeen,
      isIdle: idleSeconds >= IDLE_THRESHOLD_SECONDS
    }
  }

  public getOpenStats(): AppUsage[] {
    return Array.from(this.openTimeMap.entries()).map(([ownerName, totalTimeMs]) => ({
      ownerName,
      title: '',
      totalTimeMs,
      lastSeen: this.lastOpenSnapshot.has(ownerName) ? Date.now() : 0
    }))
  }

  public clearStats(): void {
    this.activeTimeMap.clear()
    this.openTimeMap.clear()
    this.totalScreenTimeMs = 0
  }
}

export const windowTracker = new WindowTracker()
