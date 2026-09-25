import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useRef, useState, type ChangeEvent } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuthInfo } from "@propelauth/react"
import { Button } from "@/components/ui/button"
import ThemeToggle from "@/components/ui/theme-toggle"
import api, { configureBearer } from "@/lib/api"
import {
  MoreHorizontal,
  Download,
  FileText,
  Clock3,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"

export const Route = createFileRoute("/dashboard")({ component: Dashboard })

type User = {
  id?: string
  displayName?: string
  email?: string
  avatarUrl?: string
  credits?: number
}

type ToastType = "success" | "error" | "processing"

type ToastItem = {
  id: number
  type: ToastType
  title: string
  description: string
}

function Dashboard() {
  const { accessToken, isLoggedIn, loading: authLoading } = useAuthInfo()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = (type: ToastType, title: string, description: string) => {
    const id = Date.now() + Math.random()
    setToasts((current) => [...current, { id, type, title, description }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 4000)
  }

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
              <UserMenu
                user={user}
                authUrl={import.meta.env.VITE_AUTH_URL ?? ""}
                onLogout={handleLogout}
                showToast={showToast}
              />
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

        <AudiosTable showToast={showToast} />
      </main>

      <UploadAudioDialog open={uploadOpen} onOpenChange={setUploadOpen} showToast={showToast} />
      <ToastViewport toasts={toasts} />
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

function ToastViewport({ toasts }: { toasts: ToastItem[] }) {
  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-lg border p-3 shadow-lg backdrop-blur-sm ${
            toast.type === "success"
              ? "border-emerald-600/20 bg-emerald-600/10 text-emerald-900 dark:text-emerald-100"
              : toast.type === "error"
                ? "border-red-600/20 bg-red-600/10 text-red-900 dark:text-red-100"
                : "border-blue-600/20 bg-blue-600/10 text-blue-900 dark:text-blue-100"
          }`}
        >
          <div className="flex items-start gap-2">
            <div className="mt-0.5">
              {toast.type === "success" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : toast.type === "error" ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              )}
            </div>
            <div>
              <div className="text-sm font-semibold">{toast.title}</div>
              <div className="text-xs opacity-80">{toast.description}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function UserMenu({
  user,
  authUrl,
  onLogout,
  showToast,
}: {
  user: User
  authUrl: string
  onLogout: () => void
  showToast: (type: ToastType, title: string, description: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [selectedAmount, setSelectedAmount] = useState<number | "custom">(5)
  const [customAmount, setCustomAmount] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const amountOptions = [5, 10]

  const getCheckoutUrl = (payload: any) => {
    return (
      payload?.checkout_url ||
      payload?.checkoutUrl ||
      payload?.url ||
      payload?.checkout_session_url ||
      payload?.checkoutSessionUrl ||
      payload?.session_url ||
      payload?.sessionUrl ||
      payload?.redirect_url ||
      payload?.redirectUrl ||
      null
    )
  }

  const handleAddCredits = async () => {
    const amount =
      selectedAmount === "custom"
        ? Number(customAmount)
        : typeof selectedAmount === "number"
          ? selectedAmount
          : 0

    if (selectedAmount === "custom" && (!Number.isFinite(amount) || amount < 1)) {
      setCheckoutError("Custom amount must be at least $1.")
      return
    }

    setIsSubmitting(true)
    setCheckoutError(null)
    showToast("processing", "Opening checkout", "Preparing your credit top-up.")

    try {
      const res = await api.user.createCheckout({ amount })
      const checkoutUrl = getCheckoutUrl(res.data)

      if (!checkoutUrl) {
        throw new Error("Checkout link not returned by the server.")
      }

      window.location.href = checkoutUrl
    } catch (err: any) {
      const message =
        err?.response?.data?.detail || err?.message || "Could not create checkout session."
      setCheckoutError(message)
      showToast("error", "Checkout failed", message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="relative flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          className="flex items-center gap-3 rounded-full border border-border bg-background px-1.5 py-1 text-left transition hover:bg-muted"
        >
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
        </button>

        {menuOpen ? (
          <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-xl border border-border bg-popover p-3 shadow-lg">
            <div className="mb-3 rounded-lg bg-muted/50 px-3 py-2">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Credits balance
              </div>
              <div className="mt-1 text-lg font-semibold">${(user.credits ?? 0).toFixed(2)}</div>
            </div>

            <div className="space-y-2 text-sm">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  setCheckoutOpen(true)
                }}
                className="flex w-full items-center justify-center rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground hover:bg-primary/90"
              >
                Add credits
              </button>

              <a
                href={authUrl ? `${authUrl.replace(/\/$/, "")}/account` : "#"}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center rounded-md border border-border px-3 py-2 hover:bg-muted"
              >
                Account
              </a>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  onLogout()
                }}
                className="flex w-full items-center justify-center rounded-md border border-border px-3 py-2 hover:bg-muted"
              >
                Log out
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {checkoutOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Add credits</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Top up your balance for audio processing.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCheckoutOpen(false)
                  setCheckoutError(null)
                  setCustomAmount("")
                  setSelectedAmount(5)
                }}
                type="button"
              >
                Close
              </Button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {amountOptions.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => {
                      setSelectedAmount(amount)
                      setCheckoutError(null)
                    }}
                    className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                      selectedAmount === amount
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background hover:bg-muted"
                    }`}
                  >
                    ${amount}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAmount("custom")
                    setCheckoutError(null)
                  }}
                  className={`col-span-2 rounded-md border px-3 py-2 text-sm font-medium transition ${
                    selectedAmount === "custom"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background hover:bg-muted"
                  }`}
                >
                  Custom amount
                </button>
              </div>

              {selectedAmount === "custom" ? (
                <div className="space-y-2">
                  <label htmlFor="custom-credit-amount" className="text-sm font-medium">
                    Amount in USD
                  </label>
                  <input
                    id="custom-credit-amount"
                    type="number"
                    min={1}
                    step="1"
                    value={customAmount}
                    onChange={(event) => setCustomAmount(event.target.value)}
                    placeholder="Enter at least $1"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
                  />
                </div>
              ) : null}

              {checkoutError ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {checkoutError}
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setCheckoutOpen(false)
                  setCheckoutError(null)
                  setCustomAmount("")
                  setSelectedAmount(5)
                }}
                type="button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddCredits}
                disabled={isSubmitting}
                type="button"
              >
                {isSubmitting ? "Preparing..." : "Continue to checkout"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

function UploadAudioDialog({
  open,
  onOpenChange,
  showToast,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  showToast: (type: ToastType, title: string, description: string) => void
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
    showToast("processing", "Uploading audio", "Your file is being processed.")

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
      showToast("success", "Audio uploaded", "Your audio was uploaded successfully.")
    } catch (err: any) {
      const message =
        err?.response?.data?.detail || err?.message || "Could not upload audio."
      setUploadError(message)
      showToast("error", "Upload failed", message)
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

function AudiosTable({ showToast }: { showToast: (type: ToastType, title: string, description: string) => void }) {
  const { accessToken, isLoggedIn } = useAuthInfo()
  const previousActiveStatuses = useRef<string[]>([])

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

  useEffect(() => {
    const activeRows = (data ?? []).filter(
      (audio: any) => audio.status === "pending" || audio.status === "processing"
    )

    if (activeRows.length === 0) {
      previousActiveStatuses.current = []
      return
    }

    const activeStatuses = activeRows.map((audio: any) => audio.status).join(",")
    if (activeStatuses !== previousActiveStatuses.current.join(",")) {
      showToast(
        "processing",
        "Audio being processed",
        "This audio is still being processed. Status updates will refresh automatically."
      )
      previousActiveStatuses.current = activeRows.map((audio: any) => audio.status)
    }
  }, [data, showToast])

  const handleDownload = async (id: string) => {
    try {
      const res = await api.audio.downloadAudio(id)
      const url = res.data?.file_url
      if (url) window.open(url, "_blank", "noopener,noreferrer")
      else showToast("error", "Download unavailable", "No downloadable file was returned.")
    } catch (e: any) {
      const message = e?.response?.data?.detail || e?.message || "Download failed."
      showToast("error", "Download failed", message)
    }
  }

  const handleDownloadSubtitle = async (id: string) => {
    try {
      const res = await api.audio.downloadSubtitle(id, { symbol: "*", visible_chars: 1 })
      const url = res.data?.file_url ?? res.data?.url ?? res.data?.download_url
      if (url) window.open(url, "_blank", "noopener,noreferrer")
      else showToast("error", "Subtitle unavailable", "No subtitle file was returned.")
      showToast("success", "Subtitle ready", "The subtitle download has started.")
    } catch (e: any) {
      const message = e?.response?.data?.detail || e?.message || "Subtitle download failed."
      showToast("error", "Subtitle download failed", message)
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
              <AudioRow
                key={audio.id}
                audio={audio}
                onDownload={handleDownload}
                onDownloadSubtitle={handleDownloadSubtitle}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AudioRow({
  audio,
  onDownload,
  onDownloadSubtitle,
}: {
  audio: any
  onDownload: (id: string) => void
  onDownloadSubtitle: (id: string) => void
}) {
  const queryClient = useQueryClient()
  const [menuOpen, setMenuOpen] = useState(false)
  const [updateOpen, setUpdateOpen] = useState(false)
  const [useBeep, setUseBeep] = useState(Boolean(audio.use_beep))
  const [customWords, setCustomWords] = useState(
    (audio.user_list || []).join(", ")
  )
  const [selectedSoundEffectId, setSelectedSoundEffectId] = useState(
    audio.sound_effect_id || ""
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: soundEffects = [] } = useQuery({
    queryKey: ["sound-effects"],
    enabled: updateOpen,
    queryFn: async () => {
      const res = await api.sfx.readAllSoundEffects({})
      return res.data || []
    },
    staleTime: 30_000,
  })

  const resetUpdateState = () => {
    setUseBeep(Boolean(audio.use_beep))
    setCustomWords((audio.user_list || []).join(", "))
    setSelectedSoundEffectId(audio.sound_effect_id || "")
    setError(null)
    setIsSubmitting(false)
  }

  const handleUpdate = async () => {
    setIsSubmitting(true)
    setError(null)
    showToast("processing", "Updating audio", "Your audio settings are being saved.")

    try {
      const payload = {
        user_list: customWords
          .split(",")
          .map((word) => word.trim())
          .filter(Boolean),
        use_beep: useBeep,
        sound_effect_id: selectedSoundEffectId || null,
      }

      await api.audio.updateAudio(audio.id, payload)
      await queryClient.invalidateQueries({ queryKey: ["audios"] })
      setUpdateOpen(false)
      resetUpdateState()
      showToast("success", "Audio updated", "The censor settings were updated successfully.")
    } catch (err: any) {
      const message =
        err?.response?.data?.detail || err?.message || "Could not update audio."
      setError(message)
      showToast("error", "Update failed", message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <tr className="border-t border-border">
        <td className="px-4 py-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
              audio.status === "completed"
                ? "bg-emerald-600/15 text-emerald-800 ring-1 ring-emerald-600/25 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/25"
                : audio.status === "processing"
                  ? "bg-blue-600/15 text-blue-800 ring-1 ring-blue-600/25 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/25"
                  : audio.status === "failed"
                    ? "bg-red-600/15 text-red-800 ring-1 ring-red-600/25 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/25"
                    : "bg-slate-600/15 text-slate-800 ring-1 ring-slate-600/25 dark:bg-slate-400/15 dark:text-slate-200 dark:ring-slate-300/25"
            }`}
          >
            {audio.status === "pending" ? (
              <Clock3 className="h-3.5 w-3.5" />
            ) : audio.status === "processing" ? (
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            ) : audio.status === "completed" ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5" />
            )}
            {audio.status}
          </span>
        </td>
        <td className="px-4 py-3 font-medium">{audio.name}</td>
        <td className="px-4 py-3">{audio.duration ? `${audio.duration}s` : "-"}</td>
        <td className="px-4 py-3">{relativeTime(audio.updated_at)}</td>
        <td className="px-4 py-3">{audio.credits_used ?? 0}</td>
        <td className="px-4 py-3">
          <div className="relative inline-block">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`More actions for ${audio.name}`}
              onClick={() => setMenuOpen((value) => !value)}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>

            {menuOpen ? (
              <div className="absolute right-0 z-10 mt-2 w-48 rounded-md border border-border bg-popover p-1 text-sm shadow-lg">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left hover:bg-accent"
                  onClick={() => {
                    setMenuOpen(false)
                    setUpdateOpen(true)
                    resetUpdateState()
                  }}
                >
                  <FileText className="h-4 w-4" />
                  Update audio
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left hover:bg-accent disabled:opacity-50"
                  disabled={audio.status !== "completed"}
                  onClick={() => {
                    setMenuOpen(false)
                    onDownload(audio.id)
                  }}
                >
                  <Download className="h-4 w-4" />
                  Download audio
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left hover:bg-accent"
                  onClick={() => {
                    setMenuOpen(false)
                    onDownloadSubtitle(audio.id)
                  }}
                >
                  <FileText className="h-4 w-4" />
                  Download subtitle
                </button>
              </div>
            ) : null}
          </div>
        </td>
      </tr>

      {updateOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-xl border border-border bg-background p-6 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Update audio</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Adjust censor settings for this audio file.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setUpdateOpen(false)
                  resetUpdateState()
                }}
                type="button"
              >
                Close
              </Button>
            </div>

            <div className="mt-6 space-y-5">
              <label className="flex items-center justify-between gap-4 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                <span>Enable beeps</span>
                <input
                  type="checkbox"
                  checked={useBeep}
                  onChange={(event) => setUseBeep(event.target.checked)}
                />
              </label>

              <div className="space-y-2">
                <label htmlFor={`custom-words-${audio.id}`} className="text-sm font-medium">
                  Custom words to censor
                </label>
                <input
                  id={`custom-words-${audio.id}`}
                  value={customWords}
                  onChange={(event) => setCustomWords(event.target.value)}
                  placeholder="e.g. damn, crap, idiot"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-0 placeholder:text-muted-foreground focus:border-ring"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Sound effect</label>
                <select
                  value={selectedSoundEffectId}
                  onChange={(event) => setSelectedSoundEffectId(event.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
                >
                  <option value="">None</option>
                  {(soundEffects || []).map((effect: any) => (
                    <option key={effect.id} value={effect.id}>
                      {effect.name}
                    </option>
                  ))}
                </select>
              </div>

              {error ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setUpdateOpen(false)
                  resetUpdateState()
                }}
                type="button"
              >
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={isSubmitting} type="button">
                {isSubmitting ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
