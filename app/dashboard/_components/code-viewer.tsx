"use client"

import { useState } from "react"
import { PrismAsync as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism"
import { Button } from "@/components/ui/button"
import { Copy, Download, X } from "lucide-react"
import { Submission } from "./types"
import { cn } from "@/lib/utils"

interface CodeViewerProps {
  submission: Submission | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CodeViewer({ submission, open, onOpenChange }: CodeViewerProps) {
  const [copied, setCopied] = useState(false)

  if (!submission) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(submission.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleDownload = () => {
    const extension = submission.language === "python" ? "py" : "txt"
    const filename = `submission-${submission.id.slice(0, 8)}.${extension}`
    const blob = new Blob([submission.code], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Get display name for the user
  const getUserDisplayName = () => {
    const profile = submission.profiles
    if (profile) {
      return profile.display_name || profile.full_name || profile.username || "User"
    }
    return "User"
  }

  return (
    <div
      className={cn(
        "rounded-md border bg-background flex flex-col transition-all duration-300 ease-in-out flex-shrink-0",
        open ? "w-full lg:w-1/2 min-h-[600px]" : "w-0 overflow-hidden border-0"
      )}
      style={open ? { maxHeight: "calc(100vh - 200px)" } : {}}
    >
      {open && (
        <>
          {/* Header */}
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold">Submission Code</h3>
              <p className="text-sm text-muted-foreground mt-1 truncate">
                {getUserDisplayName()} • {submission.language || "Unknown"} • {new Date(submission.created_at).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2 ml-4 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-9 w-9 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Code Content */}
          <div className="flex-1 overflow-auto bg-background min-h-0">
            <SyntaxHighlighter
              language={submission.language?.toLowerCase() || "python"}
              style={oneLight}
              customStyle={{
                margin: 0,
                padding: "1.5rem",
                background: "transparent",
                fontSize: "0.875rem",
                minHeight: "100%",
              }}
              showLineNumbers
              lineNumberStyle={{
                minWidth: "3em",
                paddingRight: "1em",
                color: "#999",
                userSelect: "none",
              }}
              PreTag="div"
            >
              {submission.code}
            </SyntaxHighlighter>
          </div>
        </>
      )}
    </div>
  )
}
