"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/utils/supabase/client"

interface User {
  id: string
  email?: string
  created_at?: string
}

interface Profile {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  is_public: boolean
  institution: string[] | null
  website: string[] | null
  websites: string[] | null
  full_name: string | null
  email: string | null
  summary: string | null
  location: string | null
  contact_json: Record<string, any> | null
}

interface ProfileModalProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileModal({ user, open, onOpenChange }: ProfileModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [formData, setFormData] = useState({
    username: "",
    display_name: "",
    full_name: "",
    avatar_url: "",
    summary: "",
    location: "",
    institution: "",
    websites: "",
    is_public: false,
  })

  const supabase = createClient()

  // Fetch profile when modal opens
  useEffect(() => {
    if (open && user) {
      fetchProfile()
    }
  }, [open, user])

  const fetchProfile = async () => {
    if (!user) return
    
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching profile:", error)
    }

    if (data) {
      setProfile(data)
      setFormData({
        username: data.username || "",
        display_name: data.display_name || "",
        full_name: data.full_name || "",
        avatar_url: data.avatar_url || "",
        summary: data.summary || "",
        location: data.location || "",
        institution: Array.isArray(data.institution) ? data.institution.join(", ") : "",
        websites: Array.isArray(data.websites) ? data.websites.join(", ") : "",
        is_public: data.is_public || false,
      })
    } else {
      // Initialize with empty values if no profile exists
      setFormData({
        username: "",
        display_name: "",
        full_name: "",
        avatar_url: "",
        summary: "",
        location: "",
        institution: "",
        websites: "",
        is_public: false,
      })
    }
  }

  const handleSave = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const updateData = {
        username: formData.username || null,
        display_name: formData.display_name || null,
        full_name: formData.full_name || null,
        avatar_url: formData.avatar_url || null,
        summary: formData.summary || null,
        location: formData.location || null,
        institution: formData.institution
          ? formData.institution.split(",").map((s) => s.trim()).filter(Boolean)
          : null,
        websites: formData.websites
          ? formData.websites.split(",").map((s) => s.trim()).filter(Boolean)
          : null,
        is_public: formData.is_public,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          ...updateData,
        })

      if (error) {
        console.error("Error saving profile:", error)
        alert("Failed to save profile. Please try again.")
      } else {
        setIsEditing(false)
        await fetchProfile() // Refresh profile data
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Failed to save profile. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Edit your profile information"
              : "View and edit your profile information"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* User ID - Read Only */}
          <div className="space-y-2">
            <Label>User ID</Label>
            <Input
              value={user.id}
              disabled
              className="font-mono text-xs bg-muted"
            />
          </div>

          {/* Email - Read Only */}
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              value={user.email || ""}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed
            </p>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            {isEditing ? (
              <Input
                id="username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                placeholder="Enter username"
              />
            ) : (
              <Input value={profile?.username || "Not set"} disabled className="bg-muted" />
            )}
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="display_name">Display Name</Label>
            {isEditing ? (
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) =>
                  setFormData({ ...formData, display_name: e.target.value })
                }
                placeholder="Enter display name"
              />
            ) : (
              <Input value={profile?.display_name || "Not set"} disabled className="bg-muted" />
            )}
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            {isEditing ? (
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                placeholder="Enter full name"
              />
            ) : (
              <Input value={profile?.full_name || "Not set"} disabled className="bg-muted" />
            )}
          </div>

          {/* Avatar URL */}
          <div className="space-y-2">
            <Label htmlFor="avatar_url">Avatar URL</Label>
            {isEditing ? (
              <Input
                id="avatar_url"
                value={formData.avatar_url}
                onChange={(e) =>
                  setFormData({ ...formData, avatar_url: e.target.value })
                }
                placeholder="https://example.com/avatar.jpg"
              />
            ) : (
              <Input value={profile?.avatar_url || "Not set"} disabled className="bg-muted" />
            )}
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            {isEditing ? (
              <Textarea
                id="summary"
                value={formData.summary}
                onChange={(e) =>
                  setFormData({ ...formData, summary: e.target.value })
                }
                placeholder="Tell us about yourself..."
                rows={4}
              />
            ) : (
              <Textarea
                value={profile?.summary || "Not set"}
                disabled
                className="bg-muted"
                rows={4}
              />
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            {isEditing ? (
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="City, Country"
              />
            ) : (
              <Input value={profile?.location || "Not set"} disabled className="bg-muted" />
            )}
          </div>

          {/* Institution */}
          <div className="space-y-2">
            <Label htmlFor="institution">Institution (comma-separated)</Label>
            {isEditing ? (
              <Input
                id="institution"
                value={formData.institution}
                onChange={(e) =>
                  setFormData({ ...formData, institution: e.target.value })
                }
                placeholder="University, Company, etc."
              />
            ) : (
              <Input
                value={
                  Array.isArray(profile?.institution)
                    ? profile.institution.join(", ")
                    : "Not set"
                }
                disabled
                className="bg-muted"
              />
            )}
          </div>

          {/* Websites */}
          <div className="space-y-2">
            <Label htmlFor="websites">Websites (comma-separated)</Label>
            {isEditing ? (
              <Input
                id="websites"
                value={formData.websites}
                onChange={(e) =>
                  setFormData({ ...formData, websites: e.target.value })
                }
                placeholder="https://example.com, https://github.com/username"
              />
            ) : (
              <Input
                value={
                  Array.isArray(profile?.websites)
                    ? profile.websites.join(", ")
                    : "Not set"
                }
                disabled
                className="bg-muted"
              />
            )}
          </div>

          {/* Public Profile */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_public"
              checked={formData.is_public}
              onChange={(e) =>
                setFormData({ ...formData, is_public: e.target.checked })
              }
              disabled={!isEditing}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="is_public" className="cursor-pointer">
              Make profile public
            </Label>
          </div>
        </div>

        <DialogFooter>
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false)
                  fetchProfile() // Reset form
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
