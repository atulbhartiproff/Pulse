import { ArrowRight, RefreshCw, Unplug } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingButton } from "@/components/ui/loading-button"
import { cn } from "@/lib/utils"

interface SpotifyActionsCardProps {
  connected: boolean
  onConnect: () => void
  onDisconnect: () => Promise<void>
  onManualSync: () => Promise<void>
  isDisconnecting: boolean
  isSyncing: boolean
}

export function SpotifyActionsCard({
  connected,
  onConnect,
  onDisconnect,
  onManualSync,
  isDisconnecting,
  isSyncing,
}: SpotifyActionsCardProps) {
  return (
    <Card className="border-white/10 bg-white/5 text-slate-50">
      <CardHeader>
        <CardTitle className="text-lg">Connection actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!connected ? (
          <Button
            onClick={onConnect}
            className="w-full justify-between bg-white text-slate-950 hover:bg-white/90"
          >
            <span>Connect Spotify</span>
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <LoadingButton
            onClick={onDisconnect}
            loading={isDisconnecting}
            variant="destructive"
            className="w-full justify-between"
          >
            <span>Disconnect Spotify</span>
            <Unplug className="size-4" />
          </LoadingButton>
        )}
        <LoadingButton
          onClick={onManualSync}
          loading={isSyncing}
          variant="secondary"
          className={cn(
            "w-full justify-between bg-slate-900 text-slate-50 hover:bg-slate-800",
            !connected && "opacity-80",
          )}
          disabled={!connected}
        >
          <span>Manual sync</span>
          <RefreshCw className="size-4" />
        </LoadingButton>
        <p className="text-sm text-slate-400">
          Manual sync imports the latest Spotify tracks and refreshes the connected views.
        </p>
      </CardContent>
    </Card>
  )
}
