"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Profile } from "./types"
import { MapPin, Building2, Link2, Mail } from "lucide-react"

interface UserTooltipProps {
  profile: Profile | null | undefined
  user_id: string
  children: React.ReactNode
}

export function UserTooltip({ profile, user_id, children }: UserTooltipProps) {
  // If no profile, just show children without tooltip
  if (!profile) {
    return <>{children}</>
  }

  // Combine websites arrays (some profiles might have both 'website' and 'websites')
  const allWebsites = [
    ...(profile.websites || []),
    ...(profile.website || []),
  ].filter(Boolean)

  const displayName = profile.display_name || profile.full_name || profile.username || "User"
  const isPublic = profile.is_public

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent className="max-w-sm p-4" side="top">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start gap-3">
              {profile.avatar_url && (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{displayName}</h4>
                {profile.username && (
                  <p className="text-xs text-muted-foreground">@{profile.username}</p>
                )}
              </div>
            </div>

            {/* Summary - only show if public */}
            {isPublic && profile.summary && (
              <p className="text-sm text-muted-foreground">{profile.summary}</p>
            )}

            {/* Location - only show if public */}
            {isPublic && profile.location && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span>{profile.location}</span>
              </div>
            )}

            {/* Institution - only show if public */}
            {isPublic && profile.institution && profile.institution.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3 flex-shrink-0" />
                <span>{profile.institution.join(", ")}</span>
              </div>
            )}

            {/* Websites - only show if public */}
            {isPublic && allWebsites.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Link2 className="h-3 w-3" />
                  <p className="text-xs font-medium">Links:</p>
                </div>
                <div className="flex flex-wrap gap-2 pl-5">
                  {allWebsites.map((url, index) => {
                    // Ensure URL has protocol
                    const fullUrl = url.startsWith('http') ? url : `https://${url}`
                    return (
                      <a
                        key={index}
                        href={fullUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline break-all"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {url}
                      </a>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Email - only show if public */}
            {isPublic && profile.email && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3 w-3 flex-shrink-0" />
                <span>{profile.email}</span>
              </div>
            )}

            {/* Show privacy notice if not public */}
            {!isPublic && (
              <p className="text-xs text-muted-foreground italic">
                Profile is private
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
