"use client"

import React from "react"
import { Trophy, Star, Award, Target, Zap } from "lucide-react"
import { Submission } from "./types"

interface UserBadgesProps {
  submissions: Submission[]
  userId: string
}

export function UserBadges({ submissions, userId }: UserBadgesProps) {
  // Filter user's submissions
  const userSubmissions = submissions.filter((s) => s.user_id === userId)
  
  // Calculate badges
  const badges: { icon: React.ReactNode; label: string; earned: boolean }[] = []
  
  // First Submission badge
  if (userSubmissions.length > 0) {
    badges.push({
      icon: <Star className="h-5 w-5" />,
      label: "First Submission",
      earned: true,
    })
  }
  
  // 3 Submissions badge
  if (userSubmissions.length >= 3) {
    badges.push({
      icon: <Award className="h-5 w-5" />,
      label: "3 Submissions",
      earned: true,
    })
  }
  
  // 10 Submissions badge
  if (userSubmissions.length >= 10) {
    badges.push({
      icon: <Target className="h-5 w-5" />,
      label: "10 Submissions",
      earned: true,
    })
  }
  
  // Top 10 badge (if user is in top 10 by overall score)
  const allUserIds = Array.from(new Set(submissions.map((s) => s.user_id)))
  const userRank = allUserIds.indexOf(userId) + 1
  if (userRank > 0 && userRank <= 10) {
    badges.push({
      icon: <Trophy className="h-5 w-5" />,
      label: `Top ${userRank}`,
      earned: true,
    })
  }
  
  // Speed badge (if any submission has low time)
  const hasFastSubmission = userSubmissions.some(
    (s) => s.metrics?.time && s.metrics.time < 5
  )
  if (hasFastSubmission) {
    badges.push({
      icon: <Zap className="h-5 w-5" />,
      label: "Speed Demon",
      earned: true,
    })
  }
  
  if (badges.length === 0) {
    return null
  }
  
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <span className="text-sm font-medium text-muted-foreground">Badges:</span>
      {badges.map((badge, index) => (
        <div
          key={index}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-background hover:bg-accent transition-colors"
          title={badge.label}
        >
          <div className="text-yellow-600">{badge.icon}</div>
          <span className="text-xs font-medium">{badge.label}</span>
        </div>
      ))}
    </div>
  )
}
