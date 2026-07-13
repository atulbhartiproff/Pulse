import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface SpotifySettingsErrorProps {
  errorMessage: string
  onRetry: () => void
}

export function SpotifySettingsError({
  errorMessage,
  onRetry,
}: SpotifySettingsErrorProps) {
  return (
    <Alert className="border-red-500/30 bg-red-500/10 text-red-50">
      <AlertTitle>Unable to load Spotify settings</AlertTitle>
      <AlertDescription>
        {errorMessage}
        <button className="ml-2 underline" onClick={onRetry}>
          Retry
        </button>
      </AlertDescription>
    </Alert>
  )
}

export function SpotifySettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Skeleton className="h-6 w-28 rounded-full bg-white/10" />
        <Skeleton className="h-10 w-2/3 bg-white/10" />
        <Skeleton className="h-5 w-full bg-white/10" />
      </div>
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        {[1, 2].map((item) => (
          <Card key={item} className="border-white/10 bg-white/5 text-slate-50">
            <CardHeader className="space-y-3">
              <Skeleton className="h-6 w-40 bg-white/10" />
              <Skeleton className="h-4 w-56 bg-white/10" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-14 rounded-2xl bg-white/10" />
              <Skeleton className="h-14 rounded-2xl bg-white/10" />
              <Skeleton className="h-14 rounded-2xl bg-white/10" />
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  )
}
