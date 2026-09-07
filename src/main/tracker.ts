import { powerMonitor } from 'electron'

export interface ScreenStats {
  totalScreenTimeMs: number
  isIdle: boolean
}

const IDLE_THRESHOLD_SECONDS = 60

let totalScreenTimeMs = 8 * 60 * 60 * 1000
let lastScreenSeen = Date.now()

class ScreenTracker {
  private intervalId: NodeJS.Timeout | null = null
  private pollIntervalMs = 1000

  public start(): void {
    if (this.intervalId) return

    this.intervalId = setInterval(() => {
      this.tick()
    }, this.pollIntervalMs)
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private tick(): void {
    const now = Date.now()
    const elapsed = now - lastScreenSeen
    const idleSeconds = powerMonitor.getSystemIdleTime()

    if (idleSeconds < IDLE_THRESHOLD_SECONDS) {
      totalScreenTimeMs += elapsed
      lastScreenSeen = now
    } else {
      lastScreenSeen = now
    }
  }

  public getScreenStats(): ScreenStats {
    const idleSeconds = powerMonitor.getSystemIdleTime()
    return {
      totalScreenTimeMs,
      isIdle: idleSeconds >= IDLE_THRESHOLD_SECONDS
    }
  }

  public clearStats(): void {
    totalScreenTimeMs = 0
  }
}

export const screenTracker = new ScreenTracker()
