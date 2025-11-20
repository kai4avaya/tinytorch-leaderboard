"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ProfileModal } from "./profile-modal"
import { UserBadges } from "./user-badges"
import { Submission } from "./types"

interface User {
  id: string
  email?: string
  created_at?: string
}

interface UserHeaderProps {
  user: User
  allSubmissions: Submission[]
}

export function UserHeader({ user, allSubmissions }: UserHeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <>
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {user.email || "User"}
            </p>
          </div>
          <Button onClick={() => setProfileOpen(true)} variant="outline">
            Profile
          </Button>
        </div>
        
        <UserBadges submissions={allSubmissions} userId={user.id} />
      </div>
      
      <ProfileModal
        user={user}
        open={profileOpen}
        onOpenChange={setProfileOpen}
      />
    </>
  )
}
