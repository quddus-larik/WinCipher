import React, { useState, useEffect, useRef } from 'react'
import { motion, Reorder, AnimatePresence } from 'motion/react'

// ─── Types ──────────────────────────────────────────────────────────────────

type WidgetType = 'caffeine' | 'business' | 'screen-time' | 'streaks' | 'music' | 'weather' | 'task'

interface ItemData {
  id: string
  type: WidgetType
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const STREAK_DATA = [
  0, 1, 3, 2, 0, 1, 2, 3, 3, 1, 0, 2, 3, 1, 0, 2, 2, 3, 1, 0, 0, 1, 3, 3, 2, 1, 2, 3, 0, 1, 3
]

const TASKS = [{ id: 1, label: 'Review PR #42', done: false }]

// ─── Sub-components ──────────────────────────────────────────────────────────

/* Screen Time */
function ScreenTimeWidget({ screenTime }: { screenTime: string }) {
  return (
    <div className="flex flex-col justify-between h-full px-3 py-2 min-w-[88px]">
      <span className="text-[9px] font-semibold uppercase tracking-widest text-white/40">
        Screen
      </span>
      <div className="flex items-end gap-0.5">
        <span className="text-sm font-bold text-white leading-none">{screenTime}</span>
      </div>
      <div className="w-full h-0.5 rounded-full bg-white/10 overflow-hidden mt-1">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400"
          initial={{ width: '0%' }}
          animate={{ width: '62%' }}
          transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
        />
      </div>
    </div>
  )
}

/* Music Player */
function MusicWidget() {
  const [playing, setPlaying] = useState(true)
  const [progress, setProgress] = useState(34)

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => setProgress((p) => (p >= 100 ? 0 : p + 0.4)), 200)
    return () => clearInterval(id)
  }, [playing])

  const bars = Array.from({ length: 18 }, (_, i) => Math.sin(i * 0.7) * 0.5 + 0.5)

  return (
    <div className="flex flex-row items-center gap-2 px-2.5 py-1.5 min-w-[148px]">
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-white truncate leading-none">
              Blinding Lights
            </p>
            <p className="text-[9px] text-white/40 truncate leading-none mt-0.5">The Weeknd</p>
          </div>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => setPlaying(!playing)}
            className="shrink-0 size-5 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
          >
            {playing ? (
              <svg width="8" height="8" viewBox="0 0 8 8" fill="white">
                <rect x="1" y="0.5" width="2" height="7" rx="0.5" />
                <rect x="5" y="0.5" width="2" height="7" rx="0.5" />
              </svg>
            ) : (
              <svg width="8" height="8" viewBox="0 0 8 8" fill="white">
                <polygon points="1,0.5 7,4 1,7.5" />
              </svg>
            )}
          </button>
        </div>

        <div className="relative h-4 w-full flex items-end gap-px overflow-hidden">
          {bars.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm transition-all duration-200"
              style={{
                height: `${(playing ? h * 0.6 + Math.sin(Date.now() / 300 + i) * 0.2 : h * 0.3) * 100}%`,
                backgroundColor:
                  i / bars.length < progress / 100 ? '#a78bfa' : 'rgba(255,255,255,0.15)'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/* Streaks */
function StreaksWidget() {
  const current = 12
  return (
    <div className="flex flex-col gap-1.5 px-2.5 py-1.5 min-w-[110px]">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Streak</span>
        <div className="flex items-center gap-1">
          <span className="text-[10px]">🔥</span>
          <span className="text-[10px] font-black text-orange-400">{current}d</span>
        </div>
      </div>
      <div className="grid grid-cols-[repeat(11,1fr)] gap-0.5">
        {STREAK_DATA.slice(-22).map((level, idx) => {
          const opacity = level === 0 ? 0.08 : level === 1 ? 0.35 : level === 2 ? 0.65 : 1
          const color = level === 0 ? 'bg-white/10' : 'bg-orange-400'
          return <div key={idx} className={`size-1.5 rounded-sm ${color}`} style={{ opacity }} />
        })}
      </div>
    </div>
  )
}

/* Weather */
function WeatherWidget() {
  return (
    <div className="flex flex-col gap-1 px-2.5 py-1.5 min-w-[130px]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-white leading-none">28°</p>
          <p className="text-[9px] text-white/40 leading-none mt-0.5">Rawalpindi · Sunny</p>
        </div>
        <span className="text-xl leading-none">☀️</span>
      </div>
    </div>
  )
}

/* Task */
function TaskWidget() {
  const [tasks, setTasks] = useState(TASKS)
  const toggle = (id: number) =>
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  const done = tasks.filter((t) => t.done).length

  return (
    <div className="flex flex-col gap-1 px-2.5 py-1.5 min-w-[148px]">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Tasks</span>
        <span className="text-[9px] font-bold text-emerald-400">
          {done}/{tasks.length}
        </span>
      </div>
      {tasks.map((t) => (
        <button
          key={t.id}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => toggle(t.id)}
          className="flex items-center gap-1.5 group text-left w-full"
        >
          <div
            className={`size-2.5 rounded-full border transition-all shrink-0 flex items-center justify-center ${
              t.done
                ? 'bg-emerald-400 border-emerald-400'
                : 'border-white/25 group-hover:border-white/50'
            }`}
          >
            {t.done && (
              <svg width="5" height="5" viewBox="0 0 5 5" fill="none">
                <path
                  d="M0.8 2.5L2 3.7L4.2 1.3"
                  stroke="black"
                  strokeWidth="0.8"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </div>
          <span
            className={`text-[10px] leading-tight transition-colors ${
              t.done ? 'text-white/25 line-through' : 'text-white/80 group-hover:text-white'
            }`}
          >
            {t.label}
          </span>
        </button>
      ))}
    </div>
  )
}
/* Caffeine Intake */
function CaffeineWidget() {
  return (
    <div className={'py-2 w-32 h-full'}>
      <div className="relative w-full gap-1 px-1.5 py-2.5 h-full rounded-3xl bg-gradient-to-r from-[#d82a43] via-[#cd253f] to-[#aa1c33] text-white flex flex-col justify-between overflow-hidden shadow-lg select-none">
        <div className="flex items-center justify-between z-10">
          <div>
            <p className="text-sm font-black text-white leading-none">14</p>
            <p className="text-tiny text-accent leading-none mt-0.5 text-shadow-sm">
              Cups of Coffee
            </p>
          </div>
          <span className="text-xl leading-none">☕</span>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-28 h-28 pointer-events-none flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,_rgba(255,255,255,0.25)_1px,_transparent_1.5px)] bg-[size:8px_8px] [mask-image:radial-gradient(circle_at_center,_black_50%,_transparent_100%)]" />
        </div>
      </div>
    </div>
  )
}

/* Business */
function BusinessWidget() {
  return (
    <div className={'py-2 px-1 w-32 h-full'}>
      <div className="relative w-full gap-1 px-1.5 py-2.5 h-full rounded-3xl bg-gradient-to-b from-[#b24bf3] via-[#7b2cbf] to-[#240046] text-white flex flex-col justify-between overflow-hidden shadow-2xl shadow-purple-900/50 select-none">
        <div className="flex items-center justify-between z-10">
          <div>
            <p className="text-sm font-black text-white leading-none">370$</p>
            <p className="text-tiny text-accent leading-none mt-0.5 text-shadow-xs">Market Cap</p>
          </div>
          <span className="text-xl leading-none">💵</span>
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[size:14px_14px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
        <div className="absolute -top-6 inset-x-0 h-16 bg-white/10 rounded-full blur-md pointer-events-none" />
        <div className="absolute inset-0 bg-radial from-transparent bg-white/20 via-transparent  pointer-events-none" />
      </div>
    </div>
  )
}

// ─── Widget Renderer ─────────────────────────────────────────────────────────

function Widget({ type, screenTime }: { type: WidgetType; screenTime: string }) {
  switch (type) {
    case 'caffeine':
      return <CaffeineWidget />
    case 'business':
      return <BusinessWidget />
    case 'screen-time':
      return <ScreenTimeWidget screenTime={screenTime} />
    case 'music':
      return <MusicWidget />
    case 'streaks':
      return <StreaksWidget />
    case 'weather':
      return <WeatherWidget />
    case 'task':
      return <TaskWidget />
  }
}

// ─── Main App ────────────────────────────────────────────────────────────────

const INITIAL_ITEMS: ItemData[] = [
  { id: 'caffeine', type: 'caffeine' },
  { id: 'business', type: 'business' },
  { id: 'screen-time', type: 'screen-time' },
  { id: 'music', type: 'music' },
  { id: 'weather', type: 'weather' },
  { id: 'streaks', type: 'streaks' },
  { id: 'task', type: 'task' }
]

function App(): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const alwaysOpen = false

  const [items, setItems] = useState<ItemData[]>(INITIAL_ITEMS)
  const [screenTime, setScreenTime] = useState('4m 22s')

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mainContainerRef = useRef<HTMLDivElement | null>(null)
  const isDraggingRef = useRef(false)

  const isPanelVisible = alwaysOpen || isOpen

  useEffect(() => {
    let sec = 262
    const id = setInterval(() => {
      sec++
      const m = Math.floor(sec / 60)
      const s = sec % 60
      setScreenTime(m > 0 ? `${m}m ${String(s).padStart(2, '0')}s` : `${s}s`)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (isDraggingRef.current) return
      const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
      const isOver =
        target !== null &&
        target !== containerRef.current &&
        (target.closest('[data-handler]') !== null || target.closest('[data-panel]') !== null)
      window.electron?.ipcRenderer?.send?.('widget:set-ignore-mouse', !isOver)
    }
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [])

  const collapseWidget = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setIsOpen(false)
  }
  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(collapseWidget, 3500)
  }
  const handleMouseEnter = () => {
    setIsOpen(true)
    window.electron?.ipcRenderer?.send?.('widget:expand')
    resetTimer()
  }
  const handleDragStart = () => {
    isDraggingRef.current = true
    if (timerRef.current) clearTimeout(timerRef.current)
    window.electron?.ipcRenderer?.send?.('widget:set-ignore-mouse', false)
  }
  const handleDrag = (_: unknown, info: { point: { x: number; y: number } }) => {
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
  }
  const handleDragEnd = () => {
    isDraggingRef.current = false
    if (isOpen) resetTimer()
  }
  const handleAnimationComplete = () => {
    if (!isOpen && !alwaysOpen) {
      window.electron?.ipcRenderer?.send?.('widget:collapse')
    }
  }

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
      style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', sans-serif" }}
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
        onMouseMove={() => {
          if (isOpen && !isDraggingRef.current) resetTimer()
        }}
        onMouseLeave={() => {
          if (!isDraggingRef.current) resetTimer()
        }}
        className="absolute top-2 left-1/2 -translate-x-1/2 bg-accent/90 rounded-[18px] flex items-stretch h-[60px] pointer-events-auto z-10 font-sans px-2"
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
          className="flex flex-row items-stretch list-none m-0 p-0"
          style={{ gap: 0 }}
        >
          {items.map((item) => {
            return (
              <Reorder.Item
                key={item.id}
                value={item}
                as="li"
                drag="x"
                dragConstraints={mainContainerRef}
                dragElastic={0.08}
                whileDrag={{ zIndex: 30, scale: 1.02, opacity: 0.95 }}
                onDragStart={handleDragStart}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                className="flex flex-row items-center text-white select-none touch-none cursor-grab active:cursor-grabbing relative h-full"
                style={{ listStyle: 'none' }}
              >
                <Widget type={item.type} screenTime={screenTime} />
              </Reorder.Item>
            )
          })}
        </Reorder.Group>
      </motion.div>
    </div>
  )
}

export default App
