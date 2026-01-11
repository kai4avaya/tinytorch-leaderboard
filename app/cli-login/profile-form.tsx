'use client'

import { useState, useRef, useTransition, useEffect } from 'react'
import { updateProfile, skipProfile } from './actions'
import { Loader2, Camera, Upload, Link as LinkIcon, User, MapPin, Globe, Building, FileText } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { InteractiveFlame } from '@/components/interactive-flame'

export function ProfileForm({ 
  redirectPort, 
  redirectTo,
  user,
  initialProfile
}: { 
  redirectPort: string
  redirectTo?: string
  user: any
  initialProfile?: any
}) {
  const [isPending, startTransition] = useTransition()
  
  // Default Avatar Logic
  const defaultAvatar = `https://api.dicebear.com/9.x/bottts/svg?seed=${user?.id || 'tinytorch'}`
  const initialAvatar = initialProfile?.avatar_url || defaultAvatar
  
  const [avatarMode, setAvatarMode] = useState<'upload' | 'camera' | 'link'>('upload')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialAvatar)
  const [avatarUrl, setAvatarUrl] = useState<string>(initialAvatar)
  
  // Form State
  const [displayName, setDisplayName] = useState(initialProfile?.display_name || user?.user_metadata?.full_name || '')
  const [username, setUsername] = useState(initialProfile?.username || user?.user_metadata?.user_name || '')
  const [institution, setInstitution] = useState(initialProfile?.institution?.[0] || '')
  const [website, setWebsite] = useState(initialProfile?.website?.[0] || '')
  const [summary, setSummary] = useState(initialProfile?.summary || '')
  const [subscribe, setSubscribe] = useState<boolean>(initialProfile?.subscribe ?? true)

  // Location State
  const [location, setLocation] = useState<string>(initialProfile?.location || '')
  const [lat, setLat] = useState<number | null>(initialProfile?.latitude || null)
  const [lon, setLon] = useState<number | null>(initialProfile?.longitude || null)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearchingLocation, setIsSearchingLocation] = useState(false)

  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const locationInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocation(value)
    setLat(null)
    setLon(null)
    
    if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current)

    if (value.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setIsSearchingLocation(true)
    suggestionTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}`)
        if (res.ok) {
          const data = await res.json()
          setSuggestions(data.slice(0, 5))
          setShowSuggestions(true)
        }
      } catch (err) {
        console.error("Location search failed", err)
      } finally {
        setIsSearchingLocation(false)
      }
    }, 500)
  }

  const selectLocation = (place: any) => {
    setLocation(place.display_name)
    setLat(parseFloat(place.lat))
    setLon(parseFloat(place.lon))
    setShowSuggestions(false)
    setSuggestions([])
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationInputRef.current && !locationInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be smaller than 2MB' })
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file)

      if (uploadError) throw uploadError

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
      if (videoRef.current) videoRef.current.srcObject = stream
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
    if (avatarMode === 'camera') startCamera()
    else stopCamera()
    return () => stopCamera()
  }, [avatarMode])

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage(null)
    const formData = new FormData(event.currentTarget)

    // Set default institution if empty
    if (!institution.trim()) {
      formData.set('institution', 'Independent')
    }

    startTransition(async () => {
      try {
        const result = await updateProfile(formData)
        if (result?.error) {
          setMessage({ type: 'error', text: result.error })
        } else if (result?.redirectUrl) {
          // Use window.location.href to force navigation to localhost
          window.location.href = result.redirectUrl
        }
      } catch (e) {
        if ((e as Error).message === 'NEXT_REDIRECT') throw e
        setMessage({ type: 'error', text: 'An unexpected error occurred' })
      }
    })
  }

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row bg-white dark:bg-zinc-900">
      {/* LEFT: FORM */}
      <div className="flex w-full md:w-1/2 flex-col justify-start p-6 md:p-12 pt-8 md:pt-12 overflow-y-auto max-h-screen">
        <div className="mx-auto w-full max-w-lg">
          <div className="mb-8 text-left">
            <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
              🔥 Tiny 🔥 Torch: Complete Your Profile
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400">Tell us a bit about yourself to get started</p>
          </div>

          {message && (
            <div className={`mb-4 rounded-md p-4 ${message.type === 'error' ? 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400'}`}>
              <p className="text-sm">{message.text}</p>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <input type="hidden" name="redirect_port" value={redirectPort} />
            <input type="hidden" name="avatar_url" value={avatarUrl} />
            <input type="hidden" name="latitude" value={lat || ''} />
            <input type="hidden" name="longitude" value={lon || ''} />
            <input type="hidden" name="subscribe" value={subscribe.toString()} />

            {/* Avatar Section */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Profile Picture</label>
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 shrink-0">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-400"><User size={32} /></div>
                  )}
                </div>
                <div className="flex-1 space-y-2 w-full">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm ${avatarMode === 'upload' ? 'bg-black text-white dark:bg-zinc-50 dark:text-black' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'}`}
                    >
                      <Upload size={16} /> Upload
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    
                    <button
                      type="button"
                      onClick={() => setAvatarMode('camera')}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm ${avatarMode === 'camera' ? 'bg-black text-white dark:bg-zinc-50 dark:text-black' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'}`}
                    >
                      <Camera size={16} /> <span className="hidden sm:inline">Camera</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAvatarMode('link')}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm ${avatarMode === 'link' ? 'bg-black text-white dark:bg-zinc-50 dark:text-black' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'}`}
                    >
                      <LinkIcon size={16} /> <span className="hidden sm:inline">Link</span>
                    </button>
                  </div>

                  {avatarMode === 'camera' && (
                    <div className="relative overflow-hidden rounded-lg bg-black mt-2">
                      <video ref={videoRef} autoPlay playsInline className="h-48 w-full object-cover" />
                      <canvas ref={canvasRef} width="300" height="300" className="hidden" />
                      <button type="button" onClick={capturePhoto} className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white p-2 text-black shadow-lg hover:bg-zinc-200"><Camera size={20} /></button>
                    </div>
                  )}
                  {avatarMode === 'link' && (
                    <input type="url" placeholder="https://example.com/avatar.jpg" onChange={(e) => { setAvatarUrl(e.target.value); setAvatarPreview(e.target.value) }} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 mt-2" />
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Username */}
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Username <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                  <input type="text" name="username" required value={username} onChange={e => setUsername(e.target.value)} placeholder="username" className="w-full rounded-md border border-zinc-300 bg-white pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-black dark:border-zinc-700 dark:bg-zinc-800 dark:focus:ring-zinc-500" />
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <label htmlFor="full_name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Display Name <span className="text-red-500">*</span></label>
                <input type="text" name="full_name" required value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="John Doe" className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-black dark:border-zinc-700 dark:bg-zinc-800 dark:focus:ring-zinc-500" />
              </div>

              {/* Location with Autocomplete */}
              <div className="col-span-full space-y-2 relative" ref={locationInputRef}>
                <label htmlFor="location" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Location <span className="text-red-500">*</span></label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                  <input 
                    type="text" 
                    name="location" 
                    required 
                    value={location} 
                    onChange={handleLocationChange} 
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    placeholder="Start typing city..." 
                    autoComplete="off"
                    className="w-full rounded-md border border-zinc-300 bg-white pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-black dark:border-zinc-700 dark:bg-zinc-800 dark:focus:ring-zinc-500" 
                  />
                  {isSearchingLocation && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="animate-spin text-zinc-400" size={16} />
                    </div>
                  )}
                </div>
                
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                    <ul className="max-h-60 overflow-auto py-1">
                      {suggestions.map((place, i) => (
                        <li 
                          key={i} 
                          onClick={() => selectLocation(place)}
                          className="cursor-pointer px-4 py-2 text-sm hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          {place.display_name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Institution */}
              <div className="col-span-full space-y-2">
                <label htmlFor="institution" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Institution</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                  <input type="text" name="institution" value={institution} onChange={e => setInstitution(e.target.value)} placeholder="University or Company (Optional)" className="w-full rounded-md border border-zinc-300 bg-white pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-black dark:border-zinc-700 dark:bg-zinc-800 dark:focus:ring-zinc-500" />
                </div>
              </div>

              {/* Website */}
              <div className="col-span-full space-y-2">
                <label htmlFor="website" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Website</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                  <input type="url" name="website" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://your-website.com" className="w-full rounded-md border border-zinc-300 bg-white pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-black dark:border-zinc-700 dark:bg-zinc-800 dark:focus:ring-zinc-500" />
                </div>
              </div>

              {/* Bio */}
              <div className="col-span-full space-y-2">
                <label htmlFor="summary" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Bio</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 text-zinc-400" size={16} />
                  <textarea name="summary" rows={3} value={summary} onChange={e => setSummary(e.target.value)} placeholder="Tell us about yourself..." className="w-full rounded-md border border-zinc-300 bg-white pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-black dark:border-zinc-700 dark:bg-zinc-800 dark:focus:ring-zinc-500" />
                </div>
              </div>

              {/* Subscribe Checkbox */}
              <div className="col-span-full flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="subscribe"
                  checked={subscribe}
                  onChange={(e) => setSubscribe(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-black focus:ring-black dark:border-zinc-700 dark:bg-zinc-800 dark:focus:ring-zinc-500"
                />
                <label htmlFor="subscribe" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-700 dark:text-zinc-300">
                  Subscribe to our mailing list
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="submit" disabled={isPending} className="flex-1 rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200 dark:focus:ring-zinc-500">
                {isPending ? <Loader2 className="mx-auto animate-spin" size={20} /> : 'Complete Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* RIGHT: FLAME */}
      <div className="hidden md:flex w-full md:w-1/2 flex-col items-center justify-center bg-zinc-950 border-l border-zinc-800 min-h-screen sticky top-0">
          <InteractiveFlame />
      </div>
    </div>
  )
}