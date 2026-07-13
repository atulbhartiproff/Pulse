import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface HistoryOverviewCardsProps {
  totalDays: number
  totalTracks: number
  totalMinutes: number
  summaryDays: number
}

const cardData = [
  { label: "Days fetched", key: "totalDays" },
  { label: "Total plays", key: "totalTracks" },
  { label: "Listening minutes", key: "totalMinutes" },
  { label: "Summaries found", key: "summaryDays" },
] as const

export function HistoryOverviewCards({
  totalDays,
  totalTracks,
  totalMinutes,
  summaryDays,
}: HistoryOverviewCardsProps) {
  const values = {
    totalDays,
    totalTracks,
    totalMinutes: `${Math.round(totalMinutes)}m`,
    summaryDays,
  }

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cardData.map((card) => (
        <Card key={card.label} className="border-white/10 bg-white/5 text-slate-50">
          <CardHeader className="space-y-3 pb-0">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="border-white/10 text-slate-300">
                {card.label}
              </Badge>
            </div>
            <CardTitle className="text-3xl tracking-tight">
              {values[card.key]}
            </CardTitle>
            <CardDescription className="text-slate-400">
              Live from the analytics history endpoint.
            </CardDescription>
          </CardHeader>
        </Card>
      ))}
    </section>
  )
}
