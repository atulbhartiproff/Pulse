import { Link as RouterLink, createFileRoute } from "@tanstack/react-router"
import { Flame, Music2, Sparkles, Timer } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import useAuth from "@/hooks/useAuth"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getTodayIsoDate,
  loadDashboardBundle,
  type DailySummary,
} from "@/lib/pulse-api"

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
  head: () => ({
    meta: [
      {
        title: "Dashboard - Pulse",
      },
    ],
  }),
})

function Dashboard() {
  const { user: currentUser } = useAuth()
  const todayDate = getTodayIsoDate()
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["pulse-dashboard", todayDate],
    queryFn: () => loadDashboardBundle(todayDate),
    staleTime: 60_000,
  })

  const dashboard = data?.dashboard
  const history = data?.history
  const today = dashboard?.today ?? null
  const weeklyTrend = dashboard?.weekly_trend ?? []
  const monthlyTrend = dashboard?.monthly_trend ?? []
  const recentTracks = history?.tracks ?? []

  const weeklyMinutes = weeklyTrend.reduce(
    (sum, summary) => sum + summary.total_minutes,
    0,
  )
  const monthlyMinutes = monthlyTrend.reduce(
    (sum, summary) => sum + summary.total_minutes,
    0,
  )

  const summaryCards = [
    {
      label: "Today",
      value: today ? formatMinutes(today.total_minutes) : "No summary",
      detail: today ? capitalize(today.dominant_mood) : "Waiting for a daily summary",
      icon: Timer,
    },
    {
      label: "Week",
      value: formatMinutes(weeklyMinutes),
      detail: `${weeklyTrend.length} day${weeklyTrend.length === 1 ? "" : "s"} of live activity`,
      icon: Flame,
    },
    {
      label: "Top artist",
      value: dashboard?.top_artist?.name ?? "No data",
      detail: dashboard?.top_artist
        ? `${dashboard.top_artist.play_count} plays in the last 30 days`
        : "Connect listening history to surface trends",
      icon: Music2,
    },
    {
      label: "Top song",
      value: dashboard?.top_song?.name ?? "No data",
      detail: dashboard?.top_song
        ? `${dashboard.top_song.play_count} plays in the last 30 days`
        : "No track has emerged as a favorite yet",
      icon: Sparkles,
    },
  ]

  if (isPending) {
    return <DashboardSkeleton />
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <Alert className="border-red-500/30 bg-red-500/10 text-red-50">
          <AlertTitle>Unable to load dashboard</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "The analytics endpoint returned an error."}
          </AlertDescription>
        </Alert>
        <Button onClick={() => refetch()} className="w-fit">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <Card className="border-white/10 bg-slate-950/80 text-slate-50 shadow-lg shadow-cyan-950/20">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-cyan-400/30 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/10">
                Pulse dashboard
              </Badge>
              <Badge variant="outline" className="border-white/10 text-slate-300">
                Dark workspace
              </Badge>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl tracking-tight sm:text-4xl">
                Welcome back, {currentUser?.full_name || currentUser?.email || "there"}.
              </CardTitle>
              <CardDescription className="max-w-2xl text-slate-400">
                Live listening data from your backend now powers this dashboard.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">Today&apos;s insight</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {today?.ai_summary || dashboard?.latest_ai_insight || "No AI summary available yet."}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {today
                  ? `Dominant mood: ${capitalize(today.dominant_mood)}.`
                  : "Your backend will populate this once daily summaries exist."}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-linear-to-br from-cyan-400/15 to-blue-500/10 p-4">
              <p className="text-sm text-cyan-100/80">Current day</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {today ? formatLongDate(today.date) : "No daily data"}
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {today
                  ? `Happy ${formatMinutes(today.happy_minutes)} · Calm ${formatMinutes(today.calm_minutes)} · Energetic ${formatMinutes(today.energetic_minutes)}`
                  : "Daily summary metrics will appear here when available."}
              </p>
              <Button
                asChild
                variant="secondary"
                className="mt-4 w-fit bg-white text-slate-950 hover:bg-white/90"
              >
                <RouterLink to="/settings">Open settings</RouterLink>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-slate-50">
          <CardHeader>
            <CardTitle className="text-lg">Latest plays</CardTitle>
            <CardDescription className="text-slate-400">
              Recent tracks from the history endpoint.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTracks.length > 0 ? (
              recentTracks.map((track) => (
                <div
                  key={track.id}
                  className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {track.track_name}
                    </p>
                    <p className="truncate text-sm text-slate-400">
                      {track.artist} · {track.album}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs uppercase tracking-[0.2em] text-cyan-300">
                    {formatTime(track.played_at)}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-sm text-slate-400">
                No recent plays were returned for today.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((stat) => (
          <Card key={stat.label} className="border-white/10 bg-white/5 text-slate-50">
            <CardHeader className="space-y-3 pb-0">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-white/10 text-slate-300">
                  {stat.label}
                </Badge>
                <stat.icon className="size-4 text-cyan-300" />
              </div>
              <CardTitle className="truncate text-2xl tracking-tight xl:text-3xl">{stat.value}</CardTitle>
              <CardDescription className="text-slate-400">{stat.detail}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-white/10 bg-white/5 text-slate-50">
          <CardHeader>
            <CardTitle className="text-lg">Weekly trend</CardTitle>
            <CardDescription className="text-slate-400">
              Daily minutes from the backend&apos;s analytics summary.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {weeklyTrend.length > 0 ? (
                weeklyTrend.map((summary) => (
                  <div key={summary.date} className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{formatShortDate(summary.date)}</span>
                    <span>{formatMinutes(summary.total_minutes)}</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/10">
                    <div
                      className="h-3 rounded-full bg-linear-to-r from-cyan-400 to-blue-500"
                      style={{ width: `${barWidth(summary.total_minutes, weeklyTrend)}%` }}
                    />
                  </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-sm text-slate-400">
                  No weekly summaries are available yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-slate-50">
          <CardHeader>
            <CardTitle className="text-lg">Monthly trend</CardTitle>
            <CardDescription className="text-slate-400">
              A broader view of your listening habits over the last month.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>Total minutes</span>
              <span>{formatMinutes(monthlyMinutes)}</span>
            </div>
            <Separator className="bg-white/10" />
            {monthlyTrend.length > 0 ? (
              monthlyTrend.slice(-5).map((summary) => (
                <div key={summary.date} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">{formatShortDate(summary.date)}</p>
                    <p className="text-sm text-slate-400">{capitalize(summary.dominant_mood)}</p>
                  </div>
                  <p className="text-sm text-cyan-300">{formatMinutes(summary.total_minutes)}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-sm text-slate-400">
                Monthly analytics will appear after more summaries are generated.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <Card className="border-white/10 bg-slate-950/80 text-slate-50">
          <CardHeader className="space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-28 rounded-full bg-white/10" />
              <Skeleton className="h-6 w-24 rounded-full bg-white/10" />
            </div>
            <Skeleton className="h-10 w-3/4 bg-white/10" />
            <Skeleton className="h-5 w-full bg-white/10" />
            <Skeleton className="h-5 w-2/3 bg-white/10" />
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-28 rounded-2xl bg-white/10" />
            <Skeleton className="h-28 rounded-2xl bg-white/10" />
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5 text-slate-50">
          <CardHeader>
            <Skeleton className="h-6 w-32 bg-white/10" />
            <Skeleton className="h-4 w-48 bg-white/10" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-14 rounded-2xl bg-white/10" />
            <Skeleton className="h-14 rounded-2xl bg-white/10" />
            <Skeleton className="h-14 rounded-2xl bg-white/10" />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <Card key={item} className="border-white/10 bg-white/5 text-slate-50">
            <CardHeader className="space-y-3 pb-0">
              <Skeleton className="h-5 w-24 bg-white/10" />
              <Skeleton className="h-8 w-36 bg-white/10" />
              <Skeleton className="h-4 w-full bg-white/10" />
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        {[1, 2].map((item) => (
          <Card key={item} className="border-white/10 bg-white/5 text-slate-50">
            <CardHeader>
              <Skeleton className="h-6 w-32 bg-white/10" />
              <Skeleton className="h-4 w-48 bg-white/10" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full bg-white/10" />
              <Skeleton className="h-4 w-full bg-white/10" />
              <Skeleton className="h-4 w-2/3 bg-white/10" />
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  )
}

function formatMinutes(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) return "0m"
  const rounded = Math.round(minutes)
  return `${rounded}m`
}

function formatLongDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00Z`)
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(date)
}

function formatShortDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00Z`)
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date)
}

function formatTime(dateString: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateString))
}

function capitalize(value: string) {
  return value
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function barWidth(totalMinutes: number, summaries: DailySummary[]) {
  const maxMinutes = Math.max(...summaries.map((summary) => summary.total_minutes), 1)
  return Math.max(8, Math.round((totalMinutes / maxMinutes) * 100))
}
