import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { SpotifyAccountCard } from "@/components/SpotifySettings/SpotifyAccountCard"
import { SpotifyActionsCard } from "@/components/SpotifySettings/SpotifyActionsCard"
import { SpotifySettingsHeader } from "@/components/SpotifySettings/SpotifySettingsHeader"
import {
  SpotifySettingsError,
  SpotifySettingsSkeleton,
} from "@/components/SpotifySettings/SpotifySettingsState"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import {
  disconnectSpotify,
  fetchSpotifyAuthorizeUrl,
  loadDashboardBundle,
  loadHistoryFeed,
  loadSpotifyStatus,
  syncSpotify,
  getTodayIsoDate,
  type SpotifyConnectionStatus,
} from "@/lib/pulse-api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const Route = createFileRoute("/_layout/settings")({
  component: SpotifySettings,
  head: () => ({
    meta: [
      {
        title: "Settings - Pulse",
      },
    ],
  }),
})

function SpotifySettings() {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const todayDate = getTodayIsoDate()

  const {
    data: status,
    isPending,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["spotify-status"],
    queryFn: loadSpotifyStatus,
    staleTime: 30_000,
  })

  const syncMutation = useMutation({
    mutationFn: syncSpotify,
    onSuccess: async (response) => {
      queryClient.setQueryData<SpotifyConnectionStatus>(["spotify-status"], (current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          last_sync: response.last_sync,
        }
      })

      await Promise.all([
        queryClient.fetchQuery({
          queryKey: ["spotify-status"],
          queryFn: loadSpotifyStatus,
        }),
        queryClient.fetchQuery({
          queryKey: ["pulse-dashboard", todayDate],
          queryFn: () => loadDashboardBundle(todayDate),
        }),
        queryClient.fetchQuery({
          queryKey: ["pulse-history", 7],
          queryFn: () => loadHistoryFeed(7),
        }),
      ])

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["spotify-status"] }),
        queryClient.invalidateQueries({ queryKey: ["pulse-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["pulse-history"] }),
      ])

      showSuccessToast(`Imported ${response.tracks_imported} new tracks.`)
    },
    onError: handleError.bind(showErrorToast),
  })

  const disconnectMutation = useMutation({
    mutationFn: disconnectSpotify,
    onSuccess: async () => {
      showSuccessToast("Spotify disconnected successfully")
      await queryClient.invalidateQueries({ queryKey: ["spotify-status"] })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["pulse-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["pulse-history"] }),
      ])
    },
    onError: handleError.bind(showErrorToast),
  })

  const handleConnect = async () => {
    try {
      const response = await fetchSpotifyAuthorizeUrl()
      window.location.href = response.authorization_url
    } catch (err) {
      handleError.bind(showErrorToast)(err)
    }
  }

  const handleManualSync = async () => {
    await syncMutation.mutateAsync()
  }

  if (isPending) {
    return <SpotifySettingsSkeleton />
  }

  if (isError) {
    return (
      <SpotifySettingsError
        errorMessage={error instanceof Error ? error.message : "Unable to load Spotify status."}
        onRetry={() => refetch()}
      />
    )
  }

  const currentStatus = status ?? {
    connected: false,
    spotify_id: null,
    last_sync: null,
  }

  return (
    <div className="space-y-6">
      <SpotifySettingsHeader
        connected={currentStatus.connected}
        onConnect={handleConnect}
      />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <SpotifyAccountCard status={currentStatus} />

        <div className="space-y-4">
          <SpotifyActionsCard
            connected={currentStatus.connected}
            onConnect={handleConnect}
            onDisconnect={async () => {
              await disconnectMutation.mutateAsync()
            }}
            onManualSync={handleManualSync}
            isDisconnecting={disconnectMutation.isPending}
            isSyncing={isFetching || syncMutation.isPending}
          />

          <Card className="border-white/10 bg-white/5 text-slate-50">
            <CardHeader>
              <CardTitle className="text-lg">How it works</CardTitle>
              <CardDescription className="text-slate-400">
                This page uses the existing Spotify status, disconnect, and sync endpoints.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-300">
              <p>Connect Spotify to start populating listening analytics and history views.</p>
              <p>Disconnect removes the stored Spotify credentials from the backend user record.</p>
              <p>Manual sync imports the latest Spotify tracks and refreshes the dashboard and history caches.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
