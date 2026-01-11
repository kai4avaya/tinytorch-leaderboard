'use client'

import { useState } from 'react'
import styles from './flame.module.css'

export function InteractiveFlame() {
  const [level, setLevel] = useState(3)
  const [waterDrops, setWaterDrops] = useState<{id: number, left: number, delay: number, duration: number}[]>([])
  const [steamPuffs, setSteamPuffs] = useState<{id: number, left: number, bottom: number}[]>([])

  const handleDouse = () => {
    // Calculate how long it takes to extinguish:
    // Level / 0.2 steps * 50ms interval
    const timeToExtinguish = (level / 0.2) * 50
    
    // 1. Create water drops falling from top
    const drops = Array.from({ length: 80 }).map((_, i) => ({
      id: Date.now() + i,
      left: 20 + Math.random() * 60,
      delay: Math.random() * timeToExtinguish,
      duration: 0.5 + Math.random() * 0.5
    }))
    setWaterDrops(drops)

    // 2. Extinguish fire smoothly
    let currentLevel = level
    const interval = setInterval(() => {
        currentLevel -= 0.2
        if (currentLevel <= 0) {
            currentLevel = 0
            clearInterval(interval)
            
            // 3. Create steam rising
            const puffs = Array.from({ length: 12 }).map((_, i) => ({
                id: Date.now() + i + 100,
                left: 40 + Math.random() * 20,
                bottom: 30 + Math.random() * 20
            }))
            setSteamPuffs(puffs)
        }
        setLevel(Math.max(0, currentLevel))
    }, 50)

    // Cleanup effects
    setTimeout(() => setWaterDrops([]), timeToExtinguish + 1200)
    setTimeout(() => setSteamPuffs([]), timeToExtinguish + 4000)
  }

  return (
    <div className={styles.flameContainer}>
        {/* Glow */}
        <div 
            className={styles.glow} 
            style={{ 
                opacity: level * 0.1,
                // Ensure glow scales or stays centered around the fire base
                transform: `translateX(-50%) scale(${1 + level * 0.1})`,
                bottom: '20px'
            }}
        />

        {/* Flame Wrapper centered */}
        <div className={styles.flameWrapper}>
            {level > 0.5 && (
                <div 
                    className={styles.flame} 
                    style={{ 
                        // EXACT ORIGINAL TRANSFORM
                        transform: `scale(${level}) translate(-13px, -15px)`,
                        bottom: '20px',
                        left: '50%',
                        position: 'absolute'
                    }}
                />
            )}
            
            {/* Water Drops */}
            {waterDrops.map(drop => (
                <div 
                    key={drop.id}
                    className={styles.waterPixel}
                    style={{
                        left: `${drop.left}%`,
                        top: '-10%',
                        animation: `fall ${drop.duration}s linear forwards`,
                        animationDelay: `${drop.delay}ms`
                    }}
                />
            ))}

            {/* Steam */}
            {steamPuffs.map(puff => (
                <div 
                    key={puff.id}
                    className={styles.steam}
                    style={{
                        left: `${puff.left}%`,
                        bottom: `${puff.bottom}%`,
                        width: '30px',
                        height: '30px',
                        animation: `rise 2.5s ease-out forwards`
                    }}
                />
            ))}
        </div>

        <div className={styles.controls}>
            <label className={styles.label}>Fire Level: {Math.round(level)}</label>
            <input 
                type="range" 
                min="0" 
                max="11" 
                step="0.1" 
                value={level}
                onChange={(e) => setLevel(parseFloat(e.target.value))}
                className={styles.range}
            />
            <button 
                onClick={handleDouse}
                className={styles.douseBtn}
                disabled={level === 0}
            >
                {level === 0 ? "Re-ignite with Slider" : "💧 Douse with Water"}
            </button>
        </div>
        
        <style jsx>{`
            @keyframes fall {
                0% { transform: translateY(0); opacity: 1; }
                100% { transform: translateY(80vh); opacity: 0; }
            }
            @keyframes rise {
                0% { transform: translateY(0) scale(0.5); opacity: 0.8; }
                100% { transform: translateY(-150px) scale(2); opacity: 0; }
            }
        `}</style>
    </div>
  )
}
