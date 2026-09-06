import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'motion/react'

function App(): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    setIsOpen(true)

    // Clear any existing timer to restart the 10s countdown on re-hover
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    // Auto-close after 10 seconds
    timerRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 3000)c
  }

  // Cleanup timer if component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <div className="flex h-full w-full items-center relative overflow-hidden">
      {/* Handler Button */}
      <button
        onMouseEnter={handleMouseEnter}
        className="absolute top-0.5 left-1/2 -translate-x-1/2 h-1 w-16 bg-slate-100 rounded-lg cursor-pointer"
      />

      {/* Animated Component */}
      <motion.div
        initial={{ y: '-100%', opacity: 0 }}
        animate={{
          y: isOpen ? 0 : '-100%',
          opacity: isOpen ? 1 : 0
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="w-full h-full bg-red-300 z-10"
      >
        {/* Your Widget Content Here */}
      </motion.div>
    </div>
  )
}

export default App
