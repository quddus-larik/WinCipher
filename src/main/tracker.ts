import { powerMonitor, app } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync } from 'fs'

export interface ScreenStats {
  totalScreenTimeMs: number
  isIdle: boolean
}

export interface DailyScreenData {
  date: string
  totalMs: number
}

const IDLE_THRESHOLD_SECONDS = 60

let totalScreenTimeMs = 0
let lastScreenSeen = Date.now()
let currentDay = new Date().toDateString()

function getDataFile(): string {
  return join(app.getPath('userData'), 'screen-time.json')
}

class ScreenTracker {
  private intervalId: NodeJS.Timeout | null = null
  private saveIntervalId: NodeJS.Timeout | null = null
  private pollIntervalMs = 1000
  private saveIntervalMs = 5000

  public start(): void {
    this.loadFromFile()
    this.checkDayChange()

    if (this.intervalId) return

    this.intervalId = setInterval(() => {
      this.tick()
    }, this.pollIntervalMs)

    this.saveIntervalId = setInterval(() => {
      this.saveToFile()
    }, this.saveIntervalMs)
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    if (this.saveIntervalId) {
      clearInterval(this.saveIntervalId)
      this.saveIntervalId = null
    }
  }

  public saveToFile(): void {
    const data: DailyScreenData = {
      date: currentDay,
      totalMs: totalScreenTimeMs
    }
    try {
      writeFileSync(getDataFile(), JSON.stringify(data, null, 2))
    } catch {
      // Ignore write errors
    }
  }

  public getDailyData(): DailyScreenData {
    return {
      date: currentDay,
      totalMs: totalScreenTimeMs
    }
  }

  private loadFromFile(): void {
    if (!existsSync(getDataFile())) return
    try {
      const raw = readFileSync(getDataFile(), 'utf-8')
      const data: DailyScreenData = JSON.parse(raw)
      const fileDay = new Date(data.date).toDateString()
      const today = new Date().toDateString()

      if (fileDay === today) {
        totalScreenTimeMs = data.totalMs ?? 0
      } else {
        totalScreenTimeMs = 0
      }
    } catch {
      totalScreenTimeMs = 0
    }
  }

  private checkDayChange(): void {
    const today = new Date().toDateString()
    if (today !== currentDay) {
      currentDay = today
      totalScreenTimeMs = 0
    }
  }

  private tick(): void {
    this.checkDayChange()
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
    this.saveToFile()
  }
}

export const screenTracker = new ScreenTracker()
