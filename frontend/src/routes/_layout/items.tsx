import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import {
  HistoryDayCard,
  HistoryErrorState,
  HistoryHeader,
  HistoryOverviewCards,
  HistorySkeleton,
} from "@/components/History"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { loadHistoryFeed } from "@/lib/pulse-api"

export const Route = createFileRoute("/_layout/items")({
  component: History,
  head: () => ({
    meta: [
      {
        title: "History - Pulse",
      },
    ],
  }),
})

function History() {
  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["pulse-history", 7],
    queryFn: () => loadHistoryFeed(7),
    staleTime: 60_000,
  })

  if (isPending) {
    return <HistorySkeleton />
  }

  if (isError) {
    return (
      <HistoryErrorState
        errorMessage={
          error instanceof Error
            ? error.message
            : "The history endpoint returned an error."
        }
        onRetry={() => refetch()}
      />
    )
  }

  const days = data?.days ?? []

  return (
    <div className="space-y-6">
      <HistoryHeader isRefreshing={isFetching} onRefresh={() => refetch()} />

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-white/10 bg-slate-950/80 text-slate-50">
          <CardHeader>
            <CardTitle className="text-lg">History summary</CardTitle>
            <CardDescription className="text-slate-400">
              A seven-day view of summaries and played tracks from the backend.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard
                label="Days covered"
                value={String(data?.totalDays ?? 0)}
                detail="Grouped client-side from daily backend records."
              />
              <MetricCard
                label="Total plays"
                value={String(data?.totalTracks ?? 0)}
                detail="Recent listening events included in the selected range."
                accent
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard
                label="Tracked minutes"
                value={`${Math.round(data?.totalMinutes ?? 0)}m`}
                detail="Derived from daily summaries returned by analytics."
              />
              <MetricCard
                label="Days with summaries"
                value={String(data?.summaryDays ?? 0)}
                detail="Shows where the backend has structured daily data."
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-slate-50">
          <CardHeader>
            <CardTitle className="text-lg">What&apos;s included</CardTitle>
            <CardDescription className="text-slate-400">
              The history view is built from the same analytics source as the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Daily summaries grouped by date",
              "Track rows ordered newest first",
              "Live refresh and error state handling",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300"
              >
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <HistoryOverviewCards
        totalDays={data?.totalDays ?? 0}
        totalTracks={data?.totalTracks ?? 0}
        totalMinutes={data?.totalMinutes ?? 0}
        summaryDays={data?.summaryDays ?? 0}
      />

      <section className="space-y-4">
        {days.length > 0 ? (
          days.map((day) => <HistoryDayCard key={day.date} day={day} />)
        ) : (
          <Card className="border-white/10 bg-white/5 text-slate-50">
            <CardHeader>
              <CardTitle className="text-lg">No listening history yet</CardTitle>
              <CardDescription className="text-slate-400">
                The backend returned no plays for the selected date range.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </section>
    </div>
  )
}

interface MetricCardProps {
  label: string
  value: string
  detail: string
  accent?: boolean
}

function MetricCard({ label, value, detail, accent = false }: MetricCardProps) {
  return (
    <div
      className={
        accent
          ? "rounded-2xl border border-white/10 bg-linear-to-br from-cyan-400/15 to-blue-500/10 p-4"
          : "rounded-2xl border border-white/10 bg-white/5 p-4"
      }
    >
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-400">{detail}</p>
    </div>
  )
}
