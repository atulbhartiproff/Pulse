import { createFileRoute } from "@tanstack/react-router"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const Route = createFileRoute("/_layout/admin")({
  component: Analytics,
  head: () => ({
    meta: [
      {
        title: "Analytics - Pulse",
      },
    ],
  }),
})

const analyticsCards = [
  { label: "Throughput", value: "2.4k", detail: "Events processed this week" },
  { label: "Signal quality", value: "96%", detail: "Stable across all sources" },
  { label: "Latency", value: "140ms", detail: "Placeholder network timing" },
]

function Analytics() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Badge className="border-cyan-400/30 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/10">
          Analytics
        </Badge>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Analytics overview</h1>
        <p className="max-w-2xl text-sm text-slate-400">
          A placeholder analytics screen that keeps the new navigation consistent without exposing the old admin table.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {analyticsCards.map((card) => (
          <Card key={card.label} className="border-white/10 bg-white/5 text-slate-50">
            <CardHeader className="space-y-2">
              <CardTitle className="text-lg text-slate-200">{card.label}</CardTitle>
              <div className="text-3xl font-semibold tracking-tight text-white">{card.value}</div>
              <CardDescription className="text-slate-400">{card.detail}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-white/10 bg-slate-950/80 text-slate-50">
          <CardHeader>
            <CardTitle className="text-lg">Trend placeholder</CardTitle>
            <CardDescription className="text-slate-400">Reserved for chart components or custom analytics widgets.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[48, 64, 52, 78, 88, 72].map((value, index) => (
              <div key={`${value}-${index}`} className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Metric {index + 1}</span>
                  <span>{value}%</span>
                </div>
                <div className="h-3 rounded-full bg-white/10">
                  <div
                    className="h-3 rounded-full bg-linear-to-r from-blue-500 to-cyan-400"
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-slate-50">
          <CardHeader>
            <CardTitle className="text-lg">Insights</CardTitle>
            <CardDescription className="text-slate-400">Small notes for future drilldowns.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Compare weekly baselines",
              "Highlight anomalous sessions",
              "Attach custom filters here",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
