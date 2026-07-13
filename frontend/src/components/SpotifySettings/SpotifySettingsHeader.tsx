import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SpotifySettingsHeaderProps {
  connected: boolean
  onConnect: () => void
}

export function SpotifySettingsHeader({
  connected,
  onConnect,
}: SpotifySettingsHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="border-cyan-400/30 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/10">
          Spotify
        </Badge>
        <Badge
          variant="outline"
          className={cn(
            "border-white/10",
            connected ? "text-emerald-300" : "text-slate-300",
          )}
        >
          {connected ? "Connected" : "Not connected"}
        </Badge>
      </div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Spotify settings
          </h1>
          <p className="max-w-2xl text-sm text-slate-400">
            Manage the Spotify connection that powers your listening history and analytics.
          </p>
        </div>
        {!connected ? (
          <Button
            onClick={onConnect}
            className="w-fit bg-white text-slate-950 hover:bg-white/90"
          >
            Connect Spotify
          </Button>
        ) : null}
      </div>
    </div>
  )
}
