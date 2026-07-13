import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { SpotifyConnectionStatus } from "@/lib/pulse-api"

interface SpotifyAccountCardProps {
  status: SpotifyConnectionStatus
}

export function SpotifyAccountCard({ status }: SpotifyAccountCardProps) {
  return (
    <Card className="border-white/10 bg-slate-950/80 text-slate-50 shadow-lg shadow-cyan-950/10">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl text-white">Connected account</CardTitle>
            <CardDescription className="text-slate-400">
              The account currently linked to Pulse.
            </CardDescription>
          </div>
          <Badge
            className={
              status.connected
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/10"
                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/5"
            }
          >
            {status.connected ? "Active" : "Disconnected"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Metric label="Spotify ID" value={status.spotify_id || "Not linked"} />
          <Metric
            label="Last sync"
            value={status.last_sync ? formatDateTime(status.last_sync) : "No sync yet"}
          />
        </div>
        <Separator className="bg-white/10" />
        <p className="text-sm text-slate-400">
          {status.connected
            ? "Your Spotify account is connected and ready to feed history and analytics views."
            : "Connect Spotify to start importing listening activity into Pulse."}
        </p>
      </CardContent>
    </Card>
  )
}

interface MetricProps {
  label: string
  value: string
}

function Metric({ label, value }: MetricProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 truncate text-base font-semibold text-white">{value}</p>
    </div>
  )
}

function formatDateTime(dateString: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateString))
}
