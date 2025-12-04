'use client'

import { useState, useRef, useTransition, useEffect } from 'react'
import { updateProfile, skipProfile } from './actions'
import { Loader2, Camera, Upload, Link as LinkIcon, User, MapPin, Globe, Building, FileText } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export function ProfileForm({ 
  redirectPort, 
  user 
}: { 
  redirectPort: string
  user: any 
}) {
  const [isPending, startTransition] = useTransition()
  const [avatarMode, setAvatarMode] = useState<'upload' | 'camera' | 'link'>('upload')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [location, setLocation] = useState<string>('')
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)

  // Try to infer location
  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data.city && data.country_name) {
          setLocation(`${data.city}, ${data.country_name}`)
        }
      })
      .catch(() => {
        // Silent fail, user can enter manually
      })
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Simple client-side validation
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      setMessage({ type: 'error', text: 'Image must be smaller than 2MB' })
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to Supabase Storage
    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(fileName, file)

      if (uploadError) {
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      setAvatarUrl(publicUrl)
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to upload image: ' + error.message })
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      setCameraStream(stream)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Could not access camera' })
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d')
      if (context) {
        context.drawImage(videoRef.current, 0, 0, 300, 300)
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.7)
        setAvatarPreview(dataUrl)
        stopCamera()
        
        // Convert to blob and upload
        fetch(dataUrl)
          .then(res => res.blob())
          .then(async blob => {
            const supabase = createClient()
            const fileName = `${user.id}-${Math.random()}.jpg`
            const { error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(fileName, blob)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
              .from('avatars')
              .getPublicUrl(fileName)

            setAvatarUrl(publicUrl)
          })
          .catch(err => setMessage({ type: 'error', text: 'Failed to upload photo' }))
      }
    }
  }

  useEffect(() => {
    if (avatarMode === 'camera') {
      startCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [avatarMode])

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage(null)
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      try {
        const result = await updateProfile(formData)
        if (result?.error) {
          setMessage({ type: 'error', text: result.error })
        }
      } catch (e) {
         // Next.js redirects throw an error, so we need to catch it
        if ((e as Error).message === 'NEXT_REDIRECT') {
          throw e
        }
        setMessage({ type: 'error', text: 'An unexpected error occurred' })
      }
    })
  }

  const handleSkip = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    setMessage(null)
    // Create a FormData object with minimal required fields
    const formData = new FormData()
    formData.set('redirect_port', redirectPort)
    if (location) formData.set('location', location)

    startTransition(async () => {
      try {
        const result = await skipProfile(formData)
        if (result?.error) {
          setMessage({ type: 'error', text: result.error })
        }
      } catch (e) {
         // Next.js redirects throw an error
        if ((e as Error).message === 'NEXT_REDIRECT') {
          throw e
        }
        setMessage({ type: 'error', text: 'An unexpected error occurred' })
      }
    })
  }

  return (
    <div className="w-full max-w-2xl rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-8 text-center">
        <img 
          src="/logo-tinytorch.png" 
          alt="Tiny Torch Logo" 
          className="mx-auto h-16 w-auto"
        />
        <h1 className="mt-4 text-2xl font-semibold text-black dark:text-zinc-50">
          Complete Your Profile
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Tell us a bit about yourself to get started
        </p>
      </div>

      {message && (
        <div
          className={`mb-4 rounded-md p-4 ${
            message.type === 'error'
              ? 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              : 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400'
          }`}
        >
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <input type="hidden" name="redirect_port" value={redirectPort} />
        <input type="hidden" name="avatar_url" value={avatarUrl} />

        {/* Avatar Section */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Profile Picture
          </label>
          
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-zinc-400">
                  <User size={32} />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAvatarMode('upload')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm ${
                    avatarMode === 'upload' 
                      ? 'bg-black text-white dark:bg-zinc-50 dark:text-black' 
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                  }`}
                >
                  <Upload size={16} /> Upload
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarMode('camera')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm ${
                    avatarMode === 'camera' 
                      ? 'bg-black text-white dark:bg-zinc-50 dark:text-black' 
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                  }`}
                >
                  <Camera size={16} /> Camera
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarMode('link')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm ${
                    avatarMode === 'link' 
                      ? 'bg-black text-white dark:bg-zinc-50 dark:text-black' 
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                  }`}
                >
                  <LinkIcon size={16} /> URL
                </button>
              </div>

              {avatarMode === 'upload' && (
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-zinc-500 file:mr-4 file:rounded-md file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-zinc-700 hover:file:bg-zinc-200 dark:file:bg-zinc-800 dark:file:text-zinc-300"
                />
              )}

              {avatarMode === 'camera' && (
                <div className="relative overflow-hidden rounded-lg bg-black">
                  <video ref={videoRef} autoPlay playsInline className="h-48 w-full object-cover" />
                  <canvas ref={canvasRef} width="300" height="300" className="hidden" />
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white p-2 text-black shadow-lg hover:bg-zinc-200"
                  >
                    <Camera size={20} />
                  </button>
                </div>
              )}

              {avatarMode === 'link' && (
                <input
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  onChange={(e) => {
                    setAvatarUrl(e.target.value)
                    setAvatarPreview(e.target.value)
                  }}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                />
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Username *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input
                type="text"
                name="username"
                required
                placeholder="username"
                className="w-full rounded-md border border-zinc-300 bg-white pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-black dark:border-zinc-700 dark:bg-zinc-800 dark:focus:ring-zinc-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="full_name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Full Name
            </label>
            <input
              type="text"
              name="full_name"
              placeholder="John Doe"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-black dark:border-zinc-700 dark:bg-zinc-800 dark:focus:ring-zinc-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="location" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input
                type="text"
                name="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, Country"
                className="w-full rounded-md border border-zinc-300 bg-white pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-black dark:border-zinc-700 dark:bg-zinc-800 dark:focus:ring-zinc-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="institution" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Institution
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input
                type="text"
                name="institution"
                placeholder="University or Company"
                className="w-full rounded-md border border-zinc-300 bg-white pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-black dark:border-zinc-700 dark:bg-zinc-800 dark:focus:ring-zinc-500"
              />
            </div>
          </div>

          <div className="col-span-full space-y-2">
            <label htmlFor="website" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Website
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input
                type="url"
                name="website"
                placeholder="https://your-website.com"
                className="w-full rounded-md border border-zinc-300 bg-white pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-black dark:border-zinc-700 dark:bg-zinc-800 dark:focus:ring-zinc-500"
              />
            </div>
          </div>

          <div className="col-span-full space-y-2">
            <label htmlFor="summary" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Bio
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-zinc-400" size={16} />
              <textarea
                name="summary"
                rows={3}
                placeholder="Tell us about yourself..."
                className="w-full rounded-md border border-zinc-300 bg-white pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-black dark:border-zinc-700 dark:bg-zinc-800 dark:focus:ring-zinc-500"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleSkip}
            disabled={isPending}
            className="flex-1 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700 dark:focus:ring-zinc-500"
          >
            Skip for now
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200 dark:focus:ring-zinc-500"
          >
            {isPending ? <Loader2 className="mx-auto animate-spin" size={20} /> : 'Create Profile'}
          </button>
        </div>
      </form>
    </div>
  )
}
