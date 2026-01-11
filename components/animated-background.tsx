'use client'

import { useEffect, useRef } from 'react'

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let startTime = Date.now()

    const render = () => {
      const currentTime = Date.now()
      // Loop time every 10 seconds to keep animation alive
      const rawT = (currentTime - startTime) / 1000
      const t_seconds = rawT % 15 

      // Resize canvas to window
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
      }

      // Clear canvas with a dark background to make the "sparks" pop
      ctx.fillStyle = '#09090b' // zinc-950
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Center the coordinate system somewhat? 
      // The algo produces specific coords. We might need to translate.
      // Dwitter usually assumes 1920x1080 or similar.
      // Let's analyze bounds: x roughly 0-2000*s?
      // We'll just run it and apply a transform if needed.
      // Actually, let's wrap the draw in save/restore and translate to center-ish.
      
      ctx.save()
      // Dwitter standard canvas is usually small (1920x1080).
      // We'll scale slightly to fit screen.
      // And move origin? The algo uses (i**5%a)*s for X. 
      // Let's try drawing from top-left (0,0).
      
      // Algorithm implementation
      let a = 2000
      let t = t_seconds * 60
      let s = 0.5
      
      // fillStyle=`hsl(${t?t%30+9:a} 50%${t?t/2-t%9:75}%`
      // Cleaning up the HSL string
      const hue = t ? (t % 30 + 9) : a
      const lightness = t ? (t / 2 - t % 9) : 75
      ctx.fillStyle = `hsl(${hue}, 50%, ${Math.max(0, Math.min(100, lightness))}%)`

      for (let i = a; i > 0; i--) {
        s *= 1.01
        
        const w_raw = t ? 99 - t + i % 119 : i
        const threshold = (Math.pow(i, 4) % 59) + 9
        
        if (w_raw > threshold) {
           let w = w_raw
           
           // x = (i**5%a + S(t/9+i)*9)*s
           // y = (290-t)*s
           const x_pos = (Math.pow(i, 5) % a + Math.sin(t / 9 + i) * 9) * s
           const y_pos = (290 - t) * s
           
           w *= s // Scale size
           
           // Ensure positive radius for ellipse
           const rx = Math.abs(w)
           const ry = Math.abs(w / 5)
           
           if (rx > 0 && ry > 0) {
             ctx.beginPath()
             ctx.ellipse(x_pos, y_pos, rx, ry, 0, 0, 9) // 9 radians rotation? Dwitter usually uses radians. 9 rad is ~2.7 rad (approx 155 deg)
             ctx.fill()
           }
        }
      }
      ctx.restore()

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 h-full w-full opacity-50 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}