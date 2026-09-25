import { createFileRoute } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { ArrowRightIcon } from "lucide-react"

export const Route = createFileRoute("/")({ component: App })

function App() {
  const authUrl = import.meta.env.VITE_AUTH_URL ?? ""

  const handleLogin = () => {
    if (!authUrl || typeof window === "undefined") return
    const redirect = `${window.location.origin}/dashboard`
    window.location.href = `${authUrl.replace(/\/$/, "")}/login?redirect=${encodeURIComponent(
      redirect
    )}`
  }

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden px-6 py-16">
      <div className="absolute inset-0 -z-10 bg-background">
        <div className="absolute top-1/2 left-1/2 size-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 size-128 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border/60" />
        <div className="absolute inset-x-0 top-0 h-48 bg-linear-to-b from-muted/70 to-transparent" />
      </div>

      <header className="absolute inset-x-0 top-0 z-10 px-6 py-5">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-full border border-border/70 bg-background/80 px-4 py-2 shadow-sm backdrop-blur sm:px-5">
          <a href="/" className="flex items-center gap-2.5">
            <img
              className="flex size-4 items-center justify-center rounded-full"
              src="./logo.svg"
              alt="logo"
            />
            <span className="font-heading text-lg tracking-tight">Censur</span>
          </a>

          <Button onClick={handleLogin} size="sm">
            Get Started
          </Button>
        </nav>
      </header>

      <section className="flex w-full max-w-3xl flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="rounded-full border border-border/80 bg-background/80 px-4 py-1.5 text-sm text-muted-foreground shadow-sm backdrop-blur">
            Automatic profanity removal for spoken content
          </div>

          <div className="flex flex-col gap-4">
            <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
              Censur that sh*t
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Detect profanity, censor it automatically, and ship podcasts,
              streams, and voice recordings with a clean final cut in minutes
              instead of hours.
            </p>
          </div>
        </div>

        <Button onClick={handleLogin} size="lg">
          Start censoring audio
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
      </section>
    </main>
  )
}
