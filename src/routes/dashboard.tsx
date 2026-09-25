import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useRef, useState, type ChangeEvent } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuthInfo } from "@propelauth/react"
import { Button } from "@/components/ui/button"
import ThemeToggle from "@/components/ui/theme-toggle"
import api, { configureBearer } from "@/lib/api"

export const Route = createFileRoute("/dashboard")({ component: Dashboard })

type User = {
  id?: string
  displayName?: string
  email?: string
  avatarUrl?: string
}

function Dashboard() {
  const { accessToken, isLoggedIn, loading: authLoading } = useAuthInfo()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)

  useEffect(() => {
    configureBearer(accessToken ?? null)
  }, [accessToken])

  useEffect(() => {
    let mounted = true

    if (!isLoggedIn || !accessToken) {
      setUser(null)
      setLoading(false)
      setError(null)
      return () => {
        mounted = false
      }
    }

    ;(async () => {
      try {
        const res = await api.me.readUser({})
        if (!mounted) return
        setUser(res.data || null)
      } catch (err: any) {
        if (!mounted) return
        setError(String(err?.message || err))
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [accessToken, isLoggedIn])

  const handleLogout = () => {
    const authUrl = import.meta.env.VITE_AUTH_URL ?? ""
    if (!authUrl || typeof window === "undefined") return
    const redirect = window.location.origin
    window.location.href = `${authUrl.replace(/\/$/, "")}/logout?redirect=${encodeURIComponent(
      redirect
    )}`
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="w-full border-b border-border bg-card px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setUploadOpen(true)}>
              Upload audio
            </Button>
            <ThemeToggle className="mr-2" />
            {authLoading || loading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : user ? (
              <div className="flex items-center gap-3">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName || "avatar"}
                    className="size-8 rounded-full"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground">
                    {user.displayName?.slice(0, 2).toUpperCase() ||
                      user.email?.slice(0, 2).toUpperCase() ||
                      "U"}
                  </div>
                )}
                <div className="hidden text-sm sm:block">
                  {user.displayName || user.email}
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Log out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground">
                  G
                </div>
                <div className="hidden text-sm text-muted-foreground sm:block">
                  Guest
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-6">
        <h2 className="text-xl font-medium">Dashboard</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Welcome to your dashboard.
        </p>

        <AudiosTable />
      </main>

      <UploadAudioDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  )
}

export default Route

function relativeTime(dateString?: string) {
  if (!dateString) return "-"
  const then = new Date(dateString).getTime()
  const diff = Date.now() - then
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const d = Math.floor(hr / 24)
  return `${d}d ago`
}

function UploadAudioDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const { isLoggedIn } = useAuthInfo()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const soundEffectInputRef = useRef<HTMLInputElement | null>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [useBeep, setUseBeep] = useState(false)
  const [customWords, setCustomWords] = useState("")
  const [selectedSoundEffectId, setSelectedSoundEffectId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const { data: soundEffects = [] } = useQuery({
    queryKey: ["sound-effects"],
    enabled: open && isLoggedIn,
    queryFn: async () => {
      const res = await api.sfx.readAllSoundEffects({})
      return res.data || []
    },
    staleTime: 30_000,
  })

  const resetState = () => {
    setSelectedFile(null)
    setUseBeep(false)
    setCustomWords("")
    setSelectedSoundEffectId("")
    setUploadError(null)
    setIsSubmitting(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (soundEffectInputRef.current) soundEffectInputRef.current.value = ""
  }

  const closeDialog = () => {
    resetState()
    onOpenChange(false)
  }

  const handleAudioFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    if (!file) return
    setSelectedFile(file)
    setUploadError(null)
    event.target.value = ""
  }

  const handleSoundEffectFileChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const res = await api.sfx.addSoundEffect({ file })
      const createdId = res.data?.id || ""
      if (createdId) {
        setSelectedSoundEffectId(createdId)
        await queryClient.invalidateQueries({ queryKey: ["sound-effects"] })
      }
    } catch (err: any) {
      setUploadError(
        err?.response?.data?.detail || err?.message || "Could not upload sound effect."
      )
    } finally {
      event.target.value = ""
    }
  }

  const handleSubmit = async () => {
    if (!selectedFile) {
      setUploadError("Please choose an audio file first.")
      return
    }

    setIsSubmitting(true)
    setUploadError(null)

    try {
      const userList = customWords
        .split(",")
        .map((word) => word.trim())
        .filter(Boolean)

      await api.audio.submitAudio({
        file: selectedFile,
        options: JSON.stringify({
          user_list: userList,
          use_beep: useBeep,
          sound_effect_id: selectedSoundEffectId || null,
        }),
      })

      await queryClient.invalidateQueries({ queryKey: ["audios"] })
      closeDialog()
    } catch (err: any) {
      setUploadError(
        err?.response?.data?.detail || err?.message || "Could not upload audio."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open || !isLoggedIn) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-xl border border-border bg-background p-6 shadow-xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Upload audio</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure how the audio should be censored before submitting.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={closeDialog} type="button">
            Close
          </Button>
        </div>

        <div className="mt-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium">Audio file</label>
            {!selectedFile ? (
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  Choose audio
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={handleAudioFileChange}
                />
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                <span className="truncate">{selectedFile.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  type="button"
                >
                  Change
                </Button>
              </div>
            )}
          </div>

          <label className="flex items-center justify-between gap-4 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
            <span>Enable beeps</span>
            <input
              type="checkbox"
              checked={useBeep}
              onChange={(event) => setUseBeep(event.target.checked)}
            />
          </label>

          <div className="space-y-2">
            <label htmlFor="custom-words" className="text-sm font-medium">
              Custom words to censor
            </label>
            <input
              id="custom-words"
              value={customWords}
              onChange={(event) => setCustomWords(event.target.value)}
              placeholder="e.g. damn, crap, idiot"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-0 placeholder:text-muted-foreground focus:border-ring"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Sound effect</label>
            <div className="flex items-center gap-2">
              <select
                value={selectedSoundEffectId}
                onChange={(event) => {
                  const value = event.target.value
                  if (value === "__upload_new__") {
                    soundEffectInputRef.current?.click()
                    return
                  }
                  setSelectedSoundEffectId(value)
                }}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
              >
                <option value="">None</option>
                {(soundEffects || []).map((effect: any) => (
                  <option key={effect.id} value={effect.id}>
                    {effect.name}
                  </option>
                ))}
                <option value="__upload_new__">Upload new sound effect...</option>
              </select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedSoundEffectId("")}
              >
                Clear
              </Button>
            </div>
            <input
              ref={soundEffectInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleSoundEffectFileChange}
            />
          </div>

          {uploadError ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {uploadError}
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={closeDialog} type="button">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedFile || isSubmitting} type="button">
            {isSubmitting ? "Submitting..." : "Submit audio"}
          </Button>
        </div>
      </div>
    </div>
  )
}

function AudiosTable() {
  const { accessToken, isLoggedIn } = useAuthInfo()

  const { data, isLoading, error } = useQuery({
    queryKey: ["audios", accessToken],
    enabled: !!accessToken && isLoggedIn,
    queryFn: async () => {
      const res = await api.audio.readAllAudios({})
      return res.data || []
    },
    staleTime: 30_000,
    refetchInterval: (query) => {
      const rows = query.state.data as Array<{ status?: string }> | undefined
      const hasActiveAudio = (rows ?? []).some(
        (audio) => audio.status === "pending" || audio.status === "processing"
      )
      return hasActiveAudio ? 5_000 : false
    },
  })

  const handleDownload = async (id: string) => {
    try {
      const res = await api.audio.downloadAudio(id)
      const url = res.data?.file_url
      if (url) window.open(url, "_blank", "noopener,noreferrer")
    } catch (e) {
      console.error(e)
    }
  }

  if (!isLoggedIn || !accessToken) {
    return (
      <div className="mt-6 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        Sign in to view your uploaded audio.
      </div>
    )
  }

  if (isLoading) return <div className="mt-6 text-sm">Loading audios...</div>
  if (error)
    return (
      <div className="mt-6 text-sm text-destructive">Failed to load audios</div>
    )

  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Filename</th>
              <th className="px-4 py-3 font-medium">Duration</th>
              <th className="px-4 py-3 font-medium">Last updated</th>
              <th className="px-4 py-3 font-medium">Credits</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data || []).map((audio: any) => (
              <tr key={audio.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                      audio.status === "completed"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        : audio.status === "processing"
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                          : audio.status === "failed"
                            ? "bg-red-500/15 text-red-700 dark:text-red-400"
                            : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {audio.status}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium">{audio.name}</td>
                <td className="px-4 py-3">
                  {audio.duration ? `${audio.duration}s` : "-"}
                </td>
                <td className="px-4 py-3">{relativeTime(audio.updated_at)}</td>
                <td className="px-4 py-3">{audio.credits_used ?? 0}</td>
                <td className="px-4 py-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(audio.id)}
                    disabled={audio.status !== "completed"}
                  >
                    Download
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
