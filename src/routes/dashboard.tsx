import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
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
          {/* Page title on the left */}
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </div>

          {/* Right side: theme toggle + user / avatar area */}
          <div className="flex items-center gap-3">
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
              // If there was an error fetching user info or user is not signed in,
              // show a neutral guest avatar instead of displaying the fetch error
              // or a Sign in button in the navbar.
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
                <td className="px-4 py-3">{audio.duration ? `${audio.duration}s` : "-"}</td>
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
