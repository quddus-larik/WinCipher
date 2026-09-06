import React, { useState, useEffect, useRef } from 'react'
import { motion, Reorder } from 'motion/react'

function App(): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const [items, setItems] = useState([1])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mainContainerRef = useRef<HTMLDivElement | null>(null)
  const isDraggingRef = useRef(false)

  useEffect(() => {
    const logActiveWindow = async (): Promise<void> => {
      try {
        const activeWindow = await window.api.getActiveWindow()
        const stats = await window.api.getTrackerStats()
        window.electron.ipcRenderer.send('renderer:log', 'Active window:', activeWindow)
        window.electron.ipcRenderer.send('renderer:log', 'Tracker stats:', stats)
      } catch (err) {
        window.electron.ipcRenderer.send('renderer:log', 'Failed to fetch active window data:', err)
      }
    }

    logActiveWindow()
    const interval = setInterval(logActiveWindow, 3000)
    return () => clearInterval(interval)
  }, [])

  // Global cursor hit-testing: ignore mouse when hovering transparent areas
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent): void => {
      if (isDraggingRef.current) return

      const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null

      // Check if cursor is directly over the trigger bar or the panel
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
    if (!isOpen) {
      window.electron.ipcRenderer.send('widget:collapse')
    }
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
      {/* Trigger handle bar */}
      <button
        data-handler
        onMouseEnter={handleMouseEnter}
        className="absolute left-0.5 top-1/2 -translate-y-1/2 w-1 h-16 bg-slate-400 hover:bg-slate-600 transition-colors rounded-xl pointer-events-auto"
      />

      {/* Expanded panel container */}
      <motion.div
        data-panel
        ref={mainContainerRef}
        initial={{ x: '-100%', opacity: 0 }}
        animate={{
          x: isOpen ? 0 : '-100%',
          opacity: isOpen ? 1 : 0
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        onAnimationComplete={handleAnimationComplete}
        onMouseMove={handlePanelMouseMove}
        onMouseLeave={handlePanelMouseLeave}
        className="w-18 h-fit z-10 rounded-2xl bg-slate-100 border-r border-y border-slate-300 shadow-xl shadow-slate-900/10 overflow-hidden pointer-events-auto"
        style={{
          padding: '6px'
        }}
      >
        <Reorder.Group
          as="div"
          axis="y"
          values={items}
          onReorder={setItems}
          className="flex flex-col items-center gap-2 m-0 p-0 list-none relative"
        >
          {items.map((value) => (
            <Reorder.Item
              key={value}
              value={value}
              as="li"
              dragConstraints={mainContainerRef}
              dragElastic={0.1}
              whileDrag={{ scale: 1.05, zIndex: 30 }}
              onDragStart={handleDragStart}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="w-full min-h-12 flex flex-col bg-white hover:bg-slate-50 border border-slate-200 shadow-sm rounded-xl transition-colors duration-200 text-slate-800 font-semibold select-none touch-none"
            >
              <div className={"flex flex-col items-center *:text-4xl"}>

              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </motion.div>
    </div>
  )
}

export default App
