import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { HistoryDay } from "@/lib/pulse-api"
import { HistoryTrackRow } from "./HistoryTrackRow"

interface HistoryDayCardProps {
  day: HistoryDay
}

export function HistoryDayCard({ day }: HistoryDayCardProps) {
  const summary = day.summary

  return (
    <Card className="border-white/10 bg-slate-950/80 text-slate-50 shadow-lg shadow-cyan-950/10">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl text-white">{formatDay(day.date)}</CardTitle>
            <CardDescription className="text-slate-400">
              {day.count} play{day.count === 1 ? "" : "s"} recorded
            </CardDescription>
          </div>
          <Badge className="border-cyan-400/30 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/10">
            {summary ? capitalize(summary.dominant_mood) : "No summary"}
          </Badge>
        </div>
        {summary?.ai_summary ? (
          <CardDescription className="max-w-3xl text-slate-400">
            {summary.ai_summary}
          </CardDescription>
        ) : (
          <CardDescription className="max-w-3xl text-slate-400">
            {summary ? "Daily summary available, but no AI insight was generated for this day." : "No daily summary was found for this date."}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Metric label="Minutes" value={summary ? `${Math.round(summary.total_minutes)}m` : "0m"} />
          <Metric label="Happy" value={summary ? `${Math.round(summary.happy_minutes)}m` : "0m"} />
          <Metric label="Calm" value={summary ? `${Math.round(summary.calm_minutes)}m` : "0m"} />
          <Metric label="Energetic" value={summary ? `${Math.round(summary.energetic_minutes)}m` : "0m"} />
        </div>
        <Separator className="bg-white/10" />
        <div className="space-y-3">
          {day.tracks.length > 0 ? (
            day.tracks.map((track) => <HistoryTrackRow key={track.id} track={track} />)
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-sm text-slate-400">
              No tracks were captured for this day.
            </div>
          )}
        </div>
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
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  )
}

function formatDay(dateString: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date(`${dateString}T00:00:00Z`))
}

function capitalize(value: string) {
  return value
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}
