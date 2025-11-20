"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ProblemGroupedSubmissions, Submission } from "./types"
import { UserTooltip } from "./user-tooltip"
import { CodeViewer } from "./code-viewer"
import { Eye } from "lucide-react"
import { cn } from "@/lib/utils"

interface SubmissionsByProblemProps {
  groupedSubmissions: ProblemGroupedSubmissions[]
}

export function SubmissionsByProblem({ groupedSubmissions }: SubmissionsByProblemProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [isCodeViewerOpen, setIsCodeViewerOpen] = useState(false)

  if (!groupedSubmissions || groupedSubmissions.length === 0) {
    return (
      <p className="text-muted-foreground p-4 text-center">
        No submissions found.
      </p>
    )
  }

  const handleViewSubmission = (submission: Submission) => {
    setSelectedSubmission(submission)
    setIsCodeViewerOpen(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusColor = (status: string | null) => {
    if (!status) return "text-gray-500"
    const statusLower = status.toLowerCase()
    if (statusLower === "success" || statusLower === "accepted") return "text-green-600"
    if (statusLower === "failed" || statusLower === "rejected") return "text-red-600"
    if (statusLower === "pending") return "text-yellow-600"
    if (statusLower === "running") return "text-blue-600"
    return "text-gray-500"
  }

  // Helper function to get all unique metric keys from a group of submissions
  const getMetricKeys = (submissions: typeof groupedSubmissions[0]['submissions']): string[] => {
    const keysSet = new Set<string>()
    submissions.forEach((submission) => {
      if (submission.metrics) {
        Object.keys(submission.metrics).forEach((key) => keysSet.add(key))
      }
    })
    return Array.from(keysSet).sort()
  }

  // Helper function to format metric value
  const formatMetricValue = (value: any): string => {
    if (typeof value === 'number') {
      // Format numbers nicely (integers vs decimals)
      return Number.isInteger(value) ? value.toString() : value.toFixed(2)
    }
    return String(value)
  }

  // Helper function to get display name from profile
  const getDisplayName = (submission: typeof groupedSubmissions[0]['submissions'][0]): string => {
    const profile = submission.profiles
    if (profile) {
      return profile.display_name || profile.full_name || profile.username || "User"
    }
    return "User"
  }

  return (
    <div className="flex flex-row-reverse gap-4 items-start">
      {/* Code Viewer Panel - Slides in from right */}
      <CodeViewer
        submission={selectedSubmission}
        open={isCodeViewerOpen}
        onOpenChange={setIsCodeViewerOpen}
      />
      
      {/* Tables Section - Shrinks when code viewer is open */}
      <div className={cn(
        "space-y-8 transition-all duration-300 ease-in-out",
        isCodeViewerOpen ? "flex-1 min-w-0" : "w-full"
      )}>
        {groupedSubmissions.map((group) => {
          // Get unique metric keys for this problem group
          const metricKeys = getMetricKeys(group.submissions)

          return (
            <div key={group.problem_id} className="space-y-2">
              <h3 className="text-lg font-semibold">
                {group.problem_title 
                  ? `Problem #${group.problem_number}: ${group.problem_title}`
                  : `Problem: ${group.problem_id.slice(0, 8)}...`}
              </h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      {/* Dynamic metric columns */}
                      {metricKeys.map((metricKey) => (
                        <TableHead key={metricKey} className="text-right">
                          {metricKey.charAt(0).toUpperCase() + metricKey.slice(1)}
                        </TableHead>
                      ))}
                      <TableHead className="text-right">Submitted</TableHead>
                      <TableHead className="w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.submissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell>
                          <UserTooltip profile={submission.profiles} user_id={submission.user_id}>
                            <span className="font-medium hover:underline cursor-help">
                              {getDisplayName(submission)}
                            </span>
                          </UserTooltip>
                        </TableCell>
                        <TableCell>
                          <span className={getStatusColor(submission.status)}>
                            {submission.status || "Pending"}
                          </span>
                        </TableCell>
                        {/* Dynamic metric cells */}
                        {metricKeys.map((metricKey) => (
                          <TableCell key={metricKey} className="text-right">
                            {submission.metrics && submission.metrics[metricKey] !== undefined
                              ? formatMetricValue(submission.metrics[metricKey])
                              : <span className="text-gray-400">-</span>}
                          </TableCell>
                        ))}
                        <TableCell className="text-right text-sm">
                          {formatDate(submission.created_at)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewSubmission(submission)}
                            className="gap-2 cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                            View Code
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
