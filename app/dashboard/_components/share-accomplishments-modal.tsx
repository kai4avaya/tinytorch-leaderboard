"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trophy, Star, Award, Target, Zap, Linkedin, Code, Download, Share2 } from "lucide-react"
import { Submission } from "./types"

interface User {
  id: string
  email?: string
  display_name?: string
}

interface ShareAccomplishmentsModalProps {
  user: User
  submissions: Submission[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShareAccomplishmentsModal({
  user,
  submissions,
  open,
  onOpenChange,
}: ShareAccomplishmentsModalProps) {
  const [copied, setCopied] = useState(false)

  // Filter user's submissions
  const userSubmissions = submissions.filter((s) => s.user_id === user.id)
  
  // Calculate achievements
  const totalSubmissions = userSubmissions.length
  const acceptedSubmissions = userSubmissions.filter(
    (s) => s.status?.toLowerCase() === "accepted" || s.status?.toLowerCase() === "success"
  ).length
  
  // Fake badges for now (we'll enhance this later)
  const fakeBadges = [
    { icon: Star, label: "First Submission", color: "text-yellow-500", bg: "bg-yellow-50" },
    { icon: Award, label: "3 Submissions", color: "text-blue-500", bg: "bg-blue-50" },
    { icon: Target, label: "10 Submissions", color: "text-green-500", bg: "bg-green-50" },
    { icon: Trophy, label: "Top Performer", color: "text-purple-500", bg: "bg-purple-50" },
    { icon: Zap, label: "Speed Demon", color: "text-orange-500", bg: "bg-orange-50" },
  ]

  const handleShareLinkedIn = () => {
    // Fake for now
    alert("Share to LinkedIn feature coming soon!")
  }

  const handleEmbed = () => {
    // Fake for now
    const embedCode = `<iframe src="https://tinytorch.netlify.app/share/${user.id}" width="600" height="400"></iframe>`
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadPDF = () => {
    // Fake for now
    alert("Download as PDF feature coming soon!")
  }

  const handleCopyLink = () => {
    const shareLink = `${window.location.origin}/share/${user.id}`
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Share Your Accomplishments</DialogTitle>
          <DialogDescription>
            Showcase your achievements and progress on TinyTorch
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* User Summary */}
          <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-purple-50 p-6">
            <h3 className="text-xl font-semibold mb-4">Your Achievements</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{totalSubmissions}</div>
                <div className="text-sm text-muted-foreground mt-1">Total Submissions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{acceptedSubmissions}</div>
                <div className="text-sm text-muted-foreground mt-1">Accepted</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {Math.round((acceptedSubmissions / Math.max(totalSubmissions, 1)) * 100)}%
                </div>
                <div className="text-sm text-muted-foreground mt-1">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{fakeBadges.length}</div>
                <div className="text-sm text-muted-foreground mt-1">Badges Earned</div>
              </div>
            </div>
          </div>

          {/* Badges Display */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Your Badges</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {fakeBadges.map((badge, index) => {
                const Icon = badge.icon
                return (
                  <div
                    key={index}
                    className={`${badge.bg} rounded-lg border-2 border-dashed p-4 text-center transition-all hover:scale-105 hover:shadow-md`}
                  >
                    <div className={`${badge.color} mb-2 flex justify-center`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <div className="text-sm font-medium">{badge.label}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Share Options */}
          <div className="border-t pt-6">
            <h3 className="text-xl font-semibold mb-4">Share Your Accomplishments</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                onClick={handleShareLinkedIn}
                variant="outline"
                className="w-full justify-start gap-2"
              >
                <Linkedin className="h-4 w-4" />
                Share to LinkedIn
              </Button>
              <Button
                onClick={handleEmbed}
                variant="outline"
                className="w-full justify-start gap-2"
              >
                <Code className="h-4 w-4" />
                {copied ? "Copied!" : "Get Embed Code"}
              </Button>
              <Button
                onClick={handleDownloadPDF}
                variant="outline"
                className="w-full justify-start gap-2"
              >
                <Download className="h-4 w-4" />
                Download as PDF
              </Button>
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="w-full justify-start gap-2"
              >
                <Share2 className="h-4 w-4" />
                {copied ? "Link Copied!" : "Copy Share Link"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
