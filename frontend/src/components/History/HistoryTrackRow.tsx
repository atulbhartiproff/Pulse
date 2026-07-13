import { Clock3 } from "lucide-react"

import { cn } from "@/lib/utils"
import type { TrackHistory } from "@/lib/pulse-api"

interface HistoryTrackRowProps {
  track: TrackHistory
  className?: string
}

export function HistoryTrackRow({ track, className }: HistoryTrackRowProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <p className="truncate text-sm font-medium text-white">{track.track_name}</p>
        <p className="truncate text-sm text-slate-400">
          {track.artist} · {track.album}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2 text-xs uppercase tracking-[0.2em] text-cyan-300">
        <Clock3 className="size-3.5" />
        <span>{formatTime(track.played_at)}</span>
      </div>
    </div>
  )
}

function formatTime(dateString: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateString))
}
