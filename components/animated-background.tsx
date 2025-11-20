"use client"

import { useEffect, useState, useMemo } from "react"

export function AnimatedBackground() {
  const [scrollY, setScrollY] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  // Color palette
  const colors = [
    "#6b8bd6", // Blue
    "#999999", // Gray
    "#8b7bd6", // Purple
    "#7bd6a8", // Green
    "#d67b9f", // Pink
    "#d6a87b", // Orange
  ]

  // Randomize color on each load (using useMemo to persist across re-renders)
  const gridColor = useMemo(() => {
    return colors[Math.floor(Math.random() * colors.length)]
  }, [])

  useEffect(() => {
    // Track scroll for grid reorientation
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    // Check screen size
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkScreenSize()
    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", checkScreenSize)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", checkScreenSize)
    }
  }, [])

  // Base background color
  const baseColor = "#fafafa"
  
  // Convert hex to rgba for opacity control
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  
  // Calculate rotation based on scroll (more dramatic 3D effect)
  // On mobile, rotate more for better visibility
  const maxRotationX = isMobile ? 15 : 12
  const maxRotationY = isMobile ? 10 : 8
  const rotationX = Math.min(scrollY * 0.03, maxRotationX)
  const rotationY = Math.min(scrollY * 0.02, maxRotationY)
  
  // Grid size based on screen
  const gridSize = isMobile ? 40 : 60
  const subGridSize = isMobile ? 20 : 30

  // Faint colored grid lines
  const mainGridColor = hexToRgba(gridColor, 0.06)
  const subGridColor = hexToRgba(gridColor, 0.035)

  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden"
      style={{
        background: baseColor,
      }}
    >
      {/* 3D Grid with perspective and color */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(${mainGridColor} 1px, transparent 1px),
            linear-gradient(90deg, ${mainGridColor} 1px, transparent 1px),
            linear-gradient(${subGridColor} 1px, transparent 1px),
            linear-gradient(90deg, ${subGridColor} 1px, transparent 1px)
          `,
          backgroundSize: `
            ${gridSize}px ${gridSize}px,
            ${gridSize}px ${gridSize}px,
            ${subGridSize}px ${subGridSize}px,
            ${subGridSize}px ${subGridSize}px
          `,
          backgroundPosition: "0 0, 0 0, 0 0, 0 0",
          transform: `perspective(1000px) rotateX(${rotationX}deg) rotateY(${rotationY}deg)`,
          transformStyle: "preserve-3d",
          transformOrigin: "50% 50%",
          willChange: "transform",
        }}
      />
    </div>
  )
}
