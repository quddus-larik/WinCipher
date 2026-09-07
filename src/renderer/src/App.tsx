import React, { useState, useEffect, useRef } from 'react'
import { motion, Reorder } from 'motion/react'

interface ItemData {
  id: string
  type: 'screen-time' | 'hi' | 'temp'
  isDragging: boolean
}

function App(): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const alwaysOpen: boolean = true

  const [items, setItems] = useState<ItemData[]>([
    { id: 'item-1', type: 'screen-time', isDragging: true },
    { id: 'item-2', type: 'hi', isDragging: false },
    { id: 'item-3', type: 'temp', isDragging: false }
  ])

  // Mock streak activity levels (0: none, 1: low, 2: mid, 3: high)
  const mockArr = [
    0, 1, 3, 2, 0, 1, 2, 3, 3, 1, 0, 2, 3, 1, 0, 2, 2, 3, 1, 0, 0, 1, 3, 3, 2, 1, 2, 3, 0, 1, 2
  ]

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mainContainerRef = useRef<HTMLDivElement | null>(null)
  const isDraggingRef = useRef(false)
  const [screenTime, setScreenTime] = useState('00:00')

  const isPanelVisible = alwaysOpen || isOpen

  useEffect(() => {
    const fetchScreenTime = async (): Promise<void> => {
      try {
        const stats = await window.api.getScreenTime()
        const totalSec = Math.floor((stats?.totalScreenTimeMs ?? 0) / 1000)
        const hh = Math.floor(totalSec / 3600)
        const mm = Math.floor((totalSec % 3600) / 60)
        const ss = totalSec % 60
        if (hh > 0) {
          setScreenTime(`${hh}h ${String(mm).padStart(2, '0')}m`)
        } else {
          setScreenTime(`${mm}m ${String(ss).padStart(2, '0')}s`)
        }
      } catch {
        // ignore
      }
    }

    const logOpenStats = async (): Promise<void> => {
      try {
        const openStats = await window.api.getOpenStats()
        window.electron.ipcRenderer.send('renderer:log', 'Open apps screen time:', openStats)
      } catch {
        // ignore
      }
    }

    fetchScreenTime()
    logOpenStats()
    const interval = setInterval(() => {
      fetchScreenTime()
      logOpenStats()
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent): void => {
      if (isDraggingRef.current) return

      const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null

      const isOverInteractive =
        target !== null &&
        target !== containerRef.current &&
        (target.closest('[data-handler]') !== null || target.closest('[data-panel]') !== null)

      window.electron.ipcRenderer.send('widget:set-ignore-mouse', !isOverInteractive)
    }

    window.addEventListener('mousemove', handleGlobalMouseMove)
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove)
  }, [])

  const collapseWidget = (): void => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setIsOpen(false)
  }

  const resetTimer = (): void => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(collapseWidget, 3000)
  }

  const handleMouseEnter = (): void => {
    setIsOpen(true)
    window.electron.ipcRenderer.send('widget:expand')
    resetTimer()
  }

  const handlePanelMouseMove = (): void => {
    if (isOpen && !isDraggingRef.current) {
      resetTimer()
    }
  }

  const handlePanelMouseLeave = (): void => {
    if (!isDraggingRef.current) {
      resetTimer()
    }
  }

  const handleDragStart = (): void => {
    isDraggingRef.current = true
    if (timerRef.current) clearTimeout(timerRef.current)
    window.electron.ipcRenderer.send('widget:set-ignore-mouse', false)
  }

  const handleDrag = (_: unknown, info: { point: { x: number; y: number } }): void => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const { x, y } = info.point

    const isOutOfBoundsX = x < rect.left || x > rect.right
    const isOutOfBoundsY = y < rect.top || y > rect.bottom

    if (isOutOfBoundsX || isOutOfBoundsY) {
      isDraggingRef.current = false
      collapseWidget()
    }
  }

  const handleDragEnd = (): void => {
    isDraggingRef.current = false
    if (isOpen) resetTimer()
  }

  const handleAnimationComplete = (): void => {
    if (!isOpen && !alwaysOpen) {
      window.electron.ipcRenderer.send('widget:collapse')
    }
  }

  const handleReorder = (newItems: ItemData[]): void => {
    const fixedIndex = newItems.findIndex((item) => item.type === 'screen-time')
    if (fixedIndex !== 0) {
      const fixedItem = newItems.splice(fixedIndex, 1)[0]
      newItems.unshift(fixedItem)
    }
    setItems(newItems)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full items-center relative overflow-hidden pointer-events-none"
    >
      {!isPanelVisible && (
        <button
          data-handler
          onMouseEnter={handleMouseEnter}
          className="absolute left-0.5 top-1/2 -translate-y-1/2 w-1 h-16 bg-slate-400 hover:bg-slate-600 transition-colors rounded-xl pointer-events-auto"
          style={{ marginLeft: '1px' }}
        />
      )}

      <motion.div
        data-panel
        ref={mainContainerRef}
        initial={{ x: '-100%', opacity: 0 }}
        animate={{
          x: isPanelVisible ? 0 : '-100%',
          opacity: isPanelVisible ? 1 : 0
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        onAnimationComplete={handleAnimationComplete}
        onMouseMove={handlePanelMouseMove}
        onMouseLeave={handlePanelMouseLeave}
        className="flex items-center bg-accent/75 border-2 border-accent/70 w-fit h-fit z-10 rounded-2xl shadow-xl overflow-hidden pointer-events-auto p-1"
        style={{ marginLeft: '5px' }}
      >
        <Reorder.Group
          as="div"
          axis="y"
          values={items}
          onReorder={handleReorder}
          className="flex flex-col items-center gap-1 list-none pl-[0.4px]"
        >
          {items.map((item) => (
            <Reorder.Item
              key={item.id}
              value={item}
              as="li"
              drag={item.type !== 'screen-time'}
              dragConstraints={mainContainerRef}
              dragElastic={0.1}
              whileDrag={{ zIndex: 30 }}
              onDragStart={handleDragStart}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="w-full flex flex-col text-background items-center justify-center p-0 transition-colors font-semibold select-none touch-none cursor-grab active:cursor-grabbing"
            >
              {item.type === 'screen-time' && (
                <div className="flex flex-col items-center *:text-xs px-1 py-0.5 rounded-lg w-full">
                  <span>{screenTime}</span>
                </div>
              )}
              {item.type === 'hi' && (
                <div className="grid grid-cols-8 gap-1 p-1 rounded-xl bg-gray-400 shadow-lg place-items-center w-full">
                  {mockArr.map((level, idx) => {
                    const intensityClass =
                      level === 3
                        ? 'bg-accent opacity-100 shadow-[0_0_6px_rgba(var(--accent-rgb),0.8)] scale-110'
                        : 'bg-background'

                    return (
                      <div
                        key={idx}
                        className={`size-1 rounded-full transition-all duration-300 ${intensityClass}`}
                      />
                    )
                  })}
                </div>
              )}
              {item.type === 'temp' && (
                <div className="flex flex-col p-1 rounded-xl bg-gray-400 shadow-lg w-full max-w-[80px] overflow-hidden">
                  <p className="text-xs">Today</p>
                  <div className="relative flex w-full overflow-hidden rounded-lg bg-red-400 px-1 py-0.5 ">
                    <div className="flex shrink-0 min-w-full whitespace-nowrap gap-4">
                      <span className="text-tiny text-accent">Go to School early today</span>
                    </div>
                  </div>
                </div>
              )}
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </motion.div>
    </div>
  )
}

export default App
