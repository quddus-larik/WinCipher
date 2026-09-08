import React, { useState, useEffect, useRef, memo, useCallback } from 'react'
import { motion, Reorder, AnimatePresence } from 'motion/react'

type WidgetType = 'caffeine' | 'business' | 'screen-time'

interface ItemData {
  id: string
  type: WidgetType
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${String(seconds).padStart(2, '0')}s`
  }
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`
}

/* Screen Time */
const ScreenTimeWidget = memo(function ScreenTimeWidget({ screenTime }: { screenTime: string }) {
  return (
    <div className="relative w-full h-full rounded-xl bg-gradient-to-b from-[#b24bf3] via-[#7b2cbf] to-[#240046] text-white flex flex-col justify-between overflow-hidden shadow-2xl shadow-purple-900/50 select-none p-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-white leading-none">{screenTime}</p>
          <p className="text-tiny text-accent leading-none mt-0.5 text-shadow-xs">Time per day</p>
        </div>
        <span className="text-xl leading-none">💵</span>
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[size:14px_14px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute -top-6 inset-x-0 h-16 bg-white/10 rounded-full blur-md pointer-events-none" />
      <div className="absolute inset-0 bg-radial from-transparent bg-white/20 via-transparent pointer-events-none" />
    </div>
  )
})

/* Caffeine Intake */
const CaffeineWidget = memo(function CaffeineWidget() {
  return (
    <div className="relative w-full h-full rounded-xl bg-gradient-to-r from-[#d82a43] via-[#cd253f] to-[#aa1c33] text-white flex flex-col justify-between overflow-hidden shadow-lg select-none p-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-white leading-none">14</p>
          <p className="text-tiny text-accent leading-none mt-0.5 text-shadow-sm">Cups of Coffee</p>
        </div>
        <span className="text-xl leading-none">☕</span>
      </div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 w-28 h-28 pointer-events-none flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,_rgba(255,255,255,0.25)_1px,_transparent_1.5px)] bg-[size:8px_8px] [mask-image:radial-gradient(circle_at_center,_black_50%,_transparent_100%)]" />
      </div>
    </div>
  )
})

