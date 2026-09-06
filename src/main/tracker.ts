import { activeWindow } from 'get-windows'

export interface AppUsage {
  ownerName: string
  title: string
  totalTimeMs: number
  lastSeen: number
}

class WindowTracker {
  private activeTimeMap: Map<string, AppUsage> = new Map()
  private intervalId: NodeJS.Timeout | null = null
  private pollIntervalMs = 2000
  private lastTimestamp = Date.now()

  public start(): void {
    if (this.intervalId) return

    this.lastTimestamp = Date.now()
    this.intervalId = setInterval(() => {
      void this.tick()
    }, this.pollIntervalMs)
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
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

  public getStats(): AppUsage[] {
    return Array.from(this.activeTimeMap.values())
  }

  public clearStats(): void {
    this.activeTimeMap.clear()
  }
}

export const windowTracker = new WindowTracker()
