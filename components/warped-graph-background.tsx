'use client'

import { useEffect, useRef } from 'react'

export function WarpedGraphBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let time = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', resize)
    resize()

    const drawGrid = () => {
      ctx.fillStyle = '#f0f4f8' // Minimal base
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const gridSize = 40
      const cols = Math.ceil(canvas.width / gridSize) + 2
      const rows = Math.ceil(canvas.height / gridSize) + 2

      // Function to calculate warped position
      const getWarpedPoint = (col: number, row: number) => {
        const x = col * gridSize - gridSize
        const y = row * gridSize - gridSize

        // Undulation Logic ("Hills")
        // Y displacement creates hills
        const yOffset = Math.sin(col * 0.1 + time) * 20 + 
                        Math.cos(row * 0.1 + time * 0.5) * 20

        // X displacement for "different sizes" / perspective feel
        const xOffset = Math.cos(row * 0.1 + time) * 15

        return {
          x: x + xOffset,
          y: y + yOffset
        }
      }

      ctx.lineWidth = 1

      // Draw Horizontal Lines
      for (let j = 0; j < rows; j++) {
        ctx.beginPath()
        // Subtle color shifting for borders
        ctx.strokeStyle = `rgba(${180 + Math.sin(j + time) * 20}, ${190 + Math.cos(j + time) * 20}, 210, 0.4)`
        
        for (let i = 0; i < cols; i++) {
          const point = getWarpedPoint(i, j)
          if (i === 0) ctx.moveTo(point.x, point.y)
          else ctx.lineTo(point.x, point.y)
        }
        ctx.stroke()
      }

      // Draw Vertical Lines
      for (let i = 0; i < cols; i++) {
        ctx.beginPath()
        ctx.strokeStyle = `rgba(${180 + Math.cos(i + time) * 20}, ${190 + Math.sin(i + time) * 20}, 210, 0.3)`
        
        for (let j = 0; j < rows; j++) {
          const point = getWarpedPoint(i, j)
          if (j === 0) ctx.moveTo(point.x, point.y)
          else ctx.lineTo(point.x, point.y)
        }
        ctx.stroke()
      }

      time += 0.008
      animationFrameId = requestAnimationFrame(drawGrid)
    }

    drawGrid()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 h-full w-full pointer-events-none"
    />
  )
}
