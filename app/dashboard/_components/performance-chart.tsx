"use client"

import { useMemo } from "react"
import { Submission } from "./types"

interface PerformanceChartProps {
  submissions: Submission[]
  currentUserId: string
  metricKey: string // e.g., "time", "memory"
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
}: PerformanceChartProps) {
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
      // Scale to simulate hundreds/thousands of submissions
      // Use deterministic seed based on bucket index to avoid hydration mismatch
      const baseCount = Math.max(1, Math.round(200 * Math.exp(-normalizedDistance * normalizedDistance * 2)))
      // Use a simple hash-like function for deterministic "randomness" based on bucket index
      const seed = i * 7 + (metricKey.length * 13) // Deterministic seed
      const pseudoRandom = ((seed * 9301 + 49297) % 233280) / 233280 // Simple LCG
      const randomVariation = Math.floor(pseudoRandom * 50) - 25 // Deterministic variation
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
    <div className="mt-4 p-4 border rounded-md bg-gradient-to-br from-gray-50 to-gray-100/50">
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-gray-700">
          Performance Distribution: {metricKey.charAt(0).toUpperCase() + metricKey.slice(1)}
        </h4>
        {userBestValue !== null && (
          <p className="text-xs text-gray-600 mt-1">
            Your best: <span className="font-medium">{userBestValue.toFixed(2)}</span>
          </p>
        )}
      </div>

      <div className="flex items-end justify-between gap-1 h-48">
        {buckets.map((bucket, index) => {
          const height = maxCount > 0 ? (bucket.count / maxCount) * 100 : 0
          const isUserBucket = bucket.userInBucket

          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center justify-end group relative"
            >
              {/* Bar */}
              <div
                className={`w-full rounded-t transition-all duration-300 ${
                  isUserBucket
                    ? "bg-gray-800 border-2 border-gray-900 shadow-lg"
                    : "bg-gray-400 border border-gray-500"
                }`}
                style={{
                  height: `${Math.max(height, 2)}%`,
                  minHeight: height > 0 ? "4px" : "0",
                }}
                title={`${bucket.range}: ${bucket.count} submission${bucket.count !== 1 ? "s" : ""}`}
              />

              {/* User indicator */}
              {isUserBucket && (
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 bg-gray-900 rounded-full border-2 border-white shadow-md" />
                    <div className="text-xs font-semibold text-gray-900 mt-1 whitespace-nowrap">
                      You
                    </div>
                  </div>
                </div>
              )}

              {/* Bucket label (show every 2nd bucket to avoid crowding) */}
              {index % 2 === 0 && (
                <div className="mt-2 text-[10px] text-gray-600 text-center leading-tight rotate-[-45deg] origin-top-left whitespace-nowrap">
                  {parseFloat(bucket.range.split("-")[0]).toFixed(1)}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-400 border border-gray-500 rounded-t" />
          <span>All submissions</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-800 border-2 border-gray-900 rounded-t" />
          <span>Your position</span>
        </div>
      </div>
    </div>
  )
}
