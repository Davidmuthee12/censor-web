import { createFileRoute } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/")({ component: App })

function App() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="flex max-w-2xl flex-col items-center gap-4 px-4 text-center">
        <h1 className="text-4xl font-semibold">Censur</h1>
        <p className="text-lg text-muted-foreground">
          Automatically censor profanity in audio — protect listeners and keep
          conversations safe with a single click.
        </p>
        <Button className="mt-4">Get started</Button>
      </div>
    </div>
  )
}
