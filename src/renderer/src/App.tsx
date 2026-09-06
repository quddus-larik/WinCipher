import React, { useState, useEffect, useRef } from 'react'
import { motion, Reorder } from 'motion/react'

function App(): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const [items, setItems] = useState([1, 2, 3, 4, 5])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const isDraggingRef = useRef(false)

  useEffect(() => {
    window.electron.ipcRenderer.send('widget:set-ignore-mouse', !isOpen)
  }, [isOpen])

  useEffect(() => {
    const onMove = (e: MouseEvent): void => {
      if (isDraggingRef.current) return

      const target = e.target as HTMLElement | null
      const overHandler = target !== null && target.closest('[data-handler]') !== null
      if (!isOpen) {
        window.electron.ipcRenderer.send('widget:set-ignore-mouse', !overHandler)
      }
    }
    document.addEventListener('mousemove', onMove)
    return () => document.removeEventListener('mousemove', onMove)
  }, [isOpen])

  const collapseWidget = (): void => {
    setIsOpen(false)
    window.electron.ipcRenderer.send('widget:collapse')
  }

  const resetTimer = (): void => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
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

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <div ref={containerRef} className="flex h-full w-full items-center relative overflow-hidden">
      <button
        data-handler
        onMouseEnter={handleMouseEnter}
        className="absolute left-0.5 top-1/2 -translate-y-1/2 w-1 h-16 bg-slate-400 hover:bg-slate-600 transition-colors rounded-xl"
      />

      <motion.div
        initial={{ x: '-100%', opacity: 0 }}
        animate={{
          x: isOpen ? 0 : '-100%',
          opacity: isOpen ? 1 : 0
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        onMouseMove={handlePanelMouseMove}
        className="w-18 h-fit max-h-full overflow-hidden z-10 rounded-2xl bg-slate-100 border-r border-y border-slate-300 shadow-xl shadow-slate-900/10"
        style={{
          padding: '6px',
          pointerEvents: isOpen ? 'auto' : 'none'
        }}
      >
        <Reorder.Group
          as="div"
          axis="y"
          values={items}
          onReorder={setItems}
          className="flex flex-col items-center gap-2 m-0 p-0 list-none overflow-hidden rounded-xl"
        >
          {items.map((value) => (
            <Reorder.Item
              key={value}
              value={value}
              as="li"
              dragConstraints={containerRef}
              dragElastic={0}
              whileDrag={{ scale: 1.05 }}
              onDragStart={handleDragStart}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="w-full h-12 flex items-center justify-center bg-white hover:bg-slate-50 border border-slate-200 shadow-sm rounded-xl transition-colors duration-200 cursor-grab active:cursor-grabbing text-slate-800 font-semibold select-none"
            >
              {value}
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </motion.div>
    </div>
  )
}

export default App
