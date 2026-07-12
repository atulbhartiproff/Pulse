import { createFileRoute } from "@tanstack/react-router"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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

const historyItems = [
  {
    label: "Morning sync",
    time: "08:30",
    detail: "Imported the latest activity batch and marked the workspace as healthy.",
  },
  {
    label: "Rule review",
    time: "11:10",
    detail: "Placeholder audit step for future history entries and approvals.",
  },
  {
    label: "Export snapshot",
    time: "14:45",
    detail: "Reserved for downloadable snapshots and event summaries.",
  },
]

function History() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Badge className="border-cyan-400/30 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/10">
          History
        </Badge>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Activity history</h1>
        <p className="max-w-2xl text-sm text-slate-400">
          A lightweight placeholder timeline for the new Pulse navigation.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-white/10 bg-slate-950/80 text-slate-50">
          <CardHeader>
            <CardTitle className="text-lg">Recent events</CardTitle>
            <CardDescription className="text-slate-400">Future entries will appear here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {historyItems.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="mt-1 text-sm text-slate-400">{item.detail}</p>
                  </div>
                  <p className="shrink-0 text-xs uppercase tracking-[0.2em] text-cyan-300">{item.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-slate-50">
          <CardHeader>
            <CardTitle className="text-lg">Snapshot</CardTitle>
            <CardDescription className="text-slate-400">A small panel for history filters or summaries.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Live feed enabled",
              "Retention window: 30 days",
              "Exports disabled in placeholder mode",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
