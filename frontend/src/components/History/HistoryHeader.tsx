import { RefreshCw } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface HistoryHeaderProps {
  isRefreshing?: boolean
  onRefresh?: () => void
}

export function HistoryHeader({
  isRefreshing = false,
  onRefresh,
}: HistoryHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="border-cyan-400/30 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/10">
          History
        </Badge>
        <Badge variant="outline" className="border-white/10 text-slate-300">
          Grouped by day
        </Badge>
      </div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Listening history
          </h1>
          <p className="max-w-2xl text-sm text-slate-400">
            Recent plays are grouped by day and pulled directly from your backend analytics data.
          </p>
        </div>
        {onRefresh ? (
          <Button
            onClick={onRefresh}
            variant="secondary"
            className="w-fit bg-white text-slate-950 hover:bg-white/90"
            disabled={isRefreshing}
          >
            <RefreshCw className={isRefreshing ? "size-4 animate-spin" : "size-4"} />
            Refresh
          </Button>
        ) : null}
      </div>
    </div>
  )
}