/* Business */
const BusinessWidget = memo(function BusinessWidget() {
  return (
    <div className="relative w-full h-full rounded-xl bg-gradient-to-b from-[#b24bf3] via-[#7b2cbf] to-[#240046] text-white flex flex-col justify-between overflow-hidden shadow-2xl shadow-purple-900/50 select-none p-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-white leading-none">370$</p>
          <p className="text-tiny text-accent leading-none mt-0.5 text-shadow-xs">Market Cap</p>
        </div>
        <span className="text-xl leading-none">💵</span>
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[size:14px_14px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute -top-6 inset-x-0 h-16 bg-white/10 rounded-full blur-md pointer-events-none" />
      <div className="absolute inset-0 bg-radial from-transparent bg-white/20 via-transparent pointer-events-none" />
    </div>
  )
})

const Widget = memo(function Widget({
  type,
  screenTime
}: {
  type: WidgetType
  screenTime: string
}) {
  switch (type) {
    case 'caffeine':
      return <CaffeineWidget />
    case 'business':
      return <BusinessWidget />
    case 'screen-time':
      return <ScreenTimeWidget screenTime={screenTime} />
  }
})

const INITIAL_ITEMS: ItemData[] = [
  { id: 'caffeine', type: 'caffeine' },
  { id: 'business', type: 'business' },
  { id: 'screen-time', type: 'screen-time' }
]

function App(): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const alwaysOpen = false

  const [items, setItems] = useState<ItemData[]>(INITIAL_ITEMS)
  const [screenTime, setScreenTime] = useState('0m 00s')

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mainContainerRef = useRef<HTMLDivElement | null>(null)
  const isDraggingRef = useRef(false)
  const isOpenRef = useRef(isOpen)

  useEffect(() => {
    isOpenRef.current = isOpen
  }, [isOpen])

  const isPanelVisible = alwaysOpen || isOpen

  useEffect(() => {
    let isMounted = true
    const fetchDailyTime = async () => {
      try {
        const daily = await window.api?.getDailyTime()
        if (daily && isMounted) {
          setScreenTime(formatTime(daily.totalMs))
        }
      } catch (e) {
        console.error('Failed to fetch daily time:', e)
      }
    }

    const fetchScreenTime = async () => {
      try {
        const stats = await window.api?.getScreenTime()
        if (stats && isMounted) {
          setScreenTime(formatTime(stats.totalScreenTimeMs))
        }
      } catch (e) {
        console.error('Failed to fetch screen time:', e)
      }
    }

    fetchDailyTime()
    fetchScreenTime()
    const id = setInterval(fetchScreenTime, 1000)
    return () => {
      isMounted = false
      clearInterval(id)
    }
  }, [])

  useEffect(() => {
    let animationFrameId: number | null = null

    const handler = (e: MouseEvent) => {
      if (isDraggingRef.current) return
      if (animationFrameId !== null) return

      animationFrameId = requestAnimationFrame(() => {
        animationFrameId = null
        const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
        const isOver =
          target !== null &&
          target !== containerRef.current &&
          (target.closest('[data-handler]') !== null || target.closest('[data-panel]') !== null)
        window.electron?.ipcRenderer?.send?.('widget:set-ignore-mouse', !isOver)
      })
    }

    window.addEventListener('mousemove', handler, { passive: true })
    return () => {
      window.removeEventListener('mousemove', handler)
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId)
    }
  }, [])

  const collapseWidget = useCallback(() => {
    if (isDraggingRef.current) return
    if (timerRef.current) clearTimeout(timerRef.current)
    setIsOpen(false)
  }, [])

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(collapseWidget, 3500)
  }, [collapseWidget])

  const handleMouseEnter = useCallback(() => {
    setIsOpen(true)
    window.electron?.ipcRenderer?.send?.('widget:expand')
    resetTimer()
  }, [resetTimer])

  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true
    if (timerRef.current) clearTimeout(timerRef.current)
    window.electron?.ipcRenderer?.send?.('widget:set-ignore-mouse', false)
  }, [])

  const handleDrag = useCallback(
    (_: unknown, info: { point: { x: number; y: number } }) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      if (
        info.point.x < rect.left ||
        info.point.x > rect.right ||
        info.point.y < rect.top ||
        info.point.y > rect.bottom
      ) {
        isDraggingRef.current = false
        collapseWidget()
      }
    },
    [collapseWidget]
  )

  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false
    if (isOpenRef.current) resetTimer()
  }, [resetTimer])

  const handleAnimationComplete = useCallback(() => {
    if (!isOpenRef.current && !alwaysOpen) {
      window.electron?.ipcRenderer?.send?.('widget:collapse')
    }
  }, [alwaysOpen])

  const handleMouseMove = useCallback(() => {
    if (isOpenRef.current && !isDraggingRef.current) resetTimer()
  }, [resetTimer])

  const handleMouseLeave = useCallback(() => {
    if (!isDraggingRef.current) resetTimer()
  }, [resetTimer])

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    []
  )

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full items-start justify-center pt-2 relative overflow-hidden pointer-events-none"
    >
      <AnimatePresence>
        {!isPanelVisible && (
          <motion.button
            data-handler
            initial={{ opacity: 0, scaleX: 0.6 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0, scaleX: 0.6 }}
            transition={{ duration: 0.2 }}
            onMouseEnter={handleMouseEnter}
            className="absolute left-1/2 top-2 -translate-x-1/2 w-12 h-1.5 bg-white/20 hover:bg-white/40 transition-colors duration-200 rounded-full pointer-events-auto backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <motion.div
        data-panel
        ref={mainContainerRef}
        initial={{ y: '-110%', opacity: 0, scale: 0.95 }}
        animate={{
          y: isPanelVisible ? 0 : '-110%',
          opacity: isPanelVisible ? 1 : 0,
          scale: isPanelVisible ? 1 : 0.95
        }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        onAnimationComplete={handleAnimationComplete}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/80 w-[400px] rounded-[18px] flex items-center h-[60px] pointer-events-auto z-10 font-sans p-1.5"
        style={{
          boxShadow:
            '0 8px 32px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.07) inset, 0 -1px 0 rgba(0,0,0,0.3) inset'
        }}
      >
        <Reorder.Group
          as="div"
          axis="x"
          values={items}
          onReorder={setItems}
          className="flex flex-row items-center list-none m-0 p-0 w-full h-full gap-1.5 relative"
        >
          {items.map((item) => (
            <Reorder.Item
              key={item.id}
              value={item}
              as="li"
              layout="position"
              drag="x"
              dragSnapToOrigin
              dragElastic={0.05}
              dragConstraints={mainContainerRef}
              whileDrag={{ zIndex: 30, scale: 1.02 }}
              onDragStart={handleDragStart}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              className="flex-1 min-w-0 h-full text-white select-none touch-none cursor-grab active:cursor-grabbing relative"
              style={{ listStyle: 'none' }}
            >
              <Widget type={item.type} screenTime={screenTime} />
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </motion.div>
    </div>
  )
}

export default App
