"use client"

import { useMemo, useEffect, useState, useRef } from "react"
import { Submission } from "./types"

interface PerformanceChartProps {
  submissions: Submission[]
  currentUserId: string
  metricKey: string // e.g., "time", "memory"
  tableContainerId?: string // ID of the table container to match height
}

interface PerformanceBucket {
  range: string
  count: number
  userInBucket: boolean
  userValue?: number
}

export function PerformanceChart({
  submissions,
  currentUserId,
  metricKey,
  tableContainerId,
}: PerformanceChartProps) {
  const [chartHeight, setChartHeight] = useState<number | undefined>(undefined)
  const [isAnimated, setIsAnimated] = useState(false)
  const chartContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const animationTimeout = setTimeout(() => setIsAnimated(true), 100)
    return () => clearTimeout(animationTimeout)
  }, [])

  // Match chart height to table height
  useEffect(() => {
    if (!tableContainerId) return

    const updateHeight = () => {
      const tableContainer = document.getElementById(tableContainerId)
      if (tableContainer && chartContainerRef.current) {
        const tableHeight = tableContainer.offsetHeight
        setChartHeight(tableHeight)
      }
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    
    // Use MutationObserver to watch for table changes
    const tableContainer = document.getElementById(tableContainerId)
    if (tableContainer) {
      const observer = new MutationObserver(updateHeight)
      observer.observe(tableContainer, { childList: true, subtree: true, attributes: true })
      
      return () => {
        window.removeEventListener('resize', updateHeight)
        observer.disconnect()
      }
    }
  }, [tableContainerId])

  // Generate fake performance data for demonstration
  // Simulates a realistic distribution with thousands of submissions
  const performanceData = useMemo(() => {
    // Get current user's best value for this metric (real data)
    const userSubmissions = submissions.filter((s) => s.user_id === currentUserId)
    const userValues = userSubmissions
      .filter((s) => s.metrics && s.metrics[metricKey] !== undefined && typeof s.metrics[metricKey] === "number")
      .map((s) => s.metrics![metricKey] as number)
    const userBestValue = userValues.length > 0 ? Math.min(...userValues) : null

    // Determine realistic range based on user's value or use defaults
    // For "time" metric, assume range of 0-100ms, for others use 0-100
    const isTimeMetric = metricKey.toLowerCase() === "time"
    const defaultMin = 0
    const defaultMax = isTimeMetric ? 100 : 100
    
    // If user has a value, use it to center the distribution
    const centerValue = userBestValue !== null ? userBestValue : defaultMax / 2
    const minValue = Math.max(0, centerValue - defaultMax * 0.6)
    const maxValue = centerValue + defaultMax * 0.4
    const range = maxValue - minValue

    // Create 10 buckets with fake distribution (normal distribution curve)
    const bucketCount = 10
    const buckets: PerformanceBucket[] = Array.from({ length: bucketCount }, (_, i) => {
      const bucketMin = minValue + (range * i) / bucketCount
      const bucketMax = minValue + (range * (i + 1)) / bucketCount
      const bucketCenter = (bucketMin + bucketMax) / 2
      
      // Simulate normal distribution (more submissions in middle buckets)
      // Peak around the 40-60% range (better performers)
      const distanceFromPeak = Math.abs(bucketCenter - (minValue + range * 0.5))
      const normalizedDistance = distanceFromPeak / (range / 2)
      
      // Generate fake count with normal distribution curve
      // Scale to simulate thousands of submissions
      // Use deterministic seed based on bucket index to avoid hydration mismatch
      const baseCount = Math.max(1, Math.round(5000 * Math.exp(-normalizedDistance * normalizedDistance * 2)))
      // Use a simple hash-like function for deterministic "randomness" based on bucket index
      const seed = i * 7 + (metricKey.length * 13) // Deterministic seed
      const pseudoRandom = ((seed * 9301 + 49297) % 233280) / 233280 // Simple LCG
      const randomVariation = Math.floor(pseudoRandom * 1000) - 500 // Deterministic variation (larger range)
      const count = Math.max(0, baseCount + randomVariation)

      // Check if user's best value is in this bucket
      const userInBucket =
        userBestValue !== null &&
        userBestValue >= bucketMin &&
        (i === bucketCount - 1 ? userBestValue <= bucketMax : userBestValue < bucketMax)

      return {
        range: `${bucketMin.toFixed(1)}-${bucketMax.toFixed(1)}`,
        count,
        userInBucket,
        userValue: userInBucket ? userBestValue : undefined,
      }
    })

    return {
      buckets,
      userBestValue,
      maxCount: Math.max(...buckets.map((b) => b.count), 1),
    }
  }, [submissions, currentUserId, metricKey])

  if (!performanceData || performanceData.maxCount === 0) {
    return (
      <div className="mt-4 p-4 border rounded-md bg-muted/30">
        <p className="text-sm text-muted-foreground text-center">
          No {metricKey} data available for this problem
        </p>
      </div>
    )
  }

  const { buckets, userBestValue, maxCount } = performanceData

  return (
    <div 
      ref={chartContainerRef}
      className="p-6 border rounded-md bg-gradient-to-br from-gray-50 to-gray-100/50 shadow-sm flex flex-col"
      style={{ height: chartHeight ? `${chartHeight}px` : (tableContainerId ? '100%' : 'auto') }}
    >
      <div className="mb-6">
        <h4 className="text-base font-bold text-gray-800">
          Performance Distribution: {metricKey.charAt(0).toUpperCase() + metricKey.slice(1)}
        </h4>
        {userBestValue !== null && (
          <p className="text-sm text-gray-700 mt-2">
            Your best: <span className="font-bold text-gray-900">{userBestValue.toFixed(2)}</span>
          </p>
        )}
      </div>

      <div className="flex items-end justify-center gap-1 flex-1 relative mt-12" style={{ height: '100%' }}>
        {/* X-axis labels container - positioned absolutely at bottom */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-1 pb-6">
          {buckets.map((bucket, index) => (
            <div
              key={`label-${index}`}
              className="flex-1 flex justify-center"
            >
              {index % 2 === 0 && (
                <div className="text-xs text-gray-600 text-center leading-tight rotate-[-45deg] origin-top-left whitespace-nowrap">
                  {parseFloat(bucket.range.split("-")[0]).toFixed(1)}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Bars container */}
        <div className="flex items-end justify-center gap-1 w-full h-full pb-8">
          {buckets.map((bucket, index) => {
            // Calculate bar height as percentage of container
            const heightPercent = maxCount > 0 ? (bucket.count / maxCount) * 100 : 0
            const isUserBucket = bucket.userInBucket

            return (
              <div
                key={index}
                className="flex flex-col items-center justify-end group relative flex-1"
                style={{ height: '100%' }}
              >
                {/* Bar */}
                <div
                  className={`rounded-t transition-all duration-1000 ease-in-out ${
                    isUserBucket
                      ? "bg-gray-800 border-2 border-gray-900 shadow-xl"
                      : "bg-gray-400 border border-gray-500"
                  }`}
                  style={{
                    width: '24px',
                    height: isAnimated ? `${heightPercent}%` : '0%',
                    minHeight: heightPercent > 0 ? '4px' : '0',
                  }}
                  title={`${bucket.range}: ${bucket.count} submission${bucket.count !== 1 ? "s" : ""}`}
                />

                {/* User indicator - more prominent */}
                {isUserBucket && (
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="flex flex-col items-center">
                      {/* Arrow pointing down */}
                      <div className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent border-t-gray-900 mb-1" />
                      {/* Larger dot */}
                      <div className="w-4 h-4 bg-gray-900 rounded-full border-2 border-white shadow-lg" />
                      {/* "You" label with better styling */}
                      <div className="mt-2 px-2 py-1 bg-gray-900 text-white text-xs font-bold rounded-md shadow-lg whitespace-nowrap border border-gray-950">
                        YOU
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-700 font-medium">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gray-400 border border-gray-500 rounded-t" />
          <span>All submissions</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gray-800 border-2 border-gray-900 rounded-t" />
          <span className="font-bold text-gray-900">Your position</span>
        </div>
      </div>
    </div>
  )
}
