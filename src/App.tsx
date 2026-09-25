import "./App.css";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
    const [isHovered, setIsHovered] = useState(false);
    const [time, setTime] = useState({ hours: "00", minutes: "00" });

    // Update time live every second
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setTime({
                hours: now.getHours().toString().padStart(2, "0"),
                minutes: now.getMinutes().toString().padStart(2, "0"),
            });
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    // Sync window size with hover state
    const handleMouseEnter = () => {
        setIsHovered(true);
        invoke("set_sidebar_expanded", { expanded: true });
        invoke("set_ignore_mouse_events", { ignore: false });
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        invoke("set_sidebar_expanded", { expanded: false });
    };

    return (
        <div className="h-screen w-full flex items-center justify-start bg-transparent select-none overflow-hidden">
            {/*
        Morphing Container:
        Animates width, border radius, and background dynamically from Left to Right
      */}
            <motion.div
                layout
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                initial={false}
                animate={{
                    width: isHovered ? 210 : 12,
                    height: isHovered ? 260 : 120,
                    borderRadius: isHovered ? "0px 24px 24px 0px" : "0px 12px 12px 0px",
                }}
                transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 30,
                }}
                className="bg-neutral-900/90 text-white backdrop-blur-xl border-r border-y border-neutral-700/60 shadow-2xl flex items-center overflow-hidden cursor-pointer"
            >
                <AnimatePresence mode="wait">
                    {!isHovered ? (
                        /* Collapsed State: Vertical Accent Bar */
                        <motion.div
                            key="handle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="w-full h-full flex items-center justify-center"
                        >
                            <div className="w-1 h-12 bg-emerald-400/80 rounded-full" />
                        </motion.div>
                    ) : (
                        /* Expanded State: Morphing Content Panel */
                        <motion.div
                            key="content"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="w-full h-full p-5 flex flex-col items-center justify-between font-mono"
                        >
                            {/* Header */}
                            <div className="w-full flex justify-between items-center text-[10px] text-neutral-400 tracking-wider uppercase">
                                <span>Widget</span>
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            </div>

                            {/* Stacked Time Display */}
                            <div className="flex flex-col items-center my-auto">
                                <motion.span
                                    initial={{ y: -10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.05 }}
                                    className="text-5xl font-black text-white leading-none tracking-tight"
                                >
                                    {time.hours}
                                </motion.span>

                                <div className="w-8 h-1 bg-emerald-400/80 my-2 rounded-full" />

                                <motion.span
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-5xl font-black text-emerald-400 leading-none tracking-tight"
                                >
                                    {time.minutes}
                                </motion.span>
                            </div>

                            {/* Action Button */}
                            <motion.button
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.15 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs rounded-xl shadow-lg transition-colors cursor-pointer"
                                onClick={() => alert("Action triggered!")}
                            >
                                Open Panel
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}